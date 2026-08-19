import React from "react";
import { Product } from "@/lib/types";
import { ProductWatermark } from "../ui/ProductWatermark";
import { formatCurrency } from "@/lib/constants";

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  isBestSeller?: boolean;
}

/**
 * Reusable Product Card Component cho toàn bộ trang khách hàng
 * Tự động tích hợp Watermark nhãn "NHUNG" trên mọi sản phẩm hiện tại và tương lai
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClick,
  isBestSeller = false,
}) => {
  if (isBestSeller) {
    return (
      <div
        onClick={onClick}
        className="w-full min-w-0 bg-white rounded-2xl sm:rounded-3xl p-2 sm:p-3 border border-neutral-200/90 hover:border-brand-400 transition-all shadow-2xs cursor-pointer active:scale-98 flex flex-col justify-between group select-none"
      >
        <div className="w-full min-w-0">
          <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-100 mb-1.5 sm:mb-2 border border-neutral-100">
            <img
              src={
                product.image ||
                "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80"
              }
              alt={product.name}
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80";
              }}
              className="w-full h-full object-cover aspect-square group-hover:scale-105 transition-transform duration-300"
            />
            {/* Badge HOT */}
            <div className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs z-10 pointer-events-none select-none">
              🔥 HOT
            </div>

            {/* Nhãn bản quyền NHUNG tự động */}
            <ProductWatermark size="sm" />
          </div>
          <h3 className="font-black text-neutral-900 text-xs sm:text-sm line-clamp-1 group-hover:text-brand-900 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs sm:text-sm font-black text-brand-700 mt-0.5">
            {formatCurrency(product.price)}
          </p>
        </div>
        <span className="mt-2 text-center text-[11px] sm:text-xs font-black text-brand-950 bg-brand-50 group-hover:bg-brand-900 group-hover:text-white py-1.5 rounded-xl transition-all shadow-2xs">
          + Chọn món
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`w-full min-w-0 bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 border border-neutral-200 hover:border-brand-400 transition-all flex gap-2.5 sm:gap-3 items-center cursor-pointer active:scale-[0.99] select-none group shadow-2xs ${
        !product.isAvailable ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      {/* Ảnh món: Kích thước cố định chuẩn + Aspect Ratio 1:1 */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-24 md:h-24 aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-100 flex-shrink-0 border border-neutral-100">
        <img
          src={
            product.image ||
            "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80"
          }
          alt={product.name}
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80";
          }}
          className="w-full h-full object-cover aspect-square group-hover:scale-105 transition-transform duration-300"
        />
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 pointer-events-none select-none">
            <span className="text-white text-[9px] font-black uppercase bg-rose-600 px-1.5 py-0.5 rounded">
              Tạm hết
            </span>
          </div>
        )}

        {/* Nhãn bản quyền NHUNG tự động */}
        <ProductWatermark size="md" />
      </div>

      {/* Thông tin món */}
      <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
        <div className="min-w-0">
          <h3 className="font-black text-neutral-900 text-xs sm:text-sm leading-snug line-clamp-1 group-hover:text-brand-900 transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-neutral-100 min-w-0">
          <span className="text-xs sm:text-sm font-black text-brand-700 truncate pr-1">
            {formatCurrency(product.price)}
          </span>
          {product.isAvailable ? (
            <span className="text-[11px] font-black px-2.5 py-1 bg-brand-50 group-hover:bg-brand-900 group-hover:text-white text-brand-950 rounded-lg transition-all shadow-2xs flex-shrink-0">
              + Chọn món
            </span>
          ) : (
            <span className="text-[11px] text-neutral-400 font-medium flex-shrink-0">
              Hết món
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
