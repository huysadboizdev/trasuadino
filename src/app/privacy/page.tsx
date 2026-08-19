import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Truck, RefreshCw, Phone, MapPin } from "lucide-react";
import { Footer } from "@/components/ui/Footer";

export const metadata = {
  title: "Chính Sách Bảo Mật - Trà Sữa Dino",
  description: "Chính sách bảo mật thông tin khách hàng và quy định giao hàng tại Trà Sữa Dino",
};

export default function PrivacyPage() {
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
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mb-1">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-brand-950 uppercase tracking-tight">
            Chính Sách Bảo Mật Thông Tin
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 font-medium max-w-xl mx-auto">
            Trà Sữa Dino tôn trọng và cam kết bảo mật tuyệt đối các thông tin cá nhân của quý khách hàng khi đặt món tại website.
          </p>
        </div>

        {/* Các điều khoản chi tiết */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6 text-neutral-700 text-xs sm:text-sm leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-sm sm:text-base font-black text-brand-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-800 flex items-center justify-center text-xs font-black">1</span>
              Mục đích thu thập thông tin
            </h2>
            <p>
              Khi quý khách thực hiện đặt đồ uống tại website <strong>Trà Sữa Dino</strong>, chúng tôi chỉ thu thập các thông tin cần thiết phục vụ cho việc xử lý đơn hàng và giao hàng, bao gồm:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-neutral-600">
              <li>Họ và tên người nhận hàng.</li>
              <li>Số điện thoại liên hệ giao hàng.</li>
              <li>Địa chỉ giao hàng chi tiết (hoặc tọa độ GPS do khách hàng cung cấp).</li>
              <li>Ghi chú khẩu vị đồ uống (mức đường, mức đá, topping...).</li>
            </ul>
          </section>

          <section className="space-y-2 pt-4 border-t border-neutral-100">
            <h2 className="text-sm sm:text-base font-black text-brand-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-800 flex items-center justify-center text-xs font-black">2</span>
              Phạm vi sử dụng thông tin
            </h2>
            <p>
              Thông tin của quý khách chỉ được sử dụng cho các mục đích nội bộ sau:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-neutral-600">
              <li>Xác nhận đơn hàng, pha chế đồ uống và bàn giao cho tài xế giao hàng.</li>
              <li>Thông báo trạng thái đơn hàng qua tin nhắn hoặc cuộc gọi khi giao tới nơi.</li>
              <li>Hỗ trợ giải quyết khiếu nại, đổi trả hoặc hoàn tiền nếu có sự cố đơn hàng.</li>
              <li>Không bán, chia sẻ hoặc tiết lộ thông tin cho bất kỳ bên thứ ba nào vì mục đích thương mại.</li>
            </ul>
          </section>

          <section className="space-y-2 pt-4 border-t border-neutral-100">
            <h2 className="text-sm sm:text-base font-black text-brand-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-800 flex items-center justify-center text-xs font-black">3</span>
              Bảo mật thanh toán trực tuyến
            </h2>
            <p>
              Đối với hình thức <strong>Thanh toán VietQR / Chuyển khoản</strong>, hệ thống sử dụng cổng đối soát tự động bảo mật cao. Chúng tôi không lưu trữ bất kỳ mật khẩu hoặc thông tin thẻ ngân hàng của quý khách. Mọi giao dịch chuyển khoản được bảo mật trực tiếp theo chuẩn an toàn của các ngân hàng tại Việt Nam.
            </p>
          </section>

          <section id="delivery-policy" className="space-y-2 pt-4 border-t border-neutral-100 scroll-mt-20">
            <h2 className="text-sm sm:text-base font-black text-brand-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-800 flex items-center justify-center text-xs font-black">4</span>
              Quy định giao hàng & Đổi trả đồ uống
            </h2>
            <ul className="space-y-2 text-neutral-600">
              <li className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-brand-700 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Thời gian giao hàng:</strong> Từ 15 – 35 phút tùy khoảng cách sau khi quán nhận đơn và hoàn tất pha chế.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Chính sách đổi trả:</strong> Quý khách được đổi món mới hoặc hoàn tiền ngay trong trường hợp: giao sai món so với đơn đặt, đồ uống bị đổ vỡ do quá trình vận chuyển, hoặc không đảm bảo chất lượng.
                </span>
              </li>
            </ul>
          </section>

          <section className="space-y-2 pt-4 border-t border-neutral-100">
            <h2 className="text-sm sm:text-base font-black text-brand-950 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-800 flex items-center justify-center text-xs font-black">5</span>
              Thông tin liên hệ & Hỗ trợ
            </h2>
            <p>
              Nếu quý khách có bất kỳ thắc mắc hoặc cần hỗ trợ về đơn hàng và thông tin cá nhân, vui lòng liên hệ ngay với chúng tôi:
            </p>
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
