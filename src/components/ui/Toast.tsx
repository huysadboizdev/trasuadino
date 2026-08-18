"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  playDingSound: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Phát âm thanh chuông êm ái bằng Web Audio API
  const playDingSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.38);
    } catch (e) {
      console.warn("Audio warning:", e);
    }
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    if (type === "success" || type === "info") {
      playDingSound();
    }

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, [playDingSound]);

  const configByType: Record<
    ToastType,
    {
      dotColor: string;
      tagBg: string;
      tagText: string;
      tagLabel: string;
      borderColor: string;
    }
  > = {
    success: {
      dotColor: "bg-emerald-500",
      tagBg: "bg-emerald-50",
      tagText: "text-emerald-800",
      tagLabel: "THÀNH CÔNG",
      borderColor: "border-emerald-200/80 shadow-emerald-900/5",
    },
    error: {
      dotColor: "bg-rose-500",
      tagBg: "bg-rose-50",
      tagText: "text-rose-800",
      tagLabel: "LỖI",
      borderColor: "border-rose-200/80 shadow-rose-900/5",
    },
    warning: {
      dotColor: "bg-amber-500",
      tagBg: "bg-amber-50",
      tagText: "text-amber-800",
      tagLabel: "LƯU Ý",
      borderColor: "border-amber-200/80 shadow-amber-900/5",
    },
    info: {
      dotColor: "bg-brand-600",
      tagBg: "bg-brand-50",
      tagText: "text-brand-900",
      tagLabel: "DINO TEA",
      borderColor: "border-brand-200/80 shadow-brand-900/5",
    },
  };

  const toastElement = mounted ? (
    <div className="fixed top-3 sm:top-5 left-3 right-3 sm:left-auto sm:right-6 z-[200] flex flex-col items-center sm:items-end gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const cfg = configByType[toast.type] || configByType.info;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-2.5 w-full max-w-[calc(100vw-24px)] sm:w-auto sm:min-w-[300px] sm:max-w-md bg-white/95 backdrop-blur-md px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl border shadow-xl transition-all duration-300 animate-slide-up ${cfg.borderColor}`}
          >
            {/* Left Content */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Status Dot with pulse effect */}
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${cfg.dotColor}`} />
                <span className={`absolute inline-block w-2.5 h-2.5 rounded-full ${cfg.dotColor} animate-ping opacity-60`} />
              </div>

              {/* Tag Badge */}
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-lg flex-shrink-0 ${cfg.tagBg} ${cfg.tagText}`}
              >
                {cfg.tagLabel}
              </span>

              {/* Message */}
              <p className="text-xs sm:text-sm font-bold text-neutral-800 tracking-tight leading-snug break-words line-clamp-2 sm:line-clamp-none">
                {toast.message}
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-neutral-400 hover:text-neutral-700 transition-colors p-1 -mr-1 rounded-lg hover:bg-neutral-100 flex-shrink-0"
              aria-label="Đóng thông báo"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <path
                  d="M1 1L13 13M1 13L1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  ) : null;

  return (
    <ToastContext.Provider value={{ showToast, playDingSound }}>
      {children}
      {mounted && toastElement && createPortal(toastElement, document.body)}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast phải được sử dụng bên trong ToastProvider");
  }
  return context;
};
