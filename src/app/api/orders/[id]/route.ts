import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Thiếu mã định danh đơn hàng" },
        { status: 400 }
      );
    }

    const order = dataStore.getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, order },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đơn hàng:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ khi lấy thông tin đơn hàng" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Thiếu mã định danh đơn hàng cần xóa" },
        { status: 400 }
      );
    }

    const deleted = dataStore.deleteOrder(orderId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy đơn hàng để xóa hoặc đơn đã bị xóa trước đó" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: deleted,
      message: `Đã xóa đơn hàng #${deleted.orderCode} thành công`,
    });
  } catch (error) {
    console.error("Lỗi khi xóa đơn hàng:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ khi xóa đơn hàng" },
      { status: 500 }
    );
  }
}
