import React, { useState, useRef, useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  labelClassName?: string;
  required?: boolean;
  options: SelectOption[];
  className?: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  error?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

const Select = ({
  label,
  labelClassName,
  required = false,
  options,
  className,
  placeholder = "Select an option",
  value,
  disabled = false,
  onChange,
  error,
  searchable = false,
  searchPlaceholder = "Search options...",
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    } else if (searchable) {
      // Focus search input when dropdown opens
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [isOpen, searchable]);

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

  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  // Fallback "Other" option, offered when a search matches nothing so users
  // can still pick it and type their own value.
  const otherOption = options.find((option) => option.value === "Other");

  // Filter options by search term (matches label or value)
  const filteredOptions = searchable && searchTerm.trim()
    ? options.filter(
        (option) =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          option.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

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
        <label
          className={cn(
            "font-medium text-black mb-2 block",
            labelClassName
          )}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Custom Dropdown Container */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full px-4 py-3.5 text-left bg-white border rounded-xl",
            "focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
            "hover:shadow-sm",
            "transition-all duration-200 ease-in-out outline-none",
            "flex items-center justify-between",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "shadow-sm hover:shadow-md",
            isOpen && "border-orange-500 ring-2 ring-orange-500/20",
            error 
              ? "border-red-500 hover:border-red-500 focus:border-red-500 focus:ring-red-500/20" 
              : "border-gray-300 hover:border-orange-400"
          )}
          disabled={disabled}
        >
          <span
            className={cn(
              "text-sm",
              !selectedOption ? "text-gray-500" : "text-black"
            )}
          >
            {displayValue}
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
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-hidden"
            style={{
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            {searchable && (
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>
            )}
            <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              searchTerm.trim() && otherOption ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if (onChange) {
                      onChange(otherOption.value);
                    }
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm hover:bg-orange-50",
                    "transition-colors duration-150 ease-in-out",
                    "rounded-xl focus:bg-orange-50 focus:outline-none",
                    value === otherOption.value &&
                      "bg-orange-100 text-orange-700 font-medium"
                  )}
                >
                  {otherOption.label}
                </button>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm.trim()
                    ? "No options found"
                    : "No options available"}
                </div>
              )
            ) : (
              filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onChange) {
                    onChange(option.value);
                  }
                }}
                className={cn(
                  "w-full px-4 py-3 text-left text-sm hover:bg-orange-50",
                  "transition-colors duration-150 ease-in-out",
                  "first:rounded-t-xl last:rounded-b-xl",
                  "focus:bg-orange-50 focus:outline-none",
                  value === option.value &&
                    "bg-orange-100 text-orange-700 font-medium"
                )}
              >
                {option.label}
              </button>
              ))
            )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default Select;
