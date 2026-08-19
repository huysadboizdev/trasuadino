import { getTelegramAdminIds, sendTelegramMessage } from "./botApi";
import { Order } from "../types";

export async function notifyTelegramNewOrder(order: Order) {
  const adminIds = getTelegramAdminIds();
  if (adminIds.length === 0) return;

  const amountStr = new Intl.NumberFormat("vi-VN").format(order.totalAmount);
  const paymentMethodLabel =
    order.paymentMethod === "SEPAY_QR"
      ? "Chuyển khoản SePay VietQR"
      : order.paymentMethod === "COD"
      ? "Tiền mặt (COD)"
      : "MoMo";

  const paymentStatusBadge =
    order.paymentStatus === "PAID" ? "✅ ĐÃ THANH TOÁN" : "⏳ CHƯA THANH TOÁN (COD)";

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

  const customerBadge = !order.userId || order.isGuest ? "🟢 <b>Loại khách:</b> KHÁCH VÃNG LAI\n" : "🔵 <b>Loại khách:</b> THÀNH VIÊN\n";

  const text = `🚨 <b>ĐƠN HÀNG MỚI #${order.orderCode}</b>
━━━━━━━━━━━━━━━━━━━━━
👤 <b>Khách hàng:</b> ${order.customerName}
${customerBadge}📞 <b>SĐT:</b> <code>${order.customerPhone}</code>
📍 <b>Giao đến:</b> ${order.deliveryAddress}
${order.note ? `📝 <b>Ghi chú:</b> <i>${order.note}</i>\n` : ""}
📋 <b>DANH SÁCH MÓN:</b>
${itemsList}━━━━━━━━━━━━━━━━━━━━━
${voucherInfo}💰 <b>TỔNG TIỀN:</b> <code>${amountStr} ₫</code>
💵 <b>Hình thức:</b> ${paymentMethodLabel}
🟡 <b>Trạng thái:</b> MỚI NHẬN`;

  const markup = {
    inline_keyboard: [
      [
        { text: "👨‍🍳 NHẬN ĐƠN & PHA CHẾ", callback_data: `order:status:${order.id}:PREPARING` },
        { text: "🚚 BẮT ĐẦU GIAO", callback_data: `order:status:${order.id}:DELIVERING` },
      ],
      [
        { text: "❌ HỦY ĐƠN", callback_data: `order:confirm_cancel:${order.id}` },
        { text: "🔍 Xem chi tiết", callback_data: `order:detail:${order.id}` },
      ],
    ],
  };

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
