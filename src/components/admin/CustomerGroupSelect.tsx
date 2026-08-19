"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { CustomerScope } from "@/lib/types";

export interface CustomerGroupOption {
  value: CustomerScope;
  label: string;
  description?: string;
}

export const CUSTOMER_GROUP_OPTIONS: CustomerGroupOption[] = [
  {
    value: "ALL",
    label: "Tất cả khách hàng",
    description: "Áp dụng cho mọi đối tượng khách hàng (mới và cũ)",
  },
  {
    value: "NEW_CUSTOMERS",
    label: "Chỉ khách hàng mới (Chưa có đơn hoàn thành)",
    description: "Chỉ áp dụng cho tài khoản hoặc số điện thoại đặt lần đầu",
  },
  {
    value: "RETURNING_CUSTOMERS",
    label: "Chỉ khách hàng thân thiết (Đã có đơn mua)",
    description: "Chỉ áp dụng cho khách đã có ít nhất 1 đơn hoàn tất thành công",
  },
];

interface CustomerGroupSelectProps {
  value: CustomerScope;
  onChange: (value: CustomerScope) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const CustomerGroupSelect: React.FC<CustomerGroupSelectProps> = ({
  value,
  onChange,
  label = "NHÓM KHÁCH HÀNG ÁP DỤNG",
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption =
    CUSTOMER_GROUP_OPTIONS.find((opt) => opt.value === value) ||
    CUSTOMER_GROUP_OPTIONS[0];

  // Đóng khi click bên ngoài container
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        const curIdx = CUSTOMER_GROUP_OPTIONS.findIndex(
          (opt) => opt.value === value
        );
        setFocusedIndex(curIdx >= 0 ? curIdx : 0);
      }
      return next;
    });
  };

  const handleSelect = (val: CustomerScope) => {
    onChange(val);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  // Keyboard navigation & Accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "Enter" ||
        e.key === " "
      ) {
        e.preventDefault();
        setIsOpen(true);
        const curIdx = CUSTOMER_GROUP_OPTIONS.findIndex(
          (opt) => opt.value === value
        );
        setFocusedIndex(curIdx >= 0 ? curIdx : 0);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
      case "Tab":
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < CUSTOMER_GROUP_OPTIONS.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : CUSTOMER_GROUP_OPTIONS.length - 1
        );
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (
          focusedIndex >= 0 &&
          focusedIndex < CUSTOMER_GROUP_OPTIONS.length
        ) {
          handleSelect(CUSTOMER_GROUP_OPTIONS[focusedIndex].value);
        }
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`p-3 sm:p-3.5 bg-white rounded-xl border border-neutral-200/90 space-y-2 relative select-none ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Label */}
      {label && (
        <label className="block text-xs sm:text-sm font-bold uppercase text-neutral-800 tracking-wider">
          {label}
        </label>
      )}

      {/* Field Trigger Button Container */}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          onClick={toggleDropdown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={label || selectedOption.label}
          className={`w-full min-h-[44px] sm:min-h-[48px] px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white rounded-xl border flex items-center justify-between gap-2.5 transition-all duration-200 cursor-pointer shadow-xs focus:outline-none ${
            disabled
              ? "opacity-60 cursor-not-allowed bg-neutral-50 border-neutral-200"
              : isOpen
              ? "border-brand-500 ring-2 ring-brand-500/20 shadow-xs text-neutral-900"
              : "border-neutral-300 hover:border-brand-400 text-neutral-800"
          }`}
        >
          {/* Selected Option Text (Responsive & Line wrapping prevention) */}
          <span className="text-sm font-semibold text-neutral-900 text-left truncate flex-1 min-w-0">
            {selectedOption.label}
          </span>

          {/* Custom Chevron Icon with smooth 180° rotation */}
          <svg
            className={`w-[18px] h-[18px] text-neutral-400 transition-transform duration-200 ease-in-out flex-shrink-0 ${
              isOpen ? "rotate-180 text-brand-900" : "group-hover:text-neutral-600"
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Custom Dropdown Floating Panel */}
        {isOpen && (
          <div
            role="listbox"
            aria-label={label || "Danh sách nhóm khách hàng"}
            className="absolute z-50 left-0 right-0 top-full mt-1.5 w-full bg-white border border-neutral-200/95 rounded-xl sm:rounded-2xl p-1.5 shadow-xl shadow-neutral-950/10 focus:outline-none animate-in fade-in-0 slide-in-from-top-1 duration-150"
          >
            <div className="space-y-1">
              {CUSTOMER_GROUP_OPTIONS.map((option, idx) => {
                const isSelected = option.value === value;
                const isFocused = idx === focusedIndex;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl flex items-center justify-between gap-3 text-left transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-brand-50/90 text-brand-950 font-bold border border-brand-200/70 shadow-2xs"
                        : isFocused
                        ? "bg-amber-50/60 text-neutral-900"
                        : "text-neutral-700 hover:bg-amber-50/50 hover:text-brand-950"
                    }`}
                  >
                    {/* Option Text Label & Subtitle */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm leading-snug break-words ${
                          isSelected
                            ? "font-bold text-brand-950"
                            : "font-medium text-neutral-800"
                        }`}
                      >
                        {option.label}
                      </p>
                      {option.description && (
                        <p className="text-[11px] text-neutral-400 font-medium mt-0.5 break-words line-clamp-2">
                          {option.description}
                        </p>
                      )}
                    </div>

                    {/* Active Checkmark Icon (Only shown on selected option) */}
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-brand-900 flex-shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
