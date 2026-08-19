"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Phone, X, MessageCircle, ExternalLink } from "lucide-react";

export function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Đóng widget khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Đóng widget khi chuyển trang
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Không hiển thị trên SSR trước khi mount hoặc khi ở trang Admin
  if (!isMounted || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div
      ref={widgetRef}
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 select-none print:hidden"
    >
      {/* 1. MENU LIÊN HỆ MỞ RỘNG */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Menu liên hệ nhanh Trà Sữa Dino"
          className="absolute bottom-16 right-0 mb-2 w-64 sm:w-72 bg-white/95 backdrop-blur-md rounded-2xl border border-neutral-200/90 shadow-floating p-3 space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header nhỏ trong menu */}
          <div className="flex items-center justify-between px-1 pb-1.5 border-b border-neutral-100">
            <div className="flex items-center gap-1.5">
              <span className="text-base">🦕</span>
              <span className="text-xs font-black text-brand-950 uppercase tracking-tight">
                Liên hệ Trà Sữa Dino
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng menu liên hệ"
              className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            {/* 1. GỌI ĐIỆN THOẠI */}
            <a
              href="tel:0858798206"
              className="group flex items-center gap-3 p-2.5 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-emerald-50 hover:border-emerald-200/80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform flex-shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-neutral-900 block group-hover:text-emerald-800">
                  Gọi ngay
                </span>
                <span className="text-[11px] font-semibold text-neutral-500 block leading-tight">
                  0858798206
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md flex-shrink-0">
                Gọi
              </span>
            </a>

            {/* 2. ZALO */}
            <a
              href="https://zalo.me/0858798206"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-2.5 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-sky-50 hover:border-sky-200/80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <div className="h-9 w-9 rounded-xl bg-[#0068FF] text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform flex-shrink-0 font-black text-xs">
                <span className="tracking-tighter">Zalo</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-neutral-900 block group-hover:text-sky-800">
                  Chat Zalo
                </span>
                <span className="text-[11px] font-semibold text-neutral-500 block leading-tight">
                  0858798206
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-sky-600 flex-shrink-0" />
            </a>

            {/* 3. FACEBOOK */}
            <a
              href="https://www.facebook.com/nhung.quinn"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-2.5 rounded-xl border border-neutral-100 bg-neutral-50/50 hover:bg-blue-50 hover:border-blue-200/80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <div className="h-9 w-9 rounded-xl bg-[#1877F2] text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform flex-shrink-0">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-neutral-900 block group-hover:text-blue-800">
                  Facebook
                </span>
                <span className="text-[11px] font-semibold text-neutral-500 block leading-tight">
                  Trà Sữa Dino
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400 group-hover:text-blue-600 flex-shrink-0" />
            </a>
          </div>
        </div>
      )}

      {/* 2. NÚT TRÒN NỔI CHÍNH (TRIGGER BUTTON) */}
      <div className="relative group">
        {/* Tooltip trên desktop khi đóng */}
        {!isOpen && (
          <div className="hidden sm:block absolute right-full mr-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap">
            <div className="bg-neutral-900/90 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-md border border-neutral-700/50 backdrop-blur-xs flex items-center gap-1.5">
              <span>💬</span>
              <span>Liên hệ với chúng tôi</span>
            </div>
          </div>
        )}

        {/* Hiệu ứng xung nhịp nhẹ khi đóng */}
        {!isOpen && (
          <span className="absolute -inset-1 rounded-full bg-brand-500/20 animate-ping pointer-events-none" />
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Liên hệ với Trà Sữa Dino"
          aria-expanded={isOpen}
          className={`relative h-13 w-13 sm:h-14 sm:w-14 rounded-full flex items-center justify-center text-white shadow-floating border-2 border-white transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-400 ${
            isOpen
              ? "bg-neutral-800 hover:bg-neutral-900 rotate-90"
              : "bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 hover:brightness-110 hover:scale-105"
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}

          {/* Chấm trạng thái hoạt động */}
          {!isOpen && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" />
          )}
        </button>
      </div>
    </div>
  );
}
