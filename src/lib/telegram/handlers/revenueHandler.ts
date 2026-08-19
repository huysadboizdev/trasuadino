import { dataStore } from "../../store";
import { keyboards } from "../keyboards";
import { editTelegramMessageText, sendTelegramMessage } from "../botApi";

export async function renderRevenueReport(
  chatId: string | number,
  messageId: number | undefined,
  period: "today" | "7days" | "30days" | "month" = "today"
) {
  const allOrders = dataStore.getOrders();
  const now = new Date();

  let filteredOrders = allOrders;
  let title = "HÔM NAY";

  if (period === "today") {
    const todayStr = now.toDateString();
    filteredOrders = allOrders.filter((o) => new Date(o.createdAt).toDateString() === todayStr);
    title = `HÔM NAY (${now.toLocaleDateString("vi-VN")})`;
  } else if (period === "7days") {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    filteredOrders = allOrders.filter((o) => new Date(o.createdAt) >= sevenDaysAgo);
    title = "7 NGÀY GẦN NHẤT";
  } else if (period === "30days") {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    filteredOrders = allOrders.filter((o) => new Date(o.createdAt) >= thirtyDaysAgo);
    title = "30 NGÀY GẦN NHẤT";
  } else if (period === "month") {
    filteredOrders = allOrders.filter(
      (o) =>
        new Date(o.createdAt).getMonth() === now.getMonth() &&
        new Date(o.createdAt).getFullYear() === now.getFullYear()
    );
    title = `THÁNG ${now.getMonth() + 1}/${now.getFullYear()}`;
  }

  const completedOrders = filteredOrders.filter(
    (o) => o.orderStatus === "COMPLETED"
  );
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const revenueFormatted = new Intl.NumberFormat("vi-VN").format(totalRevenue);

  const pendingCount = filteredOrders.filter((o) => o.orderStatus === "NEW" || o.orderStatus === "PREPARING").length;
  const deliveringCount = filteredOrders.filter((o) => o.orderStatus === "DELIVERING").length;
  const completedCount = filteredOrders.filter((o) => o.orderStatus === "COMPLETED").length;
  const cancelledCount = filteredOrders.filter((o) => o.orderStatus === "CANCELLED").length;

  // Tính các món bán chạy nhất trong khoảng thời gian này
  const itemCounts: Record<string, number> = {};
  completedOrders.forEach((o) => {
    o.items?.forEach((it) => {
      itemCounts[it.productName] = (itemCounts[it.productName] || 0) + it.quantity;
    });
  });

  const sortedTopItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  let topItemsText = "";
  if (sortedTopItems.length > 0) {
    topItemsText += `\n🔥 <b>Top món bán chạy:</b>\n`;
    sortedTopItems.forEach(([name, count], idx) => {
      topItemsText += `  ${idx + 1}. <b>${name}</b>: <b>${count}</b> ly\n`;
    });
  }

  const text = `📊 <b>BÁO CÁO DOANH THU & HIỆU SUẤT QUÁN</b>
━━━━━━━━━━━━━━━━━━━━━
📅 <b>Kỳ báo cáo:</b> <b>${title}</b>

💰 <b>Doanh thu thực thu:</b> <code>${revenueFormatted} ₫</code>
📦 <b>Tổng số đơn hàng:</b> <b>${filteredOrders.length}</b> đơn

📈 <b>Phân bổ trạng thái:</b>
  ● 🟡 Đang xử lý: <b>${pendingCount}</b> đơn
  ● 🔵 Đang giao: <b>${deliveringCount}</b> đơn
  ● 🟢 Đã hoàn thành: <b>${completedCount}</b> đơn
  ● ❌ Đã hủy: <b>${cancelledCount}</b> đơn${topItemsText}
━━━━━━━━━━━━━━━━━━━━━
<i>Bấm chọn kỳ báo cáo khác bên dưới:</i>`;

  const markup = keyboards.revenueMenu(period);

  if (messageId) {
    const res = await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
    if (res && res.ok) return res;
  }
  return await sendTelegramMessage(chatId, text, { reply_markup: markup });
}
