import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = dataStore.toggleProductAvailability(params.id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy món" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      product,
      message: product.isAvailable
        ? `Đã chuyển sang: CÒN HÀNG (${product.name})`
        : `Đã chuyển sang: TẠM HẾT MÓN (${product.name})`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi khi cập nhật trạng thái món" },
      { status: 500 }
    );
  }
}
