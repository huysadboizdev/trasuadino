"use client";

import React from "react";
import { Order } from "@/lib/types";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import { PhoneActionButton } from "./PhoneActionButton";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const getPaymentMethodText = (method?: string) => {
    switch (method) {
      case "SEPAY_QR":
        return "CHUYỂN KHOẢN SEPAY";
      case "MOMO":
        return "VÍ MOMO";
      case "ZALOPAY":
        return "VÍ ZALOPAY";
      case "BANK_TRANSFER":
        return "CHUYỂN KHOẢN NGÂN HÀNG";
      case "COD":
      default:
        return "TIỀN MẶT KHI NHẬN";
    }
  };

  const getPaymentStatusText = (status?: string) => {
    return status === "PAID" ? "ĐÃ THANH TOÁN" : "CHỜ THANH TOÁN";
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="PHIẾU HÓA ĐƠN BÁN HÀNG"
      subtitle={`Đơn hàng: #${order.orderCode}`}
      maxWidth="sm"
      footer={
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2.5 w-full">
          <Button
            type="button"
            variant="outline"
            size="md"
            fullWidth
            onClick={onClose}
            className="text-xs sm:text-sm font-black min-h-[44px]"
          >
            ĐÓNG
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            onClick={handlePrint}
            className="bg-brand-900 text-white text-xs sm:text-sm font-black min-h-[44px]"
          >
            IN HÓA ĐƠN
          </Button>
        </div>
      }
    >
      <div
        id="printable-receipt"
        className="bg-white p-4 sm:p-5 border border-dashed border-neutral-300 rounded-2xl font-sans text-xs text-neutral-800 space-y-3 print:border-none min-w-0"
      >
        {/* Store Header */}
        <div className="text-center border-b border-neutral-200 pb-3">
          <h2 className="text-sm sm:text-base font-black tracking-tight text-neutral-900">
            TRÀ SỮA DINO
          </h2>
          <p className="text-[11px] text-neutral-600 mt-0.5 font-medium">
            Hotline: 0988 888 888 • Q.7 TP.HCM
          </p>
          <p className="text-[10px] text-neutral-500 mt-1">
            {new Date(order.createdAt).toLocaleString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Order Info */}
        <div className="space-y-1.5 text-xs border-b border-neutral-200 pb-3">
          <div className="flex justify-between font-bold">
            <span className="text-neutral-600">Mã hóa đơn:</span>
            <span className="font-black text-neutral-900">#{order.orderCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Khách hàng:</span>
            <span className="font-bold text-neutral-900 truncate ml-2">{order.customerName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-600">Số điện thoại:</span>
            <PhoneActionButton phone={order.customerPhone} variant="link" />
          </div>
          {order.deliveryAddress && (
            <div className="flex justify-between text-[11px]">
              <span className="flex-shrink-0 text-neutral-600">Địa chỉ:</span>
              <span className="text-right max-w-[65%] font-medium break-words ml-2 text-neutral-800">
                {order.deliveryAddress}
              </span>
            </div>
          )}
          {order.note && (
            <div className="flex justify-between text-[11px] pt-0.5">
              <span className="flex-shrink-0 text-neutral-600">Ghi chú:</span>
              <span className="text-right max-w-[65%] font-medium italic break-words ml-2 text-neutral-700">
                {order.note}
              </span>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="space-y-2 border-b border-neutral-200 pb-3 min-w-0">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start text-xs gap-2 min-w-0">
              <div className="flex-1 pr-1 min-w-0">
                <p className="font-bold text-neutral-900 truncate">
                  {item.quantity}x {item.productName}
                </p>
                {item.optionsNote && (
                  <p className="text-[10px] text-neutral-500 mt-0.5 break-words">
                    {item.optionsNote}
                  </p>
                )}
              </div>
              <span className="font-bold flex-shrink-0 text-neutral-900">
                {formatCurrency(item.totalPrice)}
              </span>
            </div>
          ))}
        </div>

        {/* Total & Payment Method */}
        <div className="space-y-1.5 text-xs pt-1">
          {order.discountAmount ? (
            <>
              <div className="flex justify-between text-[11px] text-neutral-600">
                <span>Tạm tính tiền món:</span>
                <span className="font-bold">
                  {formatCurrency(order.subtotalAmount || (order.totalAmount + order.discountAmount))}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
                <span>Giảm giá ({order.couponCode || "Voucher"}):</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            </>
          ) : null}
          <div className="flex justify-between text-xs sm:text-sm font-black pt-1.5 border-t border-neutral-200">
            <span className="text-neutral-900">TỔNG CỘNG:</span>
            <span className="text-brand-900 font-black">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-neutral-600">
            <span>Hình thức:</span>
            <span className="font-bold text-neutral-900 uppercase">
              {getPaymentMethodText(order.paymentMethod)}
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-neutral-600">
            <span>Trạng thái:</span>
            <span className={`font-bold uppercase ${order.paymentStatus === "PAID" ? "text-emerald-700" : "text-amber-700"}`}>
              {getPaymentStatusText(order.paymentStatus)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2.5 text-[11px] text-neutral-500 border-t border-neutral-100 font-medium">
          Cảm ơn quý khách và hẹn gặp lại!
        </div>
      </div>
    </BottomSheet>
  );
};
