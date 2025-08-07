import React, { useState, useRef, useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

interface DropDownProps {
  label?: string;
  required?: boolean;
  options: string[];
  className?: string;
  defaultValue?: string;
  value?: string; // Add controlled value prop
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  [key: string]: any; // For other HTML select attributes
}

const DropDown = ({
  label,
  required = false,
  options,
  className,
  defaultValue = "Select an option",
  value,
  ...props
}: DropDownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  // Use value prop if provided (controlled), otherwise use internal state (uncontrolled)
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value !== undefined ? value : internalValue;
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className={cn(
        plusJakartaSans.className,
        "text-sm relative",
        "w-full",
        className
      )}
    >
      {label && (
        <label className="font-medium text-black mb-2 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Custom Dropdown Container */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full px-4 py-3.5 text-left bg-white border border-gray-300 rounded-xl",
            "focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
            "hover:border-orange-400 hover:shadow-sm",
            "transition-all duration-200 ease-in-out outline-none",
            "flex items-center justify-between",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "shadow-sm hover:shadow-md",
            isOpen && "border-orange-500 ring-2 ring-orange-500/20"
          )}
          disabled={props.disabled}
        >
          <span
            className={cn(
              "text-sm",
              selectedValue === defaultValue ? "text-gray-500" : "text-black"
            )}
          >
            {selectedValue}
          </span>
          <div className="flex items-center">
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400 transition-transform duration-200" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-200" />
            )}
          </div>
        </button>

        {/* Dropdown Options */}
        {isOpen && (
          <div
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
            style={{
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            {options.map((option, index) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  // Only update internal state if not controlled
                  if (value === undefined) {
                    setInternalValue(option);
                  }
                  setIsOpen(false);
                  // Trigger onChange if provided
                  if (props.onChange) {
                    const event = {
                      target: { value: option },
                    } as React.ChangeEvent<HTMLSelectElement>;
                    props.onChange(event);
                  }
                }}
                className={cn(
                  "w-full px-4 py-3 text-left text-sm hover:bg-orange-50",
                  "transition-colors duration-150 ease-in-out",
                  "first:rounded-t-xl last:rounded-b-xl",
                  "focus:bg-orange-50 focus:outline-none",
                  selectedValue === option &&
                    "bg-orange-100 text-orange-700 font-medium"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hidden native select for form compatibility */}
      <select
        className="sr-only"
        {...props}
        required={required}
        value={selectedValue === defaultValue ? "" : selectedValue}
        onChange={(e) => {
          // Only update internal state if not controlled
          if (value === undefined) {
            setInternalValue(e.target.value || defaultValue);
          }
          if (props.onChange) {
            props.onChange(e);
          }
        }}
      >
        <option value="" disabled={selectedValue !== defaultValue}>
          {defaultValue}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DropDown;
