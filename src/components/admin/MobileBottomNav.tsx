"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BottomSheet } from "../ui/BottomSheet";
import { useAuth } from "@/context/AuthContext";

interface MobileBottomNavProps {
  newOrdersCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  newOrdersCount = 0,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleLogout = async () => {
    setIsMoreOpen(false);
    await logout();
    router.push("/login");
  };

  // 4 mục chính + 1 mục "Thêm"
  const primaryNavItems = [
    {
      href: "/admin/orders",
      label: "Đơn hàng",
      badge: newOrdersCount > 0 ? newOrdersCount : undefined,
      isActive: pathname.startsWith("/admin/orders"),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      href: "/admin/products",
      label: "Menu món",
      isActive: pathname.startsWith("/admin/products") || pathname.startsWith("/admin/menu"),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      href: "/admin/coupons",
      label: "Voucher",
      isActive: pathname.startsWith("/admin/coupons") || pathname.startsWith("/admin/vouchers"),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
    },
    {
      href: "/admin/categories",
      label: "Danh mục",
      isActive: pathname.startsWith("/admin/categories"),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
  ];

  // Kiểm tra xem trang hiện tại có thuộc nhóm "Thêm" hay không
  const isMoreActive =
    pathname === "/admin" ||
    pathname.startsWith("/admin/users") ||
    pathname.startsWith("/admin/settings");

  const moreMenuItems = [
    {
      href: "/admin",
      title: "Tổng quan (Dashboard)",
      subtitle: "Xem thống kê doanh thu, đơn hàng & phân tích",
      isActive: pathname === "/admin",
      iconBg: "bg-amber-100 text-amber-800",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      href: "/admin/users",
      title: "Quản lý người dùng",
      subtitle: "Phân quyền Quản trị viên & Nhân viên pha chế",
      isActive: pathname.startsWith("/admin/users"),
      iconBg: "bg-blue-100 text-blue-800",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      href: "/admin/settings",
      title: "Cài đặt quán & SePay",
      subtitle: "Cấu hình giờ mở cửa, thông tin quán & VietQR",
      isActive: pathname.startsWith("/admin/settings"),
      iconBg: "bg-emerald-100 text-emerald-800",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      href: "/",
      title: "Xem trang bán hàng (Web khách)",
      subtitle: "Mở trang chủ đặt món dành cho khách hàng",
      isExternal: true,
      iconBg: "bg-purple-100 text-purple-800",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Fixed Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Thanh điều hướng Admin trên thiết bị di động"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-1 pt-1 md:hidden shadow-lg pb-[calc(0.35rem+env(safe-area-inset-bottom,0px))]"
      >
        <div className="grid grid-cols-5 gap-0.5 sm:gap-1 max-w-lg mx-auto">
          {/* 4 Mục điều hướng trực tiếp */}
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center min-h-[48px] py-1.5 px-0.5 rounded-xl transition-all select-none active:scale-95 ${
                item.isActive
                  ? "bg-brand-900 text-white font-black shadow-xs"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 font-bold"
              }`}
            >
              {item.badge !== undefined && (
                <span className="absolute top-1 right-1.5 sm:right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white ring-2 ring-white shadow-2xs">
                  {item.badge}
                </span>
              )}
              <div className="flex-shrink-0 mb-0.5">
                {item.icon}
              </div>
              <span className="text-[10px] sm:text-[11px] font-black tracking-tight text-center leading-none truncate w-full px-0.5">
                {item.label}
              </span>
            </Link>
          ))}

          {/* Mục thứ 5: THÊM (Mở BottomSheet Drawer) */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className={`relative flex flex-col items-center justify-center min-h-[48px] py-1.5 px-0.5 rounded-xl transition-all select-none active:scale-95 cursor-pointer ${
              isMoreActive && !primaryNavItems.some((i) => i.isActive)
                ? "bg-brand-900 text-white font-black shadow-xs"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 font-bold"
            }`}
          >
            <div className="flex-shrink-0 mb-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <span className="text-[10px] sm:text-[11px] font-black tracking-tight text-center leading-none truncate w-full px-0.5">
              Thêm
            </span>
          </button>
        </div>
      </nav>

      {/* Bottom Sheet Drawer hiển thị toàn bộ chức năng còn lại */}
      <BottomSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        title="CHỨC NĂNG QUẢN TRỊ"
        subtitle="Hệ thống quản trị Quán Trà Sữa Dino"
        maxWidth="sm"
      >
        <div className="space-y-2 py-1">
          {moreMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              target={item.isExternal ? "_blank" : undefined}
              onClick={() => setIsMoreOpen(false)}
              className={`flex items-center justify-between p-3 rounded-2xl border transition-all select-none active:scale-[0.98] ${
                item.isActive
                  ? "bg-brand-50/90 border-brand-300 ring-2 ring-brand-500/20 shadow-xs"
                  : "bg-white border-neutral-200/90 hover:bg-neutral-50 hover:border-neutral-300"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${item.iconBg}`}
                >
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-black tracking-tight truncate ${
                      item.isActive ? "text-brand-950" : "text-neutral-900"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="text-[11px] text-neutral-500 font-medium truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {item.isActive && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-brand-900 text-white rounded-md">
                    ĐANG XEM
                  </span>
                )}
                <svg
                  className="w-4 h-4 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}

          {/* Nút Đăng xuất Admin */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs uppercase tracking-wider rounded-2xl border border-rose-200 transition-all active:scale-[0.98] shadow-2xs min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>ĐĂNG XUẤT TÀI KHOẢN ADMIN</span>
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
};
