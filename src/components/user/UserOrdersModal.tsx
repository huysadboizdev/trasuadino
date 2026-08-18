"use client";

import React, { useState, useEffect } from "react";
import { Order, OrderStatus } from "@/lib/types";
import { BottomSheet } from "../ui/BottomSheet";
import { Badge, BadgeVariant } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "../ui/Toast";

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

  const fetchUserOrders = async () => {
    if (!user?.email && !user?.phone) return;
    try {
      setIsLoading(true);
      const queryParam = user.email
        ? `email=${encodeURIComponent(user.email)}`
        : `phone=${encodeURIComponent(user.phone || "")}`;
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

  useEffect(() => {
    if (isOpen) {
      fetchUserOrders();
    }
  }, [isOpen, user]);

  const handleCancelOrder = async (orderId: string, orderCode: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${orderCode}?`)) return;

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (res.ok) {
        showToast(`Đã hủy đơn hàng #${orderCode}`, "info");
        fetchUserOrders();
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi hủy đơn hàng", "error");
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
    COMPLETED: { label: "HOÀN TẤT", variant: "success", step: 4, desc: "Đơn hàng đã được giao thành công. Chúc bạn ngon miệng!" },
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
            onClick={fetchUserOrders}
            className="text-xs font-black uppercase text-brand-900 underline"
          >
            Làm Mới Trạng Thái
          </button>
        </div>

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
              BẠN CHƯA CÓ ĐƠN HÀNG NÀO
            </p>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Hãy chọn cho mình một ly trà sữa hoặc món bánh ngon lành ngoài trang chủ nhé!
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
                          onClick={() => handleCancelOrder(order.id, order.orderCode)}
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
        <BottomSheet
          isOpen={Boolean(selectedQrOrder)}
          onClose={() => setSelectedQrOrder(null)}
          title="MÃ VIETQR THANH TOÁN"
          subtitle={`Đơn hàng #${selectedQrOrder.orderCode}`}
          maxWidth="sm"
          footer={
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => setSelectedQrOrder(null)}
              className="bg-brand-900 text-white font-black"
            >
              ĐÓNG
            </Button>
          }
        >
          <div className="text-center space-y-3 py-2">
            <p className="text-xs font-bold text-neutral-700">
              Quét mã chuyển khoản {formatCurrency(selectedQrOrder.totalAmount)}:
            </p>
            <div className="w-48 h-48 mx-auto bg-white p-2 rounded-2xl border border-neutral-300 shadow-sm flex items-center justify-center">
              <img
                src={`https://qr.sepay.vn/img?acc=0988888888&bank=MBBank&amount=${selectedQrOrder.totalAmount}&des=${selectedQrOrder.orderCode}`}
                alt="Mã QR VietQR SePay"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-xs font-mono font-black text-brand-950 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
              Nội dung: {selectedQrOrder.orderCode}
            </p>
          </div>
        </BottomSheet>
      )}
    </BottomSheet>
  );
};
