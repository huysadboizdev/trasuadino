import React from "react";
import Link from "next/link";
import { Phone, MapPin, ShieldCheck, FileText, Clock, ExternalLink, Truck } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-neutral-200/90 text-neutral-700 select-none">
      {/* 1. KHU VỰC THÔNG TIN CHÍNH */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* CỘT 1: THƯƠNG HIỆU (BRAND) */}
          <div className="lg:col-span-5 space-y-3.5">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl"
            >
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-900 via-brand-950 to-[#2c140e] text-white flex items-center justify-center font-black text-xl shadow-xs group-hover:scale-105 transition-transform flex-shrink-0 border border-brand-800/20">
                🦕
              </div>
              <div className="flex flex-col">
                <span className="font-black text-brand-950 text-base sm:text-lg tracking-tight uppercase">
                  TRÀ SỮA DINO
                </span>
                <span className="text-[11px] font-bold text-brand-700 -mt-0.5">
                  Uống là mê • Ăn là ghiền
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed max-w-md">
              Thương hiệu trà sữa & đồ ăn vặt tươi ngon mỗi ngày. Chúng tôi cam kết nguyên liệu sạch,
              đậm vị thơm béo chuẩn gu, giao hàng tận nơi nhanh chóng và phục vụ tận tâm.
            </p>

            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600 bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-200/70 w-fit">
              <Clock className="w-4 h-4 text-brand-700 flex-shrink-0" />
              <span>Giờ mở cửa: <strong className="text-neutral-900 font-bold">08:00 – 22:30</strong> hàng ngày</span>
            </div>
          </div>

          {/* CỘT 2: CHÍNH SÁCH & ĐIỀU KHOẢN (LINKS) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-950">
              Chính sách & Quy định
            </h3>
            <nav aria-label="Footer Policy Links">
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <Link
                    href="/privacy"
                    className="group inline-flex items-center gap-2 text-neutral-600 hover:text-brand-900 font-semibold transition-colors focus:outline-none focus-visible:underline"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <span>Chính sách bảo mật</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="group inline-flex items-center gap-2 text-neutral-600 hover:text-brand-900 font-semibold transition-colors focus:outline-none focus-visible:underline"
                  >
                    <FileText className="w-4 h-4 text-brand-700 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <span>Điều khoản sử dụng</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy#delivery-policy"
                    className="group inline-flex items-center gap-2 text-neutral-600 hover:text-brand-900 font-medium transition-colors focus:outline-none focus-visible:underline"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 group-hover:bg-brand-600 ml-1.5 mr-0.5" />
                    <span>Quy định giao hàng & đổi trả</span>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* CỘT 3: THÔNG TIN LIÊN HỆ (CONTACT) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-950">
              Thông tin liên hệ
            </h3>
            <address className="not-italic space-y-2.5 text-xs sm:text-sm">
              {/* Hotline */}
              <div>
                <a
                  href="tel:0858798206"
                  className="group flex items-center gap-2.5 text-neutral-700 hover:text-brand-900 font-semibold transition-colors focus:outline-none focus-visible:underline"
                  title="Gọi ngay 0858798206"
                >
                  <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-neutral-500 font-medium block leading-none mb-0.5">Hotline đặt hàng & Hỗ trợ</span>
                    <span className="font-bold text-neutral-900 text-sm sm:text-base">0858798206</span>
                  </div>
                </a>
              </div>

              {/* Facebook */}
              <div>
                <a
                  href="https://www.facebook.com/nhung.quinn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 text-neutral-700 hover:text-blue-700 font-semibold transition-colors focus:outline-none focus-visible:underline"
                  title="Mở Facebook Trà Sữa Dino"
                >
                  <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-neutral-500 font-medium block leading-none mb-0.5">Fanpage Facebook</span>
                    <span className="font-bold text-neutral-900 flex items-center gap-1">
                      Facebook của Trà Sữa Dino
                      <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-blue-600 inline" />
                    </span>
                  </div>
                </a>
              </div>

              {/* Địa chỉ */}
              <div>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=740+Đường+Triệu+Quốc+Đạt,+Triệu+Sơn,+Thanh+Hóa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2.5 text-neutral-700 hover:text-brand-900 transition-colors focus:outline-none focus-visible:underline"
                  title="Xem vị trí quán trên Google Maps"
                >
                  <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] text-neutral-500 font-medium block leading-none mb-0.5">Địa chỉ cửa hàng</span>
                    <span className="font-semibold text-neutral-800 text-xs sm:text-sm leading-snug break-words">
                      740, Đường Triệu Quốc Đạt, Triệu Sơn, Thanh Hóa
                    </span>
                  </div>
                </a>
              </div>

              {/* Phạm vi giao hàng */}
              <div className="pt-2 border-t border-neutral-100 flex items-start gap-2.5 text-neutral-700">
                <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-neutral-500 font-medium block leading-none mb-0.5">Phạm vi giao hàng</span>
                  <span className="font-medium text-neutral-700 text-xs sm:text-sm leading-snug">
                    Trà Sữa Dino hiện chỉ nhận giao hàng trong khu vực <strong>Sầm Sơn, Thanh Hóa</strong> và các khu vực lân cận thuộc phạm vi phục vụ.
                  </span>
                </div>
              </div>
            </address>
          </div>

        </div>
      </div>

      {/* 2. ĐƯỜNG PHÂN CÁCH VÀ KHU VỰC COPYRIGHT */}
      <div className="border-t border-neutral-200/80 bg-neutral-50/70 py-4 sm:py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left text-xs text-neutral-500 font-medium">
          {/* Copyright text responsive */}
          <div className="leading-relaxed">
            <span className="block sm:inline">© 2026 HuyDev & Trà Sữa Dino.</span>{" "}
            <span className="block sm:inline font-semibold text-neutral-700">Bản quyền thuộc về Trà Sữa Dino.</span>
          </div>

          {/* Tagline / Subtitle */}
          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <span>🦕 Trà sữa thơm ngon</span>
            <span>•</span>
            <span>Giao tận tay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
