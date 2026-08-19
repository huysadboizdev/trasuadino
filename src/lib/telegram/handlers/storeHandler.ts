import { dataStore } from "../../store";
import { keyboards } from "../keyboards";
import { editTelegramMessageText, sendTelegramMessage } from "../botApi";
import { logTelegramAudit } from "../security";

export async function renderStoreStatus(chatId: string | number, messageId?: number) {
  const settings = dataStore.getSettings();

  const statusBadge = settings.isOpen ? "🟢 ĐANG MỞ CỬA NHẬN ĐƠN" : "🔴 ĐANG TẠM NGHỈ (ĐÓNG CỬA)";
  const sepayStatus = settings.sepayAccountNumber
    ? `✅ Đã kết nối (${settings.sepayBankName} - <code>${settings.sepayAccountNumber}</code>)`
    : "⚠️ Chưa điền STK SePay";

  const text = `🏪 <b>QUẢN TRỊ CỬA HÀNG TRÀ SỮA DINO</b>
━━━━━━━━━━━━━━━━━━━━━
🏪 <b>Tên quán:</b> ${settings.storeName}
📍 <b>Địa chỉ:</b> ${settings.address}
📞 <b>Hotline:</b> <code>${settings.hotline}</code>
⏰ <b>Giờ mở cửa:</b> <code>${settings.openTime}</code> - <code>${settings.closeTime}</code>
💳 <b>Cổng SePay VietQR:</b> ${sepayStatus}

📊 <b>TRẠNG THÁI HIỆN TẠI:</b>
👉 <b>${statusBadge}</b>

<i>Khi đóng cửa hàng, khách hàng truy cập web sẽ nhận được thông báo quán tạm nghỉ và không thể tạo đơn mới.</i>`;

  const markup = keyboards.storeMenu(settings.isOpen);

  if (messageId) {
    const res = await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
    if (res && res.ok) return res;
  }
  return await sendTelegramMessage(chatId, text, { reply_markup: markup });
}

export async function handleConfirmCloseStore(chatId: string | number, messageId: number) {
  const text = `⚠️ <b>XÁC NHẬN TẠM ĐÓNG CỬA HÀNG</b>\n\nBạn có chắc chắn muốn chuyển trạng thái quán sang <b>TẠM NGHỈ</b> không?\n<i>Khách hàng sẽ không thể đặt đơn mới trên website cho đến khi bạn mở lại.</i>`;

  const markup = keyboards.confirmAction("store:exec_close", "nav:store", "🔴 Xác nhận ĐÓNG CỬA");

  return await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
}

export async function handleExecuteCloseStore(
  chatId: string | number,
  messageId: number,
  telegramUserId: string | number
) {
  dataStore.updateSettings({ isOpen: false });

  logTelegramAudit({
    telegramUserId: String(telegramUserId),
    action: "STORE_CLOSED",
    resource: "STORE",
    result: "SUCCESS",
  });

  return await renderStoreStatus(chatId, messageId);
}

export async function handleExecuteOpenStore(
  chatId: string | number,
  messageId: number,
  telegramUserId: string | number
) {
  dataStore.updateSettings({ isOpen: true });

  logTelegramAudit({
    telegramUserId: String(telegramUserId),
    action: "STORE_OPENED",
    resource: "STORE",
    result: "SUCCESS",
  });

  return await renderStoreStatus(chatId, messageId);
}
