import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, AlertCircle, Phone, MapPin } from "lucide-react";
import { Footer } from "@/components/ui/Footer";

export const metadata = {
  title: "Điều Khoản Sử Dụng - Trà Sữa Dino",
  description: "Điều khoản và quy định sử dụng dịch vụ đặt đồ uống trực tuyến tại Trà Sữa Dino",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-neutral-900 flex flex-col justify-between">
      {/* Header đơn giản */}
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-700 hover:text-brand-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang chủ</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🦕</span>
            <span className="font-black text-brand-950 text-sm sm:text-base uppercase tracking-tight">
              TRÀ SỮA DINO
            </span>
          </Link>
        </div>
      </header>

      {/* Nội dung chính */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 w-full space-y-6">
        {/* Banner tiêu đề */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 border border-brand-200 mb-1">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-brand-950 uppercase tracking-tight">
            Điều Khoản Sử Dụng Dịch Vụ
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 font-medium max-w-xl mx-auto">
            Chào mừng bạn đến với hệ thống đặt đồ uống trực tuyến Trà Sữa Dino. Xin vui lòng đọc kỹ các điều khoản dưới đây trước khi đặt hàng.
          </p>
        </div>

        {/* Các điều khoản chi tiết */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6 text-neutral-700 text-xs sm:text-sm leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-black text-brand-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-800 flex items-center justify-center text-xs font-black">1</span>
              Chấp thuận điều khoản
            </h2>
            <p>
              Bằng việc truy cập website và gửi đơn đặt hàng tại <strong>Trà Sữa Dino</strong>, quý khách đồng ý tuân thủ toàn bộ các điều khoản và quy định được nêu rõ tại đây.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-neutral-100">
            <h2 className="text-sm sm:text-base font-black text-brand-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-800 flex items-center justify-center text-xs font-black">2</span>
              Quy trình đặt món & Xác nhận đơn hàng
            </h2>
            <ul className="space-y-1.5 text-neutral-600 list-disc list-inside pl-2">
              <li>Khách hàng cung cấp đầy đủ và chính xác: Tên người nhận, Số điện thoại và Địa chỉ giao hàng cụ thể.</li>
              <li>Hệ thống tiếp nhận đơn hàng, gửi thông báo trực tiếp đến bộ phận pha chế để chuẩn bị món nhanh nhất.</li>
              <li>Quán có quyền liên hệ xác nhận đơn hàng qua số điện thoại nếu thông tin địa chỉ chưa rõ ràng.</li>
            </ul>
          </section>

          <section className="space-y-2 pt-4 border-t border-neutral-100">
            <h2 className="text-sm sm:text-base font-black text-brand-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-800 flex items-center justify-center text-xs font-black">3</span>
              Giá cả, Mã giảm giá & Phương thức thanh toán
            </h2>
            <ul className="space-y-2 text-neutral-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Giá niêm yết:</strong> Toàn bộ giá món ăn, đồ uống và topping trên website được niêm yết rõ ràng bằng Việt Nam Đồng (VNĐ).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Phương thức thanh toán:</strong> Hỗ trợ 2 phương thức:
                  (1) <em>Tiền mặt khi nhận hàng (COD)</em> hoặc 
                  (2) <em>Chuyển khoản VietQR tự động (SePay)</em>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Mã giảm giá (Coupon):</strong> Chỉ áp dụng khi thỏa mãn điều kiện quy định và còn trong thời hạn hiệu lực.
                </span>
              </li>
            </ul>
          </section>

          <section className="space-y-2 pt-4 border-t border-neutral-100">
            <h2 className="text-sm sm:text-base font-black text-brand-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-800 flex items-center justify-center text-xs font-black">4</span>
              Chính sách hủy đơn & Hoàn tiền
            </h2>
            <ul className="space-y-1.5 text-neutral-600 list-disc list-inside pl-2">
              <li>Quý khách có thể bấm <strong>HỦY ĐƠN</strong> trực tiếp trên website khi đơn hàng còn ở trạng thái <em>MỚI NHẬN</em>.</li>
              <li>Khi đơn hàng đã chuyển sang trạng thái <em>ĐANG PHA CHẾ</em> hoặc <em>ĐANG GIAO</em>, vui lòng liên hệ trực tiếp hotline để được hỗ trợ kịp thời.</li>
              <li>Đối với đơn thanh toán chuyển khoản đã hủy hợp lệ, cửa hàng sẽ hoàn tiền qua tài khoản ngân hàng của quý khách trong vòng 24 giờ làm việc.</li>
            </ul>
          </section>

          <section className="space-y-2 pt-4 border-t border-neutral-100">
            <h2 className="text-sm sm:text-base font-black text-brand-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-800 flex items-center justify-center text-xs font-black">5</span>
              Thông tin liên hệ giải quyết khiếu nại
            </h2>
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-1.5 font-medium">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-700" />
                <span>Hotline: <strong>0858798206</strong></span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>Địa chỉ: 740, Đường Triệu Quốc Đạt, Triệu Sơn, Thanh Hóa</span>
              </p>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
