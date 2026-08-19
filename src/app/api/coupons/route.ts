import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const coupons = dataStore.getCoupons();
    return NextResponse.json(
      { success: true, coupons },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
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
    const {
      code,
      description,
      discountType = "PERCENT",
      discountValue,
      discountPercent,
      minOrderAmount,
      maxDiscountAmount,
      minCompletedOrders,
      minTotalSpent,
      customerScope,
      usageLimit,
      usagePerUser,
      startDate,
      endDate,
      applyScope,
      applicableCategoryIds,
      applicableProductIds,
      isActive,
    } = body;

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập mã giảm giá (Code)." },
        { status: 400 }
      );
    }

    const cleanType = discountType === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : "PERCENT";
    const value = Number(discountValue ?? discountPercent);

    if (isNaN(value) || value <= 0) {
      return NextResponse.json(
        { success: false, message: "Giá trị giảm giá phải lớn hơn 0." },
        { status: 400 }
      );
    }

    if (cleanType === "PERCENT" && value > 100) {
      return NextResponse.json(
        { success: false, message: "Phần trăm giảm giá không được vượt quá 100%." },
        { status: 400 }
      );
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return NextResponse.json(
        { success: false, message: "Thời gian bắt đầu không được lớn hơn thời gian kết thúc." },
        { status: 400 }
      );
    }

    const newCoupon = dataStore.createCoupon({
      code,
      description,
      discountType: cleanType,
      discountValue: value,
      discountPercent: cleanType === "PERCENT" ? value : undefined,
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      minCompletedOrders: minCompletedOrders ? Number(minCompletedOrders) : undefined,
      minTotalSpent: minTotalSpent ? Number(minTotalSpent) : undefined,
      customerScope: customerScope || "ALL",
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      usagePerUser: usagePerUser ? Number(usagePerUser) : 1,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      applyScope: applyScope || "ALL",
      applicableCategoryIds: Array.isArray(applicableCategoryIds) ? applicableCategoryIds : [],
      applicableProductIds: Array.isArray(applicableProductIds) ? applicableProductIds : [],
      isActive: isActive !== false,
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
