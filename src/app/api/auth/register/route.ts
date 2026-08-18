import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { AUTH_CONFIG, getRefreshCookieOptions } from "@/lib/authConfig";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, confirmPassword, name } = body;

    // 1. Kiểm tra Email
    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "EMAIL_EMPTY", message: "Vui lòng nhập địa chỉ Gmail/Email" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "INVALID_EMAIL", message: "Định dạng Gmail/Email không hợp lệ (VD: user@gmail.com)" },
        { status: 400 }
      );
    }

    // 2. Kiểm tra Mật khẩu
    if (!password) {
      return NextResponse.json(
        { success: false, error: "PASSWORD_EMPTY", message: "Vui lòng nhập mật khẩu" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "PASSWORD_TOO_SHORT", message: "Mật khẩu phải có tối thiểu 6 ký tự" },
        { status: 400 }
      );
    }

    // 3. Kiểm tra Nhập lại mật khẩu
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "PASSWORD_MISMATCH", message: "Mật khẩu nhập lại không khớp" },
        { status: 400 }
      );
    }

    // 4. Kiểm tra Email đã tồn tại chưa
    const existing = dataStore.findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "EMAIL_EXISTS", message: "Email này đã được đăng ký tài khoản trước đó" },
        { status: 400 }
      );
    }

    // 5. Đăng ký tài khoản
    const newUser = dataStore.registerUser(email, password, name);
    if (!newUser) {
      return NextResponse.json(
        { success: false, error: "REGISTER_FAILED", message: "Đăng ký không thành công" },
        { status: 400 }
      );
    }

    const userRole = newUser.role || "CUSTOMER";

    // 6. Tạo Access Token & Refresh Token (Tự động đăng nhập)
    const accessToken = await generateAccessToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: userRole,
    });

    const refreshData = await generateRefreshToken({
      id: newUser.id,
      role: userRole,
    });

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    dataStore.createRefreshSession({
      userId: newUser.id,
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
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: userRole,
        avatar: newUser.avatar,
      },
      message: "Đăng ký tài khoản thành công!",
    });

    const cookieOpts = getRefreshCookieOptions(userRole);
    res.cookies.set(AUTH_CONFIG.REFRESH_COOKIE_NAME, refreshData.token, cookieOpts);

    return res;
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "Lỗi máy chủ khi đăng ký tài khoản" },
      { status: 500 }
    );
  }
}
