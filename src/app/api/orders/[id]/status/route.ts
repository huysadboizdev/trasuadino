import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";
import { OrderStatus } from "@/lib/types";
import { realtimeHub } from "@/lib/realtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status } = body;

    const validStatuses: OrderStatus[] = [
      "NEW",
      "PREPARING",
      "DELIVERING",
      "COMPLETED",
      "CANCELLED",
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Trạng thái đơn hàng không hợp lệ" },
        { status: 400 }
      );
    }

    const updated = dataStore.updateOrderStatus(params.id, status as OrderStatus);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    // Bắn sự kiện realtime 2 chiều: Admin <-> User cập nhật tức thì
    realtimeHub.emitOrderStatusUpdated(updated);

    return NextResponse.json({
      success: true,
      order: updated,
      message: `Đã cập nhật trạng thái đơn sang: ${status}`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ khi cập nhật đơn" },
      { status: 500 }
    );
  }
}
