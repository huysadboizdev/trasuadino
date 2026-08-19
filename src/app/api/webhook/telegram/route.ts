import { NextRequest, NextResponse } from "next/server";
import { processTelegramWebhookUpdate } from "@/lib/telegram/router";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    // 1. Kiểm tra Webhook Secret Token nếu có thiết lập
    const expectedSecret = (process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();
    if (expectedSecret) {
      const secretHeader = (req.headers.get("x-telegram-bot-api-secret-token") || "").trim();
      if (secretHeader !== expectedSecret) {
        console.warn("[Telegram Webhook Security] Bị từ chối: Secret Token không hợp lệ");
        return NextResponse.json({ success: false, message: "Unauthorized Secret Token" }, { status: 401 });
      }
    }

    const payload = await req.json();

    console.log("[TELEGRAM WEBHOOK] RECEIVED");

    if (payload.callback_query) {
      const cb = payload.callback_query;
      console.log(
        `[TELEGRAM CALLBACK] RECEIVED callbackQueryId=${cb.id} callbackData="${cb.data}" telegramUserId=${cb.from?.id} telegramChatId=${cb.message?.chat?.id}`
      );
    }

    // Safe logging (không log token hay secret)
    const updateType = payload.message
      ? "message"
      : payload.callback_query
      ? "callback_query"
      : payload.edited_message
      ? "edited_message"
      : "other";
    console.log(`[Telegram Webhook Received] update_id=${payload.update_id || "N/A"} type=${updateType}`);

    // 2. Xử lý update bất đồng bộ để trả về 200 OK ngay cho Telegram
    processTelegramWebhookUpdate(payload).catch((err) => {
      console.error("[Telegram Webhook Processing Error]:", err);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Lỗi tiếp nhận Telegram Webhook:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Dino Tea Telegram Webhook Endpoint is Active",
  });
}
