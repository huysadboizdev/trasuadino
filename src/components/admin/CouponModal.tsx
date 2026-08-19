"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Coupon, Category, Product, DiscountType, CustomerScope, ProductScope } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { CustomerGroupSelect } from "./CustomerGroupSelect";

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Coupon>) => Promise<void>;
  coupon?: Coupon | null;
  categories?: Category[];
  products?: Product[];
}

export const CouponModal: React.FC<CouponModalProps> = ({
  isOpen,
  onClose,
  onSave,
  coupon,
  categories = [],
  products = [],
}) => {
  const { showToast } = useToast();
  const isEditing = !!coupon;

  // Basic Information
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  // Discount Type & Value
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENT");
  const [discountValue, setDiscountValue] = useState<number | string>(10);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | string>("");

  // Condition 1: Minimum Order Amount
  const [hasMinOrder, setHasMinOrder] = useState(false);
  const [minOrderAmount, setMinOrderAmount] = useState<number | string>("");

  // Condition 2: Completed Orders Requirement
  const [hasMinOrders, setHasMinOrders] = useState(false);
  const [minCompletedOrders, setMinCompletedOrders] = useState<number | string>("");

  // Condition 3: Total Spent Requirement
  const [hasMinSpent, setHasMinSpent] = useState(false);
  const [minTotalSpent, setMinTotalSpent] = useState<number | string>("");

  // Condition 4: Customer Scope
  const [customerScope, setCustomerScope] = useState<CustomerScope>("ALL");

  // Condition 5: Product / Category Scope
  const [applyScope, setApplyScope] = useState<ProductScope>("ALL");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Usage Limits
  const [hasUsageLimit, setHasUsageLimit] = useState(false);
  const [usageLimit, setUsageLimit] = useState<number | string>("");
  const [usagePerUser, setUsagePerUser] = useState<number | string>(1);

  // Time Schedule
  const [hasExpiry, setHasExpiry] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Active status
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load initial data
  useEffect(() => {
    if (coupon) {
      setCode(coupon.code);
      setDescription(coupon.description || "");
      const dtype = coupon.discountType || "PERCENT";
      setDiscountType(dtype);
      setDiscountValue(coupon.discountValue ?? coupon.discountPercent ?? 10);
      setMaxDiscountAmount(coupon.maxDiscountAmount || "");

      setHasMinOrder(Boolean(coupon.minOrderAmount && coupon.minOrderAmount > 0));
      setMinOrderAmount(coupon.minOrderAmount || "");

      setHasMinOrders(Boolean(coupon.minCompletedOrders && coupon.minCompletedOrders > 0));
      setMinCompletedOrders(coupon.minCompletedOrders || "");

      setHasMinSpent(Boolean(coupon.minTotalSpent && coupon.minTotalSpent > 0));
      setMinTotalSpent(coupon.minTotalSpent || "");

      setCustomerScope(coupon.customerScope || "ALL");

      setApplyScope(coupon.applyScope || "ALL");
      setSelectedCategoryIds(coupon.applicableCategoryIds || []);
      setSelectedProductIds(coupon.applicableProductIds || []);

      setHasUsageLimit(Boolean(coupon.usageLimit && coupon.usageLimit > 0));
      setUsageLimit(coupon.usageLimit || "");
      setUsagePerUser(coupon.usagePerUser || 1);

      setHasExpiry(Boolean(coupon.startDate || coupon.endDate));
      setStartDate(coupon.startDate || "");
      setEndDate(coupon.endDate || "");

      setIsActive(coupon.isActive);
    } else {
      setCode("");
      setDescription("");
      setDiscountType("PERCENT");
      setDiscountValue(10);
      setMaxDiscountAmount("");

      setHasMinOrder(false);
      setMinOrderAmount("");

      setHasMinOrders(false);
      setMinCompletedOrders("");

      setHasMinSpent(false);
      setMinTotalSpent("");

      setCustomerScope("ALL");

      setApplyScope("ALL");
      setSelectedCategoryIds([]);
      setSelectedProductIds([]);

      setHasUsageLimit(false);
      setUsageLimit("");
      setUsagePerUser(1);

      setHasExpiry(false);
      setStartDate("");
      setEndDate("");

      setIsActive(true);
    }
  }, [coupon, isOpen]);

  // Formatter helpers
  const formatCurrency = (val?: number | string) => {
    const num = Number(val);
    if (!num || isNaN(num)) return "0đ";
    return new Intl.NumberFormat("vi-VN").format(num) + "đ";
  };

  const formatShortDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  // Toggle Category selection
  const handleToggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Toggle Product selection
  const handleToggleProduct = (prodId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(prodId) ? prev.filter((id) => id !== prodId) : [...prev, prodId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = code.toUpperCase().trim().replace(/\s+/g, "");
    if (!cleanCode) {
      showToast("Vui lòng nhập mã giảm giá (Code)", "error");
      return;
    }

    const val = Number(discountValue);
    if (isNaN(val) || val <= 0) {
      showToast("Giá trị giảm giá phải lớn hơn 0", "error");
      return;
    }

    if (discountType === "PERCENT" && val > 100) {
      showToast("Phần trăm giảm giá không được vượt quá 100%", "error");
      return;
    }

    if (hasExpiry && startDate && endDate && new Date(startDate) > new Date(endDate)) {
      showToast("Thời gian bắt đầu không được lớn hơn thời gian kết thúc", "error");
      return;
    }

    if (applyScope === "CATEGORIES" && selectedCategoryIds.length === 0) {
      showToast("Vui lòng chọn ít nhất một danh mục áp dụng", "error");
      return;
    }

    if (applyScope === "PRODUCTS" && selectedProductIds.length === 0) {
      showToast("Vui lòng chọn ít nhất một món áp dụng", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        code: cleanCode,
        description: description.trim() || undefined,
        discountType,
        discountValue: val,
        discountPercent: discountType === "PERCENT" ? val : undefined,
        maxDiscountAmount: discountType === "PERCENT" && maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
        minOrderAmount: hasMinOrder && minOrderAmount ? Number(minOrderAmount) : 0,
        minCompletedOrders: hasMinOrders && minCompletedOrders ? Number(minCompletedOrders) : undefined,
        minTotalSpent: hasMinSpent && minTotalSpent ? Number(minTotalSpent) : undefined,
        customerScope,
        applyScope,
        applicableCategoryIds: applyScope === "CATEGORIES" ? selectedCategoryIds : [],
        applicableProductIds: applyScope === "PRODUCTS" ? selectedProductIds : [],
        usageLimit: hasUsageLimit && usageLimit ? Number(usageLimit) : undefined,
        usagePerUser: usagePerUser ? Number(usagePerUser) : 1,
        startDate: hasExpiry && startDate ? startDate : undefined,
        endDate: hasExpiry && endDate ? endDate : undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 bg-neutral-50/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-900 text-white flex items-center justify-center text-lg font-black shadow-xs">
              🎟️
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-brand-950 uppercase tracking-tight">
                {isEditing ? "CHỈNH SỬA MÃ GIẢM GIÁ" : "TẠO MÃ GIẢM GIÁ MỚI"}
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                Cấu hình chương trình khuyến mãi linh hoạt (Shopee-Style Engine)
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* SECTION 1: THÔNG TIN CƠ BẢN */}
          <div className="space-y-3 p-4 bg-neutral-50/70 rounded-2xl border border-neutral-200/80">
            <h3 className="text-xs font-black uppercase text-brand-900 tracking-wider flex items-center gap-1.5">
              <span>🏷️</span> 1. THÔNG TIN MÃ GIẢM GIÁ
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                  MÃ GIẢM GIÁ (CODE) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                  placeholder="VD: DINO100K, TET2026, VIP20"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-black text-brand-950 tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                  MÔ TẢ KHUYẾN MÃI
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="VD: Giảm 100k cho khách hàng thân thiết từ 10 đơn"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: HÌNH THỨC GIẢM */}
          <div className="space-y-3.5 p-4 bg-neutral-50/70 rounded-2xl border border-neutral-200/80">
            <h3 className="text-xs font-black uppercase text-brand-900 tracking-wider flex items-center gap-1.5">
              <span>💰</span> 2. HÌNH THỨC & MỨC GIẢM GIÁ
            </h3>

            {/* Radio Chọn Loại Giảm Giá */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  discountType === "PERCENT"
                    ? "bg-rose-50/60 border-rose-500 shadow-2xs"
                    : "bg-white border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <input
                  type="radio"
                  name="discountType"
                  value="PERCENT"
                  checked={discountType === "PERCENT"}
                  onChange={() => setDiscountType("PERCENT")}
                  className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <p className="font-black text-xs text-neutral-900">Giảm theo phần trăm (%)</p>
                  <p className="text-[11px] text-neutral-500">Ví dụ: Giảm 10%, 20%, 50%</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  discountType === "FIXED_AMOUNT"
                    ? "bg-rose-50/60 border-rose-500 shadow-2xs"
                    : "bg-white border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <input
                  type="radio"
                  name="discountType"
                  value="FIXED_AMOUNT"
                  checked={discountType === "FIXED_AMOUNT"}
                  onChange={() => setDiscountType("FIXED_AMOUNT")}
                  className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <p className="font-black text-xs text-neutral-900">Giảm tiền cố định (VNĐ)</p>
                  <p className="text-[11px] text-neutral-500">Ví dụ: Giảm 50.000đ, 100.000đ, 200.000đ</p>
                </div>
              </label>
            </div>

            {/* Inputs theo Loại Giảm Giá */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {discountType === "PERCENT" ? (
                <>
                  <div>
                    <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                      PHẦN TRĂM GIẢM (%) <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder="VD: 10, 20"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-black text-rose-600 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                        required
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-black text-neutral-400">
                        %
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                      MỨC GIẢM TỐI ĐA (VNĐ)
                    </label>
                    <CurrencyInput
                      value={maxDiscountAmount}
                      onChange={(val) => setMaxDiscountAmount(val)}
                      placeholder="Để trống = Không giới hạn"
                      suffix="₫"
                      size="sm"
                    />
                    <span className="text-[10px] text-neutral-400 font-medium">Trần giảm tối đa (VD: 100.000đ)</span>
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                    SỐ TIỀN GIẢM CỐ ĐỊNH (VNĐ) <span className="text-rose-600">*</span>
                  </label>
                  <CurrencyInput
                    value={discountValue}
                    onChange={(val) => setDiscountValue(val)}
                    placeholder="VD: 50.000, 100.000, 200.000"
                    suffix="₫"
                    required
                    size="md"
                  />
                  <span className="text-[10px] text-neutral-500 font-medium mt-1 block">
                    Được trừ trực tiếp vào tổng đơn hàng nếu thỏa mãn điều kiện.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: ĐIỀU KIỆN ÁP DỤNG */}
          <div className="space-y-3.5 p-4 bg-neutral-50/70 rounded-2xl border border-neutral-200/80">
            <h3 className="text-xs font-black uppercase text-brand-900 tracking-wider flex items-center gap-1.5">
              <span>📋</span> 3. ĐIỀU KIỆN ÁP DỤNG VOUCHER
            </h3>

            {/* 3.1. Đơn tối thiểu */}
            <div className="p-3 bg-white rounded-xl border border-neutral-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-neutral-900">Yêu cầu giá trị đơn hàng tối thiểu</p>
                  <p className="text-[11px] text-neutral-500">Áp dụng cho đơn đạt đủ giá trị trước khi giảm</p>
                </div>
                <Switch checked={hasMinOrder} onChange={(val) => setHasMinOrder(val)} />
              </div>
              {hasMinOrder && (
                <div className="pt-2 border-t border-neutral-100">
                  <CurrencyInput
                    value={minOrderAmount}
                    onChange={(val) => setMinOrderAmount(val)}
                    placeholder="VD: 500.000 hoặc 1.000.000"
                    suffix="₫"
                    required={hasMinOrder}
                    size="sm"
                  />
                </div>
              )}
            </div>

            {/* 3.2. Số đơn đã hoàn thành tối thiểu */}
            <div className="p-3 bg-white rounded-xl border border-neutral-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-neutral-900">Yêu cầu số đơn hàng đã hoàn thành</p>
                  <p className="text-[11px] text-neutral-500">Khách hàng phải có lịch sử mua tối thiểu X đơn hợp lệ</p>
                </div>
                <Switch checked={hasMinOrders} onChange={(val) => setHasMinOrders(val)} />
              </div>
              {hasMinOrders && (
                <div className="pt-2 border-t border-neutral-100">
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={minCompletedOrders}
                      onChange={(e) => setMinCompletedOrders(e.target.value)}
                      placeholder="VD: 10 đơn hoàn thành"
                      className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 font-bold text-neutral-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required={hasMinOrders}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                      Đơn
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 3.3. Tổng tiền đã chi tiêu tích lũy */}
            <div className="p-3 bg-white rounded-xl border border-neutral-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-neutral-900">Yêu cầu tổng tiền đã chi tiêu tích lũy</p>
                  <p className="text-[11px] text-neutral-500">Dành cho khách hàng thân thiết có tổng chi tiêu đạt mốc</p>
                </div>
                <Switch checked={hasMinSpent} onChange={(val) => setHasMinSpent(val)} />
              </div>
              {hasMinSpent && (
                <div className="pt-2 border-t border-neutral-100">
                  <CurrencyInput
                    value={minTotalSpent}
                    onChange={(val) => setMinTotalSpent(val)}
                    placeholder="VD: 5.000.000 (5 triệu)"
                    suffix="₫"
                    required={hasMinSpent}
                    size="sm"
                  />
                </div>
              )}
            </div>

            {/* 3.4. Phạm vi Khách Hàng */}
            <CustomerGroupSelect
              value={customerScope}
              onChange={(val) => setCustomerScope(val)}
            />

            {/* 3.5. Phạm vi Sản Phẩm / Danh Mục */}
            <div className="p-3 bg-white rounded-xl border border-neutral-200/90 space-y-2">
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider">
                Phạm Vi Áp Dụng Cho Sản Phẩm
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { id: "ALL", label: "Toàn bộ menu" },
                  { id: "CATEGORIES", label: "Theo danh mục" },
                  { id: "PRODUCTS", label: "Theo món cụ thể" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setApplyScope(s.id as ProductScope)}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition-all text-center ${
                      applyScope === s.id
                        ? "bg-brand-900 text-white border-brand-900 shadow-2xs"
                        : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Danh mục cụ thể */}
              {applyScope === "CATEGORIES" && (
                <div className="pt-2 border-t border-neutral-100 space-y-1.5">
                  <p className="text-[11px] font-bold text-neutral-600">Chọn danh mục được giảm giá:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-neutral-50 rounded-xl border border-neutral-200">
                    {categories.map((cat) => {
                      const isSelected = selectedCategoryIds.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleToggleCategory(cat.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all ${
                            isSelected
                              ? "bg-brand-800 text-white border-brand-800"
                              : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "}
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Món cụ thể */}
              {applyScope === "PRODUCTS" && (
                <div className="pt-2 border-t border-neutral-100 space-y-1.5">
                  <p className="text-[11px] font-bold text-neutral-600">Chọn các món được giảm giá ({selectedProductIds.length} món đã chọn):</p>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-neutral-50 rounded-xl border border-neutral-200">
                    {products.map((prod) => {
                      const isSelected = selectedProductIds.includes(prod.id);
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => handleToggleProduct(prod.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all ${
                            isSelected
                              ? "bg-brand-800 text-white border-brand-800"
                              : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "}
                          {prod.name} ({formatCurrency(prod.price)})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: GIỚI HẠN SỬ DỤNG & THỜI GIAN */}
          <div className="space-y-3.5 p-4 bg-neutral-50/70 rounded-2xl border border-neutral-200/80">
            <h3 className="text-xs font-black uppercase text-brand-900 tracking-wider flex items-center gap-1.5">
              <span>⏱️</span> 4. GIỚI HẠN & THỜI GIAN HIỆU LỰC
            </h3>

            {/* Giới hạn số lượt dùng toàn hệ thống */}
            <div className="p-3 bg-white rounded-xl border border-neutral-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-neutral-900">Giới hạn tổng số lượt sử dụng</p>
                  <p className="text-[11px] text-neutral-500">
                    {hasUsageLimit ? "Mã tự động khóa khi đạt số lượt này" : "Không giới hạn tổng lượt dùng"}
                  </p>
                </div>
                <Switch checked={hasUsageLimit} onChange={(val) => setHasUsageLimit(val)} />
              </div>

              {hasUsageLimit && (
                <div className="pt-2 border-t border-neutral-100">
                  <input
                    type="number"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="VD: 50, 100, 1000 lượt"
                    className="w-full px-3.5 py-2 rounded-lg border border-neutral-300 font-bold text-neutral-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required={hasUsageLimit}
                  />
                </div>
              )}
            </div>

            {/* Giới hạn số lần dùng trên mỗi khách hàng */}
            <div className="p-3 bg-white rounded-xl border border-neutral-200/90 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-xs text-neutral-900">Số lần tối đa mỗi khách hàng</p>
                <p className="text-[11px] text-neutral-500">Tránh tình trạng 1 khách dùng nhiều lần</p>
              </div>
              <div className="w-28 flex-shrink-0">
                <input
                  type="number"
                  min="1"
                  value={usagePerUser}
                  onChange={(e) => setUsagePerUser(e.target.value)}
                  placeholder="1"
                  className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 font-black text-neutral-900 text-center text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            {/* Hiệu lực theo Ngày & Giờ */}
            <div className="p-3 bg-white rounded-xl border border-neutral-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-neutral-900">Hiệu lực theo Ngày & Giờ</p>
                  <p className="text-[11px] text-neutral-500">
                    {hasExpiry ? "Chỉ áp dụng trong khung thời gian cài đặt" : "Không giới hạn thời gian"}
                  </p>
                </div>
                <Switch checked={hasExpiry} onChange={(val) => setHasExpiry(val)} />
              </div>

              {hasExpiry && (
                <div className="pt-2 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 mb-1">
                      BẮT ĐẦU TỪ:
                    </label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 font-bold text-neutral-900 bg-white text-xs"
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
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 font-bold text-neutral-900 bg-white text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bật / Tắt trạng thái mã */}
            <div className="p-3.5 bg-brand-50/60 rounded-xl border border-brand-200 flex items-center justify-between">
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
          </div>

          {/* SECTION 5: REALTIME LIVE PREVIEW VOUCHER TICKET */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-brand-900/10 rounded-2xl border border-amber-300/80 space-y-2">
            <p className="text-[11px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1">
              <span>👁️</span> XEM TRƯỚC VÉ VOUCHER (LIVE PREVIEW)
            </p>

            <div className="bg-white rounded-2xl p-4 border border-amber-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm sm:text-base text-brand-950 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                    {code.trim() ? code.toUpperCase() : "MÃ VOUCHER"}
                  </span>
                  <span className="text-xs font-black text-rose-600">
                    {discountType === "PERCENT"
                      ? `GIẢM ${discountValue || 0}% ${maxDiscountAmount ? `(Tối đa ${formatCurrency(maxDiscountAmount)})` : ""}`
                      : `GIẢM ${formatCurrency(discountValue || 0)}`}
                  </span>
                </div>

                <p className="text-xs text-neutral-600 font-medium">
                  {description || "Chưa có mô tả khuyến mãi"}
                </p>

                {/* Các điều kiện hiển thị trên vé */}
                <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-bold text-neutral-500">
                  {hasMinOrder && minOrderAmount && (
                    <span className="bg-neutral-100 px-2 py-0.5 rounded">
                      Đơn tối thiểu: {formatCurrency(minOrderAmount)}
                    </span>
                  )}
                  {hasMinOrders && minCompletedOrders && (
                    <span className="bg-neutral-100 px-2 py-0.5 rounded text-amber-800">
                      Tối thiểu {minCompletedOrders} đơn hoàn thành
                    </span>
                  )}
                  {hasMinSpent && minTotalSpent && (
                    <span className="bg-neutral-100 px-2 py-0.5 rounded text-amber-800">
                      Chi tiêu tích lũy: {formatCurrency(minTotalSpent)}
                    </span>
                  )}
                  {customerScope === "NEW_CUSTOMERS" && (
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                      Khách mới
                    </span>
                  )}
                  {hasExpiry && endDate && (
                    <span className="bg-neutral-100 px-2 py-0.5 rounded">
                      HSD: {formatShortDate(endDate)}
                    </span>
                  )}
                  <span className="bg-neutral-100 px-2 py-0.5 rounded">
                    {usagePerUser ? `${usagePerUser} lần/khách` : "1 lần/khách"}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0">
                <span className="px-3 py-1.5 rounded-xl bg-brand-900 text-white font-black text-xs uppercase tracking-wider shadow-2xs">
                  {isActive ? "SẴN SÀNG" : "ĐANG TẮT"}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2 flex-shrink-0">
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
