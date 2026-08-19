import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = dataStore.getCategoryById(params.id);
    if (!category) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy danh mục" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, category });
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
    const updated = dataStore.updateCategory(params.id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy danh mục" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      category: updated,
      message: "Cập nhật danh mục thành công",
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
    const deleted = dataStore.deleteCategory(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy danh mục để xóa" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      category: deleted,
      message: "Đã xóa danh mục thành công",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Lỗi máy chủ" }, { status: 500 });
  }
}
