import React from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

interface InputProps {
  label?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setChange?: (value: string) => void;
  disabled?: boolean;
  [key: string]: any; // For other HTML input attributes
}

const Input = ({
  label,
  placeholder,
  type = "text",
  required = false,
  className,
  value,
  onChange,
  setChange,
  disabled = false,
  min,
  max,
  variant = "default",
  ...props
}: InputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Call traditional onChange if provided
    if (onChange) {
      onChange(e);
    }
    
    // Call setChange if provided
    if (setChange) {
      setChange(e.target.value);
    }
  };

  return (
    <div
      className={cn(
        "w-full flex flex-col",
        plusJakartaSans.className,
        "text-sm",
        className
      )}
    >
      {label && (
        <label className="font-medium text-black mb-2 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        min={min}
        max={max}
        {...props}
        className={cn(
          "w-full px-4 py-3.5 border border-gray-300 rounded-xl",
          "focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
          "hover:border-orange-400 hover:shadow-sm",
          "transition-all duration-200 ease-in-out outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "shadow-sm hover:shadow-md",
          variant === "small" && "text-xs py-2 px-3",
        )}
        required={required}
        onChange={handleChange}
      />
    </div>
  );
};

export default Input;
