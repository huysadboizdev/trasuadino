import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export async function GET() {
  try {
    const coupons = dataStore.getCoupons();
    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    console.error("Lỗi khi lấy danh sách mã giảm giá:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ khi lấy danh sách mã giảm giá" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, description, discountPercent, minOrderAmount, maxDiscountAmount, startDate, endDate, isActive, usageLimit } = body;

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập mã giảm giá (Code)." },
        { status: 400 }
      );
    }

    const pct = Number(discountPercent);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      return NextResponse.json(
        { success: false, message: "Phần trăm giảm giá phải từ 1% đến 100%." },
        { status: 400 }
      );
    }

    const newCoupon = dataStore.createCoupon({
      code,
      description,
      discountPercent: pct,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      isActive: isActive !== false,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Tạo mã giảm giá "${newCoupon.code}" thành công!`,
      coupon: newCoupon,
    });
  } catch (error: any) {
    console.error("Lỗi khi tạo mã giảm giá:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Lỗi máy chủ khi tạo mã giảm giá" },
      { status: 400 }
    );
  }
}
