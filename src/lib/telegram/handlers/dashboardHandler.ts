import { dataStore } from "../../store";
import { keyboards } from "../keyboards";
import { editTelegramMessageText, sendTelegramMessage } from "../botApi";

export async function renderDashboard(chatId: string | number, messageId?: number) {
  const store = dataStore.getSettings();
  const stats = dataStore.getDashboardStats();
  const products = dataStore.getProducts();
  const coupons = dataStore.getCoupons();

  const activeProductsCount = products.filter((p) => p.isAvailable).length;
  const activeCouponsCount = coupons.filter((c) => c.isActive).length;
  const pendingOrdersCount = stats.newOrdersCount + stats.preparingOrdersCount;

  const storeStatusIcon = store.isOpen ? "🟢 Đang mở" : "🔴 Đang tạm nghỉ";
  const revenueFormatted = new Intl.NumberFormat("vi-VN").format(stats.todayRevenue);

  const text = `👑 <b>DINO ADMIN CENTER</b>

Xin chào Admin 👋

🏪 <b>Trạng thái quán:</b> ${storeStatusIcon}
📦 <b>Đơn chờ xử lý:</b> <code>${pendingOrdersCount}</code>
💰 <b>Doanh thu hôm nay:</b> <code>${revenueFormatted} ₫</code>
🥤 <b>Sản phẩm đang bán:</b> <code>${activeProductsCount}/${products.length}</code>
🎟 <b>Voucher hoạt động:</b> <code>${activeCouponsCount}</code>

━━━━━━━━━━━━━━━━━━━━━
<i>Vui lòng chọn chức năng bên dưới để quản trị hệ thống:</i>`;

  const markup = keyboards.mainDashboard();

  if (messageId) {
    const res = await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
    if (res && res.ok) return res;
  }
  return await sendTelegramMessage(chatId, text, { reply_markup: markup });
}
