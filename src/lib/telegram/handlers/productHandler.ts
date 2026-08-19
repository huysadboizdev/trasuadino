import { dataStore } from "../../store";
import { keyboards } from "../keyboards";
import { editTelegramMessageText, sendTelegramMessage } from "../botApi";
import { logTelegramAudit } from "../security";
import { getConversationSession, setConversationSession, clearConversationSession } from "../session";

const PAGE_SIZE = 8;

export async function renderProductsList(
  chatId: string | number,
  messageId: number | undefined,
  filter: string = "ALL",
  page: number = 1
) {
  let allProducts = dataStore.getProducts();
  if (filter === "AVAILABLE") {
    allProducts = allProducts.filter((p) => p.isAvailable);
  } else if (filter === "OUT_OF_STOCK") {
    allProducts = allProducts.filter((p) => !p.isAvailable);
  }

  const totalProducts = allProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageProducts = allProducts.slice(startIndex, startIndex + PAGE_SIZE);

  let filterTitle = "TẤT CẢ MÓN";
  if (filter === "AVAILABLE") filterTitle = "ĐANG MỞ BÁN";
  else if (filter === "OUT_OF_STOCK") filterTitle = "TẠM HẾT HÀNG";

  let text = `🥤 <b>QUẢN LÝ SẢN PHẨM & MENU</b> (${filterTitle})\n`;
  text += `Tổng: <b>${totalProducts}</b> món · Trang: <b>${currentPage}/${totalPages}</b>\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;

  if (pageProducts.length === 0) {
    text += `<i>Không tìm thấy món ăn nào.</i>\n`;
  } else {
    pageProducts.forEach((p, idx) => {
      const priceStr = new Intl.NumberFormat("vi-VN").format(p.price);
      const icon = p.isAvailable ? "🟢" : "🔴 [HẾT]";
      text += `${startIndex + idx + 1}. <b>${p.name}</b> · ${priceStr}₫ · ${icon}\n`;
      text += `   📁 <i>${p.categoryName || "Chung"}</i> · Đã bán: <b>${p.salesCount || 0}</b>\n`;
    });
  }

  // Create inline buttons for each product (2 per row)
  const productButtons: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < pageProducts.length; i += 2) {
    const row = [
      {
        text: `${pageProducts[i].isAvailable ? "🟢" : "🔴"} ${pageProducts[i].name.substring(0, 18)}`,
        callback_data: `prod:detail:${pageProducts[i].id}`,
      },
    ];
    if (pageProducts[i + 1]) {
      row.push({
        text: `${pageProducts[i + 1].isAvailable ? "🟢" : "🔴"} ${pageProducts[i + 1].name.substring(0, 18)}`,
        callback_data: `prod:detail:${pageProducts[i + 1].id}`,
      });
    }
    productButtons.push(row);
  }

  const markup = keyboards.productsMenu(filter, currentPage, totalPages, productButtons);

  if (messageId) {
    const res = await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
    if (res && res.ok) return res;
  }
  return await sendTelegramMessage(chatId, text, { reply_markup: markup });
}

export async function renderProductDetail(
  chatId: string | number,
  messageId: number | undefined,
  productId: string
) {
  const product = dataStore.getProductById(productId);
  if (!product) {
    const errorText = `❌ <b>Không tìm thấy món ăn "${productId}"</b>.`;
    if (messageId) return await editTelegramMessageText(chatId, messageId, errorText, { reply_markup: keyboards.backToDashboard() });
    return await sendTelegramMessage(chatId, errorText, { reply_markup: keyboards.backToDashboard() });
  }

  const priceStr = new Intl.NumberFormat("vi-VN").format(product.price);
  const statusBadge = product.isAvailable ? "🟢 ĐANG BÁN" : "🔴 TẠM HẾT HÀNG";

  let optionsInfo = "";
  if (product.options && product.options.length > 0) {
    optionsInfo += `\n⚙️ <b>Nhóm tùy chọn (${product.options.length}):</b>\n`;
    product.options.forEach((grp) => {
      const itemsList = grp.items.map((it) => it.name).join(", ");
      optionsInfo += `  ● <b>${grp.title}</b>: <i>${itemsList}</i>\n`;
    });
  }

  const text = `🥤 <b>THÔNG TIN SẢN PHẨM</b>
━━━━━━━━━━━━━━━━━━━━━
🍵 <b>Tên món:</b> <b>${product.name}</b>
💰 <b>Giá bán:</b> <code>${priceStr} ₫</code>
📂 <b>Danh mục:</b> <i>${product.categoryName || "Món quán"}</i>
📊 <b>Trạng thái:</b> ${statusBadge}
🔥 <b>Số lượt đã bán:</b> <b>${product.salesCount || 0}</b> ly
${product.description ? `📝 <b>Mô tả:</b> <i>${product.description}</i>\n` : ""}${optionsInfo}
<i>Bấm các nút bên dưới để điều chỉnh thông tin:</i>`;

  const markup = keyboards.productDetail(product.id, product.isAvailable);

  if (messageId) {
    const res = await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
    if (res && res.ok) return res;
  }
  return await sendTelegramMessage(chatId, text, { reply_markup: markup });
}

export async function handleToggleProductStatus(
  chatId: string | number,
  messageId: number,
  productId: string,
  telegramUserId: string | number
) {
  const prod = dataStore.toggleProductAvailability(productId);
  if (!prod) return;

  logTelegramAudit({
    telegramUserId: String(telegramUserId),
    action: "TOGGLE_PRODUCT_STATUS",
    resource: "PRODUCT",
    resourceId: prod.name,
    details: { isAvailable: prod.isAvailable },
    result: "SUCCESS",
  });

  return await renderProductDetail(chatId, messageId, prod.id);
}

export async function handleConfirmDeleteProduct(
  chatId: string | number,
  messageId: number,
  productId: string
) {
  const prod = dataStore.getProductById(productId);
  if (!prod) return;

  const text = `⚠️ <b>XÁC NHẬN XÓA SẢN PHẨM</b>\n\nBạn có chắc chắn muốn xóa món <b>"${prod.name}"</b> khỏi thực đơn không?\n<i>Hành động này không thể hoàn tác.</i>`;

  const markup = keyboards.confirmAction(
    `prod:exec_delete:${productId}`,
    `prod:detail:${productId}`,
    "🗑 Xác nhận XÓA MÓN"
  );

  return await editTelegramMessageText(chatId, messageId, text, { reply_markup: markup });
}

export async function handleExecuteDeleteProduct(
  chatId: string | number,
  messageId: number,
  productId: string,
  telegramUserId: string | number
) {
  const removed = dataStore.deleteProduct(productId);
  if (!removed) return;

  logTelegramAudit({
    telegramUserId: String(telegramUserId),
    action: "DELETE_PRODUCT",
    resource: "PRODUCT",
    resourceId: removed.name,
    result: "SUCCESS",
  });

  const text = `✅ <b>Đã xóa món "${removed.name}" thành công!</b>`;
  return await editTelegramMessageText(chatId, messageId, text, {
    reply_markup: {
      inline_keyboard: [[{ text: "⬅️ Quay lại danh sách món", callback_data: "nav:products:ALL:1" }]],
    },
  });
}

// --- ADD PRODUCT WIZARD ---
export async function startAddProductWizard(chatId: string | number, telegramUserId: string | number) {
  setConversationSession(telegramUserId, {
    flow: "ADD_PRODUCT",
    addProductData: { step: "NAME" },
  });

  const text = `➕ <b>THÊM SẢN PHẨM MỚI (BƯỚC 1/5)</b>\n\nVui lòng nhập <b>Tên sản phẩm</b> mới:\n<i>(Ví dụ: Trà Sữa Kem Trứng Nướng)</i>`;
  return await sendTelegramMessage(chatId, text, { reply_markup: keyboards.wizardCancel() });
}

export async function handleAddProductMessageInput(
  chatId: string | number,
  telegramUserId: string | number,
  input: string,
  photoFileId?: string
) {
  const session = getConversationSession(telegramUserId);
  const data = session.addProductData || { step: "NAME" };

  if (data.step === "NAME") {
    const name = input.trim();
    if (!name) {
      return await sendTelegramMessage(chatId, "⚠️ <i>Tên sản phẩm không được để trống. Vui lòng nhập lại:</i>", {
        reply_markup: keyboards.wizardCancel(),
      });
    }

    data.name = name;
    data.step = "PRICE";
    setConversationSession(telegramUserId, { addProductData: data });

    const text = `➕ <b>THÊM SẢN PHẨM MỚI (BƯỚC 2/5)</b>\n\nTên món: <b>${data.name}</b>\n\nVui lòng nhập <b>Giá bán (VNĐ)</b>:\n<i>(Ví dụ: 45000)</i>`;
    return await sendTelegramMessage(chatId, text, { reply_markup: keyboards.wizardCancel() });
  }

  if (data.step === "PRICE") {
    const rawNumber = input.replace(/\D/g, "");
    const price = Number(rawNumber);
    if (isNaN(price) || price <= 0) {
      return await sendTelegramMessage(chatId, "⚠️ <i>Giá bán không hợp lệ. Vui lòng nhập số tiền lớn hơn 0:</i>", {
        reply_markup: keyboards.wizardCancel(),
      });
    }

    data.price = price;
    data.step = "CATEGORY";
    setConversationSession(telegramUserId, { addProductData: data });

    // Show category buttons
    const categories = dataStore.getCategories();
    const catButtons: { text: string; callback_data: string }[][] = [];
    for (let i = 0; i < categories.length; i += 2) {
      const row = [{ text: categories[i].name, callback_data: `wizard:cat_select:${categories[i].id}` }];
      if (categories[i + 1]) {
        row.push({ text: categories[i + 1].name, callback_data: `wizard:cat_select:${categories[i + 1].id}` });
      }
      catButtons.push(row);
    }
    catButtons.push([{ text: "❌ Hủy thao tác", callback_data: "wizard:cancel" }]);

    const text = `➕ <b>THÊM SẢN PHẨM MỚI (BƯỚC 3/5)</b>\n\nTên: <b>${data.name}</b> · Giá: <b>${new Intl.NumberFormat("vi-VN").format(data.price)} ₫</b>\n\nVui lòng bấm chọn <b>Danh mục</b> cho món:`;
    return await sendTelegramMessage(chatId, text, { reply_markup: { inline_keyboard: catButtons } });
  }

  if (data.step === "IMAGE") {
    if (photoFileId) {
      const { downloadTelegramPhoto } = await import("../botApi");
      const uploadedUrl = await downloadTelegramPhoto(photoFileId);
      if (uploadedUrl) {
        data.image = uploadedUrl;
      }
    } else if (input.startsWith("http://") || input.startsWith("https://")) {
      data.image = input.trim();
    } else if (input === "/skip" || input.toLowerCase() === "skip") {
      data.image = "https://images.unsplash.com/photo-1558857563-b37cfb42e7d7?w=500&auto=format&fit=crop&q=80";
    }
    data.step = "DESCRIPTION";
    setConversationSession(telegramUserId, { addProductData: data });

    const text = `➕ <b>THÊM SẢN PHẨM MỚI (BƯỚC 5/5)</b>\n\nNhập <b>Mô tả sản phẩm</b> hoặc gửi <code>/skip</code> để bỏ qua:`;
    return await sendTelegramMessage(chatId, text, { reply_markup: keyboards.wizardCancel() });
  }

  if (data.step === "DESCRIPTION") {
    data.description = input === "/skip" ? "" : input.trim();
    data.step = "CONFIRM";
    setConversationSession(telegramUserId, { addProductData: data });

    return await renderAddProductConfirm(chatId, data);
  }
}

export async function handleCategorySelectWizard(
  chatId: string | number,
  messageId: number,
  categoryId: string,
  telegramUserId: string | number
) {
  const session = getConversationSession(telegramUserId);
  const data = session.addProductData || { step: "CATEGORY" };

  const cat = dataStore.getCategoryById(categoryId);
  data.categoryId = categoryId;
  data.categoryName = cat?.name || "Món quán";
  data.step = "IMAGE";
  setConversationSession(telegramUserId, { addProductData: data });

  const text = `➕ <b>THÊM SẢN PHẨM MỚI (BƯỚC 4/5)</b>\n\nDanh mục: <b>${data.categoryName}</b>\n\nVui lòng <b>Gửi ảnh sản phẩm</b> vào chat này\n<i>(hoặc gửi <code>/skip</code> để dùng ảnh mặc định)</i>:`;
  return await editTelegramMessageText(chatId, messageId, text, { reply_markup: keyboards.wizardCancel() });
}

export async function renderAddProductConfirm(chatId: string | number, data: any) {
  const priceStr = new Intl.NumberFormat("vi-VN").format(data.price || 0);
  const text = `📋 <b>XÁC NHẬN TẠO SẢN PHẨM MỚI</b>
━━━━━━━━━━━━━━━━━━━━━
🍵 <b>Tên món:</b> ${data.name}
💰 <b>Giá bán:</b> ${priceStr} ₫
📂 <b>Danh mục:</b> ${data.categoryName}
📝 <b>Mô tả:</b> ${data.description || "<i>Không có</i>"}
🟢 <b>Trạng thái:</b> Đang mở bán

<i>Bạn có muốn tạo sản phẩm này lên thực đơn ngay không?</i>`;

  const markup = {
    inline_keyboard: [
      [
        { text: "✅ TẠO SẢN PHẨM", callback_data: "wizard:exec_add_product" },
        { text: "❌ HỦY", callback_data: "wizard:cancel" },
      ],
    ],
  };

  return await sendTelegramMessage(chatId, text, { reply_markup: markup });
}

export async function executeAddProduct(
  chatId: string | number,
  messageId: number,
  telegramUserId: string | number
) {
  const session = getConversationSession(telegramUserId);
  const data = session.addProductData;
  if (!data || !data.name || !data.price || !data.categoryId) return;

  const newProd = dataStore.addProduct({
    name: data.name,
    price: data.price,
    categoryId: data.categoryId,
    description: data.description || "",
    image: data.image || "https://images.unsplash.com/photo-1558857563-b37cfb42e7d7?w=500&auto=format&fit=crop&q=80",
    isAvailable: true,
    options: [],
  });

  clearConversationSession(telegramUserId);

  logTelegramAudit({
    telegramUserId: String(telegramUserId),
    action: "CREATE_PRODUCT",
    resource: "PRODUCT",
    resourceId: newProd.name,
    result: "SUCCESS",
  });

  const text = `🎉 <b>TẠO MÓN MỚI THÀNH CÔNG!</b>\n\nMón <b>"${newProd.name}"</b> đã được thêm vào thực đơn hệ thống và sẵn sàng nhận đơn.`;
  return await editTelegramMessageText(chatId, messageId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔍 Xem chi tiết món vừa tạo", callback_data: `prod:detail:${newProd.id}` }],
        [{ text: "⬅️ Danh sách sản phẩm", callback_data: "nav:products:ALL:1" }],
      ],
    },
  });
}
