import fs from "fs";
import path from "path";
import { getTelegramAdminIds } from "./botApi";
import { TelegramAdminRole, TelegramAuditLog } from "./types";

const AUDIT_LOG_FILE = path.join(process.cwd(), "data", "telegram_audit.log");

export function isAuthorizedTelegramAdmin(telegramUserId: string | number, chatId?: string | number): boolean {
  const userStr = String(telegramUserId).trim();
  const chatStr = chatId ? String(chatId).trim() : "";
  const allowedList = getTelegramAdminIds();

  // Nếu chưa cấu hình whitelist, chặn để đảm bảo an toàn tuyệt đối
  if (allowedList.length === 0) {
    return false;
  }

  return allowedList.includes(userStr) || (chatStr ? allowedList.includes(chatStr) : false);
}

export function getAdminRole(telegramUserId: string | number): TelegramAdminRole {
  // Mặc định các ID trong whitelist là SUPER_ADMIN
  return "SUPER_ADMIN";
}

export function hasPermission(
  role: TelegramAdminRole,
  permission:
    | "orders.read"
    | "orders.update"
    | "products.manage"
    | "categories.manage"
    | "coupons.manage"
    | "users.manage"
    | "revenue.read"
    | "store.manage"
    | "settings.manage"
): boolean {
  if (role === "SUPER_ADMIN") return true;
  if (role === "MANAGER") {
    return permission !== "settings.manage";
  }
  if (role === "STAFF") {
    return permission === "orders.read" || permission === "orders.update";
  }
  return false;
}

export function logTelegramAudit(entry: Omit<TelegramAuditLog, "timestamp">) {
  const fullLog: TelegramAuditLog = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  try {
    const dir = path.dirname(AUDIT_LOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(AUDIT_LOG_FILE, JSON.stringify(fullLog) + "\n", "utf-8");
  } catch (e) {
    console.error("[Telegram Audit Log Error]:", e);
  }

  console.log(`==> [TELEGRAM AUDIT] [${fullLog.action}] [User:${fullLog.telegramUserId}] [Result:${fullLog.result}]`);
}
