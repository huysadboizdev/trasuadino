import { dataStore } from "../../store";
import { keyboards } from "../keyboards";
import { editTelegramMessageText, sendTelegramMessage } from "../botApi";
import { logTelegramAudit } from "../security";
import { getConversationSession, setConversationSession, clearConversationSession } from "../session";

export async function renderCategoriesList(chatId: string | number, messageId?: number) {
  const categories = dataStore.getCategories();
  const products = dataStore.getProducts();

  let text = `📂 <b>QUẢN LÝ DANH MỤC MENU</b>\n`;
  text += `Tổng số: <b>${categories.length}</b> danh mục\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;

  const catButtons: { text: string; callback_data: string }[][] = [];

  categories.forEach((cat, idx) => {
    const prodCount = products.filter((p) => p.categoryId === cat.id).length;
    text += `${idx + 1}. <b>${cat.name}</b> (<code>${prodCount} món</code>)\n`;

    catButtons.push([
      {
        text: `📁 ${cat.name} (${prodCount} món)`,
        callback_data: `cat:detail:${cat.id}`,
      },
    ]);
  });

  const markup = keyboards.categoriesMenu(catButtons);

  if (messageId) {
    const res = await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
    if (res && res.ok) return res;
  }
  return await sendTelegramMessage(chatId, text, { reply_markup: markup });
}

export async function renderCategoryDetail(
  chatId: string | number,
  messageId: number | undefined,
  categoryId: string
) {
  const cat = dataStore.getCategoryById(categoryId);
  if (!cat) {
    const errorText = `❌ <b>Không tìm thấy danh mục "${categoryId}"</b>.`;
    if (messageId) return await editTelegramMessageText(chatId, messageId, errorText, { reply_markup: keyboards.backToDashboard() });
    return await sendTelegramMessage(chatId, errorText, { reply_markup: keyboards.backToDashboard() });
  }

  const prods = dataStore.getProducts(cat.id);
  const activeProds = prods.filter((p) => p.isAvailable).length;

  let text = `📂 <b>CHI TIẾT DANH MỤC</b>\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📁 <b>Tên danh mục:</b> <b>${cat.name}</b>\n`;
  text += `🔗 <b>Slug:</b> <code>${cat.slug}</code>\n`;
  text += `🥤 <b>Tổng số món:</b> <b>${prods.length}</b> món (🟢 ${activeProds} đang bán · 🔴 ${prods.length - activeProds} tạm hết)\n`;
  if (cat.description) text += `📝 <b>Mô tả:</b> <i>${cat.description}</i>\n`;

  const markup = keyboards.categoryDetail(cat.id);

  if (messageId) {
    const res = await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
    if (res && res.ok) return res;
  }
  return await sendTelegramMessage(chatId, text, { reply_markup: markup });
}

export async function handleConfirmDeleteCategory(
  chatId: string | number,
  messageId: number,
  categoryId: string
) {
  const cat = dataStore.getCategoryById(categoryId);
  if (!cat) return;

  const prods = dataStore.getProducts(cat.id);

  const text = `⚠️ <b>XÁC NHẬN XÓA DANH MỤC</b>\n\nBạn có chắc muốn xóa danh mục <b>"${cat.name}"</b>?\n<i>Hiện đang có ${prods.length} món trong danh mục này. Hành động này không thể hoàn tác.</i>`;

  const markup = keyboards.confirmAction(
    `cat:exec_delete:${categoryId}`,
    `cat:detail:${categoryId}`,
    "🗑 Xác nhận XÓA DANH MỤC"
  );

  return await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
}

export async function handleExecuteDeleteCategory(
  chatId: string | number,
  messageId: number,
  categoryId: string,
  telegramUserId: string | number
) {
  const removed = dataStore.deleteCategory(categoryId);
  if (!removed) return;

  logTelegramAudit({
    telegramUserId: String(telegramUserId),
    action: "DELETE_CATEGORY",
    resource: "CATEGORY",
    resourceId: removed.name,
    result: "SUCCESS",
  });

  const text = `✅ <b>Đã xóa danh mục "${removed.name}" thành công!</b>`;
  return await editTelegramMessageText(chatId, messageId, text, {
    reply_markup: {
      inline_keyboard: [[{ text: "⬅️ Quay lại danh mục", callback_data: "nav:categories" }]],
    },
  });
}

export async function startAddCategoryWizard(chatId: string | number, telegramUserId: string | number) {
  setConversationSession(telegramUserId, {
    flow: "ADD_CATEGORY",
  });

  const text = `➕ <b>THÊM DANH MỤC MỚI</b>\n\nVui lòng nhập <b>Tên danh mục</b> muốn tạo:\n<i>(Ví dụ: Sinh Tố & Nước Ép)</i>`;
  return await sendTelegramMessage(chatId, text, { reply_markup: keyboards.wizardCancel() });
}

export async function handleAddCategoryInput(
  chatId: string | number,
  telegramUserId: string | number,
  input: string
) {
  const name = input.trim();
  if (!name) return;

  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");

  const newCat = dataStore.addCategory({
    name,
    slug,
    description: "",
    orderIndex: 0,
    isActive: true,
  });

  clearConversationSession(telegramUserId);

  logTelegramAudit({
    telegramUserId: String(telegramUserId),
    action: "CREATE_CATEGORY",
    resource: "CATEGORY",
    resourceId: newCat.name,
    result: "SUCCESS",
  });

  const text = `🎉 <b>Đã tạo danh mục "${newCat.name}" thành công!</b>`;
  return await sendTelegramMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: [[{ text: "📂 Xem danh sách danh mục", callback_data: "nav:categories" }]],
    },
  });
}
