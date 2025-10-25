import React, { useState } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  label: string;
  value?: Date | string;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  minDate?: Date | string;
  maxDate?: Date | string;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  label,
  value,
  onChange,
  placeholder = "Select date",
  required = false,
  className = "",
  minDate,
  maxDate,
}) => {
  // Convert string to Date object if needed
  const getDateValue = (val: Date | string | undefined): Date | undefined => {
    if (!val) return undefined;
    if (val instanceof Date) return val;
    if (typeof val === 'string') {
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    }
    return undefined;
  };

  const dateValue = getDateValue(value);
  const minDateValue = getDateValue(minDate);
  const maxDateValue = getDateValue(maxDate);

  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    dateValue ? new Date(dateValue.getFullYear(), dateValue.getMonth()) : new Date()
  );

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    // Use the same disabled check logic for consistency
    if (isDateDisabled(day)) return;
    
    onChange(selectedDate);
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    // Normalize dates to midnight for comparison
    if (minDateValue) {
      const normalizedMinDate = new Date(minDateValue.getFullYear(), minDateValue.getMonth(), minDateValue.getDate());
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      if (normalizedDate < normalizedMinDate) return true;
    }
    
    if (maxDateValue) {
      const normalizedMaxDate = new Date(maxDateValue.getFullYear(), maxDateValue.getMonth(), maxDateValue.getDate());
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      if (normalizedDate > normalizedMaxDate) return true;
    }
    
    return false;
  };

  const isToday = (day: number) => {
    const today = new Date();
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (day: number) => {
    if (!dateValue) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === dateValue.toDateString();
  };

  return (
    <div className={cn("relative", className)}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Input Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-orange-500 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className={cn(
            "text-sm",
            dateValue ? "text-gray-900" : "text-gray-500"
          )}>
            {dateValue ? formatDate(dateValue) : placeholder}
          </span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-gray-500 transition-transform",
          isOpen && "transform rotate-180"
        )} />
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <h3 className="font-medium text-gray-900">
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month start */}
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}
            
            {/* Days of the month */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const disabled = isDateDisabled(day);
              const today = isToday(day);
              const selected = isSelected(day);

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  disabled={disabled}
                  className={cn(
                    "p-2 text-sm rounded transition-colors cursor-pointer",
                    "flex items-center justify-center h-8 w-8",
                    disabled && "text-gray-300 cursor-not-allowed hover:bg-transparent",
                    selected && "bg-orange-500 text-white hover:bg-orange-600",
                    !disabled && !selected && today && "bg-blue-50 text-blue-600 font-medium hover:bg-blue-100",
                    !disabled && !selected && !today && "hover:bg-orange-50"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Clear button */}
          {dateValue && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={() => {
                  onChange(undefined);
                  setIsOpen(false);
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-800 py-1"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DateSelector;
