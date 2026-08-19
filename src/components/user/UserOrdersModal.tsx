"use client";

import React, { useState, useEffect } from "react";
import { Order, OrderStatus } from "@/lib/types";
import { BottomSheet } from "../ui/BottomSheet";
import { Badge, BadgeVariant } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ConfirmModal } from "../ui/ConfirmModal";
import { SepayQrPaymentModal } from "../payment/SepayQrPaymentModal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "../ui/Toast";
import { useRealtime } from "@/hooks/useRealtime";

interface UserOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserOrdersModal: React.FC<UserOrdersModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedQrOrder, setSelectedQrOrder] = useState<Order | null>(null);

  // Custom Cancel Confirm Modal State
  const [cancellingOrder, setCancellingOrder] = useState<{ id: string; code: string } | null>(null);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [cancelOrderError, setCancelOrderError] = useState<string | null>(null);
  const [lookupPhoneInput, setLookupPhoneInput] = useState<string>("");

  const fetchUserOrders = async (manualPhone?: string) => {
    try {
      setIsLoading(true);
      let queryParam = "";

      if (user?.email) {
        queryParam = `email=${encodeURIComponent(user.email)}`;
      } else if (user?.phone) {
        queryParam = `phone=${encodeURIComponent(user.phone)}`;
      } else {
        // Khách vãng lai chưa đăng nhập: lấy từ localStorage hoặc số điện thoại nhập tra cứu
        const targetPhone =
          manualPhone !== undefined
            ? manualPhone
            : lookupPhoneInput ||
              (typeof window !== "undefined" ? localStorage.getItem("dino_guest_phone") || "" : "");

        const rawCodes = typeof window !== "undefined" ? localStorage.getItem("dino_guest_orders") : null;
        let guestCodes = "";
        try {
          if (rawCodes) {
            const arr = JSON.parse(rawCodes);
            if (Array.isArray(arr) && arr.length > 0) guestCodes = arr.join(",");
          }
        } catch (e) {}

        if (targetPhone.trim()) {
          queryParam = `phone=${encodeURIComponent(targetPhone.trim())}`;
          if (!lookupPhoneInput) setLookupPhoneInput(targetPhone.trim());
        } else if (guestCodes) {
          queryParam = `codes=${encodeURIComponent(guestCodes)}`;
        } else {
          setOrders([]);
          setIsLoading(false);
          return;
        }
      }

      const res = await fetch(`/api/user/orders?${queryParam}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Realtime lắng nghe cập nhật trạng thái đơn hàng của User hoặc Khách vãng lai
  useRealtime({
    role: "customer",
    userId: user?.id,
    phone: user?.phone || lookupPhoneInput || (typeof window !== "undefined" ? localStorage.getItem("dino_guest_phone") || undefined : undefined),
    onOrderStatusUpdated: (updatedOrder) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === updatedOrder.id || o.orderCode === updatedOrder.orderCode);
        if (exists) {
          return prev.map((o) =>
            o.id === updatedOrder.id || o.orderCode === updatedOrder.orderCode ? updatedOrder : o
          );
        }
        return [updatedOrder, ...prev];
      });
    },
    onReconnect: () => {
      fetchUserOrders();
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchUserOrders();
    }
  }, [isOpen, user]);

  const handleCancelOrderClick = (orderId: string, orderCode: string) => {
    setCancellingOrder({ id: orderId, code: orderCode });
    setCancelOrderError(null);
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrder) return;

    try {
      setIsCancellingOrder(true);
      setCancelOrderError(null);
      const res = await fetch(`/api/orders/${cancellingOrder.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (res.ok) {
        showToast(`Đã hủy đơn hàng #${cancellingOrder.code}`, "success");
        setCancellingOrder(null);
        fetchUserOrders();
      } else {
        const data = await res.json().catch(() => ({}));
        setCancelOrderError(data.message || "Không thể hủy đơn hàng. Vui lòng thử lại.");
        showToast(data.message || "Lỗi khi hủy đơn hàng", "error");
      }
    } catch (err) {
      setCancelOrderError("Lỗi kết nối máy chủ. Vui lòng thử lại.");
      showToast("Lỗi khi hủy đơn hàng", "error");
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const statusBadgeConfig: Record<
    OrderStatus,
    { label: string; variant: BadgeVariant; step: number; desc: string }
  > = {
    NEW: { label: "ĐÃ NHẬN ĐƠN", variant: "danger", step: 1, desc: "Quán đã nhận và đang chuẩn bị xếp hàng pha chế." },
    PREPARING: { label: "ĐANG PHA CHẾ", variant: "warning", step: 2, desc: "Nhân viên đang pha trà và nướng bánh tươi cho bạn." },
    DELIVERING: { label: "ĐANG GIAO HÀNG", variant: "info", step: 3, desc: "Tài xế đang giao đơn hàng đến địa chỉ của bạn." },
    COMPLETED: { label: "HOÀN TẤT", variant: "success", step: 4, desc: "🎉 Đơn hàng đã giao thành công! Chúc bạn ngon miệng và cảm ơn bạn đã mua hàng tại Trà Sữa Dino ❤️" },
    CANCELLED: { label: "ĐÃ HỦY", variant: "neutral", step: 0, desc: "Đơn hàng này đã bị hủy." },
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="ĐƠN HÀNG CỦA TÔI"
      subtitle={user ? `Tài khoản: ${user.name || user.email}` : "Theo dõi tiến độ đơn hàng"}
      maxWidth="md"
      footer={
        <Button
          variant="outline"
          size="md"
          fullWidth
          onClick={onClose}
          className="text-xs font-black uppercase"
        >
          ĐÓNG
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-neutral-500 uppercase tracking-wider">
            LỊCH SỬ ĐẶT HÀNG ({orders.length})
          </span>
          <button
            onClick={() => fetchUserOrders()}
            className="text-xs font-black uppercase text-brand-900 underline"
          >
            Làm Mới Trạng Thái
          </button>
        </div>

        {/* Thanh tra cứu theo số điện thoại cho khách vãng lai */}
        {!user && (
          <div className="bg-neutral-50 p-2.5 rounded-2xl border border-neutral-200 flex gap-2">
            <input
              type="tel"
              value={lookupPhoneInput}
              onChange={(e) => setLookupPhoneInput(e.target.value)}
              placeholder="Nhập SĐT để tra cứu đơn..."
              className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => fetchUserOrders(lookupPhoneInput)}
              className="text-xs font-black uppercase bg-brand-900 text-white rounded-xl px-3"
            >
              TRA CỨU
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-7 w-7 animate-spin rounded-full border-3 border-brand-600 border-t-transparent mb-2" />
            <p className="text-xs font-bold text-neutral-500 uppercase">
              Đang kiểm tra tiến độ đơn hàng...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
            <p className="text-sm font-black text-neutral-800 uppercase">
              CHƯA TÌM THẤY ĐƠN HÀNG NÀO
            </p>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Hãy chọn cho mình một ly trà sữa hoặc món bánh ngon lành ngoài trang chủ, hoặc nhập SĐT nhận hàng để tra cứu nhé!
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {orders.map((order) => {
              const statusCfg = statusBadgeConfig[order.orderStatus] || {
                label: order.orderStatus,
                variant: "neutral",
                step: 1,
                desc: "",
              };

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm space-y-3"
                >
                  {/* Progress Bar 4 bước */}
                  {order.orderStatus !== "CANCELLED" && (
                    <div className="grid grid-cols-4 gap-1">
                      {[1, 2, 3, 4].map((s) => (
                        <div
                          key={s}
                          className={`h-1.5 rounded-full transition-all ${
                            s <= statusCfg.step
                              ? order.orderStatus === "COMPLETED"
                                ? "bg-emerald-600"
                                : order.orderStatus === "DELIVERING"
                                ? "bg-sky-600"
                                : order.orderStatus === "PREPARING"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                              : "bg-neutral-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Header Đơn */}
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                    <div>
                      <span className="font-black text-brand-950 text-sm">
                        #{order.orderCode}
                      </span>
                      <p className="text-[10px] text-neutral-400 font-bold mt-0.5">
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <Badge variant={statusCfg.variant} size="sm" dot>
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {/* Mô tả tiến trình hiện tại */}
                  <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700">
                    ℹ️ {statusCfg.desc}
                  </div>

                  {/* Địa chỉ giao hàng cụ thể */}
                  <div className="text-xs text-neutral-600 font-medium">
                    <span className="font-bold text-neutral-900">📍 Địa chỉ giao:</span>{" "}
                    {order.deliveryAddress}
                  </div>

                  {/* Danh sách món */}
                  <div className="space-y-1.5 text-xs pt-1 border-t border-neutral-100">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <div>
                          <span className="font-bold text-neutral-900">
                            {item.quantity}x {item.productName}
                          </span>
                          {item.optionsNote && (
                            <p className="text-[11px] text-neutral-500 font-medium">
                              {item.optionsNote}
                            </p>
                          )}
                        </div>
                        <span className="font-black text-neutral-800">
                          {formatCurrency(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer Tổng tiền, Hủy đơn & Trạng thái thanh toán */}
                  <div className="pt-2.5 border-t border-neutral-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-neutral-500 block">
                        Tổng thanh toán:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm sm:text-base font-black text-brand-900">
                          {formatCurrency(order.totalAmount)}
                        </span>
                        {order.couponCode && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            🏷️ -{formatCurrency(order.discountAmount || 0)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {order.orderStatus === "NEW" && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancelOrderClick(order.id, order.orderCode)}
                          className="text-[11px] font-bold px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200"
                        >
                          HỦY ĐƠN
                        </Button>
                      )}

                      {order.paymentMethod === "SEPAY_QR" ? (
                        order.paymentStatus === "PAID" ? (
                          <Badge variant="success" size="sm">
                            ĐÃ THANH TOÁN
                          </Badge>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSelectedQrOrder(order)}
                            className="text-xs font-black uppercase bg-brand-800 hover:bg-brand-900 text-white shadow-2xs"
                          >
                            QUÉT QR SEPAY
                          </Button>
                        )
                      ) : (
                        <Badge variant="neutral" size="sm">
                          COD
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Hiện QR SePay lại nếu đơn chưa thanh toán */}
      {selectedQrOrder && (
        <SepayQrPaymentModal
          isOpen={Boolean(selectedQrOrder)}
          onClose={() => setSelectedQrOrder(null)}
          orderCode={selectedQrOrder.orderCode}
          totalAmount={selectedQrOrder.totalAmount}
          onPaymentSuccess={() => {
            fetchUserOrders();
            showToast(`🎉 Đơn hàng #${selectedQrOrder.orderCode} đã được thanh toán thành công!`, "success");
          }}
        />
      )}

      {/* Custom Cancel Order Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(cancellingOrder)}
        onClose={() => {
          if (!isCancellingOrder) {
            setCancellingOrder(null);
            setCancelOrderError(null);
          }
        }}
        onConfirm={handleConfirmCancelOrder}
        title="Hủy đơn hàng?"
        message="Bạn có chắc chắn muốn hủy đơn hàng này không?"
        highlightText={cancellingOrder ? `#${cancellingOrder.code}` : undefined}
        highlightLabel="MÃ ĐƠN HÀNG"
        warningText="Đơn hàng sau khi hủy sẽ không thể khôi phục."
        confirmLabel="XÁC NHẬN HỦY ĐƠN"
        cancelLabel="ĐÓNG"
        variant="danger"
        isLoading={isCancellingOrder}
        errorMessage={cancelOrderError}
      />
    </BottomSheet>
  );
};
