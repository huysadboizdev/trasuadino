import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage, getTelegramBotToken, getTelegramAdminIds } from "@/lib/telegram/botApi";
import { keyboards } from "@/lib/telegram/keyboards";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body.token || getTelegramBotToken();
    const chatIds: string[] = body.chatId
      ? [String(body.chatId).trim()]
      : getTelegramAdminIds();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Chưa cấu hình Telegram Bot Token." },
        { status: 400 }
      );
    }

    if (chatIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Chưa cấu hình Telegram Admin Chat ID." },
        { status: 400 }
      );
    }

    const testText = `🔔 <b>THỬ NGHIỆM KẾT NỐI DINO ADMIN CENTER THÀNH CÔNG!</b>
━━━━━━━━━━━━━━━━━━━━━
🎉 Bot Telegram đã liên kết thành công với hệ thống Trà Sữa Dino!
⏰ Thời gian: ${new Date().toLocaleString("vi-VN")}

<i>Bạn có thể gõ <code>/start</code> để mở Bảng điều khiển Quản trị ngay bây giờ.</i>`;

    let successCount = 0;
    for (const chatId of chatIds) {
      const res = await sendTelegramMessage(chatId, testText, {
        reply_markup: keyboards.mainDashboard(),
      });
      if (res && res.ok) successCount++;
    }

    if (successCount > 0) {
      return NextResponse.json({
        success: true,
        message: `Đã gửi tin nhắn thử nghiệm thành công tới ${successCount} Chat ID!`,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Không thể gửi tin nhắn. Vui lòng kiểm tra lại Bot Token và Chat ID (đảm bảo bạn đã bấm Start bot trên Telegram).",
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Lỗi máy chủ khi gửi tin nhắn" },
      { status: 500 }
    );
  }
}
