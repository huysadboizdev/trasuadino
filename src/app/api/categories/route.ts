import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export async function GET() {
  try {
    const categories = dataStore.getCategories();
    return NextResponse.json({
      success: true,
      categories,
      total: categories.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi khi lấy danh mục" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, orderIndex } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập tên danh mục" },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");

    const newCat = dataStore.addCategory({
      name: name.trim(),
      slug,
      description: description?.trim() || "",
      orderIndex: Number(orderIndex) || 0,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      category: newCat,
      message: "Thêm danh mục mới thành công",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ khi thêm danh mục" },
      { status: 500 }
    );
  }
}
