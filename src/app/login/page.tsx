"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { triggerGoogleOAuth } from "@/lib/googleAuth";

const GoogleLogoIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");

  const { user, isLoading, login, register, loginWithGoogle } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Email check
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isEmailTouched = email.length > 0;

  // Password check
  const isPasswordValid = password.length >= 6;
  const isPasswordTouched = password.length > 0;

  // Confirm password check
  const isConfirmMatch = password === confirmPassword;
  const isConfirmTouched = confirmPassword.length > 0;

  // Tự động chuyển hướng nếu người dùng đã có phiên đăng nhập
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "ADMIN" || user.role === "STAFF") {
        router.push(redirectTarget || "/admin");
      } else {
        router.push(redirectTarget || "/");
      }
    }
  }, [user, isLoading, redirectTarget, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setFormError("Vui lòng nhập địa chỉ Gmail / Email của bạn");
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
        if (res.user?.role === "ADMIN" || res.user?.role === "STAFF") {
          router.push(redirectTarget || "/admin");
        } else {
          router.push(redirectTarget || "/");
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
        if (res.user?.role === "ADMIN" || res.user?.role === "STAFF") {
          router.push(redirectTarget || "/admin");
        } else {
          router.push(redirectTarget || "/");
        }
      } else {
        setFormError(res.message);
        showToast(res.message, "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kích hoạt Đăng Nhập Google Trực Tiếp (Mở popup tài khoản Google chính hãng)
  const handleGoogleDirectLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setFormError(null);
      const googleUser = await triggerGoogleOAuth();

      const res = await loginWithGoogle(googleUser.email, googleUser.name);
      showToast(res.message, "success");
      if (res.user?.role === "ADMIN" || res.user?.role === "STAFF") {
        router.push(redirectTarget || "/admin");
      } else {
        router.push(redirectTarget || "/");
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

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-3 sm:p-4 selection:bg-brand-500 selection:text-white">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-white border border-neutral-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-floating space-y-4 sm:space-y-6 animate-slide-up mx-auto">
        {/* Brand Header */}
        <div className="text-center space-y-1.5 sm:space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-brand-900 via-brand-950 to-[#2c140e] text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-md group-hover:scale-105 transition-transform border border-brand-800/20">
              🦕
            </div>
          </Link>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-brand-950 tracking-tight uppercase">
              TRÀ SỮA DINO
            </h1>
            <p className="text-[11px] sm:text-xs text-neutral-500 font-bold tracking-wide mt-0.5">
              CỔNG ĐĂNG NHẬP HỆ THỐNG
            </p>
          </div>
        </div>

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
            HOẶC BẰNG EMAIL
          </span>
          <div className="flex-1 h-px bg-neutral-200" />
        </div>

        {/* Báo lỗi nếu có */}
        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-800 animate-slide-up">
            ⚠️ {formError}
          </div>
        )}

        {tab === "LOGIN" ? (
          /* FORM ĐĂNG NHẬP */
          <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="VD: ban@gmail.com hoặc admin@dino.vn"
                className={`w-full px-4 py-3 rounded-2xl border text-neutral-900 font-bold focus:outline-none text-sm transition-all ${
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
              <label className="block text-xs font-black uppercase text-neutral-700 tracking-wider mb-1.5">
                MẬT KHẨU
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFormError(null);
                }}
                placeholder="Nhập mật khẩu..."
                className="w-full px-4 py-3 rounded-2xl border border-neutral-300 text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              isLoading={isSubmitting}
              className="bg-brand-900 hover:bg-brand-950 text-white font-black text-xs uppercase tracking-wider py-4 shadow-md mt-2"
            >
              ĐĂNG NHẬP NGAY
            </Button>
          </form>
        ) : (
          /* FORM ĐĂNG KÝ */
          <form onSubmit={handleRegister} className="space-y-4">
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
                className={`w-full px-4 py-3 rounded-2xl border text-neutral-900 font-bold focus:outline-none text-sm transition-all ${
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
                className={`w-full px-4 py-3 rounded-2xl border text-neutral-900 font-bold focus:outline-none text-sm transition-all ${
                  isPasswordTouched && !isPasswordValid
                    ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500"
                    : isPasswordValid
                    ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                    : "border-neutral-300 focus:ring-2 focus:ring-brand-500"
                }`}
                required
              />
            </div>

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
                className={`w-full px-4 py-3 rounded-2xl border text-neutral-900 font-bold focus:outline-none text-sm transition-all ${
                  isConfirmTouched && !isConfirmMatch
                    ? "border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-500"
                    : isConfirmTouched && isConfirmMatch
                    ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                    : "border-neutral-300 focus:ring-2 focus:ring-brand-500"
                }`}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              isLoading={isSubmitting}
              className="bg-brand-900 hover:bg-brand-950 text-white font-black text-xs uppercase tracking-wider py-4 shadow-md mt-2"
            >
              HOÀN TẤT ĐĂNG KÝ & VÀO MUA HÀNG
            </Button>
          </form>
        )}

        {/* Footer info & back link */}
        <div className="pt-4 border-t border-neutral-100 text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-black text-brand-900 hover:text-brand-700 uppercase tracking-wider"
          >
            ← Quay lại trang chủ Trà Sữa Dino
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
