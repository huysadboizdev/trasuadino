import fs from "fs";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { dataStore } from "../store";
import { InlineKeyboardMarkup, TelegramSendMessageOptions } from "./types";

export function getTelegramBotToken(): string | null {
  // 1. Kiểm tra biến môi trường
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN.trim()) {
    return process.env.TELEGRAM_BOT_TOKEN.trim();
  }
  // 2. Kiểm tra trong store settings
  try {
    const settings = dataStore.getSettings();
    if ((settings as any).telegramBotToken && (settings as any).telegramBotToken.trim()) {
      return (settings as any).telegramBotToken.trim();
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

export function getTelegramAdminIds(): string[] {
  const ids: string[] = [];
  if (process.env.TELEGRAM_ADMIN_IDS) {
    process.env.TELEGRAM_ADMIN_IDS.split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .forEach((id) => ids.push(id));
  }
  try {
    const settings = dataStore.getSettings();
    if ((settings as any).telegramAdminChatIds) {
      String((settings as any).telegramAdminChatIds)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .forEach((id) => {
          if (!ids.includes(id)) ids.push(id);
        });
    }
  } catch (e) {
    // Ignore
  }
  return ids;
}

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: TelegramSendMessageOptions
) {
  const token = getTelegramBotToken();
  if (!token) return null;

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parse_mode || "HTML",
        reply_markup: options?.reply_markup,
        disable_web_page_preview: options?.disable_web_page_preview ?? true,
      }),
    });
    return await res.json();
  } catch (error) {
    console.error("[Telegram API] Lỗi khi gửi tin nhắn:", error);
    return null;
  }
}

export async function editTelegramMessageText(
  chatId: string | number,
  messageId: number,
  text: string,
  options?: TelegramSendMessageOptions
) {
  const token = getTelegramBotToken();
  if (!token) return null;

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: options?.parse_mode || "HTML",
        reply_markup: options?.reply_markup,
        disable_web_page_preview: options?.disable_web_page_preview ?? true,
      }),
    });
    return await res.json();
  } catch (error) {
    console.error("[Telegram API] Lỗi khi sửa tin nhắn:", error);
    return null;
  }
}

export async function editTelegramMessageReplyMarkup(
  chatId: string | number,
  messageId: number,
  replyMarkup?: InlineKeyboardMarkup
) {
  const token = getTelegramBotToken();
  if (!token) return null;

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}${token}/editMessageReplyMarkup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        reply_markup: replyMarkup,
      }),
    });
    return await res.json();
  } catch (error) {
    console.error("[Telegram API] Lỗi khi sửa reply markup:", error);
    return null;
  }
}

export async function answerTelegramCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert: boolean = false
) {
  const token = getTelegramBotToken();
  if (!token) return null;

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    });
    return await res.json();
  } catch (error) {
    console.error("[Telegram API] Lỗi khi answerCallbackQuery:", error);
    return null;
  }
}

export async function deleteTelegramMessage(chatId: string | number, messageId: number) {
  const token = getTelegramBotToken();
  if (!token) return null;

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}${token}/deleteMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
      }),
    });
    return await res.json();
  } catch (error) {
    return null;
  }
}

/**
 * Tải ảnh người dùng gửi từ Telegram và tải trực tiếp lên Cloudinary (với fallback lưu máy chủ)
 */
export async function downloadTelegramPhoto(fileId: string): Promise<string | null> {
  const token = getTelegramBotToken();
  if (!token) return null;

  try {
    // 1. Lấy File Path từ Telegram API
    const getFileRes = await fetch(`${TELEGRAM_API_BASE}${token}/getFile?file_id=${fileId}`);
    const fileData = await getFileRes.json();
    if (!fileData.ok || !fileData.result?.file_path) return null;

    const filePath = fileData.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

    // 2. Tải binary ảnh
    const imgRes = await fetch(downloadUrl);
    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = path.extname(filePath) || ".jpg";
    const baseName = `tele_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 3. Ưu tiên upload trực tiếp lên Cloudinary
    try {
      const { uploadBufferToCloudinary } = await import("../cloudinary");
      const cloudRes = await uploadBufferToCloudinary(buffer, baseName, "trasua-dino/telegram");
      if (cloudRes && cloudRes.secureUrl) {
        return cloudRes.secureUrl;
      }
    } catch (cloudErr) {
      console.warn("[Telegram Cloudinary Upload Fallback]:", cloudErr);
    }

    // 4. Fallback lưu vào public/uploads
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const filename = `${baseName}${ext}`;
    const targetPath = path.join(uploadsDir, filename);

    await writeFile(targetPath, buffer);

    return `/uploads/${filename}`;
  } catch (error) {
    console.error("[Telegram Photo Download] Lỗi khi tải ảnh:", error);
    return null;
  }
}
