"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Product, ProductOptionGroup, ProductOption } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProductWatermark } from "../ui/ProductWatermark";

export interface CustomizationResult {
  product: Product;
  size: string;
  sizePrice: number;
  sugar: string;
  ice: string;
  toppings: { id: string; name: string; price: number }[];
  otherOptions: Record<string, { id: string; name: string; price: number }>;
  note: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  optionsNote: string;
}

export interface ProductCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  initialData?: {
    size?: string;
    sugar?: string;
    ice?: string;
    toppings?: string[] | { id?: string; name: string; price: number }[];
    note?: string;
    quantity?: number;
  };
  isEditing?: boolean;
  onConfirm: (result: CustomizationResult) => void;
}

// Fallback chuẩn cho đồ uống nếu món chưa có sẵn cấu hình option
const defaultDrinkOptions: ProductOptionGroup[] = [
  {
    id: "def-optg-size",
    productId: "",
    title: "Chọn Size",
    type: "RADIO",
    required: true,
    items: [
      { id: "def-size-m", groupId: "def-optg-size", name: "Size Vừa (M)", price: 0, isDefault: true, isAvailable: true },
      { id: "def-size-l", groupId: "def-optg-size", name: "Size Lớn (L)", price: 5000, isDefault: false, isAvailable: true },
    ],
  },
  {
    id: "def-optg-sugar",
    productId: "",
    title: "Mức Đường",
    type: "RADIO",
    required: true,
    items: [
      { id: "def-s-100", groupId: "def-optg-sugar", name: "100% Đường (Chuẩn vị)", price: 0, isDefault: false, isAvailable: true },
      { id: "def-s-70", groupId: "def-optg-sugar", name: "70% Đường (Vừa ngọt)", price: 0, isDefault: true, isAvailable: true },
      { id: "def-s-50", groupId: "def-optg-sugar", name: "50% Đường (Ít ngọt)", price: 0, isDefault: false, isAvailable: true },
      { id: "def-s-30", groupId: "def-optg-sugar", name: "30% Đường (Thanh nhẹ)", price: 0, isDefault: false, isAvailable: true },
      { id: "def-s-0", groupId: "def-optg-sugar", name: "0% Không đường", price: 0, isDefault: false, isAvailable: true },
    ],
  },
  {
    id: "def-optg-ice",
    productId: "",
    title: "Mức Đá",
    type: "RADIO",
    required: true,
    items: [
      { id: "def-i-100", groupId: "def-optg-ice", name: "100% Đá (Mát lạnh)", price: 0, isDefault: true, isAvailable: true },
      { id: "def-i-70", groupId: "def-optg-ice", name: "70% Đá", price: 0, isDefault: false, isAvailable: true },
      { id: "def-i-50", groupId: "def-optg-ice", name: "50% Đá", price: 0, isDefault: false, isAvailable: true },
      { id: "def-i-0", groupId: "def-optg-ice", name: "Không đá", price: 0, isDefault: false, isAvailable: true },
    ],
  },
  {
    id: "def-optg-top",
    productId: "",
    title: "Thêm Topping",
    type: "CHECKBOX",
    required: false,
    items: [
      { id: "def-top-tc-den", groupId: "def-optg-top", name: "Trân Châu Đen", price: 5000, isAvailable: true },
      { id: "def-top-tc-trang", groupId: "def-optg-top", name: "Trân Châu Trắng", price: 5000, isAvailable: true },
      { id: "def-top-no-cn", groupId: "def-optg-top", name: "Hạt Nổ Củ Năng", price: 10000, isAvailable: true },
      { id: "def-top-no-ym", groupId: "def-optg-top", name: "Hạt Nổ Yến Mạch", price: 10000, isAvailable: true },
    ],
  },
];

