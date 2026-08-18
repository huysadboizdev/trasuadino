import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import { UserRole, AuthTokenPayload } from "./types";
import { AUTH_CONFIG, getTokenTTLByRole } from "./authConfig";

const accessSecret = new TextEncoder().encode(AUTH_CONFIG.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(AUTH_CONFIG.JWT_REFRESH_SECRET);

/**
 * Băm chuỗi Refresh Token bằng thuật toán SHA-256 để lưu trữ an toàn trong Database
 * KHÔNG bao giờ lưu refresh token dạng plaintext
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

/**
 * Tạo ngẫu nhiên chuỗi Token an toàn bằng crypto
 */
export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Ký và tạo Access Token (JWT)
 * - Customer: 15 phút
 * - Admin/Staff: 10 phút
 * - Payload: sub (userId), email, name, role, type: "access"
 */
export async function generateAccessToken(user: {
  id: string;
  email?: string;
  name: string;
  role: UserRole;
}): Promise<string> {
  const ttl = getTokenTTLByRole(user.role);

  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ttl.ACCESS_TOKEN_EXPIRES_IN)
    .sign(accessSecret);
}

/**
 * Tạo Refresh Token và tính sẵn mã băm tokenHash
 * - Customer: 7 ngày
 * - Admin/Staff: 3 ngày
 */
export async function generateRefreshToken(
  user: { id: string; role: UserRole },
  existingFamilyId?: string
): Promise<{
  token: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
}> {
  const ttl = getTokenTTLByRole(user.role);
  const familyId = existingFamilyId || `fam-${crypto.randomBytes(16).toString("hex")}`;
  const randomPart = crypto.randomBytes(32).toString("hex");

  // Ký JWT cho Refresh Token để mang theo metadata
  const token = await new SignJWT({
    sub: user.id,
    role: user.role,
    familyId,
    type: "refresh",
    nonce: randomPart,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ttl.REFRESH_TOKEN_EXPIRES_IN)
    .sign(refreshSecret);

  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttl.REFRESH_TOKEN_TTL_SECONDS * 1000);

  return {
    token,
    tokenHash,
    familyId,
    expiresAt,
  };
}

/**
 * Xác thực Access Token
 * Trả về payload nếu hợp lệ và chưa hết hạn, ngược lại trả về null
 */
export async function verifyAccessToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    if (!token) return null;
    const cleanToken = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
    if (!cleanToken) return null;

    const { payload } = await jwtVerify(cleanToken, accessSecret);

    if (payload.type !== "access") {
      return null;
    }

    return {
      sub: payload.sub as string,
      email: payload.email as string | undefined,
      name: payload.name as string | undefined,
      role: (payload.role as UserRole) || "CUSTOMER",
      type: "access",
      jti: payload.jti as string | undefined,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Xác thực cấu trúc Refresh Token
 */
export async function verifyRefreshToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    if (!token) return null;
    const cleanToken = token.trim();
    if (!cleanToken) return null;

    const { payload } = await jwtVerify(cleanToken, refreshSecret);

    if (payload.type !== "refresh") {
      return null;
    }

    return {
      sub: payload.sub as string,
      role: (payload.role as UserRole) || "CUSTOMER",
      familyId: payload.familyId as string | undefined,
      type: "refresh",
    };
  } catch (err) {
    return null;
  }
}
