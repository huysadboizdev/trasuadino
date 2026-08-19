import { dataStore } from "../../store";
import { keyboards } from "../keyboards";
import { editTelegramMessageText, sendTelegramMessage } from "../botApi";

const PAGE_SIZE = 6;

export async function renderUsersList(chatId: string | number, messageId?: number, page: number = 1) {
  const users = dataStore.getUsers();
  const totalUsers = users.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageUsers = users.slice(startIndex, startIndex + PAGE_SIZE);

  let text = `👥 <b>QUẢN LÝ KHÁCH HÀNG & TÀI KHOẢN</b>\n`;
  text += `Tổng số: <b>${totalUsers}</b> tài khoản · Trang: <b>${currentPage}/${totalPages}</b>\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;

  const userButtons: { text: string; callback_data: string }[][] = [];

  pageUsers.forEach((u, idx) => {
    const roleIcon = u.role === "ADMIN" ? "👑 [ADMIN]" : u.role === "STAFF" ? "🧑‍🍳 [STAFF]" : "👤";
    text += `${startIndex + idx + 1}. <b>${u.name}</b> ${roleIcon}\n`;
    text += `   📧 <i>${u.email || "Chưa có email"}</i> · 📞 <code>${u.phone || "Chưa có SĐT"}</code>\n`;

    userButtons.push([
      {
        text: `👤 ${u.name} (${u.role})`,
        callback_data: `user:detail:${u.id}`,
      },
    ]);
  });

  const paginationRow: { text: string; callback_data: string }[] = [];
  if (totalPages > 1) {
    const prevPage = Math.max(1, currentPage - 1);
    const nextPage = Math.min(totalPages, currentPage + 1);
    paginationRow.push(
      { text: "⬅️ Trước", callback_data: `nav:users:${prevPage}` },
      { text: `${currentPage}/${totalPages}`, callback_data: "noop" },
      { text: "Sau ➡️", callback_data: `nav:users:${nextPage}` }
    );
  }

  const rows = [
    ...userButtons,
    ...(paginationRow.length ? [paginationRow] : []),
    [{ text: "⬅️ Menu chính", callback_data: "nav:dashboard" }],
  ];

  const markup = { inline_keyboard: rows };

  if (messageId) {
    const res = await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
    if (res && res.ok) return res;
  }
  return await sendTelegramMessage(chatId, text, { reply_markup: markup });
}

export async function renderUserDetail(
  chatId: string | number,
  messageId: number | undefined,
  userId: string
) {
  const user = dataStore.findUserById(userId);
  if (!user) {
    const errorText = `❌ <b>Không tìm thấy thông tin người dùng "${userId}"</b>.`;
    if (messageId) return await editTelegramMessageText(chatId, messageId, errorText, { reply_markup: keyboards.backToDashboard() });
    return await sendTelegramMessage(chatId, errorText, { reply_markup: keyboards.backToDashboard() });
  }

  // Lấy danh sách đơn của user này
  const orders = dataStore.getOrders(undefined, user.email);
  const totalSpent = orders
    .filter((o) => o.paymentStatus === "PAID" && o.orderStatus !== "CANCELLED")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const spentStr = new Intl.NumberFormat("vi-VN").format(totalSpent);
  const createdDate = new Date(user.createdAt).toLocaleDateString("vi-VN");

  const text = `👤 <b>HỒ SƠ KHÁCH HÀNG</b>
━━━━━━━━━━━━━━━━━━━━━
👤 <b>Họ tên:</b> <b>${user.name}</b>
🔑 <b>Vai trò:</b> <code>${user.role}</code>
📧 <b>Email:</b> <code>${user.email || "Chưa cập nhật"}</code>
📞 <b>Số điện thoại:</b> <code>${user.phone || "Chưa cập nhật"}</code>
📍 <b>Địa chỉ mặc định:</b> ${user.address || "Chưa có"}
📅 <b>Ngày đăng ký:</b> ${createdDate}
━━━━━━━━━━━━━━━━━━━━━
📦 <b>Tổng số đơn:</b> <b>${orders.length}</b> đơn
💰 <b>Tổng chi tiêu:</b> <code>${spentStr} ₫</code>`;

  const markup = {
    inline_keyboard: [
      [{ text: "⬅️ Quay lại danh sách", callback_data: "nav:users:1" }],
    ],
  };

  if (messageId) {
    const res = await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
    if (res && res.ok) return res;
  }
  return await sendTelegramMessage(chatId, text, { reply_markup: markup });
}
