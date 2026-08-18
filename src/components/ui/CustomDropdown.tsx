"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  shortLabel?: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  prefix?: string;
  className?: string;
  menuClassName?: string;
  align?: "left" | "right";
  ariaLabel?: string;
}

export function CustomDropdown<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  prefix,
  className = "",
  menuClassName = "",
  align = "left",
  ariaLabel,
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Tính toán hướng mở (xuống dưới hoặc lên trên nếu gần đáy màn hình)
  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedMenuHeight = options.length * 44 + 20;

    if (spaceBelow < estimatedMenuHeight && rect.top > estimatedMenuHeight) {
      setOpenUpward(true);
    } else {
      setOpenUpward(false);
    }
  }, [options.length]);

  const toggleDropdown = () => {
    if (!isOpen) {
      calculatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  // Đóng khi click ra ngoài
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  // Hỗ trợ phím Escape & Phím mũi tên (Accessibility)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        calculatePosition();
        setIsOpen(true);
        const currentIndex = options.findIndex((opt) => opt.value === value);
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
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
        setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          onChange(options[focusedIndex].value);
          setIsOpen(false);
          buttonRef.current?.focus();
        }
        break;
    }
  };

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const displayLabel = selectedOption
    ? prefix
      ? `${prefix} ${selectedOption.shortLabel || selectedOption.label}`
      : selectedOption.label
    : placeholder;

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || displayLabel}
        className={`w-full min-h-[40px] px-3 sm:px-3.5 py-2 bg-white border rounded-xl sm:rounded-2xl flex items-center justify-between gap-2 text-xs sm:text-sm font-bold text-neutral-800 transition-all select-none shadow-2xs active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
          isOpen
            ? "border-brand-500 ring-2 ring-brand-500/20 text-brand-950"
            : "border-neutral-200/90 hover:border-brand-300"
        }`}
      >
        <span className="truncate text-left flex-1 min-w-0">
          {displayLabel}
        </span>

        {/* Crisp Rotating Chevron Arrow */}
        <svg
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180 text-brand-900" : ""
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

      {/* Floating Custom Dropdown Menu Panel */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label={ariaLabel || "Tùy chọn"}
          className={`absolute z-50 w-full sm:w-auto min-w-[200px] max-w-[calc(100vw-24px)] bg-white border border-neutral-200/90 rounded-2xl p-1.5 shadow-xl shadow-neutral-950/10 focus:outline-none transition-all duration-150 transform opacity-100 scale-100 ${
            openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${align === "right" ? "right-0" : "left-0"} ${menuClassName}`}
        >
          <div className="space-y-1">
            {options.map((option, idx) => {
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
                  className={`w-full min-h-[40px] px-3 py-2 rounded-xl flex items-center justify-between gap-2 text-xs sm:text-sm font-bold text-left transition-all select-none ${
                    isSelected
                      ? "bg-brand-50/90 text-brand-950 font-black shadow-2xs"
                      : isFocused
                      ? "bg-neutral-100/80 text-neutral-900"
                      : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                  }`}
                >
                  <div className="flex items-center min-w-0 flex-1">
                    {/* Checkmark Icon for Selected Option */}
                    {isSelected ? (
                      <svg
                        className="w-4 h-4 text-brand-900 mr-2 flex-shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span className="w-4 mr-2 inline-block flex-shrink-0" />
                    )}

                    <span className="truncate">
                      {option.label}
                    </span>
                  </div>

                  {option.icon && (
                    <span className="flex-shrink-0 text-neutral-400 ml-1">
                      {option.icon}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
