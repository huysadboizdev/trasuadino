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

    return NextResponse.json(
      {
        success: true,
        orderCode: order.orderCode,
        orderId: order.id,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        totalAmount: order.totalAmount,
        paid: isPaid,
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
