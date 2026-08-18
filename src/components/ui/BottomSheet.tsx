"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "md",
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Khóa scroll của body khi modal mở
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Hỗ trợ phím Escape để đóng modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !mounted) return null;

  const maxWidthStyles = {
    sm: "md:max-w-md",
    md: "md:max-w-lg",
    lg: "md:max-w-2xl",
    xl: "md:max-w-3xl",
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 overscroll-none select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bottom-sheet-title"
    >
      {/* Dimmed Backdrop (che mờ toàn bộ màn hình bao gồm cả Bottom Navigation) */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity duration-200 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal / Bottom Sheet Box (Nằm trên cùng z-100, chuẩn 100dvh) */}
      <div
        className={`relative z-10 w-full bg-white rounded-t-[24px] md:rounded-3xl shadow-2xl overflow-hidden max-h-[calc(100dvh-8px)] md:max-h-[min(88vh,calc(100dvh-40px))] flex flex-col animate-slide-up md:animate-fade-in ${maxWidthStyles[maxWidth]} mx-auto border-t md:border border-neutral-200/80 min-w-0 select-text`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1 flex-shrink-0 bg-neutral-50/90 select-none">
          <div className="w-10 h-1 bg-neutral-300 rounded-full" />
        </div>

        {/* 1. Header (Cố định, flex-shrink: 0) */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-neutral-100 bg-neutral-50/90 flex-shrink-0">
          <div className="min-w-0 flex-1 pr-2">
            <h3
              id="bottom-sheet-title"
              className="text-sm sm:text-base md:text-lg font-black text-neutral-900 tracking-tight truncate"
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-neutral-500 font-medium truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-2.5 py-1.5 text-xs font-black text-neutral-600 bg-neutral-200/80 hover:bg-neutral-300 transition-colors uppercase tracking-wider flex-shrink-0 active:scale-95 shadow-2xs"
            aria-label="Đóng bảng chọn"
          >
            Đóng
          </button>
        </div>

        {/* 2. Scrollable Content (flex: 1, min-h: 0, overflow-y: auto) */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 overscroll-contain ${
            !footer ? "pb-[max(16px,calc(1rem+env(safe-area-inset-bottom,0px)))]" : ""
          }`}
        >
          {children}
        </div>

        {/* 3. Footer / Actions (Cố định ở đáy, flex-shrink: 0, chuẩn Safe Area iOS) */}
        {footer && (
          <div className="p-3 sm:p-4 border-t border-neutral-100 bg-neutral-50/95 pb-[max(12px,calc(0.75rem+env(safe-area-inset-bottom,0px)))] flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
