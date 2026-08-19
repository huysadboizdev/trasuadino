import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { role } = body;

    const updated = dataStore.updateUserRole(params.id, role);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy người dùng" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      user: updated,
      message: "Cập nhật quyền thành công",
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
    const deleted = dataStore.deleteUser(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy người dùng để xóa" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      user: deleted,
      message: "Đã xóa tài khoản thành công",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Lỗi máy chủ" }, { status: 500 });
  }
}
