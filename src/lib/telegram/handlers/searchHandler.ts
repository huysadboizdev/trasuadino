import { dataStore } from "../../store";
import { keyboards } from "../keyboards";
import { editTelegramMessageText, sendTelegramMessage } from "../botApi";
import { setConversationSession, clearConversationSession } from "../session";

export async function promptGlobalSearch(chatId: string | number, telegramUserId: string | number) {
  setConversationSession(telegramUserId, {
    flow: "GLOBAL_SEARCH",
  });

  const text = `🔎 <b>TÌM KIẾM TOÀN DIỆN TRÀ SỮA DINO</b>
━━━━━━━━━━━━━━━━━━━━━
Bạn có thể nhập bất kỳ thông tin nào sau đây:
● <b>Mã đơn hàng:</b> <code>DINO-892</code> hoặc <code>892</code>
● <b>Số điện thoại khách:</b> <code>0988555999</code>
● <b>Tên món ăn:</b> <code>Matcha</code>, <code>Oolong</code>, <code>Trân châu</code>
● <b>Mã giảm giá:</b> <code>DINO10</code>, <code>TET2026</code>

<i>Vui lòng nhập từ khóa tìm kiếm:</i>`;

  return await sendTelegramMessage(chatId, text, { reply_markup: keyboards.wizardCancel() });
}

export async function handleGlobalSearchInput(
  chatId: string | number,
  telegramUserId: string | number,
  keyword: string
) {
  const q = keyword.trim().toLowerCase();
  clearConversationSession(telegramUserId);

  // 1. Tìm đơn hàng
  const allOrders = dataStore.getOrders();
  const matchedOrders = allOrders.filter(
    (o) =>
      o.orderCode.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.customerName.toLowerCase().includes(q)
  );

  // 2. Tìm món ăn
  const allProds = dataStore.getProducts();
  const matchedProducts = allProds.filter(
    (p) => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
  );

  // 3. Tìm mã giảm giá
  const allCoupons = dataStore.getCoupons();
  const matchedCoupons = allCoupons.filter((c) => c.code.toLowerCase().includes(q));

  let text = `🔎 <b>KẾT QUẢ TÌM KIẾM CHO:</b> "<code>${keyword}</code>"\n━━━━━━━━━━━━━━━━━━━━━\n`;
  const resultButtons: { text: string; callback_data: string }[][] = [];

  let totalMatches = 0;

  if (matchedOrders.length > 0) {
    text += `\n📦 <b>ĐƠN HÀNG (${matchedOrders.length}):</b>\n`;
    matchedOrders.slice(0, 4).forEach((o) => {
      totalMatches++;
      text += `  ● <b>${o.orderCode}</b> (${o.customerName} - ${new Intl.NumberFormat("vi-VN").format(o.totalAmount)}₫)\n`;
      resultButtons.push([{ text: `📦 Xem đơn ${o.orderCode}`, callback_data: `order:detail:${o.id}` }]);
    });
  }

  if (matchedProducts.length > 0) {
    text += `\n🥤 <b>SẢN PHẨM (${matchedProducts.length}):</b>\n`;
    matchedProducts.slice(0, 4).forEach((p) => {
      totalMatches++;
      text += `  ● <b>${p.name}</b> (${new Intl.NumberFormat("vi-VN").format(p.price)}₫)\n`;
      resultButtons.push([{ text: `🥤 Xem món ${p.name.substring(0, 20)}`, callback_data: `prod:detail:${p.id}` }]);
    });
  }

  if (matchedCoupons.length > 0) {
    text += `\n🎟 <b>MÃ GIẢM GIÁ (${matchedCoupons.length}):</b>\n`;
    matchedCoupons.slice(0, 3).forEach((c) => {
      totalMatches++;
      text += `  ● <b>${c.code}</b> (${c.isActive ? "🟢 Hoạt động" : "🔴 Đã tắt"})\n`;
      resultButtons.push([{ text: `🎟 Xem mã ${c.code}`, callback_data: `cpn:detail:${c.id}` }]);
    });
  }

  if (totalMatches === 0) {
    text += `<i>Không tìm thấy kết quả nào phù hợp với từ khóa "${keyword}".</i>\n`;
  }

  resultButtons.push([{ text: "⬅️ Menu chính", callback_data: "nav:dashboard" }]);

  const markup = { inline_keyboard: resultButtons };
  return await sendTelegramMessage(chatId, text, { reply_markup: markup });
}
