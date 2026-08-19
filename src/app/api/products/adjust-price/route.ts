import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scope, productIds, adjustmentType, direction, amount, roundTo } = body;

    if (!scope || (scope !== "ALL" && scope !== "SELECTED")) {
      return NextResponse.json(
        { success: false, message: "Phạm vi điều chỉnh giá không hợp lệ (ALL hoặc SELECTED)." },
        { status: 400 }
      );
    }

    if (scope === "SELECTED" && (!Array.isArray(productIds) || productIds.length === 0)) {
      return NextResponse.json(
        { success: false, message: "Vui lòng chọn ít nhất 1 sản phẩm để điều chỉnh giá." },
        { status: 400 }
      );
    }

    if (!adjustmentType || (adjustmentType !== "FIXED" && adjustmentType !== "PERCENT")) {
      return NextResponse.json(
        { success: false, message: "Hình thức điều chỉnh không hợp lệ (FIXED hoặc PERCENT)." },
        { status: 400 }
      );
    }

    const numAmount = Math.abs(Number(amount));
    if (isNaN(numAmount) || numAmount === 0) {
      return NextResponse.json(
        { success: false, message: "Số tiền hoặc phần trăm điều chỉnh giá không hợp lệ." },
        { status: 400 }
      );
    }

    const effectiveDirection = direction === "DECREASE" ? "DECREASE" : "INCREASE";

    const result = dataStore.adjustProductPrices({
      scope,
      productIds,
      adjustmentType,
      direction: effectiveDirection,
      amount: numAmount,
      roundTo: roundTo !== undefined ? Number(roundTo) : 1000,
    });

    const actionText = effectiveDirection === "DECREASE" ? "giảm giá" : "tăng giá";

    return NextResponse.json({
      message: `Đã ${actionText} thành công cho ${result.updatedCount} sản phẩm!`,
      ...result,
    });
  } catch (error: any) {
    console.error("Lỗi khi điều chỉnh giá sản phẩm:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Lỗi máy chủ khi điều chỉnh giá" },
      { status: 500 }
    );
  }
}
