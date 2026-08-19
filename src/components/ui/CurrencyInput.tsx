"use client";

import React, { useState, useEffect, useRef } from "react";
import { formatVNDInput, parseVNDInput, calculateNewCursorPosition } from "@/lib/currencyUtils";

export interface CurrencyInputProps {
  value: number | string | null | undefined;
  onChange: (value: number | "") => void;
  placeholder?: string;
  suffix?: string;
  disabled?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  className?: string;
  inputClassName?: string;
  size?: "sm" | "md" | "lg";
  id?: string;
  name?: string;
  autoFocus?: boolean;
  "aria-label"?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = "0",
  suffix = "₫",
  disabled = false,
  required = false,
  min,
  max,
  className = "",
  inputClassName = "",
  size = "md",
  id,
  name,
  autoFocus = false,
  "aria-label": ariaLabel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Format initial display value
  const [displayValue, setDisplayValue] = useState<string>(() => formatVNDInput(value));

  // Synchronize internal display state when external value changes
  useEffect(() => {
    const formatted = formatVNDInput(value);
    setDisplayValue(formatted);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const oldCursorPos = e.target.selectionStart || 0;
    const oldDisplay = displayValue;

    // Parse raw number and compute new formatted string
    const rawNumeric = parseVNDInput(rawInput);
    
    // Check max constraint if defined
    if (max !== undefined && typeof rawNumeric === "number" && rawNumeric > max) {
      return;
    }

    const newFormatted = formatVNDInput(rawNumeric);
    setDisplayValue(newFormatted);

    // Emit pure integer or empty string to parent
    onChange(rawNumeric);

    // Adjust cursor position so caret does not jump
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const newCursorPos = calculateNewCursorPosition(
          oldDisplay,
          newFormatted,
          oldCursorPos
        );
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow navigation, deletion, clipboard shortcuts
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];

    if (
      allowedKeys.includes(e.key) ||
      (e.ctrlKey && ["a", "c", "v", "x", "z"].includes(e.key.toLowerCase())) ||
      (e.metaKey && ["a", "c", "v", "x", "z"].includes(e.key.toLowerCase()))
    ) {
      return;
    }

    // Block non-digit keys
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const sizeClasses = {
    sm: "py-1.5 px-3 text-xs min-h-[36px]",
    md: "py-2 px-3.5 text-xs sm:text-sm min-h-[44px]",
    lg: "py-2.5 px-4 text-sm sm:text-base min-h-[48px]",
  };

  return (
    <div className={`relative flex items-center w-full min-w-0 ${className}`}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`w-full rounded-xl border border-neutral-300 font-bold text-neutral-900 bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all shadow-xs pr-12 ${
          sizeClasses[size]
        } ${disabled ? "bg-neutral-100 text-neutral-400 cursor-not-allowed" : ""} ${inputClassName}`}
      />
      {suffix && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs sm:text-sm font-black text-neutral-400 pointer-events-none select-none">
          {suffix}
        </span>
      )}
    </div>
  );
};
