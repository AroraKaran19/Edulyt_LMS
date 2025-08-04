import React, { useState, useRef } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { Percent } from "lucide-react";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

interface PercentageInputProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  progressBar?: boolean;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setChange?: (value: string) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const PercentageInput = ({
  label,
  placeholder = "0",
  required = false,
  className,
  progressBar = false,
  value = "",
  onChange,
  setChange,
  min = 0,
  max = 100,
  disabled = false,
  ...props
}: PercentageInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert value to string for input handling
  const stringValue = value?.toString() || "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numValue = Number(inputValue);
    
    // Allow empty string or valid numbers within range
    if (inputValue === "" || (inputValue.match(/^\d*$/) && numValue >= min && numValue <= max)) {
      // Call traditional onChange if provided
      if (onChange) {
        onChange(e);
      }
      
      // Call setChange if provided
      if (setChange) {
        setChange(inputValue);
      }
    }
  };

  const getProgressColor = () => {
    const numValue = Number(stringValue) || 0;
    if (numValue >= 80) return "bg-green-500";
    if (numValue >= 60) return "bg-orange-500";
    if (numValue >= 40) return "bg-yellow-500";
    return "bg-gray-300";
  };

  const getProgressWidth = () => {
    const numValue = Number(stringValue) || 0;
    return Math.min((numValue / max) * 100, 100);
  };

  return (
    <div
      className={cn(
        "w-full flex flex-col",
        plusJakartaSans.className,
        "text-sm"
      )}
    >
      {label && (
        <label className="font-medium text-black mb-2 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Input Container */}
        <div className="relative">
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min={min}
            max={max}
            placeholder={placeholder}
            disabled={disabled}
            {...props}
            className={cn(
              "w-full px-4 py-3.5 pr-12 border border-gray-300 rounded-xl",
              "focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
              "hover:border-orange-400 hover:shadow-sm",
              "transition-all duration-200 ease-in-out outline-none",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-sm hover:shadow-md",
              isFocused && "border-orange-500 ring-2 ring-orange-500/20",
              className
            )}
            required={required}
            value={stringValue}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          
          {/* Percentage Icon */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <Percent className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Progress Bar */}
        {progressBar && stringValue && Number(stringValue) > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span className="font-medium">{stringValue}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300 ease-out",
                  getProgressColor()
                )}
                style={{ width: `${getProgressWidth()}%` }}
              />
            </div>
          </div>
        )}

        {/* Value Indicator */}
        {progressBar && stringValue && Number(stringValue) > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              getProgressColor()
            )} />
            <span className="text-xs text-gray-500">
              {Number(stringValue) >= 80 ? "Excellent" : 
               Number(stringValue) >= 60 ? "Good" : 
               Number(stringValue) >= 40 ? "Fair" : "Poor"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PercentageInput;
