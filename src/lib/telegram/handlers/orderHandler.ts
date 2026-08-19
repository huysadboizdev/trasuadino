import { dataStore } from "../../store";
import { keyboards } from "../keyboards";
import { editTelegramMessageText, sendTelegramMessage } from "../botApi";
import { logTelegramAudit } from "../security";
import { OrderStatus } from "../../types";

const PAGE_SIZE = 6;

function getStatusBadge(status: OrderStatus): string {
  switch (status) {
    case "NEW":
      return "🔴 MỚI";
    case "PREPARING":
      return "🟡 ĐANG PHA";
    case "DELIVERING":
      return "🚚 ĐANG GIAO";
    case "COMPLETED":
      return "✅ HOÀN THÀNH";
    case "CANCELLED":
      return "❌ ĐÃ HỦY";
    default:
      return status;
  }
}

export async function renderOrdersList(
  chatId: string | number,
  messageId: number | undefined,
  filter: string = "ALL",
  page: number = 1
) {
  const allOrders = dataStore.getOrders(filter === "ALL" ? undefined : filter);
  const totalOrders = allOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalOrders / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageOrders = allOrders.slice(startIndex, startIndex + PAGE_SIZE);

  let filterTitle = "TẤT CẢ ĐƠN HÀNG";
  if (filter === "NEW") filterTitle = "ĐƠN HÀNG MỚI (CHỜ NHẬN)";
  else if (filter === "PREPARING") filterTitle = "ĐƠN ĐANG PHA CHẾ";
  else if (filter === "DELIVERING") filterTitle = "ĐƠN ĐANG GIAO HÀNG";
  else if (filter === "COMPLETED") filterTitle = "ĐƠN ĐÃ HOÀN THÀNH";

  let text = `📦 <b>QUẢN LÝ ĐƠN HÀNG</b> (${filterTitle})\n`;
  text += `Tổng số: <b>${totalOrders}</b> đơn · Trang: <b>${currentPage}/${totalPages}</b>\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;

  if (pageOrders.length === 0) {
    text += `<i>Không có đơn hàng nào trong mục này.</i>\n`;
  } else {
    pageOrders.forEach((o, index) => {
      const amountStr = new Intl.NumberFormat("vi-VN").format(o.totalAmount);
      const timeStr = new Date(o.createdAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      text += `${startIndex + index + 1}. <b>${o.orderCode}</b> · ${amountStr}₫ · ${getStatusBadge(o.orderStatus)} (<i>${timeStr}</i>)\n`;
      text += `   👤 <i>${o.customerName} (${o.customerPhone})</i>\n`;
    });
  }

  // Generate order buttons (2 buttons per row)
  const orderButtons: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < pageOrders.length; i += 2) {
    const row = [
      {
        text: `📦 ${pageOrders[i].orderCode}`,
        callback_data: `order:detail:${pageOrders[i].id}`,
      },
    ];
    if (pageOrders[i + 1]) {
      row.push({
        text: `📦 ${pageOrders[i + 1].orderCode}`,
        callback_data: `order:detail:${pageOrders[i + 1].id}`,
      });
    }
    orderButtons.push(row);
  }

  const baseMarkup = keyboards.ordersMenu(filter, currentPage, totalPages);
  // Insert order buttons right before navigation/control rows
  const fullKeyboard = [
    ...baseMarkup.inline_keyboard.slice(0, 2),
    ...orderButtons,
    ...baseMarkup.inline_keyboard.slice(2),
  ];

  const markup = { inline_keyboard: fullKeyboard };

  if (messageId) {
    const res = await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
    if (res && res.ok) return res;
  }
  return await sendTelegramMessage(chatId, text, { reply_markup: markup });
}

export async function renderOrderDetail(
  chatId: string | number,
  messageId: number | undefined,
  orderId: string
) {
  const order = dataStore.getOrderById(orderId);
  if (!order) {
    const errorText = `❌ <b>Không tìm thấy đơn hàng mã "${orderId}"</b>.`;
    if (messageId) return await editTelegramMessageText(chatId, messageId, errorText, { reply_markup: keyboards.backToDashboard() });
    return await sendTelegramMessage(chatId, errorText, { reply_markup: keyboards.backToDashboard() });
  }

  const amountStr = new Intl.NumberFormat("vi-VN").format(order.totalAmount);
  const createdDate = new Date(order.createdAt).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const paymentMethodLabel =
    order.paymentMethod === "SEPAY_QR"
      ? "Chuyển khoản SePay VietQR"
      : order.paymentMethod === "COD"
      ? "Tiền mặt (COD)"
      : "MoMo";

  const paymentStatusBadge =
    order.paymentStatus === "PAID"
      ? "✅ ĐÃ THANH TOÁN"
      : order.paymentStatus === "PENDING"
      ? "⏳ CHƯA THANH TOÁN"
      : "❌ ĐÃ HỦY";

  let itemsText = "";
  order.items.forEach((it, idx) => {
    const itemTotal = new Intl.NumberFormat("vi-VN").format(it.totalPrice);
    itemsText += `${idx + 1}. <b>${it.productName}</b> × <b>${it.quantity}</b> (${itemTotal}₫)\n`;
    if (it.optionsNote) {
      itemsText += `   <i>↳ ${it.optionsNote}</i>\n`;
    }
  });

  let voucherInfo = "";
  if (order.couponCode) {
    const discountStr = new Intl.NumberFormat("vi-VN").format(order.discountAmount || 0);
    voucherInfo = `🎟 <b>Mã giảm giá:</b> <code>${order.couponCode}</code> (-${discountStr}₫)\n`;
  }

  const text = `📦 <b>CHI TIẾT ĐƠN HÀNG #${order.orderCode}</b>
━━━━━━━━━━━━━━━━━━━━━
👤 <b>Khách hàng:</b> ${order.customerName}
📞 <b>Số điện thoại:</b> <code>${order.customerPhone}</code>
📍 <b>Địa chỉ:</b> ${order.deliveryAddress}
${order.note ? `📝 <b>Ghi chú:</b> <i>${order.note}</i>\n` : ""}
📋 <b>DANH SÁCH MÓN:</b>
${itemsText}
━━━━━━━━━━━━━━━━━━━━━
${voucherInfo}💰 <b>TỔNG TIỀN:</b> <code>${amountStr} ₫</code>
💳 <b>Phương thức:</b> ${paymentMethodLabel}
📊 <b>Thanh toán:</b> ${paymentStatusBadge}
🕐 <b>Thời gian đặt:</b> ${createdDate}
📌 <b>Trạng thái đơn:</b> ${getStatusBadge(order.orderStatus)}`;

  const markup = keyboards.orderDetail(order.id, order.orderStatus, order.customerPhone);

  if (messageId) {
    const res = await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
    if (res && res.ok) return res;
  }
  return await sendTelegramMessage(chatId, text, { reply_markup: markup });
}

export async function handleOrderStatusUpdate(
  chatId: string | number,
  messageId: number,
  orderId: string,
  newStatus: OrderStatus,
  telegramUserId: string | number
) {
  const updatedOrder = dataStore.updateOrderStatus(orderId, newStatus);
  if (!updatedOrder) {
    return await editTelegramMessageText(
      chatId,
      messageId,
      "❌ <i>Không thể cập nhật trạng thái đơn. Đơn có thể đã bị xóa.</i>",
      { reply_markup: keyboards.backToDashboard() }
    );
  }

  logTelegramAudit({
    telegramUserId: String(telegramUserId),
    action: `UPDATE_ORDER_STATUS_${newStatus}`,
    resource: "ORDER",
    resourceId: updatedOrder.orderCode,
    details: { newStatus },
    result: "SUCCESS",
  });

  // Re-render chi tiết đơn đã cập nhật
  return await renderOrderDetail(chatId, messageId, updatedOrder.id);
}

export async function handleConfirmCancelOrder(
  chatId: string | number,
  messageId: number,
  orderId: string
) {
  const order = dataStore.getOrderById(orderId);
  if (!order) return;

  const text = `⚠️ <b>XÁC NHẬN HỦY ĐƠN HÀNG #${order.orderCode}</b>\n\nBạn có chắc chắn muốn hủy đơn hàng của <b>${order.customerName}</b> không?\n<i>Hành động này sẽ hoàn lại số lượt sử dụng voucher (nếu có).</i>`;

  const markup = keyboards.confirmAction(
    `order:exec_cancel:${orderId}`,
    `order:detail:${orderId}`,
    "❌ Xác nhận HỦY ĐƠN"
  );

  return await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
}

export async function handleExecuteCancelOrder(
  chatId: string | number,
  messageId: number,
  orderId: string,
  telegramUserId: string | number
) {
  const updatedOrder = dataStore.updateOrderStatus(orderId, "CANCELLED");
  if (!updatedOrder) return;

  logTelegramAudit({
    telegramUserId: String(telegramUserId),
    action: "CANCEL_ORDER",
    resource: "ORDER",
    resourceId: updatedOrder.orderCode,
    result: "SUCCESS",
  });

  return await renderOrderDetail(chatId, messageId, updatedOrder.id);
}
