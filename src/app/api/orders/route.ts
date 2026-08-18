import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;

    const orders = dataStore.getOrders(status);

    return NextResponse.json({
      success: true,
      orders,
      total: orders.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi khi lấy danh sách đơn hàng" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      userId,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      note,
      items,
      paymentMethod,
      subtotalAmount,
      couponCode,
      discountPercent,
      discountAmount,
      totalAmount,
    } = body;

    if (!customerName || !customerPhone || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin khách hàng hoặc món đã chọn" },
        { status: 400 }
      );
    }

    const newOrder = dataStore.createOrder({
      customerName,
      customerPhone,
      customerEmail,
      userId,
      deliveryAddress: deliveryAddress || "",
      deliveryLat: deliveryLat ? Number(deliveryLat) : undefined,
      deliveryLng: deliveryLng ? Number(deliveryLng) : undefined,
      note: note || "",
      paymentMethod: paymentMethod || "COD",
      paymentStatus: "PENDING",
      orderStatus: "NEW",
      subtotalAmount: subtotalAmount !== undefined ? Number(subtotalAmount) : undefined,
      couponCode: couponCode || undefined,
      discountPercent: discountPercent !== undefined ? Number(discountPercent) : undefined,
      discountAmount: discountAmount !== undefined ? Number(discountAmount) : undefined,
      totalAmount: Number(totalAmount) || 0,
      items: items || [],
    });

    return NextResponse.json({
      success: true,
      order: newOrder,
      message: "Tạo đơn hàng thành công",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ khi tạo đơn" },
      { status: 500 }
    );
  }
}
