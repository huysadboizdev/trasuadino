import { User } from "./types";

/**
 * Single-flight in-memory Access Token Manager & HTTP Client
 * - Lưu trữ Access Token trong Memory (không lưu trong localStorage)
 * - Tự động đính kèm Authorization: Bearer <accessToken>
 * - Tự động phát hiện 401, khóa Refresh Request (Single-Flight Lock) để tránh race condition
 * - Tự động Retry request duy nhất 1 lần khi Refresh thành công
 */

let memoryAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

let onAuthSuccessCallback: ((user: User, accessToken: string) => void) | null = null;
let onAuthFailureCallback: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  memoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return memoryAccessToken;
}

export function registerAuthCallbacks(
  onSuccess: (user: User, accessToken: string) => void,
  onFailure: () => void
) {
  onAuthSuccessCallback = onSuccess;
  onAuthFailureCallback = onFailure;
}

/**
 * Single-flight Refresh Token: Nếu có nhiều request đồng thời bị 401,
 * chỉ DUY NHẤT 1 request /api/auth/refresh được gửi đi, các request khác chờ kết quả chung.
 */
export async function refreshAccessTokenSingleFlight(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Tự động gửi HttpOnly Cookie
      });

      if (!res.ok) {
        setAccessToken(null);
        if (onAuthFailureCallback) onAuthFailureCallback();
        return null;
      }

      const data = await res.json();
      if (data.success && data.accessToken) {
        setAccessToken(data.accessToken);
        if (onAuthSuccessCallback && data.user) {
          onAuthSuccessCallback(data.user, data.accessToken);
        }
        return data.accessToken as string;
      }

      setAccessToken(null);
      if (onAuthFailureCallback) onAuthFailureCallback();
      return null;
    } catch (err) {
      setAccessToken(null);
      if (onAuthFailureCallback) onAuthFailureCallback();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * authFetch: Wrapper thay thế fetch thông thường
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = typeof input === "string" ? input : input.toString();

  // Chuẩn bị headers
  const headers = new Headers(init?.headers || {});
  if (memoryAccessToken && !headers.has("Authorization") && !headers.has("authorization")) {
    headers.set("Authorization", `Bearer ${memoryAccessToken}`);
  }

  const fetchOptions: RequestInit = {
    ...init,
    headers,
    credentials: "include", // Luôn đính kèm HttpOnly cookies
  };

  const response = await fetch(input, fetchOptions);

  // Không kích hoạt refresh token lặp nếu chính endpoint /api/auth/refresh hoặc login/logout bị 401
  const isAuthEndpoint =
    url.includes("/api/auth/refresh") ||
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/register") ||
    url.includes("/api/auth/logout");

  if (response.status === 401 && !isAuthEndpoint) {
    // Access Token hết hạn -> Kích hoạt Single-flight Refresh
    const newAccessToken = await refreshAccessTokenSingleFlight();

    if (newAccessToken) {
      // Retry request ban đầu đúng 1 LẦN với Access Token mới
      const retryHeaders = new Headers(init?.headers || {});
      retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);

      return fetch(input, {
        ...init,
        headers: retryHeaders,
        credentials: "include",
      });
    }
  }

  return response;
}
