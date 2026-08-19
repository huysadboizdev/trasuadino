import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const coupon = dataStore.getCouponById(params.id);
    if (!coupon) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy mã giảm giá." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Lỗi máy chủ" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = dataStore.updateCoupon(params.id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy mã giảm giá để cập nhật." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: `Cập nhật mã giảm giá "${updated.code}" thành công!`,
      coupon: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Lỗi khi cập nhật mã giảm giá" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const removed = dataStore.deleteCoupon(params.id);
    if (!removed) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy mã giảm giá để xóa." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      message: `Đã xóa mã giảm giá "${removed.code}".`,
      coupon: removed,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Lỗi khi xóa mã giảm giá" },
      { status: 500 }
    );
  }
}
