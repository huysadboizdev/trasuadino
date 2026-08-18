import React from "react";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "brand"
  | "purple";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "md",
  className = "",
  dot = false,
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    success: "bg-emerald-100 text-emerald-800 border-emerald-300",
    warning: "bg-amber-100 text-amber-900 border-amber-300",
    danger: "bg-rose-100 text-rose-800 border-rose-300",
    info: "bg-sky-100 text-sky-800 border-sky-300",
    neutral: "bg-neutral-100 text-neutral-800 border-neutral-300",
    brand: "bg-brand-100 text-brand-900 border-brand-300",
    purple: "bg-purple-100 text-purple-900 border-purple-300",
  };

  const dotColors: Record<BadgeVariant, string> = {
    success: "bg-emerald-600",
    warning: "bg-amber-600",
    danger: "bg-rose-600",
    info: "bg-sky-600",
    neutral: "bg-neutral-600",
    brand: "bg-brand-600",
    purple: "bg-purple-600",
  };

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5 font-semibold",
    md: "text-xs px-2.5 py-1 font-bold",
    lg: "text-sm px-3 py-1.5 font-bold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border tracking-wide uppercase transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
