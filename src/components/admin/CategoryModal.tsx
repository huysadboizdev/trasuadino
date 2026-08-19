"use client";

import React, { useState, useEffect } from "react";
import { Category } from "@/lib/types";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (catData: Partial<Category>) => Promise<void>;
  category?: Category | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [orderIndex, setOrderIndex] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || "");
      setOrderIndex(category.orderIndex || 0);
      setIsActive(category.isActive !== false);
    } else {
      setName("");
      setDescription("");
      setOrderIndex(0);
      setIsActive(true);
    }
  }, [category, isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      showToast("Vui lòng nhập tên danh mục", "warning");
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        name: name.trim(),
        description: description.trim(),
        orderIndex: Number(orderIndex),
        isActive,
      });
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi lưu danh mục", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={category ? "SỬA DANH MỤC" : "THÊM DANH MỤC MỚI"}
      subtitle="Phân loại các món như Trà Sữa, Bánh Ngọt, Ăn Vặt..."
      maxWidth="md"
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
            {category ? "LƯU THAY ĐỔI" : "TẠO DANH MỤC"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
        <div>
          <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1">
            TÊN DANH MỤC <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Trà Sữa Đặc Biệt, Bánh Mì Nướng..."
            className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-neutral-900 font-bold placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm min-h-[44px]"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1">
            MÔ TẢ NGẮN
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="VD: Các loại trà ủ từ lá trà tươi thơm ngon..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-neutral-900 font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm min-h-[80px] resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1">
              THỨ TỰ HIỂN THỊ
            </label>
            <input
              type="number"
              value={orderIndex}
              onChange={(e) => setOrderIndex(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1">
              TRẠNG THÁI
            </label>
            <select
              value={isActive ? "true" : "false"}
              onChange={(e) => setIsActive(e.target.value === "true")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-neutral-900 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm min-h-[44px]"
            >
              <option value="true">Đang hiển thị</option>
              <option value="false">Tạm ẩn</option>
            </select>
          </div>
        </div>
      </form>
    </BottomSheet>
  );
};
