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
  ...props
}: TextAreaProps) => {
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
      <textarea
        placeholder={placeholder}
        rows={rows}
        value={value}
        disabled={disabled}
        required={required}
        {...props}
        className={cn(
          "w-full px-4 py-3.5 border border-gray-300 rounded-xl",
          "focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
          "hover:border-orange-400 hover:shadow-sm",
          "transition-all duration-200 ease-in-out outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "shadow-sm hover:shadow-md",
          lockHeight && "resize-none",
          className
        )}
        onChange={handleChange}
      />
    </div>
  );
};

export default TextArea;
