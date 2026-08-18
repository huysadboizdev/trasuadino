import React from "react";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelLeft?: string;
  labelRight?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  labelLeft,
  labelRight,
  disabled = false,
}) => {
  return (
    <label
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {labelLeft && (
        <span
          className={`text-xs font-bold uppercase transition-colors ${
            !checked ? "text-neutral-900" : "text-neutral-400"
          }`}
        >
          {labelLeft}
        </span>
      )}
      <div
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) onChange(!checked);
        }}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? "bg-emerald-600" : "bg-neutral-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </div>
      {labelRight && (
        <span
          className={`text-xs font-bold uppercase transition-colors ${
            checked ? "text-emerald-700 font-extrabold" : "text-neutral-500"
          }`}
        >
          {labelRight}
        </span>
      )}
    </label>
  );
};
