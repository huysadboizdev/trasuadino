import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { AUTH_CONFIG, getRefreshCookieOptions } from "@/lib/authConfig";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, avatar, googleId } = body;

    const userEmail = (email || `user_${Math.floor(1000 + Math.random() * 9000)}@gmail.com`).trim();
    const userName = name || userEmail.split("@")[0];
    const userGoogleId = googleId || `google_${Date.now()}`;
    const userAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`;

    const user = dataStore.loginWithGoogle(userEmail, userName, userGoogleId, userAvatar);
    const userRole = user.role || "CUSTOMER";

    // Tạo Access Token & Refresh Token
    const accessToken = await generateAccessToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: userRole,
    });

    const refreshData = await generateRefreshToken({
      id: user.id,
      role: userRole,
    });

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    dataStore.createRefreshSession({
      userId: user.id,
      tokenHash: refreshData.tokenHash,
      familyId: refreshData.familyId,
      role: userRole,
      ipAddress,
      userAgent,
      expiresAt: refreshData.expiresAt,
    });

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
        ? `Đăng nhập Google Admin (${user.email}) thành công! Đang chuyển hướng sang Quản trị...`
        : `Đăng nhập thành công với tài khoản Google (${user.email})!`,
    });

    const cookieOpts = getRefreshCookieOptions(userRole);
    res.cookies.set(AUTH_CONFIG.REFRESH_COOKIE_NAME, refreshData.token, cookieOpts);

    return res;
  } catch (error) {
    console.error("Lỗi khi đăng nhập Google:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi xử lý xác thực Google" },
      { status: 500 }
    );
  }
}
