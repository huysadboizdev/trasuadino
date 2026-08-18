import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { AUTH_CONFIG, getRefreshCookieOptions } from "@/lib/authConfig";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, deviceId } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "EMAIL_EMPTY", message: "Vui lòng nhập Email / Gmail" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "PASSWORD_EMPTY", message: "Vui lòng nhập mật khẩu" },
        { status: 400 }
      );
    }

    const authResult = dataStore.authenticateUser(email, password);

    if (!authResult.success) {
      if (authResult.error === "EMAIL_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            error: "EMAIL_NOT_FOUND",
            message: "Tài khoản này chưa được đăng ký. Vui lòng bấm Đăng Ký!",
          },
          { status: 400 }
        );
      }
      if (authResult.error === "INVALID_PASSWORD") {
        return NextResponse.json(
          {
            success: false,
            error: "INVALID_PASSWORD",
            message: "Mật khẩu không chính xác. Vui lòng kiểm tra lại!",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: "AUTH_FAILED", message: "Đăng nhập thất bại" },
        { status: 400 }
      );
    }

    const user = authResult.user!;
    const userRole = user.role || "CUSTOMER";

    // 1. Tạo Access Token (15m cho Customer, 10m cho Admin/Staff)
    const accessToken = await generateAccessToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: userRole,
    });

    // 2. Tạo Refresh Token & Token Family (7d cho Customer, 3d cho Admin/Staff)
    const refreshData = await generateRefreshToken({
      id: user.id,
      role: userRole,
    });

    // 3. Lấy thông tin Client (IP, User-Agent) để bảo mật phiên
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    // 4. Lưu Hashed Refresh Token vào Database / Session Store
    dataStore.createRefreshSession({
      userId: user.id,
      tokenHash: refreshData.tokenHash,
      familyId: refreshData.familyId,
      role: userRole,
      deviceId: deviceId || undefined,
      ipAddress,
      userAgent,
      expiresAt: refreshData.expiresAt,
    });

    // 5. Chuẩn bị response và gắn HttpOnly Secure Cookie
    const res = NextResponse.json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: userRole,
        avatar: user.avatar,
      },
      message: userRole === "ADMIN"
        ? "Đăng nhập thành công! Đang chuyển hướng sang trang Quản trị..."
        : `Chào mừng ${user.name || user.email} quay trở lại!`,
    });

    const cookieOpts = getRefreshCookieOptions(userRole);
    res.cookies.set(AUTH_CONFIG.REFRESH_COOKIE_NAME, refreshData.token, cookieOpts);

    return res;
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "Lỗi máy chủ khi đăng nhập" },
      { status: 500 }
    );
  }
}
