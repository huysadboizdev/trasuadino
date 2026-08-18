import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export async function GET() {
  try {
    const settings = dataStore.getSettings();
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi khi lấy cài đặt" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = dataStore.updateSettings(body);
    return NextResponse.json({
      success: true,
      settings: updated,
      message: "Lưu cài đặt quán thành công",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ khi lưu cài đặt" },
      { status: 500 }
    );
  }
}
