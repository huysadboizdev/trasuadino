import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") || undefined;
    const phone = searchParams.get("phone") || undefined;
    const codes = searchParams.get("codes") || undefined;

    let orders = dataStore.getOrders();

    if (email) {
      orders = orders.filter(
        (o) => o.customerEmail?.toLowerCase() === email.toLowerCase().trim()
      );
    } else if (phone) {
      const cleanPhone = phone.trim().replace(/\s/g, "");
      orders = orders.filter((o) => o.customerPhone.replace(/\s/g, "") === cleanPhone);
    } else if (codes) {
      const codeList = codes
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);
      orders = orders.filter((o) => codeList.includes(o.orderCode.toUpperCase()));
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
