import { NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export async function POST() {
  try {
    const result = dataStore.seedNhungMenu();
    return NextResponse.json({
      success: true,
      message: "Đã nạp toàn bộ thực đơn Quán Nhung (44 món đồ uống + 4 món topping) thành công!",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi khi nạp dữ liệu menu:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ khi nạp menu" },
      { status: 500 }
    );
  }
}
