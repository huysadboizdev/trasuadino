import { UserRole } from "./types";

/**
 * Cấu hình tập trung cho Hệ thống Authentication (JWT Access Token + Refresh Token)
 */

export const AUTH_CONFIG = {
  // Tên cookie lưu Refresh Token
  REFRESH_COOKIE_NAME: "dino_refresh_token",

  // Secrets cho JWT
  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET ||
    process.env.JWT_SECRET ||
    "dino_jwt_access_secret_production_ready_2026_key_3847291038",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ||
    "dino_jwt_refresh_secret_production_ready_2026_key_9182736450",

  // Thời gian sống (TTL) cho Customer
  CUSTOMER: {
    ACCESS_TOKEN_TTL_SECONDS: 15 * 60, // 15 phút
    ACCESS_TOKEN_EXPIRES_IN: "15m",
    REFRESH_TOKEN_TTL_SECONDS: 7 * 24 * 60 * 60, // 7 ngày
    REFRESH_TOKEN_EXPIRES_IN: "7d",
  },

  // Thời gian sống (TTL) cho Admin & Staff
  ADMIN: {
    ACCESS_TOKEN_TTL_SECONDS: 10 * 60, // 10 phút
    ACCESS_TOKEN_EXPIRES_IN: "10m",
    REFRESH_TOKEN_TTL_SECONDS: 3 * 24 * 60 * 60, // 3 ngày
    REFRESH_TOKEN_EXPIRES_IN: "3d",
  },
} as const;

/**
 * Lấy cấu hình TTL theo role của người dùng
 */
export function getTokenTTLByRole(role: UserRole) {
  if (role === "ADMIN" || role === "STAFF") {
    return AUTH_CONFIG.ADMIN;
  }
  return AUTH_CONFIG.CUSTOMER;
}

/**
 * Tạo Cookie Options an toàn cho Refresh Token
 */
export function getRefreshCookieOptions(role: UserRole, isLogout = false) {
  const ttl = getTokenTTLByRole(role);
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: isLogout ? 0 : ttl.REFRESH_TOKEN_TTL_SECONDS,
  };
}
