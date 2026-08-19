import { answerTelegramCallbackQuery, sendTelegramMessage } from "./botApi";
import { isAuthorizedTelegramAdmin, getAdminRole, hasPermission } from "./security";
import { clearConversationSession, getConversationSession } from "./session";
import { renderDashboard } from "./handlers/dashboardHandler";
import {
  renderOrdersList,
  renderOrderDetail,
  handleOrderStatusUpdate,
  handleConfirmCancelOrder,
  handleExecuteCancelOrder,
} from "./handlers/orderHandler";
import {
  renderProductsList,
  renderProductDetail,
  handleToggleProductStatus,
  handleConfirmDeleteProduct,
  handleExecuteDeleteProduct,
  startAddProductWizard,
  handleAddProductMessageInput,
  handleCategorySelectWizard,
  executeAddProduct,
} from "./handlers/productHandler";
import {
  renderCategoriesList,
  renderCategoryDetail,
  handleConfirmDeleteCategory,
  handleExecuteDeleteCategory,
  startAddCategoryWizard,
  handleAddCategoryInput,
} from "./handlers/categoryHandler";
import {
  renderCouponsList,
  renderCouponDetail,
  handleToggleCoupon,
  handleConfirmDeleteCoupon,
  handleExecuteDeleteCoupon,
  startCreateCouponWizard,
  handleCreateCouponInput,
  handleCouponTypeSelectWizard,
  executeCreateCoupon,
} from "./handlers/couponHandler";
import { renderUsersList, renderUserDetail } from "./handlers/userHandler";
import { renderRevenueReport } from "./handlers/revenueHandler";
import {
  renderStoreStatus,
  handleConfirmCloseStore,
  handleExecuteCloseStore,
  handleExecuteOpenStore,
} from "./handlers/storeHandler";
import { promptGlobalSearch, handleGlobalSearchInput } from "./handlers/searchHandler";
import { keyboards } from "./keyboards";
import { dataStore } from "../store";
import { OrderStatus, DiscountType } from "../types";

