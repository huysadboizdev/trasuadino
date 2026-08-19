import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = dataStore.getProductById(params.id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy món" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, product });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = dataStore.updateProduct(params.id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy món để cập nhật" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      product: updated,
      message: "Cập nhật thông tin món thành công",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = dataStore.deleteProduct(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy món để xóa" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      product: deleted,
      message: "Đã xóa món thành công",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Lỗi máy chủ" }, { status: 500 });
  }
}
