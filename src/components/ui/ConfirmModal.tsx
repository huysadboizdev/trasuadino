"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  message?: string;
  highlightText?: string;
  highlightLabel?: string;
  warningText?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  icon?: React.ReactNode;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận hành động",
  message = "Bạn có chắc chắn muốn thực hiện hành động này không?",
  highlightText,
  highlightLabel = "Mục được chọn",
  warningText = "Hành động này không thể hoàn tác.",
  confirmLabel = "XÁC NHẬN",
  cancelLabel = "HỦY",
  variant = "danger",
  icon,
  isLoading = false,
  errorMessage = null,
}) => {
  const [mounted, setMounted] = useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

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

  // Hỗ trợ phím Escape để đóng modal (chỉ khi không đang loading)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    },
    [onClose, isLoading]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Tự động focus vào nút Hủy hoặc Xóa khi mở modal
  useEffect(() => {
    if (isOpen && mounted) {
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mounted]);

  if (!isOpen || !mounted) return null;

  const handleBackdropClick = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const isDanger = variant === "danger";

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200 animate-fade-in"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full max-w-[440px] bg-white rounded-3xl shadow-2xl border border-neutral-200/90 p-5 sm:p-6 overflow-hidden flex flex-col animate-slide-up select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Icon Circle */}
        <div className="flex justify-center mb-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs border ${
              isDanger
                ? "bg-rose-50 border-rose-100 text-rose-600"
                : "bg-amber-50 border-amber-100 text-amber-600"
            }`}
          >
            {icon || (
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                {isDanger ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                )}
              </svg>
            )}
          </div>
        </div>

        {/* Title & Message */}
        <div className="text-center space-y-1.5 mb-3">
          <h3
            id="confirm-modal-title"
            className="text-lg sm:text-xl font-black text-neutral-900 uppercase tracking-tight"
          >
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed">
            {message}
          </p>
        </div>

        {/* Highlight Box (e.g. Mã voucher hoặc Tên mục xóa) */}
        {highlightText && (
          <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200 text-center mb-3">
            <p className="text-[10px] sm:text-[11px] font-black uppercase text-neutral-400 tracking-wider">
              {highlightLabel}
            </p>
            <p className="text-base sm:text-lg font-black text-brand-950 tracking-wide font-mono mt-0.5 break-all">
              {highlightText}
            </p>
          </div>
        )}

        {/* Warning Badge Notice */}
        {warningText && (
          <div className="bg-rose-50/90 border border-rose-200/90 text-rose-800 text-[11px] sm:text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 mb-4 text-center">
            <span>⚠️</span>
            <span>{warningText}</span>
          </div>
        )}

        {/* Dynamic Error Message if API fails */}
        {errorMessage && (
          <div className="bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold p-2.5 rounded-xl text-center mb-3.5 animate-shake">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center gap-2 sm:gap-2.5 w-full pt-1">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="min-h-[44px] sm:min-h-[46px] w-full sm:w-1/3 bg-white hover:bg-neutral-100 text-neutral-700 font-black text-xs uppercase tracking-wider rounded-xl border border-neutral-300 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
          >
            {cancelLabel}
          </button>

          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`min-h-[44px] sm:min-h-[46px] w-full sm:w-2/3 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/25"
                : "bg-brand-900 hover:bg-brand-950 active:bg-neutral-900 shadow-brand-900/25"
            }`}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>ĐANG XÓA...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
