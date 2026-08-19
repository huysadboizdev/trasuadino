import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/store";
import { notifyTelegramNewOrder } from "@/lib/telegram/notifications";
import { realtimeHub } from "@/lib/realtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;

    const orders = dataStore.getOrders(status);

    return NextResponse.json(
      {
        success: true,
        orders,
        total: orders.length,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Lỗi khi lấy danh sách đơn hàng" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      userId,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      note,
      items,
      paymentMethod,
      subtotalAmount,
      couponCode,
      discountPercent,
      discountAmount,
      totalAmount,
    } = body;

    const cleanName = customerName ? String(customerName).trim() : "";
    const cleanPhone = customerPhone ? String(customerPhone).trim().replace(/\s/g, "") : "";
    const cleanAddress = deliveryAddress ? String(deliveryAddress).trim() : "";

    const isNameValid = cleanName.length >= 2;
    const isPhoneValid = /^[0-9+]{9,12}$/.test(cleanPhone);
    const isAddressValid = cleanAddress.length >= 5;

    if (!isNameValid || !isPhoneValid || !isAddressValid || !items || items.length === 0) {
      const missing = [];
      if (!isNameValid) missing.push("Tên Facebook người nhận");
      if (!isPhoneValid) missing.push("Số điện thoại");
      if (!isAddressValid) missing.push("Địa chỉ giao hàng");
      if (!items || items.length === 0) missing.push("Món trong giỏ");

      return NextResponse.json(
        {
          success: false,
          message: `Bạn chưa cập nhật đầy đủ thông tin giao hàng: ${missing.join(", ")}`,
          missingFields: {
            name: !isNameValid,
            phone: !isPhoneValid,
            address: !isAddressValid,
          },
        },
        { status: 400 }
      );
    }

    const calculatedSubtotal = items.reduce((sum: number, it: any) => sum + (Number(it.totalPrice) || 0), 0);
    let verifiedDiscount = Number(discountAmount) || 0;
    let verifiedFinalTotal = Number(totalAmount) || calculatedSubtotal;

    // Backend validation chặt chẽ cho mã giảm giá trước khi chốt đơn
    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      const valResult = dataStore.validateCoupon(
        couponCode.trim(),
        calculatedSubtotal,
        items,
        { id: userId, email: customerEmail, phone: customerPhone }
      );

      if (!valResult.valid) {
        return NextResponse.json(
          {
            success: false,
            message: `Mã giảm giá không hợp lệ: ${valResult.message}`,
            reason: valResult.reason,
          },
          { status: 400 }
        );
      }

      verifiedDiscount = valResult.discountAmount || 0;
      verifiedFinalTotal = valResult.finalAmount ?? Math.max(0, calculatedSubtotal - verifiedDiscount);
    }

    const newOrder = dataStore.createOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : undefined,
      userId: userId || undefined,
      deliveryAddress: deliveryAddress || "",
      deliveryLat: deliveryLat ? Number(deliveryLat) : undefined,
      deliveryLng: deliveryLng ? Number(deliveryLng) : undefined,
      note: note || "",
      paymentMethod: paymentMethod || "COD",
      paymentStatus: "PENDING",
      orderStatus: "NEW",
      subtotalAmount: calculatedSubtotal,
      couponCode: couponCode ? couponCode.trim().toUpperCase() : undefined,
      discountPercent: discountPercent !== undefined ? Number(discountPercent) : undefined,
      discountAmount: verifiedDiscount,
      totalAmount: verifiedFinalTotal,
      items: items || [],
    });

    // Đối với đơn COD: Bắn thông báo Telegram và Realtime lập tức cho Admin/Quán
    if (newOrder.paymentMethod === "COD") {
      realtimeHub.emitOrderCreated(newOrder);
      notifyTelegramNewOrder(newOrder).catch((err) => {
        console.error("[Telegram Notification Error]:", err);
      });
    } else {
      console.log(`==> [ORDER CREATED] Đơn #${newOrder.orderCode} (SEPAY_QR) đang chờ khách thanh toán trong 5 phút...`);
    }

    return NextResponse.json({
      success: true,
      order: newOrder,
      message: "Tạo đơn hàng thành công",
    });
  } catch (error: any) {
    console.error("Lỗi khi tạo đơn hàng:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Lỗi máy chủ khi tạo đơn" },
      { status: 500 }
    );
  }
}
