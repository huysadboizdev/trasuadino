import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";

// Lấy thông tin user hiện tại
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const id = searchParams.get("id");

  if (!email && !id) {
    return NextResponse.json({ success: false, message: "Thiếu tham số" }, { status: 400 });
  }

  const user = email ? dataStore.findUserByEmail(email) : dataStore.findUserById(id!);
  if (!user) {
    return NextResponse.json({ success: false, message: "Không tìm thấy người dùng" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      savedAddresses: user.savedAddresses || [],
      role: user.role,
      avatar: user.avatar,
    },
  });
}

// Cập nhật thông tin user hoặc thêm/xóa địa chỉ
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, name, phone, address, action, addressData, addressId } = body;

    const targetId = userId || email;
    if (!targetId) {
      return NextResponse.json({ success: false, message: "Thiếu userId/email" }, { status: 400 });
    }

    if (action === "ADD_ADDRESS") {
      const newAddr = dataStore.addSavedAddress(targetId, addressData);
      return NextResponse.json({ success: true, address: newAddr, message: "Đã thêm địa chỉ mới" });
    }

    if (action === "DELETE_ADDRESS") {
      const ok = dataStore.deleteSavedAddress(targetId, addressId);
      return NextResponse.json({ success: ok, message: "Đã xóa địa chỉ" });
    }

    const updatedUser = dataStore.updateUserProfile(targetId, {
      name,
      phone,
      address,
    });

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: "Cập nhật thất bại" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        savedAddresses: updatedUser.savedAddresses || [],
        role: updatedUser.role,
      },
      message: "Đã cập nhật thông tin cá nhân!",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Lỗi máy chủ" }, { status: 500 });
  }
}
