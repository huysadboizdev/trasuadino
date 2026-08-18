"use client";

import React from "react";
import { Order } from "@/lib/types";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";

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
      <div className="bg-white p-3.5 sm:p-4 border border-dashed border-neutral-300 rounded-2xl font-mono text-xs text-neutral-800 space-y-3 print:border-none min-w-0">
        {/* Store Header */}
        <div className="text-center border-b border-neutral-200 pb-3">
          <h2 className="text-sm sm:text-base font-black tracking-tight text-neutral-900">
            TRÀ SỮA DINO
          </h2>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Hotline: 0988 888 888 • Q.7 TP.HCM
          </p>
          <p className="text-[10px] text-neutral-400 mt-1">
            {new Date(order.createdAt).toLocaleString("vi-VN")}
          </p>
        </div>

        {/* Order Info */}
        <div className="space-y-1 text-xs border-b border-neutral-200 pb-3">
          <div className="flex justify-between font-bold">
            <span>Mã hóa đơn:</span>
            <span>#{order.orderCode}</span>
          </div>
          <div className="flex justify-between">
            <span>Khách hàng:</span>
            <span className="font-bold truncate ml-2">{order.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span>Số điện thoại:</span>
            <span>{order.customerPhone}</span>
          </div>
          {order.deliveryAddress && (
            <div className="flex justify-between text-[11px]">
              <span className="flex-shrink-0">Địa chỉ:</span>
              <span className="text-right max-w-[65%] font-medium break-words ml-2">
                {order.deliveryAddress}
              </span>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="space-y-2 border-b border-neutral-200 pb-3 min-w-0">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start text-xs gap-2 min-w-0">
              <div className="flex-1 pr-1 min-w-0">
                <p className="font-bold truncate">
                  {item.quantity}x {item.productName}
                </p>
                {item.optionsNote && (
                  <p className="text-[10px] text-neutral-500 font-sans mt-0.5 break-words">
                    {item.optionsNote}
                  </p>
                )}
              </div>
              <span className="font-bold flex-shrink-0">
                {formatCurrency(item.totalPrice)}
              </span>
            </div>
          ))}
        </div>

        {/* Total & Payment Method */}
        <div className="space-y-1 text-xs pt-1">
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
          <div className="flex justify-between text-xs sm:text-sm font-black pt-1 border-t border-neutral-200">
            <span>TỔNG CỘNG:</span>
            <span className="text-brand-950">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-neutral-600">
            <span>Hình thức:</span>
            <span className="font-bold uppercase">
              {order.paymentMethod === "SEPAY_QR"
                ? "Chuyển khoản SePay"
                : "Tiền mặt khi nhận"}
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-neutral-600">
            <span>Trạng thái:</span>
            <span className="font-bold uppercase text-emerald-700">
              {order.paymentStatus === "PAID" ? "ĐÃ THANH TOÁN" : "CHỜ THANH TOÁN"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 text-[11px] text-neutral-400 font-sans border-t border-neutral-100">
          Cảm ơn quý khách và hẹn gặp lại!
        </div>
      </div>
    </BottomSheet>
  );
};
