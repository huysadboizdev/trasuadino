import { NextRequest, NextResponse } from "next/server";
import { UserRole, AuthTokenPayload } from "./types";
import { verifyAccessToken, hashToken } from "./jwt";
import { AUTH_CONFIG } from "./authConfig";
import { dataStore } from "./store";

/**
 * Trích xuất và xác thực Access Token từ Header Authorization của Request (hoặc fallback qua cookie)
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<{ user: AuthTokenPayload | null; error?: string }> {
  // 1. Kiểm tra Authorization Header (Bearer token)
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");

  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      const token = parts[1];
      const payload = await verifyAccessToken(token);
      if (payload) {
        return { user: payload };
      }
    }
  }

  // 2. Fallback kiểm tra HttpOnly Refresh Token Cookie nếu có phiên hợp lệ
  const rawRefreshToken = req.cookies.get(AUTH_CONFIG.REFRESH_COOKIE_NAME)?.value;
  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    const session = dataStore.findRefreshSessionByHash(tokenHash);

    if (session && !session.revokedAt) {
      const isExpired = new Date().getTime() > new Date(session.expiresAt).getTime();
      if (!isExpired) {
        const user = dataStore.findUserById(session.userId);
        return {
          user: {
            sub: session.userId,
            email: user?.email,
            name: user?.name,
            role: session.role,
            type: "access",
          },
        };
      }
    }
  }

  return { user: null, error: "UNAUTHORIZED" };
}

/**
 * Helper kiểm tra quyền truy cập Server Route (Middleware logic)
 * Áp dụng kiểm tra phía Backend cho các API nhạy cảm
 */
export async function requireAuth(
  req: NextRequest,
  allowedRoles?: UserRole[]
): Promise<{ user: AuthTokenPayload } | NextResponse> {
  const { user, error } = await authenticateRequest(req);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: error || "UNAUTHORIZED",
        message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
      },
      { status: 401 }
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return NextResponse.json(
      {
        success: false,
        error: "FORBIDDEN",
        message: "Bạn không có quyền quản trị để thực hiện thao tác này.",
      },
      { status: 403 }
    );
  }

  return { user };
}
