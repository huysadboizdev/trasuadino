"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "@/lib/types";
import {
  setAccessToken,
  getAccessToken,
  refreshAccessTokenSingleFlight,
  registerAuthCallbacks,
} from "@/lib/apiClient";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User; error?: string }>;
  register: (email: string, password: string, confirmPassword?: string, name?: string) => Promise<{ success: boolean; message: string; user?: User; error?: string }>;
  loginWithGoogle: (email?: string, name?: string, googleId?: string, avatar?: string) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<{ success: boolean; message: string }>;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessTokenState, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleAuthSuccess = useCallback((userData: User, token: string) => {
    setUser(userData);
    setAccessTokenState(token);
    setAccessToken(token);
  }, []);

  const handleAuthFailure = useCallback(() => {
    setUser(null);
    setAccessTokenState(null);
    setAccessToken(null);
  }, []);

  // 1. Đăng ký callback giữa AuthContext và HTTP Client
  useEffect(() => {
    registerAuthCallbacks(handleAuthSuccess, handleAuthFailure);
  }, [handleAuthSuccess, handleAuthFailure]);

  // 2. Khởi tạo & Tự động khôi phục phiên đăng nhập (Silent Refresh on Mount)
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        // Gửi request refresh ngầm đến server qua HttpOnly Cookie
        const token = await refreshAccessTokenSingleFlight();
        if (!isMounted) return;

        if (token) {
          setAccessTokenState(token);
        } else {
          handleAuthFailure();
        }
      } catch (err) {
        if (isMounted) handleAuthFailure();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, [handleAuthFailure]);

  // 3. Đồng bộ trạng thái Auth giữa các Tab trình duyệt (Multi-tab broadcast)
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("dino_auth_channel");
        channel.onmessage = (event) => {
          if (event.data?.type === "LOGOUT") {
            handleAuthFailure();
          } else if (event.data?.type === "LOGIN") {
            refreshAccessTokenSingleFlight();
          }
        };
      }
    } catch (e) {
      // Fallback nếu browser không hỗ trợ BroadcastChannel
    }

    return () => {
      if (channel) channel.close();
    };
  }, [handleAuthFailure]);

  const notifyOtherTabs = (type: "LOGIN" | "LOGOUT") => {
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const ch = new BroadcastChannel("dino_auth_channel");
        ch.postMessage({ type });
        ch.close();
      }
    } catch (e) {
      // Ignore
    }
  };

  // Đăng nhập
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data.success && data.user && data.accessToken) {
        handleAuthSuccess(data.user, data.accessToken);
        notifyOtherTabs("LOGIN");
        return { success: true, message: data.message, user: data.user };
      } else {
        return { success: false, message: data.message || "Đăng nhập thất bại", error: data.error };
      }
    } catch (err) {
      return { success: false, message: "Lỗi kết nối máy chủ", error: "NETWORK_ERROR" };
    }
  };

  // Đăng ký
  const register = async (email: string, password: string, confirmPassword?: string, name?: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword, name }),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data.success && data.user && data.accessToken) {
        handleAuthSuccess(data.user, data.accessToken);
        notifyOtherTabs("LOGIN");
        return { success: true, message: data.message, user: data.user };
      } else {
        return { success: false, message: data.message || "Đăng ký thất bại", error: data.error };
      }
    } catch (err) {
      return { success: false, message: "Lỗi kết nối máy chủ", error: "NETWORK_ERROR" };
    }
  };

  // Đăng nhập Google
  const loginWithGoogle = async (email?: string, name?: string, googleId?: string, avatar?: string) => {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, googleId, avatar }),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data.success && data.user && data.accessToken) {
        handleAuthSuccess(data.user, data.accessToken);
        notifyOtherTabs("LOGIN");
        return { success: true, message: data.message, user: data.user };
      } else {
        return { success: false, message: data.message || "Đăng nhập Google thất bại" };
      }
    } catch (err) {
      return { success: false, message: "Lỗi kết nối Google" };
    }
  };

  // Đăng xuất (Thu hồi session hiện tại & Xóa Cookie)
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch (e) {
      // Ignore network error on logout
    } finally {
      handleAuthFailure();
      notifyOtherTabs("LOGOUT");
    }
  };

  // Đăng xuất khỏi toàn bộ thiết bị
  const logoutAll = async () => {
    try {
      const currentToken = getAccessToken();
      const res = await fetch("/api/auth/logout-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
        credentials: "include",
      });

      const data = await res.json();
      handleAuthFailure();
      notifyOtherTabs("LOGOUT");
      return { success: true, message: data.message || "Đã đăng xuất tất cả thiết bị" };
    } catch (e) {
      handleAuthFailure();
      return { success: false, message: "Lỗi khi đăng xuất tất cả thiết bị" };
    }
  };

  // Cập nhật thông tin User Profile
  const updateProfile = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: accessTokenState,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        logoutAll,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được bọc trong AuthProvider");
  }
  return context;
};
