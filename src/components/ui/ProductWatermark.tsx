import React from "react";
import { PRODUCT_WATERMARK } from "@/lib/constants";

interface ProductWatermarkProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

/**
 * Component Watermark thương hiệu "NHUNG" tự động hiển thị trên khung ảnh sản phẩm
 */
export const ProductWatermark: React.FC<ProductWatermarkProps> = ({
  className = "",
  size = "md",
}) => {
  const sizeClasses = {
    xs: "text-[7.5px] px-1 py-0.2 rounded-sm",
    sm: "text-[8.5px] px-1.2 py-0.2 rounded",
    md: "text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md",
    lg: "text-[11px] sm:text-xs px-2 py-0.5 rounded-lg",
  }[size];

  return (
    <span
      className={`absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 pointer-events-none select-none z-10 font-black tracking-widest uppercase text-neutral-900 bg-white/80 backdrop-blur-[3px] shadow-2xs border border-white/80 leading-none ${sizeClasses} ${className}`}
      aria-hidden="true"
    >
      {PRODUCT_WATERMARK}
    </span>
  );
};
