import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") || undefined;
    const phone = searchParams.get("phone") || undefined;

    let orders = dataStore.getOrders();

    if (email) {
      orders = orders.filter(
        (o) => o.customerEmail?.toLowerCase() === email.toLowerCase().trim()
      );
    } else if (phone) {
      orders = orders.filter((o) => o.customerPhone === phone.trim());
    }

    return NextResponse.json({
      success: true,
      orders,
      total: orders.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi lấy danh sách đơn hàng" },
      { status: 500 }
    );
  }
}
