import { dataStore } from "../../store";
import { keyboards } from "../keyboards";
import { editTelegramMessageText, sendTelegramMessage } from "../botApi";
import { logTelegramAudit } from "../security";
import { getConversationSession, setConversationSession, clearConversationSession } from "../session";
import { DiscountType } from "../../types";

export async function renderCouponsList(chatId: string | number, messageId?: number) {
  const coupons = dataStore.getCoupons();
  const activeCount = coupons.filter((c) => c.isActive).length;

  let text = `🎟 <b>QUẢN LÝ MÃ GIẢM GIÁ (VOUCHER)</b>\n`;
  text += `Tổng: <b>${coupons.length}</b> mã · 🟢 <b>${activeCount}</b> đang hoạt động\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;

  const couponButtons: { text: string; callback_data: string }[][] = [];

  if (coupons.length === 0) {
    text += `<i>Chưa có mã giảm giá nào trên hệ thống.</i>\n`;
  } else {
    coupons.forEach((c, idx) => {
      const statusIcon = c.isActive ? "🟢" : "🔴 [TẮT]";
      let valueStr = `${c.discountValue}%`;
      if (c.discountType === "FIXED_AMOUNT") {
        valueStr = `${new Intl.NumberFormat("vi-VN").format(c.discountValue)}₫`;
      }
      text += `${idx + 1}. <b>${c.code}</b> (Giảm: <b>${valueStr}</b>) · ${statusIcon}\n`;
      text += `   👥 Đã dùng: <b>${c.usageCount}</b>/${c.usageLimit || "∞"}\n`;

      couponButtons.push([
        {
          text: `🎟 ${c.code} (${valueStr}) ${statusIcon}`,
          callback_data: `cpn:detail:${c.id}`,
        },
      ]);
    });
  }

  const markup = keyboards.couponsMenu(couponButtons);

  if (messageId) {
    const res = await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
    if (res && res.ok) return res;
  }
  return await sendTelegramMessage(chatId, text, { reply_markup: markup });
}

export async function renderCouponDetail(
  chatId: string | number,
  messageId: number | undefined,
  couponId: string
) {
  const coupon = dataStore.getCouponById(couponId);
  if (!coupon) {
    const errorText = `❌ <b>Không tìm thấy mã giảm giá "${couponId}"</b>.`;
    if (messageId) return await editTelegramMessageText(chatId, messageId, errorText, { reply_markup: keyboards.backToDashboard() });
    return await sendTelegramMessage(chatId, errorText, { reply_markup: keyboards.backToDashboard() });
  }

  let valueDisplay = `${coupon.discountValue}%`;
  if (coupon.discountType === "FIXED_AMOUNT") {
    valueDisplay = `${new Intl.NumberFormat("vi-VN").format(coupon.discountValue)} ₫`;
  }

  const minOrderStr = coupon.minOrderAmount
    ? `${new Intl.NumberFormat("vi-VN").format(coupon.minOrderAmount)} ₫`
    : "Không yêu cầu (0₫)";

  const maxDiscountStr = coupon.maxDiscountAmount
    ? `${new Intl.NumberFormat("vi-VN").format(coupon.maxDiscountAmount)} ₫`
    : "Không giới hạn";

  const statusBadge = coupon.isActive ? "🟢 ĐANG HOẠT ĐỘNG" : "🔴 ĐÃ TẮT";

  const text = `🎟 <b>CHI TIẾT MÃ GIẢM GIÁ</b>
━━━━━━━━━━━━━━━━━━━━━
🏷 <b>Mã Coupon:</b> <code>${coupon.code}</code>
🎁 <b>Mức giảm:</b> <b>${valueDisplay}</b>
🛒 <b>Đơn tối thiểu:</b> ${minOrderStr}
⛔ <b>Giảm tối đa:</b> ${maxDiscountStr}
👥 <b>Lượt sử dụng:</b> <b>${coupon.usageCount}</b> / <b>${coupon.usageLimit || "Không giới hạn"}</b>
📊 <b>Trạng thái:</b> ${statusBadge}
${coupon.description ? `📝 <b>Mô tả:</b> <i>${coupon.description}</i>\n` : ""}
<i>Bấm các nút bên dưới để điều chỉnh mã:</i>`;

  const markup = keyboards.couponDetail(coupon.id, coupon.isActive);

  if (messageId) {
    const res = await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
    if (res && res.ok) return res;
  }
  return await sendTelegramMessage(chatId, text, { reply_markup: markup });
}

export async function handleToggleCoupon(
  chatId: string | number,
  messageId: number,
  couponId: string,
  telegramUserId: string | number
) {
  const cpn = dataStore.toggleCoupon(couponId);
  if (!cpn) return;

  logTelegramAudit({
    telegramUserId: String(telegramUserId),
    action: "TOGGLE_COUPON_STATUS",
    resource: "COUPON",
    resourceId: cpn.code,
    details: { isActive: cpn.isActive },
    result: "SUCCESS",
  });

  return await renderCouponDetail(chatId, messageId, cpn.id);
}

export async function handleConfirmDeleteCoupon(
  chatId: string | number,
  messageId: number,
  couponId: string
) {
  const cpn = dataStore.getCouponById(couponId);
  if (!cpn) return;

  const text = `⚠️ <b>XÁC NHẬN XÓA MÃ GIẢM GIÁ</b>\n\nBạn có chắc chắn muốn xóa vĩnh viễn mã <b>"${cpn.code}"</b> không?\n<i>Hành động này không thể hoàn tác.</i>`;

  const markup = keyboards.confirmAction(
    `cpn:exec_delete:${couponId}`,
    `cpn:detail:${couponId}`,
    "🗑 Xác nhận XÓA VOUCHER"
  );

  return await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
}

export async function handleExecuteDeleteCoupon(
  chatId: string | number,
  messageId: number,
  couponId: string,
  telegramUserId: string | number
) {
  const removed = dataStore.deleteCoupon(couponId);
  if (!removed) return;

  logTelegramAudit({
    telegramUserId: String(telegramUserId),
    action: "DELETE_COUPON",
    resource: "COUPON",
    resourceId: removed.code,
    result: "SUCCESS",
  });

  const text = `✅ <b>Đã xóa mã voucher "${removed.code}" thành công!</b>`;
  return await editTelegramMessageText(chatId, messageId, text, {
    reply_markup: {
      inline_keyboard: [[{ text: "⬅️ Danh sách mã giảm giá", callback_data: "nav:coupons:1" }]],
    },
  });
}

// --- CREATE COUPON WIZARD ---
export async function startCreateCouponWizard(chatId: string | number, telegramUserId: string | number) {
  setConversationSession(telegramUserId, {
    flow: "CREATE_COUPON",
    createCouponData: { step: "CODE" },
  });

  const text = `➕ <b>TẠO MÃ GIẢM GIÁ (BƯỚC 1/5)</b>\n\nVui lòng nhập <b>MÃ VOUCHER</b>:\n<i>(Ví dụ: DINO50K, TET2026, FREESHIP)</i>`;
  return await sendTelegramMessage(chatId, text, { reply_markup: keyboards.wizardCancel() });
}

export async function handleCreateCouponInput(
  chatId: string | number,
  telegramUserId: string | number,
  input: string
) {
  const session = getConversationSession(telegramUserId);
  const data = session.createCouponData || { step: "CODE" };

  if (data.step === "CODE") {
    const code = input.toUpperCase().trim().replace(/\s+/g, "");
    if (!code) return;

    data.code = code;
    data.step = "TYPE";
    setConversationSession(telegramUserId, { createCouponData: data });

    const text = `➕ <b>TẠO MÃ GIẢM GIÁ (BƯỚC 2/5)</b>\n\nMã: <code>${data.code}</code>\n\nVui lòng chọn <b>Loại giảm giá</b>:`;
    const markup = {
      inline_keyboard: [
        [
          { text: "📊 Theo phần trăm (%)", callback_data: "wizard:cpn_type:PERCENT" },
          { text: "💵 Số tiền cố định (VNĐ)", callback_data: "wizard:cpn_type:FIXED_AMOUNT" },
        ],
        [{ text: "❌ Hủy thao tác", callback_data: "wizard:cancel" }],
      ],
    };
    return await sendTelegramMessage(chatId, text, { reply_markup: markup });
  }

  if (data.step === "VALUE") {
    const val = Number(input.replace(/\D/g, ""));
    if (isNaN(val) || val <= 0) {
      return await sendTelegramMessage(chatId, "⚠️ <i>Giá trị giảm phải lớn hơn 0. Vui lòng nhập lại:</i>", {
        reply_markup: keyboards.wizardCancel(),
      });
    }

    if (data.discountType === "PERCENT" && val > 100) {
      return await sendTelegramMessage(chatId, "⚠️ <i>Phần trăm giảm không được vượt quá 100%. Vui lòng nhập lại:</i>", {
        reply_markup: keyboards.wizardCancel(),
      });
    }

    data.discountValue = val;
    data.step = "MIN_ORDER";
    setConversationSession(telegramUserId, { createCouponData: data });

    const text = `➕ <b>TẠO MÃ GIẢM GIÁ (BƯỚC 4/5)</b>\n\nNhập <b>Yêu cầu giá trị đơn hàng tối thiểu (VNĐ)</b>:\n<i>(Ví dụ: 60000 hoặc gõ <code>0</code> nếu áp dụng mọi đơn)</i>`;
    return await sendTelegramMessage(chatId, text, { reply_markup: keyboards.wizardCancel() });
  }

  if (data.step === "MIN_ORDER") {
    const minOrder = Number(input.replace(/\D/g, "")) || 0;
    data.minOrderAmount = minOrder;
    data.step = "USAGE_LIMIT";
    setConversationSession(telegramUserId, { createCouponData: data });

    const text = `➕ <b>TẠO MÃ GIẢM GIÁ (BƯỚC 5/5)</b>\n\nNhập <b>Tổng số lượt dùng tối đa</b>:\n<i>(Ví dụ: 100 hoặc gửi <code>/skip</code> nếu không giới hạn)</i>`;
    return await sendTelegramMessage(chatId, text, { reply_markup: keyboards.wizardCancel() });
  }

  if (data.step === "USAGE_LIMIT") {
    let limit: number | undefined = undefined;
    if (input !== "/skip" && input.toLowerCase() !== "skip") {
      const num = Number(input.replace(/\D/g, ""));
      if (!isNaN(num) && num > 0) limit = num;
    }
    data.usageLimit = limit;
    data.step = "CONFIRM";
    setConversationSession(telegramUserId, { createCouponData: data });

    return await renderCreateCouponConfirm(chatId, data);
  }
}

export async function handleCouponTypeSelectWizard(
  chatId: string | number,
  messageId: number,
  type: DiscountType,
  telegramUserId: string | number
) {
  const session = getConversationSession(telegramUserId);
  const data = session.createCouponData || { step: "TYPE" };

  data.discountType = type;
  data.step = "VALUE";
  setConversationSession(telegramUserId, { createCouponData: data });

  const prompt =
    type === "PERCENT"
      ? "Nhập <b>phần trăm giảm (%)</b>:\n<i>(Ví dụ: 20 để giảm 20%)</i>"
      : "Nhập <b>số tiền giảm (VNĐ)</b>:\n<i>(Ví dụ: 50000 để giảm 50.000đ)</i>";

  const text = `➕ <b>TẠO MÃ GIẢM GIÁ (BƯỚC 3/5)</b>\n\n${prompt}`;
  return await editTelegramMessageText(chatId, messageId, text, { reply_markup: keyboards.wizardCancel() });
}

export async function renderCreateCouponConfirm(chatId: string | number, data: any) {
  let valStr = `${data.discountValue}%`;
  if (data.discountType === "FIXED_AMOUNT") {
    valStr = `${new Intl.NumberFormat("vi-VN").format(data.discountValue)} ₫`;
  }
  const minOrderStr = data.minOrderAmount
    ? `${new Intl.NumberFormat("vi-VN").format(data.minOrderAmount)} ₫`
    : "Không yêu cầu (0₫)";

  const text = `📋 <b>XÁC NHẬN TẠO MÃ GIẢM GIÁ</b>
━━━━━━━━━━━━━━━━━━━━━
🏷 <b>Mã Voucher:</b> <code>${data.code}</code>
🎁 <b>Mức giảm:</b> <b>${valStr}</b>
🛒 <b>Đơn tối thiểu:</b> ${minOrderStr}
👥 <b>Giới hạn:</b> ${data.usageLimit ? `${data.usageLimit} lượt` : "Không giới hạn"}
🟢 <b>Trạng thái:</b> Kích hoạt ngay

<i>Bạn có muốn tạo mã voucher này không?</i>`;

  const markup = {
    inline_keyboard: [
      [
        { text: "✅ TẠO MÃ NGAY", callback_data: "wizard:exec_create_coupon" },
        { text: "❌ HỦY", callback_data: "wizard:cancel" },
      ],
    ],
  };

  return await sendTelegramMessage(chatId, text, { reply_markup: markup });
}

export async function executeCreateCoupon(
  chatId: string | number,
  messageId: number,
  telegramUserId: string | number
) {
  const session = getConversationSession(telegramUserId);
  const data = session.createCouponData;
  if (!data || !data.code || !data.discountValue) return;

  try {
    const newCoupon = dataStore.createCoupon({
      code: data.code,
      discountType: data.discountType || "PERCENT",
      discountValue: data.discountValue,
      discountPercent: data.discountType === "PERCENT" ? data.discountValue : undefined,
      minOrderAmount: data.minOrderAmount || 0,
      usageLimit: data.usageLimit,
      customerScope: "ALL",
      isActive: true,
    });

    clearConversationSession(telegramUserId);

    logTelegramAudit({
      telegramUserId: String(telegramUserId),
      action: "CREATE_COUPON",
      resource: "COUPON",
      resourceId: newCoupon.code,
      result: "SUCCESS",
    });

    const text = `🎉 <b>TẠO MÃ GIẢM GIÁ "${newCoupon.code}" THÀNH CÔNG!</b>\n\nKhách hàng hiện đã có thể nhập mã này khi thanh toán đơn hàng.`;
    return await editTelegramMessageText(chatId, messageId, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔍 Xem chi tiết mã vừa tạo", callback_data: `cpn:detail:${newCoupon.id}` }],
          [{ text: "⬅️ Danh sách mã giảm giá", callback_data: "nav:coupons:1" }],
        ],
      },
    });
  } catch (error: any) {
    return await editTelegramMessageText(
      chatId,
      messageId,
      `❌ <b>Lỗi:</b> ${error.message || "Không thể tạo mã giảm giá"}`,
      { reply_markup: keyboards.backToDashboard() }
    );
  }
}
