import { Coupon, Order, Product, VoucherUsage } from "./types";

export interface ValidateVoucherParams {
  code: string;
  orderAmount: number;
  items?: {
    productId?: string;
    productName?: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }[];
  user?: {
    id?: string;
    email?: string;
    phone?: string;
  };
  coupons: Coupon[];
  orders: Order[];
  products: Product[];
  voucherUsages?: VoucherUsage[];
}

export interface ValidateVoucherResult {
  valid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  finalAmount?: number;
  qualifyingAmount?: number;
  reason?: string;
  message: string;
}

/**
 * Chuẩn hóa dữ liệu voucher để đảm bảo tương thích ngược và có giá trị mặc định chuẩn xác
 */
export function normalizeCoupon(c: Partial<Coupon> & { id: string; code: string }): Coupon {
  // Tương thích ngược nếu chỉ có discountPercent cũ
  const discountType = c.discountType || "PERCENT";
  const discountValue = Number(c.discountValue ?? c.discountPercent ?? 10);
  const discountPercent = discountType === "PERCENT" ? discountValue : c.discountPercent;

  return {
    id: c.id,
    code: c.code.toUpperCase().trim().replace(/\s+/g, ""),
    description: c.description || "",
    discountType,
    discountValue,
    discountPercent,
    maxDiscountAmount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : undefined,
    minOrderAmount: Number(c.minOrderAmount || 0),
    minCompletedOrders: c.minCompletedOrders ? Number(c.minCompletedOrders) : undefined,
    minTotalSpent: c.minTotalSpent ? Number(c.minTotalSpent) : undefined,
    customerScope: c.customerScope || "ALL",
    usageLimit: c.usageLimit ? Number(c.usageLimit) : undefined,
    usageCount: Number(c.usageCount || 0),
    usagePerUser: c.usagePerUser ? Number(c.usagePerUser) : 1, // Mặc định mỗi khách được dùng 1 lần nếu không cấu hình khác
    startDate: c.startDate || undefined,
    endDate: c.endDate || undefined,
    applyScope: c.applyScope || "ALL",
    applicableCategoryIds: Array.isArray(c.applicableCategoryIds) ? c.applicableCategoryIds : [],
    applicableProductIds: Array.isArray(c.applicableProductIds) ? c.applicableProductIds : [],
    isActive: c.isActive !== false,
    createdAt: c.createdAt || new Date().toISOString(),
    updatedAt: c.updatedAt,
  };
}

/**
 * Tính toán thống kê lịch sử mua hàng của khách hàng (Đơn đã hoàn thành / thanh toán hợp lệ)
 */
export function getCustomerCompletedStats(
  orders: Order[],
  user?: { id?: string; email?: string; phone?: string }
): { completedOrdersCount: number; completedTotalSpent: number } {
  if (!user || (!user.id && !user.email && !user.phone)) {
    return { completedOrdersCount: 0, completedTotalSpent: 0 };
  }

  const cleanEmail = user.email?.toLowerCase().trim();
  const cleanPhone = user.phone?.trim();
  const userId = user.id;

  // Lọc các đơn hàng hợp lệ đã hoàn thành của khách
  const userCompletedOrders = orders.filter((o) => {
    // Chỉ tính đơn hoàn thành và không bị hủy
    const isCompleted = o.orderStatus === "COMPLETED" || (o.paymentStatus === "PAID" && o.orderStatus !== "CANCELLED");
    if (!isCompleted) return false;

    // Kiểm tra khớp danh tính khách hàng
    const matchUser = userId && o.userId === userId;
    const matchEmail = cleanEmail && o.customerEmail?.toLowerCase().trim() === cleanEmail;
    const matchPhone = cleanPhone && o.customerPhone?.trim() === cleanPhone;

    return Boolean(matchUser || matchEmail || matchPhone);
  });

  const completedOrdersCount = userCompletedOrders.length;
  const completedTotalSpent = userCompletedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return { completedOrdersCount, completedTotalSpent };
}

/**
 * Đếm số lần khách hàng cụ thể đã sử dụng voucher này trong quá khứ
 */
export function getUserVoucherUsageCount(
  couponId: string,
  couponCode: string,
  voucherUsages: VoucherUsage[] = [],
  orders: Order[] = [],
  user?: { id?: string; email?: string; phone?: string }
): number {
  if (!user || (!user.id && !user.email && !user.phone)) {
    return 0;
  }

  const cleanCode = couponCode.toUpperCase().trim();
  const cleanEmail = user.email?.toLowerCase().trim();
  const cleanPhone = user.phone?.trim();
  const userId = user.id;

  // 1. Kiểm tra từ bảng lưu vết voucherUsages
  const usageFromRecords = voucherUsages.filter((u) => {
    if (u.couponId !== couponId && u.couponCode.toUpperCase() !== cleanCode) return false;

    const matchUser = userId && u.userId === userId;
    const matchEmail = cleanEmail && u.customerEmail?.toLowerCase().trim() === cleanEmail;
    const matchPhone = cleanPhone && u.customerPhone?.trim() === cleanPhone;
    return Boolean(matchUser || matchEmail || matchPhone);
  }).length;

  if (usageFromRecords > 0) return usageFromRecords;

  // 2. Fallback kiểm tra từ danh sách đơn hàng thực tế (loại trừ đơn bị hủy)
  return orders.filter((o) => {
    if (o.orderStatus === "CANCELLED") return false;
    if (o.couponCode?.toUpperCase().trim() !== cleanCode) return false;

    const matchUser = userId && o.userId === userId;
    const matchEmail = cleanEmail && o.customerEmail?.toLowerCase().trim() === cleanEmail;
    const matchPhone = cleanPhone && o.customerPhone?.trim() === cleanPhone;
    return Boolean(matchUser || matchEmail || matchPhone);
  }).length;
}

