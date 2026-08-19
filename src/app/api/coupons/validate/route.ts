import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, orderAmount, items, user, userId, customerEmail, customerPhone } = body;

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

    const userInfo = user || {
      id: userId,
      email: customerEmail,
      phone: customerPhone,
    };

    const result = dataStore.validateCoupon(code.trim(), numAmount, items, userInfo);

    if (!result.valid) {
      return NextResponse.json(
        {
          valid: false,
          reason: result.reason,
          message: result.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      message: result.message,
      coupon: {
        id: result.coupon?.id,
        code: result.coupon?.code,
        discountType: result.coupon?.discountType,
        discountValue: result.coupon?.discountValue,
        discountPercent: result.coupon?.discountPercent,
        maxDiscountAmount: result.coupon?.maxDiscountAmount,
        minOrderAmount: result.coupon?.minOrderAmount,
        description: result.coupon?.description,
      },
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      qualifyingAmount: result.qualifyingAmount,
    });
  } catch (error: any) {
    console.error("Lỗi khi kiểm tra mã giảm giá:", error);
    return NextResponse.json(
      { valid: false, message: error?.message || "Lỗi máy chủ khi kiểm tra mã" },
      { status: 500 }
    );
  }
}
