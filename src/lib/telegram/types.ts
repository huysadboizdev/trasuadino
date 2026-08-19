/**
 * Telegram Admin Center - Types & Data Contracts
 */
import { OrderStatus, DiscountType, CustomerScope, ProductScope } from "../types";

export type TelegramAdminRole = "SUPER_ADMIN" | "MANAGER" | "STAFF";

export interface TelegramAdminUser {
  telegramUserId: string;
  chatId: string;
  name: string;
  role: TelegramAdminRole;
  isActive: boolean;
}

export interface TelegramAuditLog {
  timestamp: string;
  telegramUserId: string;
  adminName?: string;
  action: string;
  resource: "ORDER" | "PRODUCT" | "CATEGORY" | "COUPON" | "USER" | "STORE" | "SETTINGS";
  resourceId?: string;
  details?: Record<string, any>;
  result: "SUCCESS" | "FAILED" | "DENIED";
}

// Conversation State Types
export type ConversationFlow =
  | "IDLE"
  | "ADD_PRODUCT"
  | "EDIT_PRODUCT_PRICE"
  | "EDIT_PRODUCT_NAME"
  | "EDIT_PRODUCT_DESCRIPTION"
  | "ADD_CATEGORY"
  | "EDIT_CATEGORY_NAME"
  | "CREATE_COUPON"
  | "GLOBAL_SEARCH";

export interface AddProductWizardState {
  name?: string;
  price?: number;
  categoryId?: string;
  categoryName?: string;
  description?: string;
  image?: string;
  step: "NAME" | "PRICE" | "CATEGORY" | "IMAGE" | "DESCRIPTION" | "CONFIRM";
}

export interface CreateCouponWizardState {
  code?: string;
  discountType?: DiscountType;
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  customerScope?: CustomerScope;
  step: "CODE" | "TYPE" | "VALUE" | "MIN_ORDER" | "MAX_DISCOUNT" | "USAGE_LIMIT" | "CONFIRM";
}

export interface UserConversationSession {
  telegramUserId: string;
  flow: ConversationFlow;
  targetId?: string; // Product ID, Coupon ID, Category ID being edited
  addProductData?: AddProductWizardState;
  createCouponData?: CreateCouponWizardState;
  lastActive: number; // Timestamp for TTL cleanup
}

// Telegram Inline Keyboard Button types
export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface TelegramSendMessageOptions {
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  reply_markup?: InlineKeyboardMarkup;
  disable_web_page_preview?: boolean;
}
