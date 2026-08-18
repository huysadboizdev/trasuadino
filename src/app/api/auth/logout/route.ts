import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";
import { hashToken } from "@/lib/jwt";
import { AUTH_CONFIG, getRefreshCookieOptions } from "@/lib/authConfig";

export async function POST(req: NextRequest) {
  try {
    const rawRefreshToken = req.cookies.get(AUTH_CONFIG.REFRESH_COOKIE_NAME)?.value;

    if (rawRefreshToken && rawRefreshToken.trim()) {
      const currentTokenHash = hashToken(rawRefreshToken);
      dataStore.revokeRefreshSession(currentTokenHash);
    }

    const res = NextResponse.json({
      success: true,
      message: "Đăng xuất tài khoản thành công",
    });

    // Xóa sạch cookie đúng config path, secure, sameSite
    res.cookies.set(AUTH_CONFIG.REFRESH_COOKIE_NAME, "", getRefreshCookieOptions("CUSTOMER", true));

    return res;
  } catch (error) {
    console.error("Lỗi khi đăng xuất:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi xử lý đăng xuất" },
      { status: 500 }
    );
  }
}
