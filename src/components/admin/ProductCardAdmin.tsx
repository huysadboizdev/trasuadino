"use client";

import React, { useState } from "react";
import { Product } from "@/lib/types";
import { Badge } from "../ui/Badge";
import { Switch } from "../ui/Switch";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import { ProductWatermark } from "../ui/ProductWatermark";

interface ProductCardAdminProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => Promise<void>;
}

export const ProductCardAdmin: React.FC<ProductCardAdminProps> = ({
  product,
  onEdit,
  onDelete,
  onToggle,
}) => {
  const [isToggling, setIsToggling] = useState(false);
  const { showToast } = useToast();

  const handleToggle = async () => {
    try {
      setIsToggling(true);
      await onToggle(product.id);
      showToast(
        product.isAvailable
          ? `Đã chuyển sang: TẠM HẾT (${product.name})`
          : `Đã mở bán lại: CÒN HÀNG (${product.name})`,
        product.isAvailable ? "warning" : "success"
      );
    } finally {
      setIsToggling(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div
      className={`bg-white rounded-3xl p-3.5 sm:p-5 border transition-all duration-200 shadow-sm flex flex-col justify-between hover:shadow-md min-w-0 ${
        product.isAvailable
          ? "border-neutral-200 hover:border-brand-300"
          : "border-rose-200 bg-rose-50/20 opacity-90"
      }`}
    >
      <div className="min-w-0">
        {/* Top bar: Category Badge + Status Badge */}
        <div className="flex items-center justify-between gap-1.5 mb-3">
          <Badge variant="brand" size="sm" className="text-[10px] sm:text-xs truncate max-w-[60%]">
            {product.categoryName || "Món quán"}
          </Badge>
          <Badge
            variant={product.isAvailable ? "success" : "danger"}
            size="sm"
            dot
            className="text-[10px] sm:text-xs flex-shrink-0"
          >
            {product.isAvailable ? "ĐANG BÁN" : "TẠM HẾT"}
          </Badge>
        </div>

        {/* Product Media & Info */}
        <div className="flex gap-3 items-start min-w-0">
          <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-neutral-100 flex-shrink-0 border border-neutral-200 aspect-square">
            <img
              src={product.image || "/placeholder-tea.jpg"}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1558857563-b37cfb42e7d7?w=300&auto=format&fit=crop&q=80";
              }}
            />
            {!product.isAvailable && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                <span className="text-white text-[9px] sm:text-[10px] font-black tracking-wider px-1.5 py-0.5 bg-rose-600 rounded-md">
                  HẾT HÀNG
                </span>
              </div>
            )}
            <ProductWatermark size="sm" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-black text-neutral-900 text-sm sm:text-base leading-snug tracking-tight line-clamp-2">
              {product.name}
            </h3>
            <p className="text-xs sm:text-sm font-black text-brand-900 mt-1">
              {formatCurrency(product.price)}
            </p>
            {product.description && (
              <p className="text-xs text-neutral-500 line-clamp-2 mt-1 leading-relaxed font-medium">
                {product.description}
              </p>
            )}
          </div>
        </div>

        {/* Options tags preview */}
        {product.options && product.options.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-neutral-100 flex flex-wrap gap-1.5 min-w-0">
            {product.options.map((optGroup) => (
              <span
                key={optGroup.id}
                className="text-[10px] sm:text-[11px] font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-lg border border-neutral-200 truncate max-w-full"
              >
                {optGroup.title}: {optGroup.items.length} lựa chọn
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Controls: 1-Touch Stock Toggle + Action Buttons */}
      <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
        {/* Toggle Switch */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Switch
            checked={product.isAvailable}
            onChange={handleToggle}
            disabled={isToggling}
            labelRight={product.isAvailable ? "Còn Bán" : "Tạm Hết"}
          />
        </div>

        {/* Edit & Delete Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(product)}
            className="text-xs font-black shadow-2xs px-2.5 py-1"
          >
            SỬA
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(product.id)}
            className="text-xs font-black bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 shadow-2xs px-2.5 py-1"
          >
            XÓA
          </Button>
        </div>
      </div>
    </div>
  );
};
