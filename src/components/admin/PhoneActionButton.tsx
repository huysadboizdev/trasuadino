"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { isMobileDevice, handlePhoneAction } from "@/lib/phoneUtils";

export interface PhoneActionButtonProps {
  phone: string;
  variant?: "button" | "link" | "badge" | "compact";
  size?: "xs" | "sm" | "md";
  labelPrefix?: string;
  className?: string;
  onAction?: (action: "copied" | "called") => void;
}

export const PhoneActionButton: React.FC<PhoneActionButtonProps> = ({
  phone,
  variant = "button",
  size = "sm",
  labelPrefix = "GỌI",
  className = "",
  onAction,
}) => {
  const { showToast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const handleClick = async (e: React.MouseEvent) => {
    const result = await handlePhoneAction(phone, showToast, e);
    if (result === "copied") {
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
    if (onAction) {
      onAction(result === "called" ? "called" : "copied");
    }
  };

  if (!phone) return null;

  const tooltipText = isCopied
    ? "Đã sao chép số điện thoại vào bộ nhớ tạm"
    : isMobile
    ? `Bấm để gọi số ${phone}`
    : `Bấm để sao chép số điện thoại (${phone})`;

  // Variant: LINK (thích hợp cho danh sách bảng, thông tin khách trong hóa đơn / người dùng)
  if (variant === "link") {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={tooltipText}
        className={`inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold transition-all select-none cursor-pointer group ${
          isCopied
            ? "text-emerald-800 font-extrabold"
            : "text-emerald-700 hover:text-emerald-900 underline hover:no-underline"
        } ${className}`}
      >
        {isCopied ? (
          <>
            <svg className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 animate-scale" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-emerald-800 font-extrabold">Đã chép {phone}</span>
          </>
        ) : (
          <>
            <svg className="w-3 h-3 flex-shrink-0 text-emerald-600 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>{phone}</span>
            {!isMobile && (
              <svg className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity flex-shrink-0 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </>
        )}
      </button>
    );
  }

  // Variant: BADGE (nhẹ nhàng có viền)
  if (variant === "badge") {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={tooltipText}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-extrabold border transition-all select-none cursor-pointer flex-shrink-0 ${
          isCopied
            ? "bg-emerald-100 border-emerald-400 text-emerald-900"
            : "bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-800"
        } ${className}`}
      >
        {isCopied ? (
          <>
            <svg className="w-3 h-3 text-emerald-700 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>ĐÃ CHÉP SĐT</span>
          </>
        ) : (
          <>
            <svg className="w-3 h-3 flex-shrink-0 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>{phone}</span>
          </>
        )}
      </button>
    );
  }

  // Variant: BUTTON (mặc định trong OrderCard)
  const sizeClasses = {
    xs: "text-[10px] px-2 py-0.5 rounded-lg",
    sm: "text-[11px] sm:text-xs px-2.5 py-1 rounded-xl min-h-[30px]",
    md: "text-xs sm:text-sm px-3.5 py-1.5 rounded-xl min-h-[36px]",
  }[size];

  return (
    <button
      type="button"
      onClick={handleClick}
      title={tooltipText}
      aria-label={tooltipText}
      className={`group inline-flex items-center justify-center gap-1.5 font-black uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-xs select-none cursor-pointer flex-shrink-0 ${
        isCopied
          ? "bg-emerald-800 text-white ring-2 ring-emerald-400 shadow-sm"
          : "bg-emerald-700 hover:bg-emerald-800 text-white hover:shadow-md"
      } ${sizeClasses} ${className}`}
    >
      {isCopied ? (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-[11px] font-black tracking-wide">ĐÃ SAO CHÉP</span>
        </>
      ) : (
        <>
          {/* Phone Icon */}
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 text-emerald-200 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>

          {/* Text: Responsive display */}
          <span className="whitespace-nowrap">
            {labelPrefix ? `${labelPrefix} ` : ""}{phone}
          </span>

          {/* Desktop Copy Indicator Icon (Hinting that clicking copies number) */}
          {!isMobile && (
            <svg
              className="w-3 h-3 text-emerald-300 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0 hidden sm:inline-block ml-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </>
      )}
    </button>
  );
};
