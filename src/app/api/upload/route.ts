import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy file tải lên" },
        { status: 400 }
      );
    }

    // Kiểm tra định dạng ảnh
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Chỉ hỗ trợ file ảnh JPG, PNG, WebP" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Đường dẫn thư mục uploads trên máy chủ
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Tạo tên file ngẫu nhiên an toàn
    const ext = path.extname(file.name) || ".jpg";
    const filename = `tea_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    await writeFile(filepath, buffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      message: "Tải ảnh lên thành công",
    });
  } catch (error) {
    console.error("Lỗi khi upload ảnh:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi xử lý file trên máy chủ" },
      { status: 500 }
    );
  }
}