/**
 * Voucher Engine: Bộ máy kiểm tra và tính toán giảm giá toàn diện theo chuẩn sàn TMĐT
 */
export function validateVoucherEngine(params: ValidateVoucherParams): ValidateVoucherResult {
  const { code, orderAmount, items = [], user, coupons, orders, products, voucherUsages = [] } = params;

  if (!code || !code.trim()) {
    return { valid: false, reason: "EMPTY_CODE", message: "Vui lòng nhập mã giảm giá." };
  }

  const cleanCode = code.toUpperCase().trim().replace(/\s+/g, "");
  const rawCoupon = coupons.find((c) => c.code.toUpperCase().trim() === cleanCode);

  if (!rawCoupon) {
    return {
      valid: false,
      reason: "NOT_FOUND",
      message: `Mã giảm giá "${cleanCode}" không tồn tại trên hệ thống.`,
    };
  }

  const coupon = normalizeCoupon(rawCoupon);

  // 1. Kiểm tra trạng thái Kích hoạt
  if (!coupon.isActive) {
    return {
      valid: false,
      reason: "INACTIVE",
      message: `Mã giảm giá "${coupon.code}" hiện đang tạm khóa hoặc đã ngừng áp dụng.`,
    };
  }

  // 2. Kiểm tra Hiệu lực Thời gian (Ngày & Giờ)
  const now = new Date().getTime();
  if (coupon.startDate) {
    const start = new Date(coupon.startDate).getTime();
    if (now < start) {
      const startStr = new Date(coupon.startDate).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      return {
        valid: false,
        reason: "NOT_STARTED",
        message: `Mã giảm giá "${coupon.code}" chưa đến thời gian áp dụng (Bắt đầu từ ${startStr}).`,
      };
    }
  }

  if (coupon.endDate) {
    const end = new Date(coupon.endDate).getTime();
    if (now > end) {
      return {
        valid: false,
        reason: "EXPIRED",
        message: `Mã giảm giá "${coupon.code}" đã hết hạn sử dụng.`,
      };
    }
  }

  // 3. Kiểm tra Giới hạn Tổng số lượt sử dụng
  if (coupon.usageLimit && coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
    return {
      valid: false,
      reason: "USAGE_LIMIT_REACHED",
      message: `Mã giảm giá "${coupon.code}" đã hết lượt sử dụng trên toàn hệ thống.`,
    };
  }

  // 4. Kiểm tra Giới hạn lượt sử dụng cho mỗi khách hàng (Per-User Limit)
  if (coupon.usagePerUser && coupon.usagePerUser > 0 && user && (user.id || user.email || user.phone)) {
    const userUsedCount = getUserVoucherUsageCount(coupon.id, coupon.code, voucherUsages, orders, user);
    if (userUsedCount >= coupon.usagePerUser) {
      return {
        valid: false,
        reason: "USER_LIMIT_REACHED",
        message: `Bạn đã sử dụng hết lượt cho mã "${coupon.code}" (Tối đa ${coupon.usagePerUser} lần/khách hàng).`,
      };
    }
  }

  // 5. Kiểm tra Lịch sử Mua Hàng của Khách (Số đơn hoàn thành & Tổng chi tiêu)
  const { completedOrdersCount, completedTotalSpent } = getCustomerCompletedStats(orders, user);

  if (coupon.minCompletedOrders && coupon.minCompletedOrders > 0) {
    if (completedOrdersCount < coupon.minCompletedOrders) {
      const remaining = coupon.minCompletedOrders - completedOrdersCount;
      return {
        valid: false,
        reason: "MIN_ORDERS_NOT_MET",
        message: `Mã "${coupon.code}" chỉ áp dụng cho khách hàng đã hoàn thành tối thiểu ${coupon.minCompletedOrders} đơn hàng (Bạn hiện có ${completedOrdersCount} đơn, cần thêm ${remaining} đơn).`,
      };
    }
  }

  if (coupon.minTotalSpent && coupon.minTotalSpent > 0) {
    if (completedTotalSpent < coupon.minTotalSpent) {
      const formatRequired = new Intl.NumberFormat("vi-VN").format(coupon.minTotalSpent);
      const formatCurrent = new Intl.NumberFormat("vi-VN").format(completedTotalSpent);
      return {
        valid: false,
        reason: "MIN_SPENT_NOT_MET",
        message: `Mã "${coupon.code}" yêu cầu tổng chi tiêu tích lũy tối thiểu ${formatRequired}đ (Hiện tại bạn đã chi tiêu ${formatCurrent}đ).`,
      };
    }
  }

  // 6. Kiểm tra Nhóm Khách Hàng (Customer Scope)
  if (coupon.customerScope === "NEW_CUSTOMERS" && completedOrdersCount > 0) {
    return {
      valid: false,
      reason: "NEW_CUSTOMERS_ONLY",
      message: `Mã "${coupon.code}" chỉ dành riêng cho khách hàng mới chưa từng có đơn hàng hoàn thành.`,
    };
  }

  if (coupon.customerScope === "RETURNING_CUSTOMERS" && completedOrdersCount === 0) {
    return {
      valid: false,
      reason: "RETURNING_CUSTOMERS_ONLY",
      message: `Mã "${coupon.code}" dành cho khách hàng thân thiết (đã có ít nhất 1 đơn hoàn thành).`,
    };
  }

  // 7. Kiểm tra Phạm vi Sản phẩm / Danh mục (Scope) & Tính giá trị đơn đủ điều kiện
  let qualifyingAmount = orderAmount;

  if (coupon.applyScope === "CATEGORIES" && coupon.applicableCategoryIds && coupon.applicableCategoryIds.length > 0) {
    if (items.length > 0) {
      const eligibleItems = items.filter((item) => {
        const prod = products.find((p) => p.id === item.productId || p.name === item.productName);
        return prod && coupon.applicableCategoryIds!.includes(prod.categoryId);
      });

      qualifyingAmount = eligibleItems.reduce((sum, item) => sum + item.totalPrice, 0);

      if (qualifyingAmount <= 0) {
        return {
          valid: false,
          reason: "CATEGORY_SCOPE_MISMATCH",
          message: `Mã giảm giá "${coupon.code}" chỉ áp dụng cho các món thuộc danh mục quy định.`,
        };
      }
    }
  } else if (coupon.applyScope === "PRODUCTS" && coupon.applicableProductIds && coupon.applicableProductIds.length > 0) {
    if (items.length > 0) {
      const eligibleItems = items.filter((item) => {
        const prod = products.find((p) => p.id === item.productId || p.name === item.productName);
        return prod && coupon.applicableProductIds!.includes(prod.id);
      });

      qualifyingAmount = eligibleItems.reduce((sum, item) => sum + item.totalPrice, 0);

      if (qualifyingAmount <= 0) {
        return {
          valid: false,
          reason: "PRODUCT_SCOPE_MISMATCH",
          message: `Mã giảm giá "${coupon.code}" chỉ áp dụng cho một số món cụ thể trong thực đơn.`,
        };
      }
    }
  }

  // 8. Kiểm tra Giá trị Đơn Hàng Tối Thiểu (minOrderAmount)
  if (coupon.minOrderAmount && coupon.minOrderAmount > 0) {
    if (qualifyingAmount < coupon.minOrderAmount) {
      const formatMin = new Intl.NumberFormat("vi-VN").format(coupon.minOrderAmount);
      const formatCurrent = new Intl.NumberFormat("vi-VN").format(qualifyingAmount);
      return {
        valid: false,
        reason: "MIN_ORDER_AMOUNT_NOT_MET",
        message: `Đơn hàng tối thiểu ${formatMin}đ mới đủ điều kiện áp dụng mã "${coupon.code}" (Đơn hợp lệ hiện tại: ${formatCurrent}đ).`,
      };
    }
  }

  // 9. Tính Toán Giá Trị Giảm Giá (Discount Calculation)
  let rawDiscount = 0;

  if (coupon.discountType === "PERCENT") {
    rawDiscount = Math.round((qualifyingAmount * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
      rawDiscount = Math.min(rawDiscount, coupon.maxDiscountAmount);
    }
  } else if (coupon.discountType === "FIXED_AMOUNT") {
    rawDiscount = Math.round(coupon.discountValue);
  }

  // Không giảm vượt quá tổng giá trị đơn hàng
  const discountAmount = Math.max(0, Math.min(rawDiscount, orderAmount));
  const finalAmount = Math.max(0, orderAmount - discountAmount);

  // Tạo thông điệp thành công chi tiết
  const discountDisplay = coupon.discountType === "PERCENT"
    ? `${coupon.discountValue}% (-${new Intl.NumberFormat("vi-VN").format(discountAmount)}đ)`
    : `-${new Intl.NumberFormat("vi-VN").format(discountAmount)}đ`;

  return {
    valid: true,
    coupon,
    discountAmount,
    finalAmount,
    qualifyingAmount,
    message: `Áp dụng thành công mã "${coupon.code}"! Giảm ${discountDisplay}.`,
  };
}
