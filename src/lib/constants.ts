/**
 * Hằng số thương hiệu và hàm định dạng dùng chung cho toàn bộ hệ thống
 */

// Nhãn watermark thương hiệu xuất hiện trên tất cả khung ảnh sản phẩm
export const PRODUCT_WATERMARK = "NHUNG";

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};
