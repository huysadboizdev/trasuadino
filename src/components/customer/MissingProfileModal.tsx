"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

export interface MissingProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: {
    name?: boolean;
    phone?: boolean;
    address?: boolean;
  };
  onGoToProfile: () => void;
}

export const MissingProfileModal: React.FC<MissingProfileModalProps> = ({
  isOpen,
  onClose,
  missingFields,
  onGoToProfile,
}) => {
  if (!isOpen) return null;

  const missingList: string[] = [];
  if (missingFields.name) missingList.push("Tên Facebook người nhận");
  if (missingFields.phone) missingList.push("Số điện thoại nhận hàng");
  if (missingFields.address) missingList.push("Địa chỉ giao hàng cụ thể");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="missing-info-title"
    >
      <div
        className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-neutral-200 space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center flex-shrink-0 text-2xl shadow-2xs">
            📋
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id="missing-info-title"
              className="text-base sm:text-lg font-black text-brand-950 uppercase tracking-tight"
            >
              Bạn chưa cập nhật thông tin
            </h3>
            <p className="text-xs text-neutral-600 font-medium mt-1">
              Để quán phục vụ và giao trà sữa tận tay nhanh chóng, bạn cần cung cấp đầy đủ thông tin nhận hàng:
            </p>
          </div>
        </div>

        {/* Missing Fields Highlight Box */}
        <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-3.5 space-y-1.5">
          <p className="text-[11px] font-black uppercase text-rose-800 tracking-wider">
            THÔNG TIN CÒN THIẾU:
          </p>
          <ul className="space-y-1 text-xs font-bold text-rose-900">
            {missingList.length > 0 ? (
              missingList.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-rose-600 text-base leading-none">•</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="flex items-center gap-2">
                <span className="text-rose-600">•</span>
                <span>Thông tin cá nhân & Địa chỉ nhận hàng</span>
              </li>
            )}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            className="order-2 sm:order-1 text-xs font-black uppercase border-neutral-300 text-neutral-700 hover:bg-neutral-100 min-h-[44px]"
          >
            ĐỂ SAU
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onGoToProfile}
            className="order-1 sm:order-2 flex-1 text-xs sm:text-sm font-black uppercase tracking-wider bg-brand-900 hover:bg-brand-950 text-white min-h-[44px] shadow-md"
          >
            👉 NHẬP THÔNG TIN TẠI ĐÂY
          </Button>
        </div>
      </div>
    </div>
  );
};
