import React from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost" | "success";
export type ButtonSize = "sm" | "md" | "lg" | "full";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "bg-brand-700 hover:bg-brand-800 text-white shadow-sm focus:ring-brand-500",
    secondary:
      "bg-neutral-800 hover:bg-neutral-900 text-white shadow-sm focus:ring-neutral-700",
    outline:
      "border-2 border-neutral-300 hover:bg-neutral-100 text-neutral-800 focus:ring-neutral-400",
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-400",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-400",
    ghost:
      "text-neutral-700 hover:bg-neutral-200/70 focus:ring-neutral-400",
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: "text-xs px-3 py-2 min-h-[36px]",
    md: "text-sm px-4 py-2.5 min-h-[44px]", // 44px chuẩn touch target cho mobile
    lg: "text-base px-5 py-3.5 min-h-[50px]",
    full: "w-full text-base px-5 py-3.5 min-h-[50px]",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Đang xử lý...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
