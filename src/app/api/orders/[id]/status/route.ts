import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/lib/orderService";
import { OrderStatus } from "@/lib/types";

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
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Trạng thái đơn hàng không hợp lệ" },
        { status: 400 }
      );
    }

    const result = orderService.updateStatus(params.id, status as OrderStatus, {
      source: "WEB_ADMIN",
    });

    if (!result.success) {
      const statusCode = result.reason === "NOT_FOUND" ? 404 : 500;
      return NextResponse.json(
        { success: false, message: result.message },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      message: result.message,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ khi cập nhật đơn" },
      { status: 500 }
    );
  }
}
