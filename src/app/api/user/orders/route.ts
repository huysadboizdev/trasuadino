import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.trim();
    const phone = searchParams.get("phone")?.trim();
    const code = searchParams.get("code")?.trim();
    const codes = searchParams.get("codes")?.trim();
    const token = searchParams.get("token")?.trim();
    const tokens = searchParams.get("tokens")?.trim();
    const query = searchParams.get("query")?.trim() || searchParams.get("q")?.trim();

    let orders = dataStore.getOrders();

    if (query) {
      const cleanQ = query.replace(/^#/, "").toUpperCase();
      const cleanPhoneQ = query.replace(/\s/g, "");
      orders = orders.filter((o) => {
        const matchCode = o.orderCode.toUpperCase().includes(cleanQ) || o.id.toUpperCase() === cleanQ;
        const matchPhone = o.customerPhone.replace(/\s/g, "").includes(cleanPhoneQ);
        const matchEmail = o.customerEmail && o.customerEmail.toLowerCase().includes(query.toLowerCase());
        const matchToken = o.trackingToken && o.trackingToken === query;
        return matchCode || matchPhone || matchEmail || matchToken;
      });
    } else if (code) {
      const cleanCode = code.replace(/^#/, "").toUpperCase();
      orders = orders.filter(
        (o) =>
          o.orderCode.toUpperCase() === cleanCode ||
          o.orderCode.toUpperCase().endsWith(`-${cleanCode}`) ||
          o.id.toUpperCase() === cleanCode
      );
    } else if (email) {
      orders = orders.filter(
        (o) => o.customerEmail?.toLowerCase() === email.toLowerCase().trim()
      );
    } else if (phone) {
      const cleanPhone = phone.replace(/\s/g, "");
      orders = orders.filter((o) => o.customerPhone.replace(/\s/g, "") === cleanPhone);
    } else if (token) {
      orders = orders.filter((o) => o.trackingToken === token);
    } else if (tokens) {
      const tokenList = tokens.split(",").map((t) => t.trim()).filter(Boolean);
      orders = orders.filter((o) => o.trackingToken && tokenList.includes(o.trackingToken));
    } else if (codes) {
      const codeList = codes
        .split(",")
        .map((c) => c.replace(/^#/, "").trim().toUpperCase())
        .filter(Boolean);
      orders = orders.filter((o) =>
        codeList.some((c) => o.orderCode.toUpperCase() === c || o.orderCode.toUpperCase().endsWith(`-${c}`))
      );
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
