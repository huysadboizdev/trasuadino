import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";
import { realtimeHub } from "@/lib/realtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = dataStore.getSettings();
    return NextResponse.json(
      {
        success: true,
        settings,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
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

    // Phát sự kiện Realtime cập nhật trạng thái quán
    realtimeHub.emitStoreStatusUpdated(updated);

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
