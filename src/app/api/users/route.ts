import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const users = dataStore.getUsers();
    return NextResponse.json(
      {
        success: true,
        users,
        total: users.length,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi khi lấy danh sách người dùng" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, role, address } = body;

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập Họ tên và Số điện thoại" },
        { status: 400 }
      );
    }

    const newUser = dataStore.addUser({
      name: name.trim(),
      phone: phone.trim(),
      role: role || "STAFF",
      address: address?.trim() || "",
    });

    return NextResponse.json({
      success: true,
      user: newUser,
      message: "Thêm tài khoản thành công",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ khi thêm tài khoản" },
      { status: 500 }
    );
  }
}
