import React, { useState, useRef, KeyboardEvent } from 'react';
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { Plus, X } from "lucide-react";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

interface TagInputProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  tags?: string[];
  setTags?: (tags: string[]) => void;
  onChange?: (tags: string[]) => void;
  disabled?: boolean;
  maxTags?: number;
  duplicate?: boolean;
  [key: string]: any; // For other HTML attributes
}

const TagInput = ({
  label,
  placeholder = "Enter tag...",
  required = false,
  className,
  tags = [],
  setTags,
  onChange,
  disabled = false,
  maxTags = 10,
  duplicate = false,
  ...props
}: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    const trimmedValue = inputValue.trim();
    // Check if we can add more tags (maxTags = 0 means infinite)
    const canAddMore = maxTags === 0 || tags.length < maxTags;
    
    if (trimmedValue && canAddMore) {
      // Check for duplicates only if duplicate is false
      const isDuplicate = !duplicate && tags.includes(trimmedValue);
      
      if (!isDuplicate) {
        const newTags = [...tags, trimmedValue];
        
        // Call setTags if provided
        if (setTags) {
          setTags(newTags);
        }
        
        // Call onChange if provided
        if (onChange) {
          onChange(newTags);
        }
        
        setInputValue("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    
    // Call setTags if provided
    if (setTags) {
      setTags(newTags);
    }
    
    // Call onChange if provided
    if (onChange) {
      onChange(newTags);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className={cn(
      "w-full flex flex-col gap-2",
      plusJakartaSans.className,
      "text-sm",
      className
    )}>
      {label && (
        <label className="font-medium text-black mb-2 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* Input Container */}
      <div className="relative">
        <div className={cn(
          "w-full flex items-center gap-2 p-3 border border-gray-300 rounded-xl bg-white",
          "focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500",
          "hover:border-orange-400 hover:shadow-sm",
          "transition-all duration-200 ease-in-out",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "shadow-sm hover:shadow-md",
          isFocused && "border-orange-500 ring-2 ring-orange-500/20"
        )}>
          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={inputValue}
            disabled={disabled}
            {...props}
            className={cn(
              "flex-1 outline-none",
              "placeholder-gray-400",
              "disabled:cursor-not-allowed"
            )}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          
          {/* Add Button */}
          <button
            type="button"
            onClick={handleAddTag}
            disabled={disabled || !inputValue.trim() || (maxTags !== 0 && tags.length >= maxTags)}
            className={cn(
              "p-2 rounded-lg flex items-center justify-center",
              "transition-all duration-200 ease-in-out",
              "focus:outline-none focus:ring-2 focus:ring-orange-500/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              inputValue.trim() && (maxTags === 0 || tags.length < maxTags)
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tags Display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700",
                "rounded-lg border border-orange-200",
                "transition-all duration-200 ease-in-out",
                "hover:bg-orange-200 hover:border-orange-300"
              )}
            >
              <span className="text-sm font-medium">{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                disabled={disabled}
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center",
                  "hover:bg-orange-300 transition-colors duration-200",
                  "focus:outline-none focus:ring-1 focus:ring-orange-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Max Tags Warning */}
      {maxTags !== 0 && tags.length >= maxTags && (
        <p className="text-xs text-orange-600 mt-1">
          Maximum {maxTags} tags allowed
        </p>
      )}
    </div>
  );
};

export default TagInput;