import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";
import { notifyTelegramPaymentSuccess } from "@/lib/telegram/notifications";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("==> [SEPAY WEBHOOK RECEIVED]:", JSON.stringify(payload, null, 2));

    // Lấy nội dung chuyển khoản và số tiền từ SePay
    const content = (payload.content || payload.description || "").toString().toUpperCase();
    const amount = Number(payload.transferAmount || payload.amount || 0);

    if (!content) {
      return NextResponse.json(
        { success: false, message: "Thiếu nội dung chuyển khoản" },
        { status: 400 }
      );
    }

    // Tìm mã đơn dạng DINO-XXX hoặc DINO XXX hoặc DINOXXX
    const match = content.match(/DINO[- ]?(\d+)/i);
    let matchedOrderCode = "";
    if (match) {
      matchedOrderCode = `DINO-${match[1]}`;
    }

    if (!matchedOrderCode) {
      console.warn("Không trích xuất được mã đơn DINO từ nội dung:", content);
      return NextResponse.json({
        success: true,
        message: "Không tìm thấy mã đơn hàng trong nội dung chuyển khoản",
      });
    }

    // Cập nhật trạng thái đơn hàng sang ĐÃ THANH TOÁN
    const order = dataStore.markOrderPaidByCode(matchedOrderCode);

    if (order) {
      console.log(`==> [SEPAY] Đã xác nhận thanh toán tự động cho đơn: ${order.orderCode} (${amount}đ)`);

      // Bắn thông báo Telegram xác nhận thanh toán thành công
      notifyTelegramPaymentSuccess(order, amount).catch((err) => {
        console.error("[Telegram SePay Notification Error]:", err);
      });

      return NextResponse.json({
        success: true,
        orderCode: order.orderCode,
        message: "Xác nhận thanh toán thành công",
      });
    } else {
      console.warn(`==> [SEPAY] Không tìm thấy đơn hàng mã ${matchedOrderCode} trong hệ thống`);
      return NextResponse.json({
        success: true,
        message: `Không tìm thấy đơn hàng mã ${matchedOrderCode}`,
      });
    }
  } catch (error) {
    console.error("Lỗi khi xử lý SePay Webhook:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi xử lý webhook" },
      { status: 500 }
    );
  }
}
