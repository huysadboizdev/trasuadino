"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/constants";
import { generateVietQRUrl, paymentConfig } from "@/lib/paymentConfig";

interface SepayQrPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderCode: string;
  totalAmount: number;
  onPaymentSuccess?: () => void;
  onViewOrders?: () => void;
}

export function SepayQrPaymentModal({
  isOpen,
  onClose,
  orderCode,
  totalAmount,
  onPaymentSuccess,
  onViewOrders,
}: SepayQrPaymentModalProps) {
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PAID" | "ERROR">("PENDING");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrLoaded, setQrLoaded] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const bankAccount = paymentConfig.sepay.bankAccount;
  const bankHolder = paymentConfig.sepay.bankHolder;
  const bankName = paymentConfig.sepay.bankName;
  const bankCode = paymentConfig.sepay.bankCode;

  const qrUrl = generateVietQRUrl({
    amount: totalAmount,
    orderCode: orderCode,
    bankCode: bankCode,
    accountNumber: bankAccount,
    template: "compact",
  });

  // Polling kiểm tra trạng thái thanh toán mỗi 3 giây
  useEffect(() => {
    if (!isOpen || paymentStatus === "PAID" || !orderCode) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderCode)}/payment-status`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.paid || data.paymentStatus === "PAID") {
            setPaymentStatus("PAID");
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            if (onPaymentSuccess) {
              onPaymentSuccess();
            }
          }
        }
      } catch (err) {
        console.error("Lỗi khi kiểm tra thanh toán:", err);
      }
    };

    // Kiểm tra ngay 1 lần khi mở
    checkStatus();

    // Bắt đầu interval polling
    pollIntervalRef.current = setInterval(checkStatus, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isOpen, orderCode, paymentStatus, onPaymentSuccess]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={paymentStatus === "PAID" ? "🎉 THANH TOÁN THÀNH CÔNG!" : "THANH TOÁN VIETQR"}
      subtitle={`Mã đơn hàng: #${orderCode}`}
      maxWidth="md"
      footer={
        <div className="space-y-2 w-full">
          {paymentStatus === "PAID" ? (
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => {
                onClose();
                if (onViewOrders) onViewOrders();
              }}
              className="text-xs sm:text-sm font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl shadow-md"
            >
              Xem tiến độ đơn hàng →
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => {
                onClose();
                if (onViewOrders) onViewOrders();
              }}
              className="text-xs font-bold uppercase tracking-wider py-3 rounded-2xl"
            >
              Tôi đã chuyển khoản / Xem đơn hàng
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 py-1 text-center">
        {paymentStatus === "PAID" ? (
          /* TRẠNG THÁI THANH TOÁN THÀNH CÔNG */
          <div className="py-4 space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 border-2 border-emerald-300 text-emerald-600 text-3xl font-black shadow-sm">
              ✓
            </div>
            <div>
              <h4 className="text-lg sm:text-xl font-black text-emerald-950 uppercase tracking-tight">
                Xác nhận đã thanh toán thành công!
              </h4>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-sm mx-auto">
                Hệ thống đã tự động ghi nhận thanh toán cho đơn hàng <b>#{orderCode}</b>. Quán đang bắt đầu chuẩn bị đồ uống cho bạn.
              </p>
            </div>

            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Số tiền thanh toán:</span>
                <span className="font-black text-emerald-800 text-sm">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Cổng thanh toán:</span>
                <span className="font-bold text-neutral-800">VietQR Auto (SePay)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Trạng thái:</span>
                <Badge variant="success" size="sm">ĐÃ THANH TOÁN</Badge>
              </div>
            </div>
          </div>
        ) : (
          /* GIAO DIỆN THANH TOÁN QUÉT MÃ QR */
          <>
            {/* Header thông tin số tiền */}
            <div className="bg-gradient-to-r from-brand-900 to-brand-950 text-white p-3.5 sm:p-4 rounded-2xl shadow-sm text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-200">
                Tổng tiền cần thanh toán
              </span>
              <div className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5 text-amber-300">
                {formatCurrency(totalAmount)}
              </div>
              <div className="text-[11px] text-neutral-200 mt-1 flex items-center justify-center gap-1.5 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Mã đơn: <b className="font-mono text-white font-black text-xs">#{orderCode}</b>
              </div>
            </div>

            {/* Khung chứa ảnh mã QR VietQR */}
            <div className="relative mx-auto w-56 sm:w-64 bg-white p-3 rounded-2xl border-2 border-neutral-200 shadow-sm flex flex-col items-center justify-center">
              <div className="w-full aspect-square relative flex items-center justify-center">
                <img
                  src={qrUrl}
                  alt={`Mã QR Thanh Toán #${orderCode}`}
                  className={`w-full h-full object-contain rounded-xl transition-opacity duration-300 ${
                    qrLoaded ? "opacity-100" : "opacity-40"
                  }`}
                  onLoad={() => setQrLoaded(true)}
                />
                {!qrLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 text-xs font-medium bg-neutral-50 rounded-xl">
                    <span className="animate-spin text-lg mb-1">⏳</span>
                    Đang tạo mã VietQR...
                  </div>
                )}
              </div>
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                <span>📱</span> Mở app ngân hàng quét mã để thanh toán
              </span>
            </div>

            {/* Box thông tin chuyển khoản thủ công */}
            <div className="bg-neutral-50 p-3 sm:p-3.5 rounded-2xl border border-neutral-200/80 text-left space-y-2 text-xs">
              <div className="text-[11px] font-black text-neutral-700 uppercase tracking-wider border-b border-neutral-200/60 pb-1.5">
                Thông tin chuyển khoản thủ công:
              </div>

              {/* Ngân hàng */}
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Ngân hàng:</span>
                <span className="font-black text-neutral-900">{bankName} ({bankCode})</span>
              </div>

              {/* Số tài khoản */}
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-sm text-brand-900 bg-white px-2 py-0.5 rounded-lg border border-neutral-200">
                    {bankAccount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(bankAccount, "account")}
                    className="text-[11px] font-bold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded-lg border border-brand-200 transition-colors"
                  >
                    {copiedField === "account" ? "✓ Đã chép" : "Sao chép"}
                  </button>
                </div>
              </div>

              {/* Chủ tài khoản */}
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Chủ tài khoản:</span>
                <span className="font-black text-neutral-900 uppercase">{bankHolder}</span>
              </div>

              {/* Nội dung chuyển khoản */}
              <div className="flex justify-between items-center pt-1 border-t border-neutral-200/60">
                <span className="text-neutral-500 font-medium">Nội dung CK:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-sm text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                    {orderCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(orderCode, "content")}
                    className="text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg border border-rose-200 transition-colors"
                  >
                    {copiedField === "content" ? "✓ Đã chép" : "Sao chép"}
                  </button>
                </div>
              </div>
            </div>

            {/* Trạng thái lắng nghe thanh toán tự động */}
            <div className="bg-amber-50/80 border border-amber-200 p-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-medium text-amber-900">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Đang chờ chuyển khoản... Hệ thống tự động xác nhận sau 3-5 giây.</span>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
