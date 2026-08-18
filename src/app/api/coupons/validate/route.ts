import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, orderAmount } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { valid: false, message: "Vui lòng nhập mã giảm giá." },
        { status: 400 }
      );
    }

    const numAmount = Number(orderAmount);
    if (isNaN(numAmount) || numAmount < 0) {
      return NextResponse.json(
        { valid: false, message: "Giá trị đơn hàng không hợp lệ." },
        { status: 400 }
      );
    }

    const result = dataStore.validateCoupon(code.trim(), numAmount);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      message: result.message,
      coupon: {
        id: result.coupon?.id,
        code: result.coupon?.code,
        discountPercent: result.coupon?.discountPercent,
        description: result.coupon?.description,
      },
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
    });
  } catch (error: any) {
    console.error("Lỗi khi kiểm tra mã giảm giá:", error);
    return NextResponse.json(
      { valid: false, message: error?.message || "Lỗi máy chủ khi kiểm tra mã" },
      { status: 500 }
    );
  }
}
