import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const identifier = params.id;
    if (!identifier) {
      return NextResponse.json(
        { success: false, message: "Thiếu mã đơn hàng" },
        { status: 400 }
      );
    }

    const raw = identifier.trim();
    const cleanUpper = raw.replace(/^#/, "").trim().toUpperCase();

    const orders = dataStore.getOrders();
    const order = orders.find(
      (o) =>
        o.id === raw ||
        o.orderCode === raw ||
        o.id.toUpperCase() === cleanUpper ||
        o.orderCode.toUpperCase() === cleanUpper
    );

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: `Không tìm thấy đơn hàng "${identifier}"`,
          orderCode: identifier,
          paid: false,
        },
        { status: 404 }
      );
    }

    const isPaid = order.paymentStatus === "PAID";

    // Tính toán thời gian hết hạn (5 phút kể từ lúc tạo đơn cho đơn SEPAY_QR)
    const createdAtMs = new Date(order.createdAt).getTime();
    const expiresAtMs = order.expiresAt
      ? new Date(order.expiresAt).getTime()
      : createdAtMs + 5 * 60 * 1000;
    const now = Date.now();
    const timeLeftSeconds = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
    const isExpired =
      timeLeftSeconds <= 0 &&
      order.paymentStatus === "PENDING" &&
      order.paymentMethod === "SEPAY_QR";

    // Nếu đã quá 5 phút mà chưa thanh toán: Tự động hủy đơn
    if (isExpired) {
      const cancelledOrder = dataStore.cancelExpiredOrder(order.id);
      return NextResponse.json(
        {
          success: true,
          orderCode: order.orderCode,
          orderId: order.id,
          paymentStatus: "CANCELLED",
          orderStatus: "CANCELLED",
          totalAmount: order.totalAmount,
          paid: false,
          isExpired: true,
          timeLeftSeconds: 0,
          expiresAt: order.expiresAt,
          message: "Mã thanh toán đã hết hạn sau 5 phút và đơn hàng đã tự động hủy",
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        orderCode: order.orderCode,
        orderId: order.id,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        totalAmount: order.totalAmount,
        paid: isPaid,
        isExpired: false,
        timeLeftSeconds,
        expiresAt: order.expiresAt,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("Lỗi khi kiểm tra trạng thái thanh toán đơn hàng:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ khi kiểm tra thanh toán" },
      { status: 500 }
    );
  }
}
