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
    {
      href: "/admin",
      label: "TỔNG QUAN (DASHBOARD)",
      shortLabel: "Tổng quan",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      href: "/admin/orders",
      label: "QUẢN LÝ ĐƠN HÀNG",
      shortLabel: "Đơn hàng",
      badge: newOrdersCount > 0 ? `${newOrdersCount} Mới` : undefined,
      shortBadge: newOrdersCount > 0 ? newOrdersCount : undefined,
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      href: "/admin/products",
      label: "QUẢN LÝ MENU & MÓN",
      shortLabel: "Menu món",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      href: "/admin/categories",
      label: "QUẢN LÝ DANH MỤC",
      shortLabel: "Danh mục",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      href: "/admin/coupons",
      label: "MÃ GIẢM GIÁ (VOUCHER)",
      shortLabel: "Voucher",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
    },
    {
      href: "/admin/users",
      label: "QUẢN LÝ NGƯỜI DÙNG",
      shortLabel: "Tài khoản",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      href: "/admin/settings",
      label: "CÀI ĐẶT & SEPAY",
      shortLabel: "Cài đặt",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      aria-label="Thanh điều hướng bên cho quản trị viên"
      className="hidden md:flex md:w-20 lg:w-64 xl:w-72 2xl:w-80 flex-col justify-between border-r border-neutral-200 bg-white h-screen sticky top-0 left-0 p-3 lg:p-5 shadow-subtle flex-shrink-0 z-30 select-none overflow-y-auto transition-all duration-200"
    >
      <div className="space-y-4 lg:space-y-6">
        {/* Logo & Store Header */}
        <div className="border-b border-neutral-100 pb-3 lg:pb-5">
          {/* Logo Brand */}
          <Link href="/admin" className="flex items-center justify-center lg:justify-start gap-2">
            <span className="bg-brand-900 text-white font-black text-xs px-2.5 py-1 rounded-md tracking-wider flex-shrink-0">
              ADMIN
            </span>
            <span className="hidden lg:inline font-black text-brand-950 tracking-tight text-lg truncate">
              TRÀ SỮA DINO
            </span>
          </Link>

          {/* User info on desktop */}
          <p className="hidden lg:block text-xs text-neutral-500 font-medium mt-1 truncate">
            Đang đăng nhập: <b>{user?.name || user?.email}</b>
          </p>

          {/* Quick Store Open Toggle (Desktop: Full Card, Tablet: Compact Icon) */}
          <div className="mt-3 lg:mt-4 p-2 lg:p-3 bg-neutral-50 rounded-2xl border border-neutral-200 flex flex-col lg:flex-row items-center justify-between gap-1.5 shadow-2xs">
            <div className="text-center lg:text-left min-w-0">
              <p className="hidden lg:block text-xs font-black text-neutral-800 uppercase tracking-wide">
                Trạng thái quán
              </p>
              <Badge variant={isOpen ? "success" : "danger"} size="sm" dot className="mt-0 lg:mt-1 text-[10px]">
                <span className="hidden lg:inline">{isOpen ? "Đang nhận đơn" : "Đang đóng cửa"}</span>
                <span className="lg:hidden">{isOpen ? "Mở" : "Đóng"}</span>
              </Badge>
            </div>
            {onToggleStoreOpen && (
              <div className="scale-90 lg:scale-100 flex-shrink-0">
                <Switch checked={isOpen} onChange={onToggleStoreOpen} />
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1 sm:space-y-1.5" aria-label="Danh mục quản trị">
          <p className="hidden lg:block text-[11px] font-black text-neutral-400 uppercase tracking-wider px-3 mb-2">
            Menu Quản Trị
          </p>
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href) ||
                  (item.href === "/admin/coupons" && pathname.startsWith("/admin/vouchers")) ||
                  (item.href === "/admin/products" && pathname.startsWith("/admin/menu"));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center justify-center lg:justify-between px-2.5 lg:px-4 py-2.5 lg:py-3 rounded-2xl text-sm font-black transition-all select-none group min-h-[44px] ${
                  isActive
                    ? "bg-brand-900 text-white shadow-md"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                {/* Icon + Label */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`transition-transform duration-150 ${isActive ? "scale-105" : "group-hover:scale-105"}`}>
                    {item.icon}
                  </div>
                  <span className="hidden lg:inline tracking-tight truncate">
                    {item.label}
                  </span>
                </div>

                {/* Badge on Desktop */}
                {item.badge && (
                  <span className="hidden lg:inline-block bg-rose-600 text-white text-xs font-black px-2 py-0.5 rounded-full flex-shrink-0 ml-1">
                    {item.badge}
                  </span>
                )}

                {/* Badge indicator on Tablet */}
                {item.shortBadge !== undefined && (
                  <span className="lg:hidden absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-black text-white ring-2 ring-white">
                    {item.shortBadge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer link to public web & Logout */}
      <div className="pt-3 lg:pt-4 border-t border-neutral-100 space-y-2">
        <Link
          href="/"
          target="_blank"
          title="Xem trang bán hàng (Web khách)"
          className="flex items-center justify-center w-full py-2 lg:py-2.5 px-2 lg:px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-black rounded-xl border border-neutral-300 uppercase tracking-wider transition-colors shadow-2xs min-h-[40px]"
        >
          <svg className="w-4 h-4 lg:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span className="hidden lg:inline">XEM TRANG KHÁCH (WEB)</span>
        </Link>
        <button
          onClick={handleLogout}
          title="Đăng xuất khỏi tài khoản Admin"
          className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 uppercase tracking-wider py-1.5 transition-colors min-h-[36px]"
        >
          <svg className="w-4 h-4 lg:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden lg:inline">Đăng Xuất Admin</span>
        </button>
      </div>
    </aside>
  );
};
