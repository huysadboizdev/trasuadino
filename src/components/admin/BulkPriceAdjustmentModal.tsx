"use client";

import React, { useState, useMemo } from "react";
import { Product, Category } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { useToast } from "@/components/ui/Toast";

interface BulkPriceAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  onSuccess: () => void;
}

export const BulkPriceAdjustmentModal: React.FC<BulkPriceAdjustmentModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  onSuccess,
}) => {
  const { showToast } = useToast();

  // State
  const [scope, setScope] = useState<"SELECTED" | "ALL">("SELECTED");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [direction, setDirection] = useState<"INCREASE" | "DECREASE">("INCREASE");
  const [adjustmentType, setAdjustmentType] = useState<"FIXED" | "PERCENT">("FIXED");
  const [amount, setAmount] = useState<string>("2000");
  const [roundTo, setRoundTo] = useState<number>(1000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Filter products for selection list
  const selectableProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = filterCategory === "ALL" || p.categoryId === filterCategory;
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchCat && matchSearch;
    });
  }, [products, filterCategory, searchQuery]);

  // Handle select all in current filtered view
  const handleSelectAllFiltered = () => {
    const currentIds = selectableProducts.map((p) => p.id);
    const newSet = new Set([...selectedProductIds, ...currentIds]);
    setSelectedProductIds(Array.from(newSet));
  };

  const handleDeselectAllFiltered = () => {
    const currentIds = new Set(selectableProducts.map((p) => p.id));
    setSelectedProductIds(selectedProductIds.filter((id) => !currentIds.has(id)));
  };

  const handleToggleProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((item) => item !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  // Preview price changes
  const targetProducts = useMemo(() => {
    if (scope === "ALL") return products;
    return products.filter((p) => selectedProductIds.includes(p.id));
  }, [scope, products, selectedProductIds]);

  const numAmount = Math.abs(Number(amount)) || 0;
  const effectiveAmount = direction === "DECREASE" ? -numAmount : numAmount;

  const previewList = useMemo(() => {
    return targetProducts.map((p) => {
      const oldPrice = p.price;
      let newPrice = oldPrice;
      if (adjustmentType === "FIXED") {
        newPrice = oldPrice + effectiveAmount;
      } else if (adjustmentType === "PERCENT") {
        newPrice = oldPrice * (1 + effectiveAmount / 100);
      }

      if (roundTo > 0) {
        newPrice = Math.round(newPrice / roundTo) * roundTo;
      }
      newPrice = Math.max(0, Math.round(newPrice));
      const diff = newPrice - oldPrice;

      return {
        id: p.id,
        name: p.name,
        categoryName: p.categoryName,
        oldPrice,
        newPrice,
        diff,
      };
    });
  }, [targetProducts, adjustmentType, effectiveAmount, roundTo]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val) + "đ";
  };

  const handleSubmit = async () => {
    if (numAmount === 0) {
      showToast("Vui lòng nhập số tiền hoặc % điều chỉnh khác 0", "error");
      return;
    }

    if (scope === "SELECTED" && selectedProductIds.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 món để điều chỉnh giá", "warning");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/products/adjust-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          productIds: scope === "SELECTED" ? selectedProductIds : undefined,
          adjustmentType,
          direction,
          amount: numAmount,
          roundTo,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || "Điều chỉnh giá thành công!", "success");
        onSuccess();
        onClose();
      } else {
        showToast(data.message || "Lỗi khi điều chỉnh giá", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || "Lỗi kết nối máy chủ", "error");
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-100 bg-neutral-50/70 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-900 text-white flex items-center justify-center text-lg font-black shadow-xs">
              ⚡
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-brand-950 uppercase tracking-tight">
                ĐIỀU CHỈNH GIÁ SẢN PHẨM
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                Tăng hoặc giảm giá nhanh theo từng món được chọn hoặc toàn bộ thực đơn
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* 1. Lựa chọn phạm vi áp dụng */}
          <div>
            <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-2">
              1. PHẠM VI ÁP DỤNG
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setScope("SELECTED")}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                  scope === "SELECTED"
                    ? "border-brand-900 bg-brand-50/50 ring-2 ring-brand-800/20"
                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                }`}
              >
                <span className="text-lg">🎯</span>
                <div>
                  <p className="text-xs font-black text-neutral-900 uppercase">
                    Tùy chọn từng sản phẩm ({selectedProductIds.length} đã chọn)
                  </p>
                  <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                    Tự chọn danh sách các món hoặc theo từng danh mục cụ thể
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope("ALL")}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                  scope === "ALL"
                    ? "border-brand-900 bg-brand-50/50 ring-2 ring-brand-800/20"
                    : "border-neutral-200 hover:border-neutral-300 bg-white"
                }`}
              >
                <span className="text-lg">🌐</span>
                <div>
                  <p className="text-xs font-black text-neutral-900 uppercase">
                    Toàn bộ thực đơn ({products.length} món)
                  </p>
                  <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                    Điều chỉnh giá đồng loạt cho tất cả các món đang có trong quán
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Cấu hình mức tăng/giảm giá & hình thức */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-4">
            <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider">
              2. HƯỚNG ĐIỀU CHỈNH & MỨC GIÁ
            </label>

            {/* Chiều điều chỉnh: TĂNG GIÁ (+) hoặc GIẢM GIÁ (-) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection("INCREASE")}
                className={`py-2.5 px-3 rounded-xl border-2 text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                  direction === "INCREASE"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs"
                    : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <span>📈</span> TĂNG GIÁ (+)
              </button>
              <button
                type="button"
                onClick={() => setDirection("DECREASE")}
                className={`py-2.5 px-3 rounded-xl border-2 text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                  direction === "DECREASE"
                    ? "border-rose-600 bg-rose-50 text-rose-900 shadow-2xs"
                    : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <span>📉</span> GIẢM GIÁ (-)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Hình thức */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1.5">
                  Hình thức tính:
                </label>
                <div className="flex bg-neutral-200/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType("FIXED")}
                    className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${
                      adjustmentType === "FIXED"
                        ? "bg-white text-brand-950 shadow-2xs"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    Số tiền cố định (VNĐ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType("PERCENT")}
                    className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${
                      adjustmentType === "PERCENT"
                        ? "bg-white text-brand-950 shadow-2xs"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    Phần trăm (%)
                  </button>
                </div>
              </div>

              {/* Mức tăng/giảm */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1.5">
                  {direction === "INCREASE"
                    ? (adjustmentType === "FIXED" ? "Số tiền tăng thêm (VNĐ):" : "Phần trăm tăng thêm (%):")
                    : (adjustmentType === "FIXED" ? "Số tiền giảm bớt (VNĐ):" : "Phần trăm giảm bớt (%):")}
                </label>
                {adjustmentType === "FIXED" ? (
                  <CurrencyInput
                    value={amount}
                    onChange={(val) => setAmount(val === "" ? "" : String(val))}
                    placeholder="VD: 2.000 hoặc 5.000"
                    suffix="₫"
                    size="md"
                  />
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="VD: 10"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-black text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white pr-10"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400">
                      %
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quy tắc làm tròn */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200/60">
              <span className="text-[11px] font-bold text-neutral-600">
                Làm tròn giá mới:
              </span>
              <div className="flex items-center gap-2">
                {[
                  { value: 1000, label: "Tròn 1.000đ (khuyên dùng)" },
                  { value: 500, label: "Tròn 500đ" },
                  { value: 0, label: "Không làm tròn" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRoundTo(opt.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                      roundTo === opt.value
                        ? "bg-brand-900 text-white border-brand-900 shadow-2xs font-black"
                        : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Danh sách chọn sản phẩm (Nếu chọn Option 1: SELECTED) */}
          {scope === "SELECTED" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-black uppercase text-neutral-700 tracking-wider">
                  3. CHỌN DANH SÁCH MÓN ({selectedProductIds.length}/{products.length} món)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-xs font-black text-brand-900 hover:underline"
                  >
                    + Chọn tất cả ({selectableProducts.length})
                  </button>
                  <span className="text-neutral-300">•</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllFiltered}
                    className="text-xs font-bold text-neutral-500 hover:underline"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              {/* Bộ lọc theo danh mục & tìm kiếm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="ALL">Tất cả danh mục ({products.length} món)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({products.filter((p) => p.categoryId === c.id).length} món)
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Tìm nhanh tên món..."
                  className="px-3 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Box danh sách checkbox sản phẩm */}
              <div className="max-h-56 overflow-y-auto border border-neutral-200 rounded-2xl p-2 space-y-1 bg-neutral-50/50">
                {selectableProducts.length === 0 ? (
                  <p className="p-4 text-center text-xs text-neutral-400 font-bold">
                    Không tìm thấy món nào phù hợp.
                  </p>
                ) : (
                  selectableProducts.map((p) => {
                    const isSelected = selectedProductIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? "bg-brand-100/70 border border-brand-300"
                            : "hover:bg-neutral-100 border border-transparent bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleProduct(p.id)}
                            className="w-4 h-4 rounded text-brand-900 focus:ring-brand-500 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-neutral-900 truncate">
                              {p.name}
                            </p>
                            <p className="text-[10px] text-neutral-400 font-bold">
                              {p.categoryName}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-neutral-700 whitespace-nowrap pl-2">
                          {formatCurrency(p.price)}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 4. Xem trước kết quả thay đổi (Live Preview) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-neutral-700 tracking-wider flex items-center gap-1.5">
                <span>👁️</span> BẢNG XEM TRƯỚC GIÁ MỚI ({previewList.length} món)
              </label>
              {previewList.length > 0 && numAmount !== 0 && (
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-md border ${
                    direction === "INCREASE"
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : "text-rose-700 bg-rose-50 border-rose-200"
                  }`}
                >
                  {direction === "INCREASE" ? "Tăng " : "Giảm "}
                  {adjustmentType === "FIXED"
                    ? `${formatCurrency(numAmount)}/món`
                    : `${numAmount}%/món`}
                </span>
              )}
            </div>

            {previewList.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-neutral-300 rounded-2xl bg-neutral-50/50">
                <p className="text-xs font-bold text-neutral-400">
                  Chưa có món nào được chọn để xem trước giá mới.
                </p>
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto border border-neutral-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-neutral-100 text-neutral-700 font-black uppercase text-[10px] tracking-wider sticky top-0">
                    <tr>
                      <th className="p-2.5">Tên món</th>
                      <th className="p-2.5 text-right">Giá hiện tại</th>
                      <th className="p-2.5 text-right">Chênh lệch</th>
                      <th className="p-2.5 text-right text-brand-950 font-black">Giá sau điều chỉnh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white font-medium">
                    {previewList.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50">
                        <td className="p-2.5 font-bold text-neutral-900 truncate max-w-[180px]">
                          {item.name}
                        </td>
                        <td className="p-2.5 text-right text-neutral-500">
                          {formatCurrency(item.oldPrice)}
                        </td>
                        <td
                          className={`p-2.5 text-right font-black ${
                            item.diff > 0
                              ? "text-emerald-600"
                              : item.diff < 0
                              ? "text-rose-600"
                              : "text-neutral-500"
                          }`}
                        >
                          {item.diff > 0
                            ? `+${formatCurrency(item.diff)}`
                            : item.diff < 0
                            ? `-${formatCurrency(Math.abs(item.diff))}`
                            : "0đ"}
                        </td>
                        <td className="p-2.5 text-right font-black text-brand-950">
                          {formatCurrency(item.newPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Xác Nhận 2 Bước */}
        {showConfirm && (
          <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full border border-neutral-200 shadow-2xl space-y-4 animate-scale-up">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-2xl mx-auto font-black">
                  ⚠️
                </div>
                <h3 className="text-base font-black text-neutral-900 uppercase">
                  Xác nhận điều chỉnh giá?
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                  Bạn đang chuẩn bị {direction === "INCREASE" ? "tăng giá" : "giảm giá"} cho <b>{previewList.length} sản phẩm</b> với mức{" "}
                  <b>
                    {direction === "INCREASE" ? "+" : "-"}
                    {adjustmentType === "FIXED" ? formatCurrency(numAmount) : `${numAmount}%`}
                  </b>.
                  Giá mới sẽ được áp dụng ngay lập tức cho toàn bộ khách hàng trên web.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowConfirm(false)}
                  disabled={isSubmitting}
                >
                  HỦY BỎ
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  className="bg-brand-900 hover:bg-brand-950 text-white font-black"
                >
                  {direction === "INCREASE" ? "ĐỒNG Ý TĂNG GIÁ" : "ĐỒNG Ý GIẢM GIÁ"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between gap-3 flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            ĐÓNG
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              if (previewList.length === 0) {
                showToast("Vui lòng chọn ít nhất 1 món để điều chỉnh giá", "warning");
                return;
              }
              setShowConfirm(true);
            }}
            disabled={previewList.length === 0 || numAmount === 0 || isSubmitting}
            className="bg-brand-900 hover:bg-brand-950 text-white font-black px-6 shadow-md"
          >
            ⚡ ÁP DỤNG {direction === "INCREASE" ? "TĂNG" : "GIẢM"} GIÁ ({previewList.length} MÓN)
          </Button>
        </div>
      </div>
    </div>
  );
};
