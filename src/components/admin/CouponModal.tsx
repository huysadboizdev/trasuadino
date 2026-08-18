"use client";

import React, { useState, useEffect } from "react";
import { Coupon } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Coupon>) => Promise<void>;
  coupon?: Coupon | null;
}

export const CouponModal: React.FC<CouponModalProps> = ({
  isOpen,
  onClose,
  onSave,
  coupon,
}) => {
  const { showToast } = useToast();
  const isEditing = !!coupon;

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number | string>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number | string>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | string>("");
  const [hasExpiry, setHasExpiry] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hasUsageLimit, setHasUsageLimit] = useState(false);
  const [usageLimit, setUsageLimit] = useState<number | string>("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (coupon) {
      setCode(coupon.code);
      setDescription(coupon.description || "");
      setDiscountPercent(coupon.discountPercent);
      setMinOrderAmount(coupon.minOrderAmount || 0);
      setMaxDiscountAmount(coupon.maxDiscountAmount || "");
      setHasExpiry(!!(coupon.startDate || coupon.endDate));
      setStartDate(coupon.startDate || "");
      setEndDate(coupon.endDate || "");
      setHasUsageLimit(!!coupon.usageLimit);
      setUsageLimit(coupon.usageLimit || "");
      setIsActive(coupon.isActive);
    } else {
      setCode("");
      setDescription("");
      setDiscountPercent(10);
      setMinOrderAmount(0);
      setMaxDiscountAmount("");
      setHasExpiry(false);
      setStartDate("");
      setEndDate("");
      setHasUsageLimit(false);
      setUsageLimit("");
      setIsActive(true);
    }
  }, [coupon, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = code.toUpperCase().trim().replace(/\s+/g, "");
    if (!cleanCode) {
      showToast("Vui lòng nhập mã giảm giá (Code)", "error");
      return;
    }

    const pct = Number(discountPercent);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      showToast("Phần trăm giảm giá phải từ 1% đến 100%", "error");
      return;
    }

    if (hasExpiry && startDate && endDate && new Date(startDate) > new Date(endDate)) {
      showToast("Thời gian bắt đầu không được lớn hơn thời gian kết thúc", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        code: cleanCode,
        description: description.trim() || undefined,
        discountPercent: pct,
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
        startDate: hasExpiry && startDate ? startDate : undefined,
        endDate: hasExpiry && endDate ? endDate : undefined,
        usageLimit: hasUsageLimit && usageLimit ? Number(usageLimit) : undefined,
        isActive,
      });
      onClose();
    } catch (err: any) {
      showToast(err?.message || "Lỗi khi lưu mã giảm giá", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-100 bg-neutral-50/70 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-900 text-white flex items-center justify-center text-lg font-black shadow-xs">
              🏷️
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-brand-950 uppercase tracking-tight">
                {isEditing ? "CHỈNH SỬA MÃ GIẢM GIÁ" : "TẠO MÃ GIẢM GIÁ MỚI"}
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                Cài đặt mã voucher khuyến mãi theo % cho khách hàng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 flex items-center justify-center text-sm font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* Mã Code & % Giảm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                MÃ GIẢM GIÁ <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                placeholder="VD: DINO10, TET2026"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-300 font-black text-brand-950 tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                GIẢM THEO PHẦN TRĂM (%) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="VD: 10, 20, 50"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-300 font-black text-rose-600 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-black text-neutral-400">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
              MÔ TẢ KHUYẾN MÃI
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Giảm 20% mừng khai trương cho đơn từ 60.000đ"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-300 font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>

          {/* Điều kiện đơn tối thiểu & Giảm tối đa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                ĐƠN TỐI THIỂU (VNĐ)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="0 = Không yêu cầu"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-300 font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
              <span className="text-[10px] text-neutral-400 font-medium">0đ: áp dụng mọi đơn hàng</span>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                MỨC GIẢM TỐI ĐA (VNĐ)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                placeholder="Để trống = Không giới hạn"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-300 font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
              <span className="text-[10px] text-neutral-400 font-medium">Tối đa số tiền được trừ (VD: 30.000đ)</span>
            </div>
          </div>

          {/* Giới hạn số lượt dùng */}
          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-neutral-800 uppercase">
                  Giới hạn số lượt sử dụng
                </p>
                <p className="text-[11px] text-neutral-500 font-medium">
                  {hasUsageLimit ? "Mã sẽ tự động khóa khi đạt số lượt này" : "Không giới hạn tổng số lượt dùng"}
                </p>
              </div>
              <Switch checked={hasUsageLimit} onChange={(val) => setHasUsageLimit(val)} />
            </div>

            {hasUsageLimit && (
              <div className="pt-2 border-t border-neutral-200/60">
                <input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="VD: 50 hoặc 100 lượt"
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 font-black text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required={hasUsageLimit}
                />
              </div>
            )}
          </div>

          {/* Hạn sử dụng (Theo ngày và giờ) */}
          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-neutral-800 uppercase">
                  Hiệu lực theo Ngày & Giờ
                </p>
                <p className="text-[11px] text-neutral-500 font-medium">
                  {hasExpiry ? "Chỉ cho phép dùng trong khung thời gian cài đặt" : "Có hiệu lực vĩnh viễn (hoặc đến khi tắt)"}
                </p>
              </div>
              <Switch checked={hasExpiry} onChange={(val) => setHasExpiry(val)} />
            </div>

            {hasExpiry && (
              <div className="pt-2 border-t border-neutral-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-1">
                    BẮT ĐẦU TỪ:
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-bold text-neutral-900 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 mb-1">
                    KẾT THÚC VÀO:
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-bold text-neutral-900 bg-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bật / Tắt trạng thái mã ngay lập tức */}
          <div className="p-3.5 bg-brand-50/50 rounded-2xl border border-brand-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-brand-950 uppercase">
                Trạng thái kích hoạt mã
              </p>
              <p className="text-[11px] text-brand-700 font-medium">
                {isActive ? "Đang bật (Khách hàng có thể nhập mã)" : "Đang tắt (Tạm ngưng áp dụng mã này)"}
              </p>
            </div>
            <Switch checked={isActive} onChange={(val) => setIsActive(val)} />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              HỦY BỎ
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              className="bg-brand-900 hover:bg-brand-950 text-white font-black px-6"
            >
              {isEditing ? "LƯU THAY ĐỔI" : "TẠO MÃ GIẢM GIÁ"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
