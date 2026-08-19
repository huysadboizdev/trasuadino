"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/constants";
import { generateVietQRUrl, paymentConfig } from "@/lib/paymentConfig";
import { Clock, AlertTriangle, CheckCircle2, RotateCcw, Copy, Check } from "lucide-react";

interface SepayQrPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderCode: string;
  totalAmount: number;
  onPaymentSuccess?: () => void;
  onViewOrders?: () => void;
  onReorder?: () => void;
}

const TOTAL_TIMEOUT_SECONDS = 300; // 5 phút

export function SepayQrPaymentModal({
  isOpen,
  onClose,
  orderCode,
  totalAmount,
  onPaymentSuccess,
  onViewOrders,
  onReorder,
}: SepayQrPaymentModalProps) {
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PAID" | "EXPIRED">("PENDING");
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_TIMEOUT_SECONDS);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrLoaded, setQrLoaded] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Reset state mỗi khi mở modal đơn mới
  useEffect(() => {
    if (isOpen) {
      setPaymentStatus("PENDING");
      setTimeLeft(TOTAL_TIMEOUT_SECONDS);
      setQrLoaded(false);
    }
  }, [isOpen, orderCode]);

  // Bộ đếm ngược 1 giây
  useEffect(() => {
    if (!isOpen || paymentStatus !== "PENDING") {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      return;
    }

    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPaymentStatus("EXPIRED");
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [isOpen, paymentStatus]);

  // Polling kiểm tra trạng thái thanh toán từ Server mỗi 3 giây
  useEffect(() => {
    if (!isOpen || paymentStatus !== "PENDING" || !orderCode) {
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

          // 1. Nếu đã thanh toán thành công
          if (data.paid || data.paymentStatus === "PAID") {
            setPaymentStatus("PAID");
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            if (onPaymentSuccess) {
              onPaymentSuccess();
            }
            return;
          }

          // 2. Nếu đơn hàng đã hết hạn hoặc bị hủy
          if (data.isExpired || data.paymentStatus === "CANCELLED" || data.orderStatus === "CANCELLED") {
            setPaymentStatus("EXPIRED");
            setTimeLeft(0);
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            return;
          }

          // 3. Đồng bộ thời gian còn lại từ server nếu có
          if (typeof data.timeLeftSeconds === "number") {
            setTimeLeft(data.timeLeftSeconds);
            if (data.timeLeftSeconds <= 0) {
              setPaymentStatus("EXPIRED");
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

  // Định dạng MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / TOTAL_TIMEOUT_SECONDS) * 100));

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        paymentStatus === "PAID"
          ? "🎉 THANH TOÁN THÀNH CÔNG!"
          : paymentStatus === "EXPIRED"
          ? "⏱️ MÃ THANH TOÁN HẾT HẠN"
          : "THANH TOÁN VIETQR"
      }
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
          ) : paymentStatus === "EXPIRED" ? (
            <div className="flex items-center gap-2 w-full">
              <Button
                variant="outline"
                size="md"
                onClick={onClose}
                className="text-xs font-bold uppercase rounded-2xl py-3 px-4"
              >
                Đóng
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => {
                  onClose();
                  if (onReorder) {
                    onReorder();
                  }
                }}
                className="flex-1 text-xs sm:text-sm font-black uppercase tracking-wider bg-brand-900 hover:bg-brand-950 text-white py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Đặt lại đơn mới</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={onClose}
              className="text-xs font-bold uppercase tracking-wider py-3 rounded-2xl border-neutral-300 hover:bg-neutral-100 text-neutral-700"
            >
              Đóng / Hủy thanh toán
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4 py-1 text-center select-none">
        {paymentStatus === "PAID" ? (
          /* TRẠNG THÁI 1: THANH TOÁN THÀNH CÔNG */
          <div className="py-4 space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 border-2 border-emerald-300 text-emerald-600 text-3xl font-black shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-lg sm:text-xl font-black text-emerald-950 uppercase tracking-tight">
                Xác nhận đã thanh toán thành công!
              </h4>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-sm mx-auto font-medium">
                Hệ thống SePay đã tự động duyệt đơn hàng <b>#{orderCode}</b>. Quán Trà Sữa Dino đã nhận thông báo và bắt đầu pha chế món cho bạn!
              </p>
            </div>

            <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 font-medium">Số tiền thanh toán:</span>
                <span className="font-black text-emerald-800 text-sm">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 font-medium">Cổng thanh toán:</span>
                <span className="font-bold text-neutral-800">VietQR Auto (SePay)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 font-medium">Trạng thái:</span>
                <Badge variant="success" size="sm">ĐÃ THANH TOÁN</Badge>
              </div>
            </div>
          </div>
        ) : paymentStatus === "EXPIRED" ? (
          /* TRẠNG THÁI 2: HẾT HẠN THANH TOÁN (5 PHÚT) */
          <div className="py-4 space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-100 border-2 border-rose-300 text-rose-600 shadow-sm">
              <AlertTriangle className="w-9 h-9 text-rose-600" />
            </div>

            <div>
              <h4 className="text-lg sm:text-xl font-black text-rose-950 uppercase tracking-tight">
                Mã thanh toán đã hết hạn
              </h4>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 max-w-sm mx-auto font-medium leading-relaxed">
                Mã QR thanh toán đã tự động hủy sau <strong>5 phút</strong> để bảo đảm an toàn giao dịch. Đơn hàng <b>#{orderCode}</b> đã được hủy tự động.
              </p>
            </div>

            <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 font-medium">Mã đơn hàng:</span>
                <span className="font-bold font-mono text-neutral-900">#{orderCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 font-medium">Số tiền:</span>
                <span className="font-bold text-neutral-900">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600 font-medium">Trạng thái đơn:</span>
                <Badge variant="danger" size="sm">ĐÃ HỦY DO HẾT HẠN</Badge>
              </div>
            </div>

            <div className="p-3 bg-neutral-100/80 rounded-xl text-[11px] text-neutral-500 font-medium">
              💡 Bạn có thể bấm <strong>"Đặt lại đơn mới"</strong> bên dưới để hệ thống tạo mã QR thanh toán mới trong 5 phút tiếp theo.
            </div>
          </div>
        ) : (
          /* TRẠNG THÁI 3: ĐANG CHỜ THANH TOÁN (CÓ ĐẾM NGƯỢC 5 PHÚT) */
          <>
            {/* Header thông tin số tiền & Đồng hồ đếm ngược */}
            <div className="bg-gradient-to-r from-brand-900 to-brand-950 text-white p-3.5 sm:p-4 rounded-2xl shadow-sm text-center space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-200">
                Tổng tiền cần thanh toán
              </span>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-amber-300">
                {formatCurrency(totalAmount)}
              </div>

              {/* Thanh đếm ngược 5 phút */}
              <div className="pt-2 border-t border-brand-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="inline-flex items-center gap-1.5 text-brand-200">
                    <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>Thời gian thanh toán còn lại:</span>
                  </span>
                  <span
                    className={`font-mono text-sm font-black px-2 py-0.5 rounded-md ${
                      timeLeft <= 60
                        ? "bg-rose-500 text-white animate-pulse"
                        : timeLeft <= 120
                        ? "bg-amber-500 text-brand-950"
                        : "bg-white/20 text-amber-300"
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-brand-950/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      timeLeft <= 60
                        ? "bg-rose-500"
                        : timeLeft <= 120
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
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
                    className="text-[11px] font-bold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded-lg border border-brand-200 transition-colors flex items-center gap-1"
                  >
                    {copiedField === "account" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Sao chép</span>
                      </>
                    )}
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
                    className="text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg border border-rose-200 transition-colors flex items-center gap-1"
                  >
                    {copiedField === "content" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Trạng thái lắng nghe thanh toán tự động */}
            <div className="bg-amber-50/80 border border-amber-200 p-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-medium text-amber-900">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Đang chờ chuyển khoản... Quán sẽ nhận đơn ngay khi bạn chuyển tiền xong.</span>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
