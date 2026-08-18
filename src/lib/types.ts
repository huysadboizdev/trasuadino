export type UserRole = "ADMIN" | "STAFF" | "CUSTOMER";

export interface SavedAddress {
  id: string;
  label: string; // Nhà riêng, Công ty, Trường học...
  address: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  role: UserRole;
  address?: string;
  savedAddresses?: SavedAddress[];
  avatar?: string;
  googleId?: string;
  createdAt: string;
}

export interface RefreshSession {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  role: UserRole;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  revokedAt?: string;
  lastUsedAt: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthTokenPayload {
  sub: string; // User ID
  email?: string;
  name?: string;
  role: UserRole;
  type: "access" | "refresh";
  sessionId?: string;
  familyId?: string;
  jti?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  orderIndex: number;
  isActive: boolean;
  description?: string;
  productCount?: number;
}

export interface ProductOption {
  id: string;
  groupId: string;
  name: string;
  price: number;
  isDefault?: boolean;
  isAvailable?: boolean;
}

export interface ProductOptionGroup {
  id: string;
  productId: string;
  title: string;
  type: "RADIO" | "CHECKBOX";
  required: boolean;
  items: ProductOption[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId: string;
  categoryName?: string;
  isAvailable: boolean;
  isFeatured?: boolean; // Món bán chạy / nổi bật
  salesCount?: number;  // Số lượt bán
  options?: ProductOptionGroup[];
  createdAt?: string;
}

export interface Coupon {
  id: string;
  code: string; // VD: DINO20, TET2026 (viết hoa, không khoảng trắng)
  description?: string;
  discountPercent: number; // % giảm: 1 - 100
  minOrderAmount?: number; // Đơn tối thiểu áp dụng (VND), mặc định 0
  maxDiscountAmount?: number; // Mức giảm tối đa (VND), optional
  startDate?: string; // Ngày giờ bắt đầu (YYYY-MM-DDTHH:mm hoặc ISO)
  endDate?: string; // Ngày giờ kết thúc (YYYY-MM-DDTHH:mm hoặc ISO)
  isActive: boolean; // Bật / Tắt tức thì
  usageLimit?: number; // Giới hạn lượt dùng tối đa, optional
  usageCount: number; // Số lượt đã dùng
  createdAt: string;
  updatedAt?: string;
}

export type OrderStatus = "NEW" | "PREPARING" | "DELIVERING" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "CANCELLED";
export type PaymentMethod = "SEPAY_QR" | "COD" | "MOMO";

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  optionsNote?: string;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  userId?: string;
  deliveryAddress: string; // Bắt buộc có địa chỉ cụ thể
  deliveryLat?: number;
  deliveryLng?: number;
  note?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subtotalAmount?: number; // Tổng tiền trước giảm giá
  couponCode?: string; // Mã giảm giá áp dụng
  discountPercent?: number; // % giảm
  discountAmount?: number; // Số tiền giảm (VND)
  totalAmount: number; // Tổng tiền thực tế sau giảm giá
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface StoreSetting {
  storeName: string;
  hotline: string;
  address: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  sepayApiKey: string;
  sepayAccountNumber: string;
  sepayBankName: string;
  sepayAccountName: string;
  sepayQrPattern: string;
}

export interface DashboardStats {
  todayRevenue: number;
  todayOrdersCount: number;
  newOrdersCount: number;
  preparingOrdersCount: number;
  deliveringOrdersCount: number;
  completedOrdersCount: number;
  outOfStockProductsCount: number;
}
