"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Search,
  Sliders,
  Truck,
  Clock,
  CupSoda,
  ShoppingBag,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "dino_onboarding_dismissed_until";
// 30 ngày tính theo thời gian thực (30 * 24 * 60 * 60 * 1000 = 2.592.000.000 ms)
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface GuideStep {
  stepNumber: number;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  description: string;
  tip: string;
  icon: React.ReactNode;
  highlights: { title: string; desc: string; iconText: string }[];
}

const guideSteps: GuideStep[] = [
  {
    stepNumber: 1,
    badge: "BƯỚC 1 / 5",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    title: "Khám Phá Menu Tươi Ngon",
    subtitle: "Trà sữa đậm vị, Trà hoa quả tươi mát & Bánh nướng nóng hổi",
    description:
      "Lướt qua các danh mục phong phú ngay trên trang chủ. Mỗi món đều có hình ảnh sắc nét, giá bán rõ ràng và thông tin topping chi tiết.",
    tip: "Mẹo: Món có huy hiệu 'Món Bán Chạy' là những thức uống được yêu thích nhất tại Dino!",
    icon: <CupSoda className="w-8 h-8 text-amber-600" />,
    highlights: [
      {
        iconText: "🧋",
        title: "Trà Sữa Đậm Vị",
        desc: "Ủ từ lá trà tươi nguyên chất kết hợp sữa béo ngậy chuẩn gu.",
      },
      {
        iconText: "🍹",
        title: "Trà Trái Cây",
        desc: "Vị hoa quả nhiệt đới thanh mát, giòn ngọt tự nhiên.",
      },
      {
        iconText: "🍰",
        title: "Bánh Nóng Hổi",
        desc: "Bánh tươi làm mới mỗi ngày, ăn kèm trà sữa cực ghiền.",
      },
    ],
  },
  {
    stepNumber: 2,
    badge: "BƯỚC 2 / 5",
    badgeColor: "bg-sky-100 text-sky-900 border-sky-300",
    title: "Tìm Kiếm & Lọc Món Thông Minh",
    subtitle: "Gõ không dấu mượt mà & Lọc giá theo ngân sách",
    description:
      "Sử dụng thanh tìm kiếm nhanh để tìm món yêu thích (hỗ trợ cả gõ có dấu lẫn không dấu như 'tra sua', 'olong', 'dao').",
    tip: "Mẹo: Bạn có thể lọc nhanh món dưới 30k hoặc sắp xếp giá từ thấp đến cao tiện lợi!",
    icon: <Search className="w-8 h-8 text-sky-600" />,
    highlights: [
      {
        iconText: "🔍",
        title: "Tìm kiếm tức thì",
        desc: "Gõ từ khóa bất kỳ, kết quả lọc ra ngay lập tức không cần chờ.",
      },
      {
        iconText: "🏷️",
        title: "Lọc theo khoảng giá",
        desc: "Dưới 30k, 30k - 50k hoặc trên 50k tùy nhu cầu của bạn.",
      },
      {
        iconText: "✨",
        title: "Sắp xếp linh hoạt",
        desc: "Xem món mới nhất hoặc sắp xếp giá tăng/giảm dần theo ý muốn.",
      },
    ],
  },
  {
    stepNumber: 3,
    badge: "BƯỚC 3 / 5",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    title: "Tùy Chỉnh Ly Trà Theo Gu Của Bạn",
    subtitle: "Chọn Size, Mức Đường, Mức Đá & Topping hảo hạng",
    description:
      "Bấm vào bất kỳ món nào để mở bảng tùy chỉnh: Tăng size L (+6k), giảm ngọt 50% đường, giảm lạnh 50% đá, thêm trân châu hoàng kim, kem cheese và ghi chú riêng.",
    tip: "Mẹo: Món đã thêm vào giỏ vẫn có thể bấm nút chỉnh sửa để đổi lại topping bất kỳ lúc nào.",
    icon: <Sliders className="w-8 h-8 text-emerald-600" />,
    highlights: [
      {
        iconText: "📏",
        title: "Chọn Size M / L",
        desc: "Size L nhiều hơn, uống đã hơn chỉ với phụ phí nhỏ.",
      },
      {
        iconText: "🧊",
        title: "Mức Đường & Đá",
        desc: "0%, 30%, 50%, 70%, 100% linh hoạt theo khẩu vị.",
      },
      {
        iconText: "🍯",
        title: "Topping hảo hạng",
        desc: "Trân châu hoàng kim, thạch đào, pudding, kem cheese béo thơm.",
      },
    ],
  },
  {
    stepNumber: 4,
    badge: "BƯỚC 4 / 5",
    badgeColor: "bg-indigo-100 text-indigo-900 border-indigo-300",
    title: "Đặt Hàng Nhanh Không Cần Tài Khoản",
    subtitle: "Giao tận nơi 15-30p • Tiền mặt (COD) hoặc Quét mã QR SePay",
    description:
      "Bấm 'Đặt hàng ngay', chỉ cần điền Tên + SĐT + Địa chỉ nhận hàng (hoặc bấm 'Lấy Vị Trí GPS'). Không bắt buộc đăng ký tài khoản rườm rà!",
    tip: "Mẹo: Chuyển khoản qua Quét mã QR SePay được hệ thống xác nhận tự động chỉ sau 3 giây!",
    icon: <Truck className="w-8 h-8 text-indigo-600" />,
    highlights: [
      {
        iconText: "📍",
        title: "Lấy vị trí GPS",
        desc: "Bấm 1 chạm để định vị địa chỉ giao chính xác đến tận cửa.",
      },
      {
        iconText: "💵",
        title: "Tiền mặt (COD)",
        desc: "Nhận trà sữa thơm ngon tận tay rồi mới trả tiền cho tài xế.",
      },
      {
        iconText: "📲",
        title: "QR Bank SePay",
        desc: "Mở app ngân hàng quét mã QR, tự động điền số tiền và mã đơn.",
      },
    ],
  },
  {
    stepNumber: 5,
    badge: "BƯỚC 5 / 5",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-300",
    title: "Tra Cứu & Theo Dõi Đơn Hàng Realtime",
    subtitle: "Theo dõi 4 bước tiến độ pha chế & Shipper giao hàng trực tiếp",
    description:
      "Bấm nút 'Tra cứu đơn' trên thanh menu bất cứ lúc nào. Hệ thống tự động ghi nhớ đơn trên máy bạn, cập nhật trạng thái theo thời gian thực mà không cần F5.",
    tip: "Mẹo: Bạn có thể sao chép liên kết theo dõi đơn hàng để gửi Zalo hoặc lưu lại máy khác!",
    icon: <Clock className="w-8 h-8 text-rose-600" />,
    highlights: [
      {
        iconText: "🧾",
        title: "Tra cứu không cần đăng nhập",
        desc: "Tự động load đơn đã lưu hoặc nhập SĐT / Mã đơn để tra cứu.",
      },
      {
        iconText: "🟢",
        title: "Tiến trình 4 bước Realtime",
        desc: "Nhận đơn ➔ Đang pha chế ➔ Đang giao hàng ➔ Hoàn tất.",
      },
      {
        iconText: "📞",
        title: "Hotline hỗ trợ 0858.798.206",
        desc: "Cần đổi món hoặc hỗ trợ khẩn cấp? Bấm gọi quán ngay 1 chạm.",
      },
    ],
  },
];

