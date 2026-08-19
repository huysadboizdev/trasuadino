import { orderService } from "../../orderService";
import { dataStore } from "../../store";
import { keyboards, buildOrderKeyboard } from "../keyboards";
import { buildOrderMessage } from "../notifications";
import { editTelegramMessageText, sendTelegramMessage, answerTelegramCallbackQuery } from "../botApi";
import { logTelegramAudit } from "../security";
import { OrderStatus } from "../../types";

const PAGE_SIZE = 6;

function getStatusBadge(status: OrderStatus): string {
  switch (status) {
    case "NEW":
      return "🟡 MỚI NHẬN";
    case "PREPARING":
      return "🟠 ĐANG PHA CHẾ";
    case "DELIVERING":
      return "🔵 ĐANG GIAO";
    case "COMPLETED":
      return "🟢 HOÀN TẤT";
    case "CANCELLED":
      return "❌ ĐÃ HỦY";
    default:
      return status;
  }
}

const statusNameMap: Record<OrderStatus, string> = {
  NEW: "MỚI NHẬN",
  PREPARING: "ĐANG PHA CHẾ",
  DELIVERING: "ĐANG GIAO",
  COMPLETED: "HOÀN TẤT",
  CANCELLED: "ĐÃ HỦY",
};

export async function renderOrdersList(
  chatId: string | number,
  messageId: number | undefined,
  filter: string = "ALL",
  page: number = 1
) {
  const allOrders = orderService.getOrders(filter === "ALL" ? undefined : filter);
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
      text += `   👤 <i>${o.customerName || "Khách"} (${o.customerPhone})</i>\n`;
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
  const order = orderService.getOrderById(orderId);
  if (!order) {
    const errorText = `❌ <b>Đơn hàng "${orderId}" không còn tồn tại trong hệ thống.</b>`;
    if (messageId) return await editTelegramMessageText(chatId, messageId, errorText, { reply_markup: keyboards.backToDashboard() });
    return await sendTelegramMessage(chatId, errorText, { reply_markup: keyboards.backToDashboard() });
  }

  const text = buildOrderMessage(order);
  const markup = buildOrderKeyboard(order);

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
  telegramUserId: string | number,
  callbackQueryId?: string
) {
  console.log(
    `[Telegram Order Status Update] orderId="${orderId}", targetStatus="${newStatus}", adminId=${telegramUserId}`
  );

  const result = orderService.updateStatus(orderId, newStatus, {
    source: "TELEGRAM_ADMIN",
    id: telegramUserId,
  });

  if (!result.success) {
    if (callbackQueryId) {
      if (result.reason === "NOT_FOUND") {
        await answerTelegramCallbackQuery(callbackQueryId, `❌ Đơn hàng #${orderId} không còn tồn tại`, true);
      } else {
        await answerTelegramCallbackQuery(callbackQueryId, `❌ Lỗi: ${result.message}`, true);
      }
    }

    return await editTelegramMessageText(
      chatId,
      messageId,
      `❌ <b>${result.message}</b>\n<i>Vui lòng kiểm tra lại trạng thái đơn.</i>`,
      { reply_markup: keyboards.backToDashboard() }
    );
  }

  const targetOrder = result.order!;
  const statusLabel = statusNameMap[newStatus] || newStatus;

  if (callbackQueryId) {
    if (result.isUnchanged) {
      await answerTelegramCallbackQuery(
        callbackQueryId,
        `ℹ️ Đơn #${targetOrder.orderCode} đã ở trạng thái ${statusLabel}`
      );
    } else {
      await answerTelegramCallbackQuery(
        callbackQueryId,
        `✅ Đã chuyển đơn #${targetOrder.orderCode} sang: ${statusLabel}`
      );
    }
  }

  logTelegramAudit({
    telegramUserId: String(telegramUserId),
    action: `UPDATE_ORDER_STATUS_${newStatus}`,
    resource: "ORDER",
    resourceId: targetOrder.orderCode,
    details: { newStatus, previousStatus: result.previousStatus },
    result: "SUCCESS",
  });

  // Edit chính message cũ (sửa nội dung và cập nhật inline keyboard tương ứng)
  const text = buildOrderMessage(targetOrder);
  const markup = buildOrderKeyboard(targetOrder);
  return await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
}

export async function handleConfirmCancelOrder(
  chatId: string | number,
  messageId: number,
  orderId: string
) {
  const order = orderService.getOrderById(orderId);
  if (!order) return;

  const text = `⚠️ <b>XÁC NHẬN HỦY ĐƠN HÀNG #${order.orderCode}</b>\n\nBạn có chắc chắn muốn hủy đơn hàng của <b>${order.customerName || "Khách"}</b> không?\n<i>Hành động này sẽ hoàn lại số lượt sử dụng voucher (nếu có).</i>`;

  const markup = {
    inline_keyboard: [
      [
        { text: "❌ Xác nhận HỦY ĐƠN", callback_data: `order:exec_cancel:${order.id}` },
        { text: "⬅️ Quay lại", callback_data: `order:detail:${order.id}` },
      ],
    ],
  };

  return await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
}

export async function handleExecuteCancelOrder(
  chatId: string | number,
  messageId: number,
  orderId: string,
  telegramUserId: string | number,
  callbackQueryId?: string
) {
  const result = orderService.updateStatus(orderId, "CANCELLED", {
    source: "TELEGRAM_ADMIN",
    id: telegramUserId,
  });

  if (!result.success) {
    if (callbackQueryId) {
      await answerTelegramCallbackQuery(callbackQueryId, `❌ ${result.message}`, true);
    }
    return;
  }

  if (callbackQueryId) {
    await answerTelegramCallbackQuery(callbackQueryId, `✅ Đã hủy đơn #${result.order!.orderCode}`);
  }

  logTelegramAudit({
    telegramUserId: String(telegramUserId),
    action: "CANCEL_ORDER",
    resource: "ORDER",
    resourceId: result.order!.orderCode,
    result: "SUCCESS",
  });

  const cancelledOrder = result.order!;
  const text = buildOrderMessage(cancelledOrder);
  const markup = buildOrderKeyboard(cancelledOrder);
  return await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
}
