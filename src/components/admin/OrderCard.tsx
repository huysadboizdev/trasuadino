"use client";

import React, { useState } from "react";
import { Order, OrderStatus } from "@/lib/types";
import { Badge, BadgeVariant } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import { PhoneActionButton } from "./PhoneActionButton";

interface OrderCardProps {
  order: Order;
  onStatusChange: (id: string, newStatus: OrderStatus) => Promise<void>;
  onViewReceipt?: (order: Order) => void;
  onDelete?: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onStatusChange,
  onViewReceipt,
  onDelete,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { showToast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const handleUpdate = async (status: OrderStatus) => {
    try {
      setIsUpdating(true);
      await onStatusChange(order.id, status);
      showToast(`Đã chuyển đơn #${order.orderCode} sang trạng thái: ${status}`, "success");
    } finally {
      setIsUpdating(false);
    }
  };

  const statusBadgeConfig: Record<
    OrderStatus,
    { label: string; variant: BadgeVariant; step: number }
  > = {
    NEW: { label: "MỚI NHẬN", variant: "danger", step: 1 },
    PREPARING: { label: "ĐANG PHA CHẾ", variant: "warning", step: 2 },
    DELIVERING: { label: "ĐANG GIAO", variant: "info", step: 3 },
    DELIVERED: { label: "GIAO THÀNH CÔNG", variant: "info", step: 4 },
    COMPLETED: { label: "HOÀN TẤT", variant: "success", step: 5 },
    CANCELLED: { label: "ĐÃ HỦY", variant: "neutral", step: 0 },
  };

  const statusConfig = statusBadgeConfig[order.orderStatus] || {
    label: order.orderStatus,
    variant: "neutral",
    step: 1,
  };

  return (
    <div
      className={`bg-white rounded-3xl p-3.5 sm:p-5 border transition-all duration-200 shadow-sm flex flex-col justify-between hover:shadow-md min-w-0 ${
        order.orderStatus === "NEW"
          ? "border-rose-300 ring-2 ring-rose-500/20 bg-rose-50/10"
          : order.orderStatus === "PREPARING"
          ? "border-amber-300 bg-amber-50/10"
          : order.orderStatus === "DELIVERED"
          ? "border-teal-300 bg-teal-50/10"
          : "border-neutral-200"
      }`}
    >
      <div className="min-w-0">
        {/* Progress Bar hiển thị tiến độ đơn */}
        {order.orderStatus !== "CANCELLED" && (
          <div className="grid grid-cols-5 gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s <= statusConfig.step
                    ? order.orderStatus === "COMPLETED"
                      ? "bg-emerald-600"
                      : order.orderStatus === "DELIVERED"
                      ? "bg-teal-600"
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

        {/* Top bar: Order Code + Time + Status Badge + Payment Badge */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-neutral-100 pb-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-base font-black text-brand-950 tracking-tight truncate">
                #{order.orderCode}
              </span>
              <Badge variant={statusConfig.variant} size="sm" dot className="text-[10px] sm:text-xs">
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-[11px] text-neutral-400 font-bold mt-0.5">
              {formatTime(order.createdAt)}
            </p>
          </div>

          {/* Payment Status Badge + Delete Action */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {order.paymentMethod === "SEPAY_QR" ? (
              order.paymentStatus === "PAID" ? (
                <Badge variant="success" size="sm" className="text-[10px]">
                  ĐÃ TRẢ SEPAY
                </Badge>
              ) : (
                <Badge variant="warning" size="sm" className="text-[10px]">
                  CHỜ SEPAY
                </Badge>
              )
            ) : (
              <Badge variant="neutral" size="sm" className="text-[10px]">
                TIỀN MẶT (COD)
              </Badge>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(order);
                }}
                title={`Xóa đơn hàng #${order.orderCode}`}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                aria-label={`Xóa đơn hàng #${order.orderCode}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Customer Information (with Direct Call Button for Mobile / Copy for Desktop) */}
        <div className="bg-neutral-50 rounded-2xl p-3 sm:p-3.5 border border-neutral-200/80 mb-3.5 space-y-2 min-w-0">
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <span className="text-xs font-black text-neutral-900 uppercase truncate min-w-0 flex-1">
              {order.customerName || "Khách"}
            </span>
            <PhoneActionButton phone={order.customerPhone} />
          </div>

          {order.deliveryAddress && (
            <p className="text-xs text-neutral-600 font-medium break-words">
              <span className="font-bold text-neutral-800">Địa chỉ:</span>{" "}
              {order.deliveryAddress}
            </p>
          )}

          {order.note && (
            <p className="text-xs text-amber-950 bg-amber-50 p-2 sm:p-2.5 rounded-xl border border-amber-200 font-bold break-words">
              Ghi chú: {order.note}
            </p>
          )}
        </div>

        {/* Order Items List with Highlighting */}
        <div className="space-y-2 mb-4 min-w-0">
          <p className="text-[11px] font-black text-neutral-400 uppercase tracking-wider">
            DANH SÁCH MÓN ({order.items.length})
          </p>
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-2 text-xs border-b border-neutral-100 pb-2.5 last:border-0 min-w-0"
            >
              <div className="flex-1 min-w-0 pr-1">
                <p className="font-black text-neutral-900 text-xs sm:text-sm truncate">
                  <span className="text-brand-700 font-black">{item.quantity}x</span>{" "}
                  {item.productName}
                </p>
                {item.optionsNote && (
                  <p className="text-[11px] text-brand-950 font-bold bg-brand-50/70 px-2 py-0.5 rounded-lg mt-1 border border-brand-200/60 break-words inline-block max-w-full">
                    {item.optionsNote}
                  </p>
                )}
              </div>
              <span className="font-black text-neutral-800 flex-shrink-0 text-xs sm:text-sm mt-0.5">
                {formatCurrency(item.totalPrice)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Total Amount & Action Controls */}
      <div className="pt-3 border-t border-neutral-200">
        {order.couponCode && (
          <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 mb-2">
            <span>🏷️ Voucher: <b>{order.couponCode}</b></span>
            <span className="font-bold">-{formatCurrency(order.discountAmount || 0)}</span>
          </div>
        )}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase text-neutral-600">
            TỔNG TIỀN ĐƠN:
          </span>
          <span className="text-lg sm:text-xl font-black text-brand-900">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>

        {/* Status Workflow Action Buttons */}
        <div className="space-y-2">
          {order.orderStatus === "NEW" && (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleUpdate("CANCELLED")}
                disabled={isUpdating}
                className="col-span-1 text-[11px] sm:text-xs font-black bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-1 truncate"
              >
                HỦY ĐƠN
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleUpdate("PREPARING")}
                disabled={isUpdating}
                className="col-span-2 text-[11px] sm:text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-sm tracking-wider uppercase px-1 truncate"
              >
                NHẬN ĐƠN & LÀM
              </Button>
            </div>
          )}

          {order.orderStatus === "PREPARING" && (
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => handleUpdate("DELIVERING")}
              disabled={isUpdating}
              className="text-xs font-black bg-sky-600 hover:bg-sky-700 text-white shadow-sm tracking-wider uppercase"
            >
              GIAO CHO SHIPPER / KHÁCH
            </Button>
          )}

          {order.orderStatus === "DELIVERING" && (
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleUpdate("CANCELLED")}
                disabled={isUpdating}
                className="col-span-1 text-[11px] sm:text-xs font-black bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-1 truncate"
              >
                HỦY ĐƠN
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleUpdate("DELIVERED")}
                disabled={isUpdating}
                className="col-span-2 text-[11px] sm:text-xs font-black bg-teal-600 hover:bg-teal-700 text-white shadow-sm tracking-wider uppercase px-1 truncate"
              >
                ✅ GIAO THÀNH CÔNG
              </Button>
            </div>
          )}

          {order.orderStatus === "DELIVERED" && (
            <Button
              variant="success"
              size="md"
              fullWidth
              onClick={() => handleUpdate("COMPLETED")}
              disabled={isUpdating}
              className="text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm tracking-wider uppercase"
            >
              💰 XÁC NHẬN HOÀN TẤT & DOANH THU
            </Button>
          )}

          {order.orderStatus === "COMPLETED" && (
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
              <span>Đã hoàn tất</span>
              {onViewReceipt && (
                <button
                  type="button"
                  onClick={() => onViewReceipt(order)}
                  className="text-xs font-black uppercase text-emerald-950 underline hover:text-emerald-700"
                >
                  Xem Hóa Đơn
                </button>
              )}
            </div>
          )}

          {order.orderStatus === "CANCELLED" && (
            <div className="text-center text-xs font-bold text-neutral-500 bg-neutral-100 py-2.5 rounded-xl">
              Đơn hàng này đã bị hủy
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
