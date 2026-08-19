import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";
import { notifyTelegramPaymentSuccess } from "@/lib/telegram/notifications";
import { realtimeHub } from "@/lib/realtime";
import { paymentConfig } from "@/lib/paymentConfig";

/**
 * Handler chung cho SePay Webhook xử lý đối soát thanh toán tự động
 */
export async function handleSepayWebhook(req: NextRequest) {
  try {
    // 1. Kiểm tra xác thực Webhook Secret (nếu được cấu hình trong env)
    const webhookSecret = paymentConfig.sepay.webhookSecret;
    if (webhookSecret) {
      const authHeader = req.headers.get("Authorization") || req.headers.get("authorization") || "";
      const expectedToken = webhookSecret.startsWith("Apikey ") ? webhookSecret : `Apikey ${webhookSecret}`;
      if (authHeader !== webhookSecret && authHeader !== expectedToken) {
        console.warn("[SEPAY WEBHOOK] Unauthorized request received");
        return NextResponse.json(
          { success: false, message: "Unauthorized webhook request" },
          { status: 401 }
        );
      }
    }

    const payload = await req.json();
    console.log("==> [SEPAY WEBHOOK RECEIVED]:", JSON.stringify(payload, null, 2));

    // 2. Lấy nội dung chuyển khoản, số tiền và mã giao dịch từ SePay
    const content = (payload.content || payload.description || "").toString().trim();
    const amount = Number(payload.transferAmount || payload.amount || 0);
    const transactionCode = String(payload.referenceCode || payload.code || payload.id || `SEPAY-${Date.now()}`);

    if (!content && amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Dữ liệu webhook không hợp lệ (thiếu nội dung và số tiền)" },
        { status: 400 }
      );
    }

    // 3. Tìm mã đơn dạng DINO-XXX hoặc DINO XXX hoặc DINOXXX
    const match = content.toUpperCase().match(/DINO[- ]?(\d+)/i);
    let matchedOrderCode = "";
    if (match) {
      matchedOrderCode = `DINO-${match[1]}`;
    }

    if (!matchedOrderCode) {
      console.warn("==> [SEPAY] Không trích xuất được mã đơn DINO từ nội dung:", content);
      return NextResponse.json({
        success: true,
        message: "Không tìm thấy mã đơn hàng DINO trong nội dung chuyển khoản",
        rawContent: content,
      });
    }

    // 4. Tìm đơn hàng trong hệ thống để đối soát số tiền
    const allOrders = dataStore.getOrders();
    const targetOrder = allOrders.find(
      (o) => o.orderCode.toUpperCase() === matchedOrderCode.toUpperCase()
    );

    if (!targetOrder) {
      console.warn(`==> [SEPAY] Không tìm thấy đơn hàng mã ${matchedOrderCode} trong hệ thống`);
      return NextResponse.json({
        success: true,
        message: `Không tìm thấy đơn hàng mã ${matchedOrderCode}`,
      });
    }

    // 5. Kiểm tra số tiền chuyển khoản >= tổng tiền đơn hàng
    if (amount > 0 && amount < targetOrder.totalAmount) {
      console.warn(
        `==> [SEPAY] Số tiền chuyển (${amount}đ) nhỏ hơn tổng tiền đơn hàng #${targetOrder.orderCode} (${targetOrder.totalAmount}đ)`
      );
      return NextResponse.json({
        success: true,
        message: `Số tiền thanh toán (${amount}đ) chưa đủ với tổng tiền đơn (${targetOrder.totalAmount}đ)`,
        orderCode: targetOrder.orderCode,
      });
    }

    // 6. Cập nhật trạng thái thanh toán đơn hàng sang PAID và lưu PaymentTransaction (Idempotent)
    const result = dataStore.markOrderPaidByCode(matchedOrderCode, {
      amount: amount > 0 ? amount : targetOrder.totalAmount,
      transactionCode,
      content,
      rawData: payload,
    });

    if (result && result.order) {
      const { order, wasAlreadyPaid } = result;
      console.log(
        `==> [SEPAY] Xác nhận thanh toán thành công cho đơn #${order.orderCode} (Số tiền: ${amount}đ, Đã thanh toán trước đó: ${wasAlreadyPaid})`
      );

      // Bắn sự kiện Realtime SSE cho Web Admin & Khách hàng
      realtimeHub.emitOrderStatusUpdated(order);

      // Nếu là lần đầu tiên thanh toán thành công, gửi thông báo Telegram cho Admin
      if (!wasAlreadyPaid) {
        notifyTelegramPaymentSuccess(order, amount > 0 ? amount : order.totalAmount).catch((err) => {
          console.error("[Telegram SePay Notification Error]:", err);
        });
      }

      return NextResponse.json({
        success: true,
        orderCode: order.orderCode,
        paymentStatus: order.paymentStatus,
        message: wasAlreadyPaid
          ? "Đơn hàng đã được thanh toán trước đó"
          : "Xác nhận thanh toán SePay thành công",
      });
    }

    return NextResponse.json({
      success: true,
      message: `Đã xử lý webhook cho đơn ${matchedOrderCode}`,
    });
  } catch (error: any) {
    console.error("==> [SEPAY WEBHOOK ERROR]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Lỗi xử lý webhook SePay" },
      { status: 500 }
    );
  }
}
