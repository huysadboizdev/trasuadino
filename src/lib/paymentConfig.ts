/**
 * Cấu hình tập trung cho cổng thanh toán VietQR / SePay
 */

export const paymentConfig = {
  sepay: {
    bankCode: process.env.SEPAY_BANK_CODE || process.env.NEXT_PUBLIC_SEPAY_BANK_CODE || "MBBank",
    bankName: "MB Bank (Ngân hàng Quân Đội)",
    bankAccount: process.env.SEPAY_BANK_ACCOUNT || process.env.NEXT_PUBLIC_SEPAY_BANK_ACCOUNT || "0858798206",
    bankHolder: process.env.SEPAY_BANK_HOLDER || process.env.NEXT_PUBLIC_SEPAY_BANK_HOLDER || "NGUYEN THI NHUNG",
    webhookSecret: process.env.SEPAY_WEBHOOK_SECRET || "",
    template: "compact", // compact, qr_only, print
  },
};

/**
 * Hàm sinh URL VietQR chuẩn hóa, an toàn với URLSearchParams
 */
export function generateVietQRUrl(params: {
  amount: number;
  orderCode: string;
  bankCode?: string;
  accountNumber?: string;
  template?: string;
}): string {
  const bank = params.bankCode || paymentConfig.sepay.bankCode;
  const acc = params.accountNumber || paymentConfig.sepay.bankAccount;
  const template = params.template || paymentConfig.sepay.template;

  // Làm sạch và chuẩn hóa mã đơn
  const cleanOrderCode = params.orderCode.trim().toUpperCase();

  const searchParams = new URLSearchParams({
    acc: acc,
    bank: bank,
    amount: Math.round(params.amount).toString(),
    des: cleanOrderCode,
    template: template,
  });

  return `https://vietqr.app/img?${searchParams.toString()}`;
}