export async function processTelegramWebhookUpdate(update: any) {
  // 1. Xử lý tin nhắn văn bản / hình ảnh (Message)
  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat?.id;
    const userId = msg.from?.id;
    const text = (msg.text || msg.caption || "").trim();

    if (!chatId || !userId) return;

    // Kiểm tra quyền Admin Whitelist
    if (!isAuthorizedTelegramAdmin(userId, chatId)) {
      await sendTelegramMessage(
        chatId,
        `⛔ <b>TRUY CẬP BỊ TỪ CHỐI</b>\n\nTài khoản Telegram (ID: <code>${userId}</code>) không có quyền quản trị hệ thống Trà Sữa Dino.\n\n<i>Vui lòng liên hệ Quản trị viên để cấp quyền truy cập.</i>`
      );
      return;
    }

    // Kiểm tra nếu đang trong luồng Wizard hội thoại
    const session = getConversationSession(userId);
    if (session.flow !== "IDLE" && !text.startsWith("/")) {
      if (session.flow === "ADD_PRODUCT") {
        let photoFileId: string | undefined;
        if (msg.photo && msg.photo.length > 0) {
          photoFileId = msg.photo[msg.photo.length - 1].file_id;
        }
        await handleAddProductMessageInput(chatId, userId, text, photoFileId);
        return;
      }
      if (session.flow === "CREATE_COUPON") {
        await handleCreateCouponInput(chatId, userId, text);
        return;
      }
      if (session.flow === "ADD_CATEGORY") {
        await handleAddCategoryInput(chatId, userId, text);
        return;
      }
      if (session.flow === "GLOBAL_SEARCH") {
        await handleGlobalSearchInput(chatId, userId, text);
        return;
      }
    }

    // Xử lý các câu lệnh (Commands)
    const lower = text.toLowerCase();

    if (lower === "/start" || lower === "/dashboard" || lower === "/admin") {
      clearConversationSession(userId);
      await renderDashboard(chatId);
      return;
    }

    if (lower === "/donhang" || lower === "/orders") {
      clearConversationSession(userId);
      await renderOrdersList(chatId, undefined, "ALL", 1);
      return;
    }

    if (lower.startsWith("/don ") || lower.startsWith("/order ")) {
      const query = text.split(" ")[1]?.trim();
      if (query) {
        await renderOrderDetail(chatId, undefined, query);
        return;
      }
    }

    if (lower === "/sanpham" || lower === "/products" || lower === "/menu") {
      clearConversationSession(userId);
      await renderProductsList(chatId, undefined, "ALL", 1);
      return;
    }

    if (lower === "/danhmuc" || lower === "/categories") {
      clearConversationSession(userId);
      await renderCategoriesList(chatId);
      return;
    }

    if (lower === "/voucher" || lower === "/coupons" || lower === "/magiamgia") {
      clearConversationSession(userId);
      await renderCouponsList(chatId);
      return;
    }

    if (lower === "/doanhthu" || lower === "/stats" || lower === "/revenue") {
      clearConversationSession(userId);
      await renderRevenueReport(chatId, undefined, "today");
      return;
    }

    if (lower === "/khachhang" || lower === "/users") {
      clearConversationSession(userId);
      await renderUsersList(chatId, undefined, 1);
      return;
    }

    if (lower === "/cuahang" || lower === "/store") {
      clearConversationSession(userId);
      await renderStoreStatus(chatId);
      return;
    }

    if (lower.startsWith("/tim ") || lower.startsWith("/search ")) {
      const keyword = text.substring(lower.startsWith("/tim ") ? 5 : 8).trim();
      if (keyword) {
        await handleGlobalSearchInput(chatId, userId, keyword);
        return;
      }
    }

    if (lower.startsWith("/hetmon ")) {
      const prodName = text.substring(8).trim().toLowerCase();
      const prod = dataStore.getProducts().find((p) => p.name.toLowerCase().includes(prodName));
      if (prod) {
        dataStore.updateProduct(prod.id, { isAvailable: false });
        await sendTelegramMessage(
          chatId,
          `🔴 Đã chuyển món <b>"${prod.name}"</b> sang trạng thái <b>TẠM HẾT HÀNG</b>.`,
          { reply_markup: keyboards.backToDashboard() }
        );
        return;
      }
    }

    if (lower.startsWith("/conmon ")) {
      const prodName = text.substring(8).trim().toLowerCase();
      const prod = dataStore.getProducts().find((p) => p.name.toLowerCase().includes(prodName));
      if (prod) {
        dataStore.updateProduct(prod.id, { isAvailable: true });
        await sendTelegramMessage(
          chatId,
          `🟢 Đã mở bán lại món <b>"${prod.name}"</b> trên thực đơn.`,
          { reply_markup: keyboards.backToDashboard() }
        );
        return;
      }
    }

    if (lower === "/dongcua") {
      dataStore.updateSettings({ isOpen: false });
      await sendTelegramMessage(chatId, "🔴 Quán đã chuyển sang chế độ <b>TẠM NGHỈ</b>.", {
        reply_markup: keyboards.backToDashboard(),
      });
      return;
    }

    if (lower === "/mocua") {
      dataStore.updateSettings({ isOpen: true });
      await sendTelegramMessage(chatId, "🟢 Quán đã <b>MỞ CỬA NHẬN ĐƠN</b> bình thường.", {
        reply_markup: keyboards.backToDashboard(),
      });
      return;
    }

    if (lower === "/help") {
      const helpText = `📖 <b>DANH SÁCH LỆNH DINO ADMIN:</b>
━━━━━━━━━━━━━━━━━━━━━
● <code>/start</code>: Mở Bảng điều khiển Admin Dashboard
● <code>/donhang</code>: Xem danh sách đơn hàng
● <code>/don &lt;mã&gt;</code>: Xem chi tiết đơn (VD: /don DINO-892)
● <code>/sanpham</code>: Quản lý món ăn & Menu
● <code>/danhmuc</code>: Quản lý danh mục
● <code>/voucher</code>: Quản lý mã giảm giá
● <code>/doanhthu</code>: Báo cáo doanh thu quán
● <code>/cuahang</code>: Xem trạng thái đóng/mở quán
● <code>/hetmon &lt;tên&gt;</code>: Tắt bán món nhanh
● <code>/conmon &lt;tên&gt;</code>: Bật bán món nhanh
● <code>/tim &lt;từ khóa&gt;</code>: Tìm kiếm đơn/món/khách`;
      await sendTelegramMessage(chatId, helpText, { reply_markup: keyboards.backToDashboard() });
      return;
    }

    // Mặc định hiển thị Dashboard nếu không khớp lệnh
    await renderDashboard(chatId);
    return;
  }

  // 2. Xử lý các sự kiện bấm nút Inline Button (Callback Query)
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.message?.chat?.id;
    const messageId = cb.message?.message_id;
    const userId = cb.from?.id;
    const data = cb.data || "";

    if (!chatId || !messageId || !userId) return;

    // Phản hồi callback ngay lập tức để Telegram tắt loading spinner trên nút
    await answerTelegramCallbackQuery(cb.id);

    // Kiểm tra quyền Admin Whitelist
    if (!isAuthorizedTelegramAdmin(userId, chatId)) {
      await sendTelegramMessage(chatId, "⛔ Bạn không có quyền thực hiện thao tác này.");
      return;
    }

    const role = getAdminRole(userId);

    // Xử lý các nhóm callback data:

    // 1. Dashboard
    if (data === "nav:dashboard") {
      clearConversationSession(userId);
      await renderDashboard(chatId, messageId);
      return;
    }

    // 2. Orders Navigation & Actions
    if (data.startsWith("nav:orders:")) {
      const [, , filter, pageStr] = data.split(":");
      await renderOrdersList(chatId, messageId, filter || "ALL", Number(pageStr) || 1);
      return;
    }

    if (data.startsWith("order:detail:")) {
      const orderId = data.replace("order:detail:", "");
      await renderOrderDetail(chatId, messageId, orderId);
      return;
    }

    if (data.startsWith("order:status:")) {
      if (!hasPermission(role, "orders.update")) {
        await sendTelegramMessage(chatId, "⛔ Bạn không có quyền cập nhật đơn hàng.");
        return;
      }
      const parts = data.split(":");
      const orderId = parts[2];
      const newStatus = parts[3] as OrderStatus;
      await handleOrderStatusUpdate(chatId, messageId, orderId, newStatus, userId);
      return;
    }

    if (data.startsWith("order:confirm_cancel:")) {
      const orderId = data.replace("order:confirm_cancel:", "");
      await handleConfirmCancelOrder(chatId, messageId, orderId);
      return;
    }

    if (data.startsWith("order:exec_cancel:")) {
      if (!hasPermission(role, "orders.update")) return;
      const orderId = data.replace("order:exec_cancel:", "");
      await handleExecuteCancelOrder(chatId, messageId, orderId, userId);
      return;
    }

    // 3. Products Navigation & Actions
    if (data.startsWith("nav:products:")) {
      const [, , filter, pageStr] = data.split(":");
      await renderProductsList(chatId, messageId, filter || "ALL", Number(pageStr) || 1);
      return;
    }

    if (data.startsWith("prod:detail:")) {
      const prodId = data.replace("prod:detail:", "");
      await renderProductDetail(chatId, messageId, prodId);
      return;
    }

    if (data.startsWith("prod:toggle:")) {
      if (!hasPermission(role, "products.manage")) return;
      const prodId = data.replace("prod:toggle:", "");
      await handleToggleProductStatus(chatId, messageId, prodId, userId);
      return;
    }

    if (data.startsWith("prod:confirm_delete:")) {
      const prodId = data.replace("prod:confirm_delete:", "");
      await handleConfirmDeleteProduct(chatId, messageId, prodId);
      return;
    }

    if (data.startsWith("prod:exec_delete:")) {
      if (!hasPermission(role, "products.manage")) return;
      const prodId = data.replace("prod:exec_delete:", "");
      await handleExecuteDeleteProduct(chatId, messageId, prodId, userId);
      return;
    }

    if (data === "wizard:add_product") {
      await startAddProductWizard(chatId, userId);
      return;
    }

    if (data.startsWith("wizard:cat_select:")) {
      const catId = data.replace("wizard:cat_select:", "");
      await handleCategorySelectWizard(chatId, messageId, catId, userId);
      return;
    }

    if (data === "wizard:exec_add_product") {
      await executeAddProduct(chatId, messageId, userId);
      return;
    }

    // 4. Categories Navigation & Actions
    if (data === "nav:categories") {
      await renderCategoriesList(chatId, messageId);
      return;
    }

    if (data.startsWith("cat:detail:")) {
      const catId = data.replace("cat:detail:", "");
      await renderCategoryDetail(chatId, messageId, catId);
      return;
    }

    if (data.startsWith("cat:confirm_delete:")) {
      const catId = data.replace("cat:confirm_delete:", "");
      await handleConfirmDeleteCategory(chatId, messageId, catId);
      return;
    }

    if (data.startsWith("cat:exec_delete:")) {
      if (!hasPermission(role, "categories.manage")) return;
      const catId = data.replace("cat:exec_delete:", "");
      await handleExecuteDeleteCategory(chatId, messageId, catId, userId);
      return;
    }

    if (data === "wizard:add_category") {
      await startAddCategoryWizard(chatId, userId);
      return;
    }

    // 5. Coupons Navigation & Actions
    if (data.startsWith("nav:coupons:")) {
      await renderCouponsList(chatId, messageId);
      return;
    }

    if (data.startsWith("cpn:detail:")) {
      const cpnId = data.replace("cpn:detail:", "");
      await renderCouponDetail(chatId, messageId, cpnId);
      return;
    }

    if (data.startsWith("cpn:toggle:")) {
      if (!hasPermission(role, "coupons.manage")) return;
      const cpnId = data.replace("cpn:toggle:", "");
      await handleToggleCoupon(chatId, messageId, cpnId, userId);
      return;
    }

    if (data.startsWith("cpn:confirm_delete:")) {
      const cpnId = data.replace("cpn:confirm_delete:", "");
      await handleConfirmDeleteCoupon(chatId, messageId, cpnId);
      return;
    }

    if (data.startsWith("cpn:exec_delete:")) {
      if (!hasPermission(role, "coupons.manage")) return;
      const cpnId = data.replace("cpn:exec_delete:", "");
      await handleExecuteDeleteCoupon(chatId, messageId, cpnId, userId);
      return;
    }

    if (data === "wizard:create_coupon") {
      await startCreateCouponWizard(chatId, userId);
      return;
    }

    if (data.startsWith("wizard:cpn_type:")) {
      const type = data.replace("wizard:cpn_type:", "") as DiscountType;
      await handleCouponTypeSelectWizard(chatId, messageId, type, userId);
      return;
    }

    if (data === "wizard:exec_create_coupon") {
      await executeCreateCoupon(chatId, messageId, userId);
      return;
    }

    // 6. Users Navigation
    if (data.startsWith("nav:users:")) {
      const pageStr = data.replace("nav:users:", "");
      await renderUsersList(chatId, messageId, Number(pageStr) || 1);
      return;
    }

    if (data.startsWith("user:detail:")) {
      const uId = data.replace("user:detail:", "");
      await renderUserDetail(chatId, messageId, uId);
      return;
    }

    // 7. Revenue Navigation
    if (data.startsWith("nav:revenue:")) {
      const period = data.replace("nav:revenue:", "") as any;
      await renderRevenueReport(chatId, messageId, period);
      return;
    }

    // 8. Store Navigation & Actions
    if (data === "nav:store") {
      await renderStoreStatus(chatId, messageId);
      return;
    }

    if (data === "store:confirm_close") {
      await handleConfirmCloseStore(chatId, messageId);
      return;
    }

    if (data === "store:exec_close") {
      if (!hasPermission(role, "store.manage")) return;
      await handleExecuteCloseStore(chatId, messageId, userId);
      return;
    }

    if (data === "store:open") {
      if (!hasPermission(role, "store.manage")) return;
      await handleExecuteOpenStore(chatId, messageId, userId);
      return;
    }

    // 9. Quick Actions & Search
    if (data === "nav:quick_actions") {
      await sendTelegramMessage(chatId, "⚡ <b>THAO TÁC NHANH</b>\n\nChọn tác vụ bạn muốn xử lý nhanh:", {
        reply_markup: keyboards.quickActions(),
      });
      return;
    }

    if (data === "nav:search" || data === "action:search_order" || data === "action:search_product") {
      await promptGlobalSearch(chatId, userId);
      return;
    }

    if (data === "wizard:cancel") {
      clearConversationSession(userId);
      await sendTelegramMessage(chatId, "❌ <i>Đã hủy thao tác.</i>", {
        reply_markup: keyboards.backToDashboard(),
      });
      return;
    }
  }
}
