import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authServer";
import { dataStore } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);

    if (!auth.user) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Chưa đăng nhập hoặc token đã hết hạn" },
        { status: 401 }
      );
    }

    let user = dataStore.findUserById(auth.user.sub);
    const envAdminEmail = (process.env.ADMIN_EMAIL || "admin@dino.vn").trim().toLowerCase();

    if (!user && auth.user.sub === "usr-admin") {
      user = {
        id: "usr-admin",
        name: "Chủ Quán (Admin)",
        email: envAdminEmail,
        role: "ADMIN",
        address: "Cửa hàng chính",
        createdAt: new Date().toISOString(),
      };
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "USER_NOT_FOUND", message: "Người dùng không tồn tại" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role || "CUSTOMER",
        avatar: user.avatar,
        savedAddresses: user.savedAddresses || [],
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ" },
      { status: 500 }
    );
  }
}
