"use client";
import ImageComponent from "@/components/ui/ImageComponent";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

const CalenderBtn = ({
  filters,
  activeFilter,
  setFilter,
	isLoading,
}: {
  filters: { label: string; value: number }[];
  activeFilter: number;
  setFilter: (filter: number) => void;
  isLoading: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
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

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          if (!isLoading) {
            setIsOpen(!isOpen);
          }
        }}
        className={`p-2 rounded-lg transition-all duration-200 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 cursor-pointer ${
          isOpen ? "bg-gray-100 shadow-sm" : ""
        }`}
        aria-label="Open calendar filter"
        aria-expanded={isOpen}
      >
        <ImageComponent
          src="/admin/total-users-icon.svg"
          alt="total-users"
          width={44}
          height={44}
          className="sm:w-11 sm:h-11"
        />
      </button>
      {isOpen && (
        <div className="absolute w-48 mt-2 top-full right-0 z-50 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="py-2">
            {filters.map((filter, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!isLoading) {
                    setFilter(filter.value);
                  }
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150 ease-in-out focus:outline-none focus:bg-gray-50 focus:text-gray-900 cursor-pointer",
                  activeFilter === filter.value && "bg-gray-200 text-gray-900"
                )}
              >
                <span className="flex items-center justify-between">
                  {filter.label}
                  <span className="text-xs text-gray-400 font-normal">
                    {filter.value === 0 ? "All" : `${filter.value} days`}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalenderBtn;
