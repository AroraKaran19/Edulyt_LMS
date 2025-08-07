import React, { useState, useRef, useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

interface CategoryInputProps {
  label?: string;
  required?: boolean;
  options: string[];
  className?: string;
  defaultValue?: string;
  value?: string; // Add controlled value prop
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  setChange?: (value: string) => void;
  [key: string]: any; // For other HTML select attributes
}

const CategoryInput = ({
  label,
  required = false,
  options,
  className,
  defaultValue = "Select a category",
  value,
  disabled = false,
  onChange,
  setChange,
  ...props
}: CategoryInputProps) => {
  // Destructure setChange from props to avoid passing it to DOM elements
  const { setChange: _, ...domProps } = props;
  const [isOpen, setIsOpen] = useState(false);
  // Use value prop if provided (controlled), otherwise use internal state (uncontrolled)
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value !== undefined ? value : internalValue;
  const [isTyping, setIsTyping] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustomInput(false);
        setIsTyping(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus input when custom input is shown
  useEffect(() => {
    if (showCustomInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCustomInput]);

  const handleOptionSelect = (option: string) => {
    // Only update internal state if not controlled
    if (value === undefined) {
      setInternalValue(option);
    }
    setIsOpen(false);
    setShowCustomInput(false);
    setIsTyping(false);
    
    // Trigger onChange if provided
    if (onChange) {
      const event = {
        target: { value: option }
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(event);
    }
    
    // Trigger setChange if provided
    if (setChange) {
      setChange(option);
    }
  };

  const handleCustomCategorySubmit = () => {
    if (customValue.trim()) {
      handleOptionSelect(customValue.trim());
      setCustomValue("");
    }
  };

  const handleCustomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomCategorySubmit();
    } else if (e.key === 'Escape') {
      setShowCustomInput(false);
      setIsTyping(false);
      setCustomValue("");
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomValue(e.target.value);
    setIsTyping(true);
  };

  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(customValue.toLowerCase())
  );

  return (
    <div className={cn(plusJakartaSans.className, "text-sm relative", "w-full", className)}>
      {label && (
        <label className="font-medium text-black mb-2 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* Custom Dropdown Container */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              setShowCustomInput(false);
              setIsTyping(false);
            }
          }}
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
          disabled={disabled}
        >
          <span className={cn(
            "text-sm",
            selectedValue === defaultValue ? "text-gray-500" : "text-black"
          )}>
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
              animation: 'fadeIn 0.2s ease-out',
              scrollbarWidth: "thin"
            }}
          >
            {/* Custom Category Input */}
            <div className="p-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type custom category..."
                  value={customValue}
                  onChange={handleCustomInputChange}
                  onKeyDown={handleCustomInputKeyDown}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg",
                    "focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
                    "outline-none transition-all duration-200"
                  )}
                />
                <button
                  type="button"
                  onClick={handleCustomCategorySubmit}
                  disabled={!customValue.trim()}
                  className={cn(
                    "px-3 py-2 text-sm bg-orange-500 text-white rounded-lg",
                    "hover:bg-orange-600 transition-colors duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center gap-1"
                  )}
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>
            </div>

            {/* Existing Options */}
            {filteredOptions.length > 0 && (
              <div className="py-1">
                {filteredOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm hover:bg-orange-50",
                      "transition-colors duration-150 ease-in-out",
                      "focus:bg-orange-50 focus:outline-none",
                      selectedValue === option && "bg-orange-100 text-orange-700 font-medium"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {/* No results message */}
            {isTyping && filteredOptions.length === 0 && customValue.trim() && (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No matching categories found. Press Enter to create "{customValue.trim()}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden native select for form compatibility */}
      <select
        className="sr-only"
        {...domProps}
        required={required}
        value={selectedValue === defaultValue ? "" : selectedValue}
        onChange={(e) => {
          // Only update internal state if not controlled
          if (value === undefined) {
            setInternalValue(e.target.value || defaultValue);
          }
          if (onChange) {
            onChange(e);
          }
          if (setChange) {
            setChange(e.target.value);
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

export default CategoryInput; 