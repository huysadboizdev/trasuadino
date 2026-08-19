import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const search = searchParams.get("search") || undefined;

    const products = dataStore.getProducts(categoryId, search);

    return NextResponse.json(
      {
        success: true,
        products,
        total: products.length,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Lỗi khi lấy danh sách món:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, price, categoryId, description, image, isAvailable, isFeatured, options } = body;

    if (!name || price === undefined || !categoryId) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập Tên món, Giá bán và Danh mục" },
        { status: 400 }
      );
    }

    const newProduct = dataStore.addProduct({
      name,
      price: Number(price),
      categoryId,
      description: description || "",
      image: image || "https://images.unsplash.com/photo-1558857563-b37cfb42e7d7?w=500&auto=format&fit=crop&q=80",
      isAvailable: isAvailable !== false,
      isFeatured: Boolean(isFeatured),
      options: options || [],
    });

    return NextResponse.json({
      success: true,
      product: newProduct,
      message: "Thêm món mới thành công",
    });
  } catch (error) {
    console.error("Lỗi khi tạo món mới:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ khi thêm món" },
      { status: 500 }
    );
  }
}
