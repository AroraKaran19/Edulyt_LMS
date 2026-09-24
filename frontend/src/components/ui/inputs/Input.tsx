import React from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import IndianFlagIcon from "../../../../public/icons/IndiaFlag";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

interface InputProps {
  label?: string;
  labelClassName?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setChange?: (value: string) => void;
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
  showCharacterCount?: boolean;
  error?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  showIndiaFlag?: boolean;
  [key: string]: any; // For other HTML input attributes
}

const Input = ({
  label,
  labelClassName,
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
  minLength,
  maxLength,
  showCharacterCount = false,
  error,
  startAdornment,
  endAdornment,
  showIndiaFlag = true,
  ...props
}: InputProps) => {
  // Calculate character count
  const getCharacterCount = (text: string | number) => {
    const stringValue = text ? String(text) : "";
    return stringValue.length;
  };

  const characterCount = getCharacterCount(value || "");
  const isMinLengthMet = minLength ? characterCount >= minLength : true;
  const isMaxLengthExceeded = maxLength ? characterCount > maxLength : false;

  const hasAdornments = Boolean(startAdornment || endAdornment);

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
        <label
          className={cn("font-medium text-black mb-2 block", labelClassName)}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex gap-2 items-center">
        {type === "tel" && showIndiaFlag && (
          <div className="rounded-md border border-gray-300 bg-primary-500 flex items-center justify-center p-2">
            <IndianFlagIcon className="size-7.5" />
          </div>
        )}
        {hasAdornments ? (
          <div
            className={cn(
              "relative flex min-h-[48px] w-full items-center gap-3 rounded-[10px] border bg-white px-3.5 transition-colors",
              "focus-within:border-[#F27420] focus-within:ring-2 focus-within:ring-[#F27420]/15",
              error
                ? "border-red-500"
                : "border-[#E4E7EC] hover:border-[#D0D5DD]"
            )}
          >
            {startAdornment}
            <input
              type={type}
              placeholder={placeholder}
              value={value}
              disabled={disabled}
              min={min}
              max={max}
              minLength={minLength}
              maxLength={maxLength}
              {...props}
              className={cn(
                "min-w-0 flex-1 border-0 bg-transparent py-3 text-sm font-medium text-[#333] outline-none",
                "placeholder:font-normal placeholder:text-[#98A2B3]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                variant === "small" && "text-xs py-2",
                showCharacterCount && "pr-12"
              )}
              required={required}
              onChange={handleChange}
              onKeyDown={props.onKeyDown}
              onPaste={props.onPaste}
            />
            {endAdornment}
            {showCharacterCount && (
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-white px-1">
                <div
                  className={cn(
                    "text-right",
                    isMaxLengthExceeded
                      ? "text-red-500"
                      : !isMinLengthMet
                        ? "text-orange-500"
                        : "text-gray-500"
                  )}
                >
                  {characterCount}
                  {maxLength && `/${maxLength}`}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <input
              type={type}
              placeholder={placeholder}
              value={value}
              disabled={disabled}
              min={min}
              max={max}
              minLength={minLength}
              maxLength={maxLength}
              {...props}
              className={cn(
                "w-full px-4 py-3.5 border rounded-xl bg-white text-black",
                "focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
                "hover:shadow-sm",
                "transition-all duration-200 ease-in-out outline-none",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "shadow-sm hover:shadow-md",
                variant === "small" && "text-xs py-2 px-3",
                showCharacterCount && "pr-12",
                error
                  ? "border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : "border-gray-300 hover:border-orange-400"
              )}
              required={required}
              onChange={handleChange}
              onKeyDown={props.onKeyDown}
              onPaste={props.onPaste}
            />
            {showCharacterCount && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs bg-white px-1 rounded">
                <div
                  className={cn(
                    "text-right",
                    isMaxLengthExceeded
                      ? "text-red-500"
                      : !isMinLengthMet
                        ? "text-orange-500"
                        : "text-gray-500"
                  )}
                >
                  {characterCount}
                  {maxLength && `/${maxLength}`}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {minLength && !isMinLengthMet && (
        <div className="text-xs text-orange-500 mt-1">
          Minimum {minLength} characters required ({minLength - characterCount}{" "}
          more needed)
        </div>
      )}
      {maxLength && isMaxLengthExceeded && (
        <div className="text-xs text-red-500 mt-1">
          Maximum {maxLength} characters exceeded (remove{" "}
          {characterCount - maxLength} characters)
        </div>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Input;
