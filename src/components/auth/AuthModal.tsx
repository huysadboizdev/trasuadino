"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "../ui/Toast";
import { triggerGoogleOAuth } from "@/lib/googleAuth";

export const GoogleLogoIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "LOGIN" | "REGISTER";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = "LOGIN",
}) => {
  const router = useRouter();
  const [tab, setTab] = useState<"LOGIN" | "REGISTER">(defaultTab);
  const { login, register, loginWithGoogle } = useAuth();
  const { showToast } = useToast();

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Validation Touch State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Email validation check
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isEmailTouched = email.length > 0;

  // Password validation check
  const isPasswordValid = password.length >= 6;
  const isPasswordTouched = password.length > 0;

  // Confirm password check
  const isConfirmMatch = password === confirmPassword;
  const isConfirmTouched = confirmPassword.length > 0;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setFormError("Vui lòng nhập địa chỉ Gmail/Email của bạn");
      return;
    }
    if (!isEmailValid) {
      setFormError("Định dạng Gmail/Email không đúng (VD: tenban@gmail.com)");
      return;
    }
    if (!password) {
      setFormError("Vui lòng nhập mật khẩu");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await login(email.trim(), password);
      if (res.success) {
        showToast(res.message, "success");
        onClose();
        resetForm();
        if (res.user?.role === "ADMIN" || res.user?.role === "STAFF") {
          router.push("/admin");
        }
      } else {
        setFormError(res.message);
        showToast(res.message, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setFormError("Vui lòng nhập địa chỉ Gmail của bạn");
      return;
    }
    if (!isEmailValid) {
      setFormError("Gmail không hợp lệ. Vui lòng nhập đúng dạng: username@gmail.com");
      return;
    }
    if (password.length < 6) {
      setFormError("Mật khẩu bắt buộc phải từ 6 ký tự trở lên");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Mật khẩu nhập lại không khớp với mật khẩu đã nhập");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await register(email.trim(), password, confirmPassword);
      if (res.success) {
        showToast("Đăng ký thành công! Chào mừng bạn đến với Trà Sữa Dino.", "success");
        onClose();
        resetForm();
        if (res.user?.role === "ADMIN" || res.user?.role === "STAFF") {
          router.push("/admin");
        }
      } else {
        setFormError(res.message);
        showToast(res.message, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kích hoạt Đăng Nhập Google Trực Tiếp (Mở popup tài khoản Google thật)
  const handleGoogleDirectLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setFormError(null);
      const googleUser = await triggerGoogleOAuth();

      const res = await loginWithGoogle(googleUser.email, googleUser.name);
      showToast(res.message, "success");
      onClose();
      resetForm();
      if (res.user?.role === "ADMIN" || res.user?.role === "STAFF") {
        router.push("/admin");
      }
    } catch (err: any) {
      console.error("Lỗi Google Sign-In:", err);
      const errorMsg = err?.message || "Không thể hoàn tất đăng nhập với Google";
      setFormError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFormError(null);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => {
        onClose();
        resetForm();
      }}
      title={tab === "LOGIN" ? "ĐĂNG NHẬP TÀI KHOẢN" : "ĐĂNG KÝ TÀI KHOẢN"}
      subtitle="Để tích điểm, lưu địa chỉ và theo dõi đơn hàng"
      maxWidth="sm"
    >
      <div className="space-y-4">
        {/* Tab chuyển đổi ĐĂNG NHẬP / ĐĂNG KÝ */}
        <div className="flex bg-neutral-100 p-1 rounded-xl sm:rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setTab("LOGIN");
              setFormError(null);
            }}
            className={`flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all ${
              tab === "LOGIN"
                ? "bg-white text-brand-950 shadow-sm"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            ĐĂNG NHẬP
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("REGISTER");
              setFormError(null);
            }}
            className={`flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all ${
              tab === "REGISTER"
                ? "bg-white text-brand-950 shadow-sm"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            ĐĂNG KÝ MỚI
          </button>
        </div>

        {/* Nút Đăng Nhập Google Trực Tiếp (Mở popup tài khoản Google thật) */}
        <button
          type="button"
          onClick={handleGoogleDirectLogin}
          disabled={isSubmitting || isGoogleLoading}
          className="w-full flex items-center justify-center gap-2.5 sm:gap-3 py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl border-2 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/80 bg-white text-neutral-800 text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-xs active:scale-98 transition-all min-h-[44px]"
        >
          <GoogleLogoIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="truncate">
            {isGoogleLoading ? "Đang kết nối Google..." : "TIẾP TỤC VỚI GOOGLE"}
          </span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-neutral-200" />
          <span className="text-[11px] font-black uppercase text-neutral-400">
            HOẶC BẰNG GMAIL
          </span>
          <div className="flex-1 h-px bg-neutral-200" />
        </div>

        {/* Báo lỗi chính nếu có */}
        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-800 animate-slide-up">
            ⚠️ {formError}
          </div>
        )}

        {tab === "LOGIN" ? (
          /* FORM ĐĂNG NHẬP */
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                ĐỊA CHỈ GMAIL / EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFormError(null);
                }}
                placeholder="VD: ban@gmail.com"
                className={`w-full px-3.5 py-3 rounded-xl border text-neutral-900 font-bold focus:outline-none text-sm transition-all ${
                  isEmailTouched && !isEmailValid
                    ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500"
                    : "border-neutral-300 focus:ring-2 focus:ring-brand-500"
                }`}
                required
              />
              {isEmailTouched && !isEmailValid && (
                <p className="text-[11px] text-rose-600 font-bold mt-1">
                  Định dạng Gmail chưa đúng (VD: username@gmail.com)
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider">
                  MẬT KHẨU
                </label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFormError(null);
                }}
                placeholder="Nhập mật khẩu của bạn..."
                className="w-full px-3.5 py-3 rounded-xl border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              isLoading={isSubmitting}
              className="bg-brand-900 hover:bg-brand-950 text-white font-black text-xs uppercase tracking-wider py-3.5 shadow-md mt-2"
            >
              ĐĂNG NHẬP NGAY
            </Button>
          </form>
        ) : (
          /* FORM ĐĂNG KÝ (GMAIL + MẬT KHẨU + NHẬP LẠI MẬT KHẨU) */
          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* 1. Gmail */}
            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                GMAIL / EMAIL ĐĂNG KÝ <span className="text-rose-600">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFormError(null);
                }}
                placeholder="VD: nguyenvana@gmail.com"
                className={`w-full px-3.5 py-3 rounded-xl border text-neutral-900 font-bold focus:outline-none text-sm transition-all ${
                  isEmailTouched && !isEmailValid
                    ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500"
                    : "border-neutral-300 focus:ring-2 focus:ring-brand-500"
                }`}
                required
              />
              {isEmailTouched && !isEmailValid ? (
                <p className="text-[11px] text-rose-600 font-bold mt-1">
                  Gmail chưa đúng định dạng (cần có @gmail.com)
                </p>
              ) : (
                <p className="text-[11px] text-neutral-400 font-medium mt-1">
                  Đăng ký xong là vào mua hàng ngay không cần xác nhận email.
                </p>
              )}
            </div>

            {/* 2. Mật khẩu */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider">
                  MẬT KHẨU <span className="text-rose-600">*</span>
                </label>
                <span
                  className={`text-[11px] font-bold ${
                    isPasswordTouched && !isPasswordValid
                      ? "text-rose-600 font-black"
                      : isPasswordValid
                      ? "text-emerald-700 font-black"
                      : "text-neutral-400"
                  }`}
                >
                  {password.length}/6 ký tự
                </span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFormError(null);
                }}
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)..."
                className={`w-full px-3.5 py-3 rounded-xl border text-neutral-900 font-bold focus:outline-none text-sm transition-all ${
                  isPasswordTouched && !isPasswordValid
                    ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500"
                    : isPasswordValid
                    ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                    : "border-neutral-300 focus:ring-2 focus:ring-brand-500"
                }`}
                required
              />
              {isPasswordTouched && !isPasswordValid && (
                <p className="text-[11px] text-rose-600 font-bold mt-1">
                  Mật khẩu cần tối thiểu 6 ký tự (còn thiếu {6 - password.length} ký tự)
                </p>
              )}
            </div>

            {/* 3. Nhập lại mật khẩu */}
            <div>
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                NHẬP LẠI MẬT KHẨU <span className="text-rose-600">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFormError(null);
                }}
                placeholder="Nhập lại chính xác mật khẩu trên..."
                className={`w-full px-3.5 py-3 rounded-xl border text-neutral-900 font-bold focus:outline-none text-sm transition-all ${
                  isConfirmTouched && !isConfirmMatch
                    ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500"
                    : isConfirmTouched && isConfirmMatch
                    ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                    : "border-neutral-300 focus:ring-2 focus:ring-brand-500"
                }`}
                required
              />
              {isConfirmTouched && !isConfirmMatch && (
                <p className="text-[11px] text-rose-600 font-bold mt-1">
                  Mật khẩu nhập lại chưa khớp với mật khẩu ở trên!
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              isLoading={isSubmitting}
              className="bg-brand-900 hover:bg-brand-950 text-white font-black text-xs uppercase tracking-wider py-3.5 shadow-md mt-2"
            >
              HOÀN TẤT ĐĂNG KÝ & VÀO MUA HÀNG
            </Button>
          </form>
        )}
      </div>
    </BottomSheet>
  );
};
