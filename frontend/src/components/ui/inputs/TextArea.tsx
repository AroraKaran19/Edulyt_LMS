import { Plus_Jakarta_Sans } from "next/font/google";
import React from "react";
import { cn } from "@/lib/utils";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

interface TextAreaProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  rows?: number;
  lockHeight?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  setChange?: (value: string) => void;
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
  showWordCount?: boolean;
  [key: string]: any; // For other HTML textarea attributes
}

const TextArea = ({
  label,
  placeholder,
  required = false,
  className,
  rows = 4,
  lockHeight = false,
  value,
  onChange,
  setChange,
  disabled = false,
  minLength,
  maxLength,
  showWordCount = false,
  ...props
}: TextAreaProps) => {
  // Calculate character count
  const getCharacterCount = (text: string) => {
    return text ? text.length : 0;
  };

  const characterCount = getCharacterCount(value || '');
  const isMinLengthMet = minLength ? characterCount >= minLength : true;
  const isMaxLengthExceeded = maxLength ? characterCount > maxLength : false;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
        "w-full flex flex-col gap-2",
        plusJakartaSans.className,
        "text-sm"
      )}
    >
      {label && (
        <label className="font-medium text-black block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <textarea
          placeholder={placeholder}
          rows={rows}
          value={value}
          disabled={disabled}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          {...props}
          className={cn(
            "w-full px-4 py-3.5 border border-gray-300 rounded-xl bg-white text-black",
            "focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
            "hover:border-orange-400 hover:shadow-sm",
            "transition-all duration-200 ease-in-out outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "shadow-sm hover:shadow-md",
            lockHeight && "resize-none",
            showWordCount && "pb-8", // Add bottom padding when word count is shown
            className
          )}
          onChange={handleChange}
        />
        {showWordCount && (
          <div className="absolute bottom-2 right-3 text-xs bg-white px-1 rounded">
            <div className={cn(
              "text-right",
              isMaxLengthExceeded ? "text-red-500" : 
              !isMinLengthMet ? "text-orange-500" : 
              "text-gray-500"
            )}>
              {characterCount}
              {maxLength && `/${maxLength}`}
            </div>
          </div>
        )}
        {minLength && !isMinLengthMet && (
          <div className="text-xs text-orange-500 mt-1">
            Minimum {minLength} characters required ({minLength - characterCount} more needed)
          </div>
        )}
        {maxLength && isMaxLengthExceeded && (
          <div className="text-xs text-red-500 mt-1">
            Maximum {maxLength} characters exceeded (remove {characterCount - maxLength} characters)
          </div>
        )}
      </div>
    </div>
  );
};

export default TextArea;