export const ProductCustomizationModal: React.FC<ProductCustomizationModalProps> = ({
  isOpen,
  onClose,
  product,
  initialData,
  isEditing = false,
  onConfirm,
}) => {
  // Option Groups hiệu lực
  const optionGroups: ProductOptionGroup[] = useMemo(() => {
    if (!product) return [];
    if (product.options && product.options.length > 0) {
      return product.options;
    }
    return defaultDrinkOptions;
  }, [product]);

  // Selected states
  const [selectedRadioOptions, setSelectedRadioOptions] = useState<Record<string, ProductOption>>({});
  const [selectedToppings, setSelectedToppings] = useState<ProductOption[]>([]);
  const [itemNote, setItemNote] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  // Initialize selections when product or initialData changes
  useEffect(() => {
    if (!isOpen || !product) return;

    // 1. Radio groups initialization
    const initialRadios: Record<string, ProductOption> = {};

    optionGroups.forEach((group) => {
      if (group.type === "RADIO") {
        let matchedItem: ProductOption | undefined;

        // Nếu có initialData (chế độ edit)
        if (initialData) {
          const groupTitleLower = group.title.toLowerCase();
          if (groupTitleLower.includes("size") && initialData.size) {
            matchedItem = group.items.find((it) => it.name.toLowerCase() === initialData.size?.toLowerCase());
          } else if (groupTitleLower.includes("đường") && initialData.sugar) {
            matchedItem = group.items.find((it) => it.name.toLowerCase() === initialData.sugar?.toLowerCase());
          } else if (groupTitleLower.includes("đá") && initialData.ice) {
            matchedItem = group.items.find((it) => it.name.toLowerCase() === initialData.ice?.toLowerCase());
          }
        }

        // Nếu chưa tìm thấy, chọn option default hoặc item đầu tiên
        if (!matchedItem) {
          matchedItem = group.items.find((it) => it.isDefault) || group.items[0];
        }

        if (matchedItem) {
          initialRadios[group.id] = matchedItem;
        }
      }
    });

    setSelectedRadioOptions(initialRadios);

    // 2. Toppings initialization (CHECKBOX)
    const initialTops: ProductOption[] = [];
    const toppingGroups = optionGroups.filter(
      (g) => g.type === "CHECKBOX" || g.title.toLowerCase().includes("topping")
    );

    if (initialData?.toppings && initialData.toppings.length > 0) {
      const topNames = initialData.toppings.map((t) =>
        typeof t === "string" ? t.toLowerCase() : t.name.toLowerCase()
      );

      toppingGroups.forEach((group) => {
        group.items.forEach((item) => {
          if (topNames.includes(item.name.toLowerCase())) {
            initialTops.push(item);
          }
        });
      });
    }

    setSelectedToppings(initialTops);

    // 3. Item Note initialization
    setItemNote(initialData?.note || "");

    // 4. Quantity initialization
    setQuantity(initialData?.quantity && initialData.quantity > 0 ? initialData.quantity : 1);
  }, [isOpen, product, optionGroups, initialData]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Currency Formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Tính toán giá thời gian thực
  const calculatedUnitPrice = useMemo(() => {
    if (!product) return 0;

    // Giá gốc của món
    let total = product.price;

    // Cộng phụ phí từ tất cả các RADIO groups (như Size L +5.000đ, Hương vị...)
    Object.values(selectedRadioOptions).forEach((opt) => {
      if (opt && opt.price > 0) {
        total += opt.price;
      }
    });

    // Cộng phụ phí từ tất cả các TOPPING đã chọn (Multi-select)
    selectedToppings.forEach((top) => {
      if (top && top.price > 0) {
        total += top.price;
      }
    });

    return total;
  }, [product, selectedRadioOptions, selectedToppings]);

  const calculatedTotalPrice = calculatedUnitPrice * quantity;

  // Toggle Topping (Multi-Select)
  const handleToggleTopping = (topping: ProductOption) => {
    setSelectedToppings((prev) => {
      const isSelected = prev.some((t) => t.id === topping.id || t.name === topping.name);
      if (isSelected) {
        return prev.filter((t) => t.id !== topping.id && t.name !== topping.name);
      } else {
        return [...prev, topping];
      }
    });
  };

  // Handle Radio Selection (Single-Select)
  const handleSelectRadio = (groupId: string, option: ProductOption) => {
    setSelectedRadioOptions((prev) => ({
      ...prev,
      [groupId]: option,
    }));
  };

  // Submit Handler
  const handleConfirm = () => {
    if (!product) return;

    // Tìm thông tin size, sugar, ice từ radio selections
    let sizeName = "Size Vừa (M)";
    let sizePrice = 0;
    let sugarName = "70% Đường";
    let iceName = "100% Đá";
    const otherOptions: Record<string, { id: string; name: string; price: number }> = {};

    optionGroups.forEach((group) => {
      const selected = selectedRadioOptions[group.id];
      if (!selected) return;

      const titleLower = group.title.toLowerCase();
      if (titleLower.includes("size")) {
        sizeName = selected.name;
        sizePrice = selected.price;
      } else if (titleLower.includes("đường")) {
        sugarName = selected.name;
      } else if (titleLower.includes("đá")) {
        iceName = selected.name;
      } else {
        otherOptions[group.title] = {
          id: selected.id,
          name: selected.name,
          price: selected.price,
        };
      }
    });

    // Xây dựng chuỗi tóm tắt optionsNote
    const summaryParts: string[] = [];
    if (sizeName) summaryParts.push(sizeName);
    if (sugarName) summaryParts.push(sugarName);
    if (iceName) summaryParts.push(iceName);

    // Thêm các option khác (nếu có)
    Object.entries(otherOptions).forEach(([title, opt]) => {
      summaryParts.push(`${title}: ${opt.name}`);
    });

    // Thêm danh sách Toppings
    if (selectedToppings.length > 0) {
      const topNames = selectedToppings.map((t) => t.name).join(", ");
      summaryParts.push(`Topping: ${topNames}`);
    }

    // Thêm Ghi chú nếu có
    const trimmedNote = itemNote.trim();
    if (trimmedNote) {
      summaryParts.push(`Ghi chú: ${trimmedNote}`);
    }

    const optionsNote = summaryParts.join(" • ");

    const result: CustomizationResult = {
      product,
      size: sizeName,
      sizePrice,
      sugar: sugarName,
      ice: iceName,
      toppings: selectedToppings.map((t) => ({ id: t.id, name: t.name, price: t.price })),
      otherOptions,
      note: trimmedNote,
      quantity,
      unitPrice: calculatedUnitPrice,
      totalPrice: calculatedTotalPrice,
      optionsNote,
    };

    onConfirm(result);
  };

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs select-none transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg md:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. HEADER (Cố định ở đỉnh) */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200 bg-white/95 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
            {product.image && (
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-neutral-100 flex-shrink-0 border border-neutral-200/80 shadow-2xs">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <ProductWatermark size="xs" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2
                id="product-modal-title"
                className="text-base sm:text-lg font-black text-brand-950 truncate tracking-tight uppercase"
              >
                {product.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs sm:text-sm font-extrabold text-brand-900">
                  {formatCurrency(product.price)}
                </span>
                {product.categoryName && (
                  <Badge variant="neutral" size="sm" className="text-[10px] hidden xs:inline-flex">
                    {product.categoryName}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 flex items-center justify-center transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Đóng popup tùy chỉnh món"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 2. BODY SCROLLABLE (Khu vực các nhóm Option + Topping Multi-select + Ghi chú) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 overscroll-contain">
          {product.description && (
            <p className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-2xl border border-neutral-200/80 font-medium">
              {product.description}
            </p>
          )}

          {/* Render các Option Groups */}
          {optionGroups.map((group) => {
            const isCheckboxGroup =
              group.type === "CHECKBOX" || group.title.toLowerCase().includes("topping");

            if (isCheckboxGroup) {
              // TOPPING MULTI-SELECT GROUP
              const selectedCount = selectedToppings.length;

              return (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black uppercase text-neutral-800 tracking-wider">
                        {group.title}
                      </p>
                      {selectedCount > 0 ? (
                        <span className="text-[10px] font-black text-brand-900 bg-brand-100 px-2 py-0.5 rounded-md border border-brand-200">
                          Đã chọn {selectedCount}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-neutral-400">
                          (Chọn nhiều)
                        </span>
                      )}
                    </div>
                    {selectedCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedToppings([])}
                        className="text-[11px] font-bold text-neutral-400 hover:text-rose-600 uppercase underline"
                      >
                        Bỏ chọn
                      </button>
                    )}
                  </div>

                  {/* Topping Multi-select Checkbox Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const isSelected = selectedToppings.some(
                        (t) => t.id === item.id || t.name === item.name
                      );

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleTopping(item)}
                          className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-2.5 ${
                            isSelected
                              ? "bg-brand-50/70 border-brand-800 text-brand-950 shadow-2xs ring-1 ring-brand-800/30"
                              : "bg-white border-neutral-200 text-neutral-800 hover:border-brand-200 hover:bg-neutral-50/80"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Checkbox box */}
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
                                isSelected
                                  ? "bg-brand-900 border-brand-900 text-white"
                                  : "border-neutral-300 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3.5 w-3.5 stroke-[3]"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <span className="text-xs sm:text-sm font-bold truncate">
                              {item.name}
                            </span>
                          </div>

                          <span
                            className={`text-xs font-black flex-shrink-0 ${
                              isSelected ? "text-brand-950" : "text-neutral-600"
                            }`}
                          >
                            +{formatCurrency(item.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // RADIO SINGLE-SELECT GROUP (Size, Đường, Đá, Hương vị...)
            const currentSelected = selectedRadioOptions[group.id];

            return (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase text-neutral-800 tracking-wider">
                    {group.title}
                  </p>
                  {group.required && (
                    <span className="text-[10px] font-bold text-neutral-400">
                      (Bắt buộc)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {group.items.map((item) => {
                    const isSelected = currentSelected?.id === item.id || currentSelected?.name === item.name;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectRadio(group.id, item)}
                        className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center min-h-[44px] ${
                          isSelected
                            ? "bg-brand-900 border-brand-900 text-white shadow-2xs font-extrabold"
                            : "bg-white border-neutral-200 text-neutral-800 hover:border-brand-200 hover:bg-neutral-50 font-bold"
                        }`}
                      >
                        <span className="text-xs sm:text-sm truncate w-full">{item.name}</span>
                        {item.price > 0 && (
                          <span
                            className={`text-[10px] mt-0.5 ${
                              isSelected ? "text-amber-200 font-bold" : "text-brand-700 font-extrabold"
                            }`}
                          >
                            +{formatCurrency(item.price)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 3. GHI CHÚ CHO MÓN (Item Note Section) */}
          <div className="space-y-2 pt-2 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <label
                htmlFor="item-note-input"
                className="text-xs font-black uppercase text-neutral-800 tracking-wider flex items-center gap-1.5"
              >
                <span>✍️ GHI CHÚ CHO MÓN</span>
                <span className="text-[10px] font-normal text-neutral-400">(Tùy chọn)</span>
              </label>
              <span className="text-[11px] font-bold text-neutral-400">
                {itemNote.length}/500
              </span>
            </div>

            <div className="relative">
              <textarea
                id="item-note-input"
                rows={2}
                maxLength={500}
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                placeholder="Ví dụ: Ít ngọt hơn, cho nhiều trân châu, không lấy ống hút..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 bg-white font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 resize-none shadow-2xs"
              />
              {itemNote && (
                <button
                  type="button"
                  onClick={() => setItemNote("")}
                  className="absolute right-2.5 bottom-2.5 text-[10px] font-black uppercase text-neutral-400 hover:text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-1.5 py-0.5 rounded-md"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. FOOTER STICKY (Số lượng + Nút Thêm vào giỏ với giá tính tự động) */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 bg-white/95 backdrop-blur-md sticky bottom-0 z-10 flex items-center justify-between gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center gap-1 border border-neutral-300 rounded-2xl p-1 bg-neutral-50 flex-shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-xl bg-white disabled:opacity-40 disabled:cursor-not-allowed font-black text-neutral-800 flex items-center justify-center hover:bg-neutral-100 active:scale-90 transition-all shadow-2xs text-sm"
              aria-label="Giảm số lượng"
            >
              −
            </button>
            <span className="w-7 text-center font-black text-xs sm:text-sm text-neutral-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              className="w-8 h-8 rounded-xl bg-white font-black text-neutral-800 flex items-center justify-center hover:bg-neutral-100 active:scale-90 transition-all shadow-2xs text-sm"
              aria-label="Tăng số lượng"
            >
              +
            </button>
          </div>

          {/* Add to Cart / Update Cart Button */}
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleConfirm}
            className="flex-1 text-xs sm:text-sm font-black uppercase bg-brand-900 hover:bg-brand-950 text-white py-3.5 rounded-2xl shadow-md active:scale-98 truncate min-h-[44px]"
          >
            {isEditing ? "CẬP NHẬT GIỎ HÀNG" : "THÊM VÀO GIỎ"} • {formatCurrency(calculatedTotalPrice)}
          </Button>
        </div>
      </div>
    </div>
  );
};
