import { InlineKeyboardMarkup, InlineKeyboardButton } from "./types";
import { OrderStatus } from "../types";

export const keyboards = {
  // 1. Main Dashboard
  mainDashboard: (): InlineKeyboardMarkup => ({
    inline_keyboard: [
      [{ text: "📦 ĐƠN HÀNG", callback_data: "nav:orders:ALL:1" }],
      [
        { text: "🥤 SẢN PHẨM", callback_data: "nav:products:ALL:1" },
        { text: "📂 DANH MỤC", callback_data: "nav:categories" },
      ],
      [
        { text: "🎟 MÃ GIẢM GIÁ", callback_data: "nav:coupons:1" },
        { text: "👥 KHÁCH HÀNG", callback_data: "nav:users:1" },
      ],
      [
        { text: "📊 DOANH THU", callback_data: "nav:revenue:today" },
        { text: "🏪 CỬA HÀNG", callback_data: "nav:store" },
      ],
      [
        { text: "⚡ THAO TÁC NHANH", callback_data: "nav:quick_actions" },
        { text: "🔎 TÌM KIẾM", callback_data: "nav:search" },
      ],
    ],
  }),

  // 2. Orders Menu & Filter
  ordersMenu: (currentFilter: string = "ALL", page: number = 1, totalPages: number = 1): InlineKeyboardMarkup => {
    const filterButtons: InlineKeyboardButton[] = [
      { text: currentFilter === "NEW" ? "🔘 Đơn mới" : "🔴 Đơn mới", callback_data: "nav:orders:NEW:1" },
      { text: currentFilter === "PREPARING" ? "🔘 Đang pha" : "🟡 Đang pha", callback_data: "nav:orders:PREPARING:1" },
      { text: currentFilter === "DELIVERING" ? "🔘 Đang giao" : "🚚 Đang giao", callback_data: "nav:orders:DELIVERING:1" },
    ];

    const rows: InlineKeyboardButton[][] = [
      filterButtons,
      [
        { text: currentFilter === "ALL" ? "🔘 Tất cả đơn" : "📋 Tất cả", callback_data: "nav:orders:ALL:1" },
        { text: currentFilter === "COMPLETED" ? "🔘 Đã giao" : "✅ Hoàn thành", callback_data: "nav:orders:COMPLETED:1" },
      ],
    ];

    // Pagination
    if (totalPages > 1) {
      const prevPage = Math.max(1, page - 1);
      const nextPage = Math.min(totalPages, page + 1);
      rows.push([
        { text: "⬅️ Trước", callback_data: `nav:orders:${currentFilter}:${prevPage}` },
        { text: `${page}/${totalPages}`, callback_data: "noop" },
        { text: "Sau ➡️", callback_data: `nav:orders:${currentFilter}:${nextPage}` },
      ]);
    }

    rows.push([
      { text: "🔎 Tìm đơn", callback_data: "action:search_order" },
      { text: "⬅️ Menu chính", callback_data: "nav:dashboard" },
    ]);

    return { inline_keyboard: rows };
  },

  // 3. Order Detail
  orderDetail: (orderId: string, currentStatus: OrderStatus, phone?: string): InlineKeyboardMarkup => {
    const actionRows: InlineKeyboardButton[][] = [];

    // Các nút chuyển trạng thái phù hợp
    if (currentStatus === "NEW") {
      actionRows.push([
        { text: "🧑‍🍳 Nhận đơn & Pha chế", callback_data: `order:status:${orderId}:PREPARING` },
        { text: "❌ Hủy đơn", callback_data: `order:confirm_cancel:${orderId}` },
      ]);
    } else if (currentStatus === "PREPARING") {
      actionRows.push([
        { text: "🚚 Bắt đầu giao hàng", callback_data: `order:status:${orderId}:DELIVERING` },
        { text: "✅ Hoàn thành luôn", callback_data: `order:status:${orderId}:COMPLETED` },
      ]);
      actionRows.push([{ text: "❌ Hủy đơn", callback_data: `order:confirm_cancel:${orderId}` }]);
    } else if (currentStatus === "DELIVERING") {
      actionRows.push([
        { text: "✅ Khách đã nhận (Hoàn thành)", callback_data: `order:status:${orderId}:COMPLETED` },
        { text: "❌ Hủy / Hoàn đơn", callback_data: `order:confirm_cancel:${orderId}` },
      ]);
    }

    const utilRow: InlineKeyboardButton[] = [];
    if (phone) {
      utilRow.push({ text: `📞 Gọi: ${phone}`, url: `tel:${phone.replace(/\D/g, "")}` });
    }
    utilRow.push({ text: "⬅️ Quay lại DS đơn", callback_data: "nav:orders:ALL:1" });
    actionRows.push(utilRow);

    return { inline_keyboard: actionRows };
  },

  // 4. Products Menu
  productsMenu: (
    currentFilter: string = "ALL",
    page: number = 1,
    totalPages: number = 1,
    productButtons: InlineKeyboardButton[][] = []
  ): InlineKeyboardMarkup => {
    const rows: InlineKeyboardButton[][] = [
      [
        { text: "➕ THÊM SẢN PHẨM", callback_data: "wizard:add_product" },
        { text: "🔎 Tìm món", callback_data: "action:search_product" },
      ],
      [
        { text: currentFilter === "ALL" ? "🔘 Tất cả" : "📋 Tất cả", callback_data: "nav:products:ALL:1" },
        { text: currentFilter === "AVAILABLE" ? "🔘 Đang bán" : "🟢 Đang bán", callback_data: "nav:products:AVAILABLE:1" },
        { text: currentFilter === "OUT_OF_STOCK" ? "🔘 Tạm hết" : "🔴 Tạm hết", callback_data: "nav:products:OUT_OF_STOCK:1" },
      ],
      ...productButtons,
    ];

    if (totalPages > 1) {
      const prevPage = Math.max(1, page - 1);
      const nextPage = Math.min(totalPages, page + 1);
      rows.push([
        { text: "⬅️ Trước", callback_data: `nav:products:${currentFilter}:${prevPage}` },
        { text: `${page}/${totalPages}`, callback_data: "noop" },
        { text: "Sau ➡️", callback_data: `nav:products:${currentFilter}:${nextPage}` },
      ]);
    }

    rows.push([{ text: "⬅️ Menu chính", callback_data: "nav:dashboard" }]);
    return { inline_keyboard: rows };
  },

  // 5. Product Detail
  productDetail: (productId: string, isAvailable: boolean): InlineKeyboardMarkup => ({
    inline_keyboard: [
      [
        { text: "✏️ Sửa tên", callback_data: `prod:edit_name:${productId}` },
        { text: "💰 Đổi giá", callback_data: `prod:edit_price:${productId}` },
      ],
      [
        {
          text: isAvailable ? "🔴 Tạm ngưng bán" : "🟢 Bật bán lại",
          callback_data: `prod:toggle:${productId}`,
        },
        { text: "🗑 Xóa món", callback_data: `prod:confirm_delete:${productId}` },
      ],
      [{ text: "⬅️ Quay lại DS món", callback_data: "nav:products:ALL:1" }],
    ],
  }),

  // 6. Categories Menu
  categoriesMenu: (categoryButtons: InlineKeyboardButton[][] = []): InlineKeyboardMarkup => ({
    inline_keyboard: [
      [
        { text: "➕ Thêm danh mục", callback_data: "wizard:add_category" },
      ],
      ...categoryButtons,
      [{ text: "⬅️ Menu chính", callback_data: "nav:dashboard" }],
    ],
  }),

  // 7. Category Detail
  categoryDetail: (categoryId: string): InlineKeyboardMarkup => ({
    inline_keyboard: [
      [
        { text: "✏️ Đổi tên", callback_data: `cat:edit:${categoryId}` },
        { text: "🗑 Xóa danh mục", callback_data: `cat:confirm_delete:${categoryId}` },
      ],
      [{ text: "⬅️ Quay lại danh mục", callback_data: "nav:categories" }],
    ],
  }),

  // 8. Coupons Menu
  couponsMenu: (couponButtons: InlineKeyboardButton[][] = []): InlineKeyboardMarkup => ({
    inline_keyboard: [
      [{ text: "➕ TẠO MÃ GIẢM GIÁ MỚI", callback_data: "wizard:create_coupon" }],
      ...couponButtons,
      [{ text: "⬅️ Menu chính", callback_data: "nav:dashboard" }],
    ],
  }),

  // 9. Coupon Detail
  couponDetail: (couponId: string, isActive: boolean): InlineKeyboardMarkup => ({
    inline_keyboard: [
      [
        {
          text: isActive ? "🔴 Tắt mã voucher" : "🟢 Bật hoạt động",
          callback_data: `cpn:toggle:${couponId}`,
        },
        { text: "🗑 Xóa mã", callback_data: `cpn:confirm_delete:${couponId}` },
      ],
      [{ text: "⬅️ Quay lại DS mã", callback_data: "nav:coupons:1" }],
    ],
  }),

  // 10. Store Management Menu
  storeMenu: (isOpen: boolean): InlineKeyboardMarkup => ({
    inline_keyboard: [
      [
        {
          text: isOpen ? "🔴 ĐÓNG CỬA HÀNG (TẠM NGHỈ)" : "🟢 MỞ CỬA HÀNG (NHẬN ĐƠN)",
          callback_data: isOpen ? "store:confirm_close" : "store:open",
        },
      ],
      [
        { text: "🔄 Làm mới trạng thái", callback_data: "nav:store" },
        { text: "⬅️ Menu chính", callback_data: "nav:dashboard" },
      ],
    ],
  }),

  // 11. Quick Actions Menu
  quickActions: (): InlineKeyboardMarkup => ({
    inline_keyboard: [
      [
        { text: "🔴 Đơn mới cần duyệt", callback_data: "nav:orders:NEW:1" },
        { text: "➕ Thêm món mới", callback_data: "wizard:add_product" },
      ],
      [
        { text: "🎟 Tạo mã giảm giá", callback_data: "wizard:create_coupon" },
        { text: "🔴 Xem món tạm hết", callback_data: "nav:products:OUT_OF_STOCK:1" },
      ],
      [{ text: "⬅️ Menu chính", callback_data: "nav:dashboard" }],
    ],
  }),

  // 12. Revenue Filters
  revenueMenu: (currentPeriod: string): InlineKeyboardMarkup => ({
    inline_keyboard: [
      [
        { text: currentPeriod === "today" ? "🔘 Hôm nay" : "📅 Hôm nay", callback_data: "nav:revenue:today" },
        { text: currentPeriod === "7days" ? "🔘 7 ngày qua" : "📅 7 ngày", callback_data: "nav:revenue:7days" },
      ],
      [
        { text: currentPeriod === "30days" ? "🔘 30 ngày qua" : "📅 30 ngày", callback_data: "nav:revenue:30days" },
        { text: currentPeriod === "month" ? "🔘 Tháng này" : "📅 Tháng này", callback_data: "nav:revenue:month" },
      ],
      [{ text: "⬅️ Menu chính", callback_data: "nav:dashboard" }],
    ],
  }),

  // 13. Reusable Confirm / Cancel Keyboard
  confirmAction: (confirmCallback: string, cancelCallback: string, confirmText = "⚠️ Xác nhận thực hiện"): InlineKeyboardMarkup => ({
    inline_keyboard: [
      [
        { text: confirmText, callback_data: confirmCallback },
        { text: "❌ Hủy bỏ", callback_data: cancelCallback },
      ],
    ],
  }),

  // 14. Wizard Cancel Keyboard
  wizardCancel: (): InlineKeyboardMarkup => ({
    inline_keyboard: [[{ text: "❌ Hủy thao tác & Quay lại", callback_data: "wizard:cancel" }]],
  }),

  // 15. Back to Dashboard
  backToDashboard: (): InlineKeyboardMarkup => ({
    inline_keyboard: [[{ text: "⬅️ Menu chính", callback_data: "nav:dashboard" }]],
  }),
};
