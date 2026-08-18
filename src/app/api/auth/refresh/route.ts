import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";
import { hashToken, generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { AUTH_CONFIG, getRefreshCookieOptions } from "@/lib/authConfig";

export async function POST(req: NextRequest) {
  try {
    // 1. Đọc Refresh Token từ HttpOnly Cookie
    const rawRefreshToken = req.cookies.get(AUTH_CONFIG.REFRESH_COOKIE_NAME)?.value;

    if (!rawRefreshToken || !rawRefreshToken.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "NO_REFRESH_TOKEN",
          message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        },
        { status: 401 }
      );
    }

    const currentTokenHash = hashToken(rawRefreshToken);

    // 2. PHÁT HIỆN TOKEN REUSE (Sử dụng lại Token cũ đã được xoay vòng)
    const rotatedRecord = dataStore.findRotatedTokenRecord(currentTokenHash);
    if (rotatedRecord) {
      // Phát hiện hành vi sử dụng lại token cũ -> Thu hồi toàn bộ Family Session ngay lập tức!
      console.warn(`[SECURITY ALERT] Phát hiện Refresh Token Reuse cho Family ID: ${rotatedRecord.familyId}`);
      dataStore.revokeFamilySessions(rotatedRecord.familyId);

      const res = NextResponse.json(
        {
          success: false,
          error: "TOKEN_REUSE_DETECTED",
          message: "Phát hiện phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
        },
        { status: 401 }
      );
      // Xóa sạch cookie trên client
      res.cookies.set(AUTH_CONFIG.REFRESH_COOKIE_NAME, "", getRefreshCookieOptions("CUSTOMER", true));
      return res;
    }

    // 3. Tìm Session theo Token Hash trong Database
    const session = dataStore.findRefreshSessionByHash(currentTokenHash);

    if (!session) {
      const res = NextResponse.json(
        {
          success: false,
          error: "INVALID_SESSION",
          message: "Phiên đăng nhập không tồn tại. Vui lòng đăng nhập lại.",
        },
        { status: 401 }
      );
      res.cookies.set(AUTH_CONFIG.REFRESH_COOKIE_NAME, "", getRefreshCookieOptions("CUSTOMER", true));
      return res;
    }

    // 4. Kiểm tra xem Session đã bị thu hồi (Revoked) chưa
    if (session.revokedAt) {
      console.warn(`[SECURITY ALERT] Cố gắng sử dụng Refresh Token của Session đã bị thu hồi: ${session.id}`);
      dataStore.revokeFamilySessions(session.familyId);

      const res = NextResponse.json(
        {
          success: false,
          error: "SESSION_REVOKED",
          message: "Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.",
        },
        { status: 401 }
      );
      res.cookies.set(AUTH_CONFIG.REFRESH_COOKIE_NAME, "", getRefreshCookieOptions(session.role, true));
      return res;
    }

    // 5. Kiểm tra thời hạn hết hạn của Refresh Token
    const isExpired = new Date().getTime() > new Date(session.expiresAt).getTime();
    if (isExpired) {
      dataStore.revokeRefreshSession(currentTokenHash);

      const res = NextResponse.json(
        {
          success: false,
          error: "SESSION_EXPIRED",
          message: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.",
        },
        { status: 401 }
      );
      res.cookies.set(AUTH_CONFIG.REFRESH_COOKIE_NAME, "", getRefreshCookieOptions(session.role, true));
      return res;
    }

    // 6. Lấy thông tin người dùng tương ứng
    let user = dataStore.findUserById(session.userId);
    const envAdminEmail = (process.env.ADMIN_EMAIL || "admin@dino.vn").trim().toLowerCase();

    if (!user && session.userId === "usr-admin") {
      user = {
        id: "usr-admin",
        name: "Chủ Quán (Admin)",
        email: envAdminEmail,
        role: "ADMIN",
        address: "Cửa hàng chính",
        createdAt: new Date().toISOString(),
      };
    }

    if (!user) {
      const res = NextResponse.json(
        {
          success: false,
          error: "USER_NOT_FOUND",
          message: "Tài khoản không tồn tại. Vui lòng đăng nhập lại.",
        },
        { status: 401 }
      );
      res.cookies.set(AUTH_CONFIG.REFRESH_COOKIE_NAME, "", getRefreshCookieOptions(session.role, true));
      return res;
    }

    const userRole = user.role || session.role || "CUSTOMER";

    // 7. THỰC HIỆN REFRESH TOKEN ROTATION:
    // - Tạo Access Token mới (15m cho customer, 10m cho admin)
    // - Tạo Refresh Token mới giữ nguyên familyId (7d cho customer, 3d cho admin)
    const newAccessToken = await generateAccessToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: userRole,
    });

    const newRefreshData = await generateRefreshToken(
      {
        id: user.id,
        role: userRole,
      },
      session.familyId
    );

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    // Cập nhật session với Token Hash mới
    dataStore.rotateRefreshSession(
      currentTokenHash,
      newRefreshData.tokenHash,
      newRefreshData.expiresAt,
      ipAddress,
      userAgent
    );

    // 8. Trả về Access Token mới và cập nhật HttpOnly Cookie
    const res = NextResponse.json({
      success: true,
      accessToken: newAccessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: userRole,
        avatar: user.avatar,
      },
    });

    const cookieOpts = getRefreshCookieOptions(userRole);
    res.cookies.set(AUTH_CONFIG.REFRESH_COOKIE_NAME, newRefreshData.token, cookieOpts);

    return res;
  } catch (error) {
    console.error("Lỗi khi xoay vòng Refresh Token:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "Lỗi máy chủ khi làm mới phiên" },
      { status: 500 }
    );
  }
}
