import React, { useState } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

interface CheckBoxProps {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  setChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  [key: string]: any; // For other HTML input attributes
}

const CheckBoxContainer = ({ 
  label, 
  checked = false, 
  onChange,
  setChange,
  disabled = false,
  required = false,
  className,
  ...props 
}: CheckBoxProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (newChecked: boolean) => {
    // Call traditional onChange if provided
    if (onChange) {
      onChange(newChecked);
    }
    
    // Call setChange if provided
    if (setChange) {
      setChange(newChecked);
    }
  };

  return (
    <div className={cn(
      "w-full flex flex-col gap-2",
      plusJakartaSans.className,
      "text-sm",
      className
    )}>
      {/* Container for checkbox and label */}
      <div className={cn(
        "w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl",
        "hover:border-orange-200 hover:shadow-sm",
        "transition-all duration-200 ease-in-out",
        isFocused && "border-orange-300 ring-1 ring-orange-500/20",
        disabled && "opacity-50"
      )}>
        {/* Custom Checkbox */}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && handleChange(!checked)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            className={cn(
              "w-5 h-5 border-2 rounded-md flex items-center justify-center",
              "transition-all duration-200 ease-in-out",
              "focus:outline-none focus:ring-2 focus:ring-orange-500/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              checked 
                ? "bg-orange-500 border-orange-500 hover:bg-orange-600 hover:border-orange-600" 
                : "bg-white border-gray-300 hover:border-orange-400",
              isFocused && "ring-2 ring-orange-500/20"
            )}
            {...props}
          >
            {checked && (
              <Check 
                className="w-3 h-3 text-white" 
                style={{
                  animation: 'fadeIn 0.2s ease-out'
                }}
              />
            )}
          </button>
          
          {/* Hidden native checkbox for form compatibility */}
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => handleChange(e.target.checked)}
            className="sr-only"
            disabled={disabled}
            required={required}
          />
        </div>

        {/* Label */}
        <label 
          className={cn(
            "font-medium text-black cursor-pointer select-none flex-1",
            "hover:text-orange-600 transition-colors duration-200",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !disabled && handleChange(!checked)}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
    </div>
  );
};

export default CheckBoxContainer;
