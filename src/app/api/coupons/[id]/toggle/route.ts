import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const coupon = dataStore.toggleCoupon(params.id);
    if (!coupon) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy mã giảm giá." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      coupon,
      message: coupon.isActive
        ? `Đã kích hoạt mã "${coupon.code}"`
        : `Đã tắt mã "${coupon.code}"`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Lỗi máy chủ" },
      { status: 500 }
    );
  }
}
