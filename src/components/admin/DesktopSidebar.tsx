"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Badge } from "../ui/Badge";
import { Switch } from "../ui/Switch";
import { useAuth } from "@/context/AuthContext";

interface DesktopSidebarProps {
  isOpen?: boolean;
  onToggleStoreOpen?: (open: boolean) => void;
  newOrdersCount?: number;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  isOpen = true,
  onToggleStoreOpen,
  newOrdersCount = 0,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const navItems = [
    { href: "/admin", label: "TỔNG QUAN (DASHBOARD)" },
    {
      href: "/admin/orders",
      label: "QUẢN LÝ ĐƠN HÀNG",
      badge: newOrdersCount > 0 ? `${newOrdersCount} Mới` : undefined,
    },
    { href: "/admin/products", label: "QUẢN LÝ MENU & MÓN" },
    { href: "/admin/categories", label: "QUẢN LÝ DANH MỤC" },
    { href: "/admin/coupons", label: "MÃ GIẢM GIÁ (VOUCHER)" },
    { href: "/admin/users", label: "QUẢN LÝ NGƯỜI DÙNG" },
    { href: "/admin/settings", label: "CÀI ĐẶT & SEPAY" },
  ];

  return (
    <aside className="hidden md:flex w-64 lg:w-72 flex-col justify-between border-r border-neutral-200 bg-white h-screen sticky top-0 left-0 p-5 shadow-subtle flex-shrink-0 z-30 select-none overflow-y-auto">
      <div className="space-y-6">
        {/* Logo & Store Header */}
        <div className="border-b border-neutral-100 pb-5">
          <div className="flex items-center gap-2">
            <span className="bg-brand-900 text-white font-black text-xs px-2.5 py-1 rounded-md tracking-wider">
              ADMIN
            </span>
            <span className="font-black text-brand-950 tracking-tight text-lg">
              TRÀ SỮA DINO
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Đang đăng nhập: <b>{user?.name || user?.email}</b>
          </p>

          {/* Quick Store Open Toggle */}
          <div className="mt-4 p-3 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center justify-between shadow-2xs">
            <div>
              <p className="text-xs font-black text-neutral-800 uppercase tracking-wide">
                Trạng thái quán
              </p>
              <Badge variant={isOpen ? "success" : "danger"} size="sm" dot className="mt-1">
                {isOpen ? "Đang nhận đơn" : "Đang đóng cửa"}
              </Badge>
            </div>
            {onToggleStoreOpen && (
              <Switch checked={isOpen} onChange={onToggleStoreOpen} />
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          <p className="text-[11px] font-black text-neutral-400 uppercase tracking-wider px-3 mb-2">
            Menu Quản Trị
          </p>
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-black transition-all select-none ${
                  isActive
                    ? "bg-brand-900 text-white shadow-md"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                <span className="tracking-tight">{item.label}</span>
                {item.badge && (
                  <span className="bg-rose-600 text-white text-xs font-black px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer link to public web & Logout */}
      <div className="pt-4 border-t border-neutral-100 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-center w-full py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-black rounded-xl border border-neutral-300 uppercase tracking-wider transition-colors shadow-2xs"
        >
          XEM TRANG KHÁCH (WEB)
        </Link>
        <button
          onClick={handleLogout}
          className="w-full text-center text-xs font-bold text-rose-600 hover:text-rose-800 uppercase tracking-wider py-1.5 transition-colors"
        >
          Đăng Xuất Admin
        </button>
      </div>
    </aside>
  );
};
