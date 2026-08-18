"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export const AdminAuthGuard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Nếu chưa đăng nhập hoặc không phải tài khoản Quản trị -> Tự động chuyển về trang Đăng Nhập Chung
      if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
        router.replace("/login?redirect=/admin");
      }
    }
  }, [user, isLoading, router]);

  // Đang kiểm tra quyền hoặc đang tự động chuyển hướng về trang login
  if (isLoading || !user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Đang xác thực quyền Quản trị...
          </p>
        </div>
      </div>
    );
  }

  // Đã xác thực quyền ADMIN hoặc STAFF -> Cho phép vào Dashboard
  return <>{children}</>;
};
