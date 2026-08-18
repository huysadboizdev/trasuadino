"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "../ui/Badge";
import { useAuth } from "@/context/AuthContext";

interface MobileHeaderProps {
  title?: string;
  isOpen?: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  isOpen = true,
}) => {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-3 sm:px-4 py-2 sm:py-2.5 md:hidden shadow-xs">
      <div className="flex items-center justify-between gap-2 min-w-0">
        {/* Left: Brand Identity */}
        <Link href="/admin" className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="bg-brand-900 text-white font-black text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-md tracking-wider flex-shrink-0">
            ADMIN
          </span>
          <span className="font-black text-brand-950 tracking-tight text-xs sm:text-sm md:text-base truncate">
            TRÀ SỮA DINO
          </span>
        </Link>

        {/* Right: Store Status + Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          <Badge variant={isOpen ? "success" : "danger"} size="sm" dot className="px-1.5 sm:px-2 text-[10px] sm:text-xs">
            {isOpen ? "MỞ" : "ĐÓNG"}
          </Badge>

          <Link
            href="/"
            target="_blank"
            className="text-[10px] sm:text-xs font-bold px-2 py-1 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg border border-neutral-300 active:scale-95 transition-colors flex items-center gap-1"
            title="Xem trang bán hàng (Web khách)"
          >
            <span>WEB</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="text-[10px] sm:text-xs font-bold px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg border border-rose-200 active:scale-95 transition-colors"
            title="Đăng xuất khỏi hệ thống quản trị"
          >
            Thoát
          </button>
        </div>
      </div>

      {title && (
        <div className="mt-2 pt-2 border-t border-neutral-100">
          <h1 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight uppercase truncate">
            {title}
          </h1>
        </div>
      )}
    </header>
  );
};