interface OnboardingGuideModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialMode?: "WELCOME" | "TOUR";
}

export function OnboardingGuideModal({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  initialMode = "WELCOME",
}: OnboardingGuideModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [mode, setMode] = useState<"WELCOME" | "TOUR">(initialMode);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Xác định trạng thái mở từ props ngoài hoặc state nội bộ
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  // Đóng modal đơn thuần (KHÔNG lưu hạn 30 ngày -> Lần sau F5 vẫn hiện lại)
  const handleCloseForNow = useCallback(() => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  }, [externalOnClose]);

  // Đóng modal và KÍCH HOẠT TẮT TRONG 30 NGÀY theo thời gian thực
  const handleDismissFor30Days = useCallback(() => {
    const expireAt = Date.now() + THIRTY_DAYS_MS;
    try {
      localStorage.setItem(STORAGE_KEY, expireAt.toString());
    } catch (e) {}

    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  }, [externalOnClose]);

  // Kiểm tra LocalStorage theo thời gian thực khi mount lần đầu trên Client
  useEffect(() => {
    setIsMounted(true);

    if (externalIsOpen === undefined) {
      try {
        const savedDismissedUntil = localStorage.getItem(STORAGE_KEY);
        if (savedDismissedUntil) {
          const expireTime = Number(savedDismissedUntil);
          const now = Date.now();
          // Kiểm tra thời gian thực: Nếu thời điểm hiện tại còn nhỏ hơn thời điểm hết hạn -> Bỏ qua
          if (!isNaN(expireTime) && now < expireTime) {
            return;
          }
        }
        // Nếu chưa lưu hoặc đã hết hạn 30 ngày -> Luôn luôn hiển thị khi tải trang (F5/Refresh)
        const timer = setTimeout(() => {
          setMode("WELCOME");
          setInternalIsOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      } catch (e) {}
    }
  }, [externalIsOpen]);

  // Lắng nghe sự kiện toàn cục mở hướng dẫn từ Footer
  useEffect(() => {
    const handleOpenEvent = () => {
      setMode("TOUR");
      setCurrentStep(0);
      setInternalIsOpen(true);
    };

    window.addEventListener("open-onboarding-guide", handleOpenEvent);
    return () => {
      window.removeEventListener("open-onboarding-guide", handleOpenEvent);
    };
  }, []);

  // Xử lý phím tắt Escape / Left / Right
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseForNow();
      } else if (mode === "TOUR") {
        if (e.key === "ArrowRight" && currentStep < guideSteps.length - 1) {
          setCurrentStep((prev) => prev + 1);
        } else if (e.key === "ArrowLeft" && currentStep > 0) {
          setCurrentStep((prev) => prev - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, mode, currentStep, handleCloseForNow]);

  // Đổi mode khi prop initialMode thay đổi
  useEffect(() => {
    if (externalIsOpen) {
      setMode(initialMode);
      setCurrentStep(0);
    }
  }, [externalIsOpen, initialMode]);

  if (!isMounted || !isOpen) return null;

  const currentStepData = guideSteps[currentStep];
  const isLastStep = currentStep === guideSteps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto select-none animate-fade-in">
      {/* Nền mờ Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
        onClick={handleCloseForNow}
      />

      {/* MODAL CONTAINER */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-3xl sm:rounded-[32px] shadow-2xl border border-neutral-200/80 w-full max-w-xl overflow-hidden z-10 my-auto transform transition-all animate-scale-up"
      >
        {/* Nút Đóng nhanh ở góc */}
        <button
          type="button"
          onClick={handleCloseForNow}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 h-8 w-8 rounded-full bg-neutral-100/90 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 flex items-center justify-center transition-all shadow-2xs active:scale-95"
          title="Đóng bảng hướng dẫn"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ============================================================ */}
        {/* GIAI ĐOẠN 1: MÀN HÌNH CHÀO MỪNG & PHÂN LOẠI (WELCOME SCREEN) */}
        {/* ============================================================ */}
        {mode === "WELCOME" ? (
          <div className="p-5 sm:p-7 md:p-8 space-y-5 sm:space-y-6">
            {/* Header Chào Mừng Thương Hiệu */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-900 via-brand-950 to-[#2c140e] text-white text-3xl shadow-md border border-brand-800/30 animate-bounce-subtle">
                🦕
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-brand-950 uppercase tracking-tight">
                Chào mừng bạn đến với Dino!
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 font-medium max-w-md mx-auto leading-relaxed">
                Trà sữa tươi ủ mỗi ngày • Giao nhanh tận nơi 15-30 phút. Hãy chọn hướng dẫn phù hợp với bạn:
              </p>
            </div>

            {/* 2 Thẻ Lựa Chọn Lớn */}
            <div className="grid grid-cols-1 gap-3 sm:gap-3.5">
              {/* Lựa chọn 1: Người mới */}
              <button
                type="button"
                onClick={() => {
                  setMode("TOUR");
                  setCurrentStep(0);
                }}
                className="group relative text-left p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-white hover:from-amber-500/20 hover:via-amber-100 hover:to-amber-50/50 border-2 border-amber-300/80 hover:border-amber-500 transition-all shadow-2xs hover:shadow-md flex items-center justify-between gap-3 active:scale-[0.99]"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xl flex-shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                    🌱
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-sm sm:text-base text-brand-950">
                        Tôi là người mới
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900">
                        Khuyên dùng (1 phút)
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 font-medium leading-tight">
                      Xem chỉ dẫn cách chọn món, mix topping chuẩn vị và tra cứu đơn siêu nhanh.
                    </p>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* Lựa chọn 2: Đã quen sử dụng */}
              <div className="p-4 sm:p-4.5 rounded-2xl bg-neutral-50 border-2 border-neutral-200/90 space-y-2.5">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-neutral-200 text-neutral-700 flex items-center justify-center font-black text-xl flex-shrink-0">
                    ⚡
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="font-black text-sm sm:text-base text-neutral-800 block">
                      Tôi đã quen sử dụng
                    </span>
                    <p className="text-xs text-neutral-500 font-medium leading-tight">
                      Bạn đã biết cách đặt món? Hãy chọn cách vào menu bên dưới:
                    </p>
                  </div>
                </div>

                {/* 2 nút tùy chọn cho người đã quen */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDismissFor30Days}
                    className="w-full py-2.5 px-3 rounded-xl bg-brand-900 hover:bg-brand-950 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                    title="Vào menu và không hiện lại bảng này trong 30 ngày"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Tắt trong 30 ngày</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseForNow}
                    className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 text-xs font-bold transition-all flex items-center justify-center gap-1 active:scale-95"
                    title="Chỉ đóng lần này, lần sau vào web vẫn hiện lại"
                  >
                    <span>Chỉ đóng lần này</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Lưu ý chân trang */}
            <p className="text-[11px] text-neutral-400 text-center">
              💡 Bạn luôn có thể xem lại hướng dẫn bất cứ lúc nào ở mục <b>"Hướng dẫn sử dụng web"</b> dưới chân trang.
            </p>
          </div>
        ) : (
          /* ============================================================ */
          /* GIAI ĐOẠN 2: CHUỖI CHỈ DẪN TỪNG BƯỚC (INTERACTIVE STEP TOUR) */
          /* ============================================================ */
          <div className="flex flex-col">
            {/* Header Tour Bar */}
            <div className="bg-gradient-to-r from-[#2c1209] via-[#482017] to-[#2c1209] text-white px-5 sm:px-6 py-4 flex items-center justify-between gap-3 border-b border-brand-900/60">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-amber-300 font-black text-sm">
                  {currentStep + 1}
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-200 block leading-none">
                    HƯỚNG DẪN SỬ DỤNG
                  </span>
                  <span className="text-[11px] text-amber-100/80 font-medium">
                    Bước {currentStep + 1} trên {guideSteps.length}
                  </span>
                </div>
              </div>

              {/* Thanh tiến trình mini trên top */}
              <div className="hidden xs:flex items-center gap-1">
                {guideSteps.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentStep(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentStep
                        ? "w-6 bg-amber-400"
                        : idx < currentStep
                        ? "w-2 bg-amber-200/80"
                        : "w-2 bg-white/25"
                    }`}
                    title={`Chuyển đến bước ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Nội dung chi tiết của bước hiện tại */}
            <div className="p-5 sm:p-6 md:p-7 space-y-4 sm:space-y-5">
              {/* Badge & Tiêu đề bước */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${currentStepData.badgeColor}`}
                  >
                    {currentStepData.badge}
                  </span>
                  <span className="text-xs font-bold text-neutral-400">
                    {currentStepData.subtitle}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-brand-950 tracking-tight">
                  {currentStepData.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed">
                  {currentStepData.description}
                </p>
              </div>

              {/* 3 Điểm Nổi Bật Dạng Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {currentStepData.highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-neutral-50/90 border border-neutral-200/80 rounded-2xl p-3 space-y-1 shadow-2xs hover:bg-white hover:border-brand-300 transition-all"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{item.iconText}</span>
                      <span className="font-black text-xs text-neutral-900 truncate">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-medium leading-tight">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Box Mẹo Hữu Ích (Tip Box) */}
              <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3 sm:p-3.5 flex items-start gap-2 text-xs text-amber-900 font-medium leading-relaxed">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{currentStepData.tip}</span>
              </div>

              {/* ======================================================= */}
              {/* BƯỚC CUỐI CÙNG (BƯỚC 5): KHU VỰC CHỌN TẮT 30 NGÀY RÕ RÀNG */}
              {/* ======================================================= */}
              {isLastStep && (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border-2 border-emerald-300 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-xs sm:text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Bạn đã hoàn thành 5 bước hướng dẫn!</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                    Hãy chọn một trong hai cách bên dưới để bắt đầu trải nghiệm:
                  </p>

                  <div className="space-y-2 pt-1">
                    {/* NÚT CHÍNH: TẮT 30 NGÀY */}
                    <button
                      type="button"
                      onClick={handleDismissFor30Days}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>🎉 ĐÃ HIỂU! TẮT HƯỚNG DẪN TRONG 30 NGÀY</span>
                    </button>

                    {/* NÚT PHỤ: VÀO MENU (F5 VẪN HIỆN LẠI) */}
                    <button
                      type="button"
                      onClick={handleCloseForNow}
                      className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Bắt đầu đặt món (Lần sau vào web vẫn hiện lại)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Điều Hướng Bước (Khi chưa ở bước cuối) */}
            {!isLastStep && (
              <div className="bg-neutral-50 px-5 sm:px-6 py-4 border-t border-neutral-200/80 flex items-center justify-between gap-2.5">
                {/* Nút Quay lại hoặc Bỏ qua */}
                {currentStep > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    className="text-xs font-bold rounded-xl border-neutral-300 text-neutral-700 hover:bg-neutral-200 flex items-center gap-1 px-3"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại</span>
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCloseForNow}
                    className="text-xs font-bold text-neutral-400 hover:text-neutral-700 px-2 py-1.5 transition-colors"
                  >
                    Bỏ qua
                  </button>
                )}

                {/* 5 Chấm tròn tiến trình (Dots) */}
                <div className="flex items-center gap-1.5">
                  {guideSteps.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentStep(idx)}
                      className={`h-2.5 rounded-full transition-all ${
                        idx === currentStep
                          ? "w-6 bg-brand-900"
                          : "w-2 bg-neutral-300 hover:bg-neutral-400"
                      }`}
                      title={`Đến bước ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Nút Tiếp theo */}
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                  className="bg-brand-900 hover:bg-brand-950 text-white font-black text-xs uppercase rounded-xl px-4 py-2 flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <span>Tiếp theo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
