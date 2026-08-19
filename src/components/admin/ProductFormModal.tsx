"use client";

import React, { useState, useEffect, useRef } from "react";
import { Product, Category, ProductOptionGroup, ProductOption } from "@/lib/types";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { CurrencyInput } from "../ui/CurrencyInput";
import { useToast } from "../ui/Toast";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => Promise<void>;
  product?: Product | null;
  categories: Category[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Danh sách các nhóm tùy chọn (Size, Đường, Đá, Topping)
  const [optionGroups, setOptionGroups] = useState<ProductOptionGroup[]>([]);
  const [activeTab, setActiveTab] = useState<"INFO" | "OPTIONS">("INFO");

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tạo mẫu tùy chọn chuẩn
  const defaultOptionGroupsTemplate = (): ProductOptionGroup[] => [
    {
      id: `optg-size-${Date.now()}`,
      productId: "",
      title: "Chọn Size",
      type: "RADIO",
      required: true,
      items: [
        { id: `opt-m-${Date.now()}`, groupId: "", name: "Size Vừa (M)", price: 0, isDefault: true, isAvailable: true },
        { id: `opt-l-${Date.now()}`, groupId: "", name: "Size Lớn (L)", price: 8000, isDefault: false, isAvailable: true },
      ],
    },
    {
      id: `optg-sugar-${Date.now()}`,
      productId: "",
      title: "Mức Đường",
      type: "RADIO",
      required: true,
      items: [
        { id: `opt-s100-${Date.now()}`, groupId: "", name: "100% Đường", price: 0, isDefault: false, isAvailable: true },
        { id: `opt-s70-${Date.now()}`, groupId: "", name: "70% Đường (Chuẩn)", price: 0, isDefault: true, isAvailable: true },
        { id: `opt-s50-${Date.now()}`, groupId: "", name: "50% Đường", price: 0, isDefault: false, isAvailable: true },
        { id: `opt-s30-${Date.now()}`, groupId: "", name: "30% Đường", price: 0, isDefault: false, isAvailable: true },
        { id: `opt-s0-${Date.now()}`, groupId: "", name: "Không Đường", price: 0, isDefault: false, isAvailable: true },
      ],
    },
    {
      id: `optg-ice-${Date.now()}`,
      productId: "",
      title: "Mức Đá",
      type: "RADIO",
      required: true,
      items: [
        { id: `opt-i100-${Date.now()}`, groupId: "", name: "100% Đá", price: 0, isDefault: true, isAvailable: true },
        { id: `opt-i70-${Date.now()}`, groupId: "", name: "70% Đá", price: 0, isDefault: false, isAvailable: true },
        { id: `opt-i50-${Date.now()}`, groupId: "", name: "50% Đá", price: 0, isDefault: false, isAvailable: true },
        { id: `opt-i0-${Date.now()}`, groupId: "", name: "Không Đá", price: 0, isDefault: false, isAvailable: true },
      ],
    },
    {
      id: `optg-top-${Date.now()}`,
      productId: "",
      title: "Topping Thêm",
      type: "CHECKBOX",
      required: false,
      items: [
        { id: `opt-tc-${Date.now()}`, groupId: "", name: "Trân Châu Đen", price: 6000, isAvailable: true },
        { id: `opt-pd-${Date.now()}`, groupId: "", name: "Pudding Trứng", price: 8000, isAvailable: true },
        { id: `opt-mc-${Date.now()}`, groupId: "", name: "Kem Phô Mai Macchiato", price: 10000, isAvailable: true },
      ],
    },
  ];

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.price);
      setCategoryId(product.categoryId || categories[0]?.id || "");
      setDescription(product.description || "");
      setImage(product.image || "");
      setIsAvailable(product.isAvailable !== false);
      setIsFeatured(Boolean(product.isFeatured));
      setOptionGroups(product.options || []);
      setActiveTab("INFO");
    } else {
      setName("");
      setPrice("");
      setCategoryId(categories[0]?.id || "");
      setDescription("");
      setImage("");
      setIsAvailable(true);
      setIsFeatured(false);
      setOptionGroups(defaultOptionGroupsTemplate());
      setActiveTab("INFO");
    }
  }, [product, categories, isOpen]);

  // Upload ảnh cục bộ lên server
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setImage(data.url);
        showToast("Đã tải ảnh lên máy chủ thành công!", "success");
      } else {
        showToast(data.message || "Tải ảnh thất bại", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối khi tải ảnh", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Thêm tùy chọn mới vào nhóm
  const handleAddOptionItem = (groupIndex: number) => {
    const itemName = prompt("Nhập tên lựa chọn mới (VD: Thạch Củ Năng, Size Khổng Lồ...):");
    if (!itemName?.trim()) return;

    const priceInput = prompt("Nhập giá cộng thêm (VNĐ) (0 nếu miễn phí):", "0");
    const itemPrice = Number(priceInput) || 0;

    setOptionGroups((prev) => {
      const copy = [...prev];
      const targetGroup = { ...copy[groupIndex] };
      const newItem: ProductOption = {
        id: `opt-custom-${Date.now()}`,
        groupId: targetGroup.id,
        name: itemName.trim(),
        price: itemPrice,
        isAvailable: true,
      };
      targetGroup.items = [...targetGroup.items, newItem];
      copy[groupIndex] = targetGroup;
      return copy;
    });

    showToast(`Đã thêm lựa chọn: ${itemName}`, "info");
  };

  // Xóa tùy chọn trong nhóm
  const handleRemoveOptionItem = (groupIndex: number, itemIndex: number) => {
    setOptionGroups((prev) => {
      const copy = [...prev];
      const targetGroup = { ...copy[groupIndex] };
      targetGroup.items = targetGroup.items.filter((_, idx) => idx !== itemIndex);
      copy[groupIndex] = targetGroup;
      return copy;
    });
  };

  // Thêm 1 nhóm tùy chọn mới hoàn toàn
  const handleAddOptionGroup = () => {
    const groupTitle = prompt("Nhập tên nhóm tùy chọn (VD: Chọn Vị Sốt, Topping Đặc Biệt...):");
    if (!groupTitle?.trim()) return;

    const newGroup: ProductOptionGroup = {
      id: `optg-${Date.now()}`,
      productId: product?.id || "",
      title: groupTitle.trim(),
      type: "CHECKBOX",
      required: false,
      items: [],
    };
    setOptionGroups((prev) => [...prev, newGroup]);
    showToast(`Đã tạo nhóm: ${groupTitle}`, "info");
  };

  // Xóa nhóm tùy chọn
  const handleRemoveOptionGroup = (groupIndex: number) => {
    const groupName = optionGroups[groupIndex]?.title || "tùy chọn";
    setOptionGroups((prev) => prev.filter((_, idx) => idx !== groupIndex));
    showToast(`Đã xóa nhóm ${groupName}`, "info");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      showToast("Vui lòng nhập tên món ăn/đồ uống", "warning");
      return;
    }
    if (price === "" || Number(price) < 0) {
      showToast("Vui lòng nhập giá bán hợp lệ", "warning");
      return;
    }
    if (!categoryId) {
      showToast("Vui lòng chọn danh mục", "warning");
      return;
    }

    try {
      setIsSaving(true);
      const payload: Partial<Product> = {
        name: name.trim(),
        price: Number(price),
        categoryId,
        description: description.trim(),
        image:
          image ||
          "https://images.unsplash.com/photo-1558857563-b37cfb42e7d7?w=500&auto=format&fit=crop&q=80",
        isAvailable,
        isFeatured,
        options: optionGroups,
      };

      await onSave(payload);
      showToast(product ? "Đã cập nhật món thành công!" : "Đã tạo món mới thành công!", "success");
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi lưu món", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={product ? "CHỈNH SỬA MÓN" : "THÊM MÓN MỚI"}
      subtitle={product ? `Đang chỉnh sửa: ${product.name}` : "Tạo món, tải ảnh và cấu hình topping"}
      maxWidth="lg"
      footer={
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2.5 w-full">
          <Button
            type="button"
            variant="outline"
            size="md"
            fullWidth
            onClick={onClose}
            disabled={isSaving}
            className="text-xs sm:text-sm font-black min-h-[44px]"
          >
            HỦY BỎ
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            isLoading={isSaving}
            onClick={() => handleSubmit()}
            className="bg-brand-900 hover:bg-brand-950 text-white text-xs sm:text-sm font-black min-h-[44px]"
          >
            {product ? "LƯU THAY ĐỔI" : "TẠO MÓN NGAY"}
          </Button>
        </div>
      }
    >
      {/* Sub Tabs */}
      <div className="flex border-b border-neutral-200 mb-4 min-w-0 bg-neutral-100/60 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab("INFO")}
          className={`flex-1 py-2 sm:py-2.5 text-[11px] sm:text-xs font-black uppercase tracking-tight sm:tracking-wider transition-all rounded-lg truncate px-2 text-center ${
            activeTab === "INFO"
              ? "bg-white text-brand-950 shadow-xs"
              : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          1. THÔNG TIN & ẢNH
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("OPTIONS")}
          className={`flex-1 py-2 sm:py-2.5 text-[11px] sm:text-xs font-black uppercase tracking-tight sm:tracking-wider transition-all rounded-lg flex items-center justify-center gap-1.5 truncate px-2 text-center ${
            activeTab === "OPTIONS"
              ? "bg-white text-brand-950 shadow-xs"
              : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          <span className="truncate">2. SIZE & TOPPING</span>
          <Badge variant="brand" size="sm" className="hidden xs:inline-flex">
            {optionGroups.length}
          </Badge>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
        {activeTab === "INFO" ? (
          <>
            {/* Upload Ảnh */}
            <div className="bg-neutral-50 p-3 sm:p-3.5 rounded-2xl border border-neutral-200">
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-2">
                ẢNH ĐẠI DIỆN MÓN
              </label>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-2 border-dashed border-neutral-300 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm aspect-square">
                  {image ? (
                    <img
                      src={image}
                      alt="Ảnh món"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[11px] font-bold text-neutral-400 text-center px-1">
                      Chưa chọn ảnh
                    </span>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full space-y-2 text-center sm:text-left min-w-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-black uppercase tracking-wider bg-white shadow-xs min-h-[40px]"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? "ĐANG TẢI ẢNH LÊN..." : "CHỤP / CHỌN ẢNH TỪ MÁY"}
                  </Button>
                  <p className="text-[11px] text-neutral-500 font-medium">
                    Lưu trực tiếp vào thư mục máy chủ (/public/uploads)
                  </p>
                </div>
              </div>
            </div>

            {/* Tên món */}
            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1">
                TÊN MÓN <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Trà Sữa Oolong Nướng Trân Châu..."
                className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-neutral-900 font-bold placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm min-h-[44px]"
                required
              />
            </div>

            {/* Giá bán & Danh mục (1 col on mobile, 2 col on tablet/desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1">
                  GIÁ BÁN (VNĐ) <span className="text-rose-600">*</span>
                </label>
                <CurrencyInput
                  value={price}
                  onChange={(val) => setPrice(val)}
                  placeholder="VD: 35.000"
                  suffix="₫"
                  required
                  size="md"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1">
                  DANH MỤC <span className="text-rose-600">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-neutral-900 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm min-h-[44px]"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mô tả */}
            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1">
                MÔ TẢ HƯƠNG VỊ / NGUYÊN LIỆU
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="VD: Vị trà béo ngậy, hương caramel nướng thơm lừng..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-neutral-900 font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm min-h-[80px] resize-y"
              />
            </div>

            {/* Bật / Tắt trạng thái món */}
            <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-neutral-900 uppercase">
                  TRẠNG THÁI MỞ BÁN
                </p>
                <p className="text-[11px] text-neutral-500 font-medium truncate">
                  {isAvailable ? "Đang bật để khách đặt món" : "Đang tạm khóa hết hàng"}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>
          </>
        ) : (
          /* Tab 2: Quản lý Size, Mức Đường/Đá và Topping */
          <div className="space-y-3.5 sm:space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-black uppercase text-neutral-700 tracking-wider">
                CẤU HÌNH TÙY CHỌN MÓN
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOptionGroup}
                className="text-xs font-black uppercase min-h-[36px]"
              >
                + THÊM NHÓM
              </Button>
            </div>

            {optionGroups.length === 0 ? (
              <div className="text-center p-5 sm:p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
                <p className="text-xs font-bold text-neutral-500 uppercase">
                  Món này chưa có tùy chọn đính kèm
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setOptionGroups(defaultOptionGroupsTemplate())}
                  className="mt-3 text-xs font-black uppercase bg-brand-900 text-white w-full sm:w-auto min-h-[40px]"
                >
                  NẠP MẪU TRÀ SỮA CHUẨN
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {optionGroups.map((group, gIdx) => (
                  <div
                    key={group.id || gIdx}
                    className="p-3 sm:p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2.5 min-w-0"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <span className="font-black text-xs sm:text-sm text-neutral-900 uppercase truncate">
                          {group.title}
                        </span>
                        <Badge variant="neutral" size="sm" className="text-[10px]">
                          {group.type === "RADIO" ? "CHỌN 1" : "NHIỀU"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAddOptionItem(gIdx)}
                          className="text-[10px] sm:text-[11px] font-black text-brand-900 bg-brand-100 hover:bg-brand-200 px-2.5 py-1 rounded-lg uppercase transition-colors active:scale-95"
                        >
                          + Thêm
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionGroup(gIdx)}
                          className="text-[10px] sm:text-[11px] font-black text-rose-700 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-lg uppercase transition-colors active:scale-95"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>

                    {/* Danh sách các item trong nhóm */}
                    <div className="flex flex-wrap gap-1.5 min-w-0">
                      {group.items.map((item, iIdx) => (
                        <span
                          key={item.id || iIdx}
                          className="inline-flex items-center gap-1.5 bg-white border border-neutral-300 text-xs font-bold text-neutral-800 px-2.5 py-1 rounded-xl shadow-2xs max-w-full truncate"
                        >
                          <span className="truncate">{item.name}</span>
                          {item.price > 0 && (
                            <span className="text-brand-900 font-black flex-shrink-0">
                              +{item.price.toLocaleString("vi-VN")}đ
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionItem(gIdx, iIdx)}
                            className="text-neutral-400 hover:text-rose-600 font-black ml-0.5 text-xs flex-shrink-0 p-0.5"
                            aria-label={`Xóa lựa chọn ${item.name}`}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </form>
    </BottomSheet>
  );
};
