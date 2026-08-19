export type UserRole = "ADMIN" | "STAFF" | "CUSTOMER";

export const SYSTEM_GUEST_USER_ID = "usr-system-guest";

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

export type DiscountType = "PERCENT" | "FIXED_AMOUNT";
export type CustomerScope = "ALL" | "NEW_CUSTOMERS" | "RETURNING_CUSTOMERS" | "MIN_ORDERS" | "MIN_SPENT";
export type ProductScope = "ALL" | "CATEGORIES" | "PRODUCTS";

export interface VoucherUsage {
  id: string;
  couponId: string;
  couponCode: string;
  userId?: string;
  customerPhone?: string;
  customerEmail?: string;
  orderId: string;
  orderCode: string;
  discountAmount: number;
  usedAt: string;
}

export interface Coupon {
  id: string;
  code: string; // VD: DINO20, TET2026, GIAM100K (viết hoa, không khoảng trắng)
  description?: string;
  
  // 1. Loại giảm giá
  discountType: DiscountType; // "PERCENT" | "FIXED_AMOUNT"
  discountValue: number; // Nếu PERCENT: 1 - 100 (%), nếu FIXED_AMOUNT: số tiền VNĐ (VD: 100000)
  maxDiscountAmount?: number; // Mức giảm tối đa (VND) khi dùng PERCENT
  
  // 2. Điều kiện giá trị đơn hàng
  minOrderAmount?: number; // Đơn tối thiểu áp dụng (VND), mặc định 0
  
  // 3. Điều kiện lịch sử mua hàng của khách (Đơn hoàn thành & Tổng chi tiêu)
  minCompletedOrders?: number; // Số đơn hàng đã hoàn thành tối thiểu (ví dụ: >= 10 đơn)
  minTotalSpent?: number; // Tổng tiền đã mua tích lũy tối thiểu (ví dụ: >= 5.000.000đ)
  customerScope?: CustomerScope; // "ALL" | "NEW_CUSTOMERS" | "RETURNING_CUSTOMERS" | "MIN_ORDERS" | "MIN_SPENT"
  
  // 4. Giới hạn lượt sử dụng
  usageLimit?: number; // Tổng số lượt dùng tối đa trên toàn hệ thống (undefined = không giới hạn)
  usageCount: number; // Tổng số lượt đã dùng
  usagePerUser?: number; // Số lần tối đa mỗi khách hàng được dùng (mặc định 1 hoặc tuỳ chỉnh)
  
  // 5. Hiệu lực theo ngày & giờ
  startDate?: string; // Ngày giờ bắt đầu (YYYY-MM-DDTHH:mm hoặc ISO)
  endDate?: string; // Ngày giờ kết thúc (YYYY-MM-DDTHH:mm hoặc ISO)
  
  // 6. Phạm vi áp dụng (Product / Category Scope)
  applyScope?: ProductScope; // "ALL" | "CATEGORIES" | "PRODUCTS"
  applicableCategoryIds?: string[]; // Danh sách categoryId được áp dụng
  applicableProductIds?: string[]; // Danh sách productId được áp dụng
  
  // 7. Trạng thái & Timestamps
  isActive: boolean; // Bật / Tắt tức thì
  createdAt: string;
  updatedAt?: string;

  // Backward compatibility:
  discountPercent?: number; // Hỗ trợ tương thích ngược dữ liệu cũ
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
  trackingToken?: string; // Token bảo mật dành cho khách vãng lai theo dõi đơn
  isGuest?: boolean; // Đánh dấu đơn của khách vãng lai (không đăng nhập)
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
  expiresAt?: string; // Thời gian hết hạn thanh toán (createdAt + 5 phút cho SEPAY_QR)
  updatedAt?: string;
  completedAt?: string;
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
  telegramBotToken?: string;
  telegramAdminChatIds?: string;
  telegramNotifyNewOrder?: boolean;
  telegramNotifyPayment?: boolean;
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

export interface PaymentTransaction {
  id: string;
  orderId: string;
  orderCode?: string;
  gateway: "SEPAY" | "CASH" | "BANK_TRANSFER" | "MOMO";
  transactionCode?: string;
  amount: number;
  content?: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  rawData?: string;
  createdAt: string;
}
