import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";
import { authenticateRequest } from "@/lib/authServer";
import { hashToken } from "@/lib/jwt";
import { AUTH_CONFIG, getRefreshCookieOptions } from "@/lib/authConfig";

export async function POST(req: NextRequest) {
  try {
    let userId: string | undefined;

    // 1. Kiểm tra qua Access Token nếu có
    const auth = await authenticateRequest(req);
    if (auth.user) {
      userId = auth.user.sub;
    } else {
      // Hoặc qua Refresh Token trong cookie
      const rawRefreshToken = req.cookies.get(AUTH_CONFIG.REFRESH_COOKIE_NAME)?.value;
      if (rawRefreshToken) {
        const tokenHash = hashToken(rawRefreshToken);
        const session = dataStore.findRefreshSessionByHash(tokenHash);
        if (session) {
          userId = session.userId;
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Không xác định được phiên người dùng" },
        { status: 401 }
      );
    }

    const count = dataStore.revokeAllUserSessions(userId);

    const res = NextResponse.json({
      success: true,
      revokedSessionsCount: count,
      message: `Đã đăng xuất khỏi toàn bộ ${count} thiết bị thành công!`,
    });

    res.cookies.set(AUTH_CONFIG.REFRESH_COOKIE_NAME, "", getRefreshCookieOptions("CUSTOMER", true));

    return res;
  } catch (error) {
    console.error("Lỗi khi đăng xuất tất cả thiết bị:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ khi đăng xuất tất cả thiết bị" },
      { status: 500 }
    );
  }
}
