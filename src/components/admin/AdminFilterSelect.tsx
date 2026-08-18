"use client";

import React, { useState } from "react";
import { BottomSheet } from "../ui/BottomSheet";
import { BadgeVariant } from "../ui/Badge";

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
  badgeVariant?: BadgeVariant;
  dotColor?: string;
  icon?: React.ReactNode;
}

interface AdminFilterSelectProps {
  label: string;
  title: string;
  subtitle?: string;
  value: string;
  options: FilterOption[];
  onChange: (id: string) => void;
  className?: string;
  icon?: React.ReactNode;
  placeholder?: string;
}

export const AdminFilterSelect: React.FC<AdminFilterSelectProps> = ({
  label,
  title,
  subtitle,
  value,
  options,
  onChange,
  className = "",
  icon,
  placeholder = "Chọn lọc...",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.id === value);
  const selectedLabel = selectedOption ? selectedOption.label : placeholder;
  const selectedCount = selectedOption?.count;

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger Button for Mobile & Tablet */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full min-h-[44px] px-3.5 py-2.5 bg-white rounded-2xl border border-neutral-300 hover:border-brand-500 focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 text-left transition-all shadow-xs flex items-center justify-between gap-2 select-none active:scale-[0.99] min-w-0 ${className}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && <span className="text-neutral-500 flex-shrink-0">{icon}</span>}
          <div className="flex items-baseline gap-1.5 min-w-0 truncate">
            <span className="text-[11px] font-black uppercase text-neutral-400 flex-shrink-0 tracking-wider">
              {label}:
            </span>
            <span className="text-xs sm:text-sm font-black text-neutral-900 truncate">
              {selectedLabel}
            </span>
            {selectedCount !== undefined && (
              <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-md flex-shrink-0 border border-neutral-200">
                {selectedCount}
              </span>
            )}
          </div>
        </div>

        {/* Dropdown Chevron Indicator */}
        <div className="flex items-center gap-1 flex-shrink-0 text-neutral-400 pl-1">
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Filter Bottom Sheet / Modal */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        subtitle={subtitle || `Đang chọn: ${selectedLabel}`}
        maxWidth="sm"
      >
        <div className="space-y-1.5 py-1 min-w-0">
          {options.map((opt) => {
            const isSelected = opt.id === value;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt.id)}
                className={`w-full min-h-[48px] px-3.5 py-3 rounded-2xl flex items-center justify-between gap-3 text-left transition-all border select-none active:scale-[0.98] min-w-0 ${
                  isSelected
                    ? "bg-brand-50/80 border-brand-300 text-brand-950 font-black shadow-xs ring-1 ring-brand-400/30"
                    : "bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-700 font-bold"
                }`}
              >
                {/* Radio Bullet & Label */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? "bg-brand-900 text-white shadow-xs"
                        : "border-2 border-neutral-300 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {opt.dotColor && (
                      <span className={`w-2.5 h-2.5 rounded-full ${opt.dotColor} flex-shrink-0`} />
                    )}
                    <span className={`text-xs sm:text-sm truncate ${isSelected ? "font-black text-neutral-900" : "text-neutral-800 font-bold"}`}>
                      {opt.label}
                    </span>
                  </div>
                </div>

                {/* Right Badge / Count */}
                {opt.count !== undefined && (
                  <div className="flex-shrink-0">
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-xl border transition-colors ${
                        isSelected
                          ? "bg-brand-900 text-white border-brand-900"
                          : "bg-neutral-100 text-neutral-600 border-neutral-200"
                      }`}
                    >
                      {opt.count}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
};
