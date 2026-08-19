import { getTelegramAdminIds, sendTelegramMessage } from "./botApi";
import { Order } from "../types";
import { buildOrderKeyboard } from "./keyboards";

export function buildOrderMessage(order: Order): string {
  const amountStr = new Intl.NumberFormat("vi-VN").format(order.totalAmount);
  const paymentMethodLabel =
    order.paymentMethod === "SEPAY_QR"
      ? "Chuyển khoản SePay VietQR"
      : order.paymentMethod === "COD"
      ? "Tiền mặt (COD)"
      : "MoMo";

  let itemsList = "";
  order.items.forEach((it, idx) => {
    const itemTotal = new Intl.NumberFormat("vi-VN").format(it.totalPrice);
    itemsList += `  ${idx + 1}. <b>${it.productName}</b> × <b>${it.quantity}</b> (${itemTotal}₫)\n`;
    if (it.optionsNote) {
      itemsList += `     <i>↳ ${it.optionsNote}</i>\n`;
    }
  });

  let voucherInfo = "";
  if (order.couponCode) {
    const discountStr = new Intl.NumberFormat("vi-VN").format(order.discountAmount || 0);
    voucherInfo = `🎟 <b>Voucher:</b> <code>${order.couponCode}</code> (-${discountStr}₫)\n`;
  }

  let statusLine = "🟡 <b>Trạng thái:</b> MỚI NHẬN";
  if (order.orderStatus === "PREPARING") {
    statusLine = "🟠 <b>Trạng thái:</b> ĐANG PHA CHẾ";
  } else if (order.orderStatus === "DELIVERING") {
    statusLine = "🔵 <b>Trạng thái:</b> ĐANG GIAO";
  } else if (order.orderStatus === "COMPLETED") {
    statusLine = "🟢 <b>Trạng thái:</b> HOÀN TẤT";
  } else if (order.orderStatus === "CANCELLED") {
    statusLine = "🔴 <b>Trạng thái:</b> ĐÃ HỦY";
  }

  return `🦖 <b>ĐƠN HÀNG #${order.orderCode}</b>
━━━━━━━━━━━━━━━━━━━━━
👤 <b>Khách:</b> ${order.customerName || "Khách"}
📞 <b>SĐT:</b> <code>${order.customerPhone}</code>
📍 <b>Địa chỉ:</b> ${order.deliveryAddress}
${order.note ? `📝 <b>Ghi chú:</b> <i>${order.note}</i>\n` : ""}
🥤 <b>DANH SÁCH MÓN:</b>
${itemsList}━━━━━━━━━━━━━━━━━━━━━
${voucherInfo}💰 <b>Tổng:</b> <code>${amountStr} ₫</code>
💵 <b>Thanh toán:</b> ${paymentMethodLabel}
${statusLine}`;
}

export async function notifyTelegramNewOrder(order: Order) {
  const adminIds = getTelegramAdminIds();
  if (adminIds.length === 0) return;

  const text = buildOrderMessage(order);
  const markup = buildOrderKeyboard(order);

  for (const chatId of adminIds) {
    await sendTelegramMessage(chatId, text, { reply_markup: markup });
  }
}

export async function notifyTelegramPaymentSuccess(order: Order, amount: number) {
  const adminIds = getTelegramAdminIds();
  if (adminIds.length === 0) return;

  const amountStr = new Intl.NumberFormat("vi-VN").format(amount);

  const text = `💳 <b>XÁC NHẬN THANH TOÁN THÀNH CÔNG</b>
━━━━━━━━━━━━━━━━━━━━━
📦 <b>Mã đơn hàng:</b> <code>#${order.orderCode}</code>
👤 <b>Khách hàng:</b> ${order.customerName} (<code>${order.customerPhone}</code>)
💰 <b>Số tiền chuyển khoản:</b> <code>${amountStr} ₫</code>
🏦 <b>Cổng thanh toán:</b> SePay VietQR Auto

✅ Đơn hàng đã tự động chuyển sang trạng thái <b>ĐÃ THANH TOÁN (PAID)</b>.`;

  const markup = {
    inline_keyboard: [[{ text: "📦 Mở chi tiết đơn hàng", callback_data: `order:detail:${order.id}` }]],
  };

  for (const chatId of adminIds) {
    await sendTelegramMessage(chatId, text, { reply_markup: markup });
  }
}
