import { NextRequest, NextResponse } from "next/server";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    const ext = path.extname(file.name) || ".jpg";
    const baseName = `tea_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 1. ƯU TIÊN UPLOAD LÊN CLOUDINARY (LƯU TRÊN CLOUD CDN TOÀN CẦU)
    try {
      const cloudResult = await uploadBufferToCloudinary(buffer, baseName, "trasua-dino");
      return NextResponse.json({
        success: true,
        url: cloudResult.secureUrl,
        publicId: cloudResult.publicId,
        provider: "cloudinary",
        message: "Tải ảnh lên Cloudinary thành công",
      });
    } catch (cloudErr) {
      console.warn("[Cloudinary Upload Warning - Fallback to Local]:", cloudErr);
    }

    // 2. DỰ PHÒNG LƯU LOCAL TRÊN MÁY CHỦ NẾU CLOUD GẶP SỰ CỐ
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const filename = `${baseName}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      provider: "local",
      message: "Tải ảnh lên máy chủ thành công",
    });
  } catch (error) {
    console.error("Lỗi khi upload ảnh:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi xử lý file trên máy chủ" },
      { status: 500 }
    );
  }
}
