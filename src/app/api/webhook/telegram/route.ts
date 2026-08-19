import { NextRequest, NextResponse } from "next/server";
import { processTelegramWebhookUpdate } from "@/lib/telegram/router";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    // 1. Kiểm tra Webhook Secret Token nếu có thiết lập
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expectedSecret) {
      const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
      if (secretHeader !== expectedSecret) {
        return NextResponse.json({ success: false, message: "Unauthorized Secret Token" }, { status: 401 });
      }
    }

    const payload = await req.json();

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
