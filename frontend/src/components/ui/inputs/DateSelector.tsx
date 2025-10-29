import React, { useState, useMemo, useCallback } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

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
    if (typeof val === "string") {
      const date = new Date(val);
      return isNaN(date.getTime()) ? undefined : date;
    }
    return undefined;
  };

  const dateValue = getDateValue(value);
  const minDateValue = getDateValue(minDate);
  const maxDateValue = getDateValue(maxDate);

  const [isOpen, setIsOpen] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    dateValue
      ? new Date(dateValue.getFullYear(), dateValue.getMonth())
      : new Date()
  );

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Memoize calendar calculations
  const { daysInMonth, firstDayOfMonth } = useMemo(() => {
    const daysCount = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();
    const firstDay = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    ).getDay();

    return {
      daysInMonth: daysCount,
      firstDayOfMonth: firstDay,
    };
  }, [currentMonth]);

  // Generate years array (current year ± 50 years) - memoized
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearsList = [];
    for (let i = currentYear - 50; i <= currentYear + 10; i++) {
      yearsList.push(i);
    }
    return yearsList;
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isDateDisabled = useCallback(
    (day: number) => {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );

      // Normalize dates to midnight for comparison
      if (minDateValue) {
        const normalizedMinDate = new Date(
          minDateValue.getFullYear(),
          minDateValue.getMonth(),
          minDateValue.getDate()
        );
        const normalizedDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        if (normalizedDate < normalizedMinDate) return true;
      }

      if (maxDateValue) {
        const normalizedMaxDate = new Date(
          maxDateValue.getFullYear(),
          maxDateValue.getMonth(),
          maxDateValue.getDate()
        );
        const normalizedDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        if (normalizedDate > normalizedMaxDate) return true;
      }

      return false;
    },
    [currentMonth, minDateValue, maxDateValue]
  );

  const isToday = useCallback(
    (day: number) => {
      const today = new Date();
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      return date.toDateString() === today.toDateString();
    },
    [currentMonth]
  );

  const isSelected = useCallback(
    (day: number) => {
      if (!dateValue) return false;
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      return date.toDateString() === dateValue.toDateString();
    },
    [currentMonth, dateValue]
  );

  const handleDateClick = useCallback(
    (day: number) => {
      const selectedDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );

      // Use the same disabled check logic for consistency
      if (isDateDisabled(day)) return;

      onChange(selectedDate);
      setIsOpen(false);
    },
    [currentMonth, onChange, isDateDisabled]
  );

  const navigateMonth = useCallback((direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  }, []);

  const handleMonthSelect = useCallback(
    (monthIndex: number) => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex));
      setShowMonthSelector(false);
    },
    [currentMonth]
  );

  const handleYearSelect = useCallback(
    (year: number) => {
      setCurrentMonth(new Date(year, currentMonth.getMonth()));
      setShowYearSelector(false);
    },
    [currentMonth]
  );

  // Memoize calendar days at top level to avoid conditional hook calls
  const calendarDays = useMemo(() => 
    Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const disabled = isDateDisabled(day);
      const today = isToday(day);
      const selected = isSelected(day);

      return (
        <button
          type="button"
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={disabled}
          className={cn(
            "p-2 text-sm rounded transition-colors cursor-pointer",
            "flex items-center justify-center h-8 w-8",
            disabled &&
              "text-gray-300 cursor-not-allowed hover:bg-transparent",
            selected && "bg-orange-500 text-white hover:bg-orange-600",
            !disabled &&
              !selected &&
              today &&
              "bg-blue-50 text-blue-600 font-medium hover:bg-blue-100",
            !disabled && !selected && !today && "hover:bg-orange-50"
          )}
        >
          {day}
        </button>
      );
    }), [daysInMonth, isDateDisabled, isToday, isSelected, handleDateClick]
  );

  return (
    <div
      className={cn(
        "w-full flex flex-col",
        plusJakartaSans.className,
        "text-sm",
        className
      )}
    >
      <label className="font-medium text-black mb-2 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Input Trigger */}
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3.5 border border-gray-300 rounded-xl bg-white cursor-pointer hover:border-orange-400 hover:shadow-sm focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all duration-200 ease-in-out flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span
              className={cn(
                "text-sm",
                dateValue ? "text-black" : "text-gray-500"
              )}
            >
              {dateValue ? formatDate(dateValue) : placeholder}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-500 transition-transform cursor-pointer",
              isOpen && "transform rotate-180"
            )}
          />
        </div>

        {/* Calendar Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
            {!showMonthSelector && !showYearSelector ? (
              <>
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => navigateMonth("prev")}
                  className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                  <button
                    type="button"
                    onClick={() => setShowMonthSelector(true)}
                    className="font-medium text-gray-900 hover:text-orange-500 transition-colors cursor-pointer px-2 py-1 rounded hover:bg-orange-50"
                  >
                    {months[currentMonth.getMonth()]}{" "}
                    {currentMonth.getFullYear()}
                  </button>
                <button
                  type="button"
                  onClick={() => navigateMonth("next")}
                  className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium text-gray-500 py-2"
                    >
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
                  {calendarDays}
                </div>

                {/* Clear button */}
                {dateValue && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <button
                      type="button"
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
              </>
            ) : showMonthSelector ? (
              /* Month Selector */
              <div>
                <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setShowMonthSelector(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMonthSelector(false);
                    setShowYearSelector(true);
                  }}
                  className="font-medium text-gray-900 hover:text-orange-500 transition-colors cursor-pointer px-2 py-1 rounded hover:bg-orange-50"
                >
                    {currentMonth.getFullYear()}
                  </button>
                  <div className="w-6"></div> {/* Spacer for alignment */}
                </div>

                {/* Months Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {months.map((month, index) => {
                    const isCurrentMonth = index === currentMonth.getMonth();
                    const isToday =
                      index === new Date().getMonth() &&
                      currentMonth.getFullYear() === new Date().getFullYear();

                    return (
                    <button
                      type="button"
                      key={month}
                      onClick={() => handleMonthSelect(index)}
                      className={cn(
                          "p-3 text-sm rounded-lg transition-colors cursor-pointer",
                          "hover:bg-orange-50 hover:text-orange-600",
                          isCurrentMonth &&
                            "bg-orange-500 text-white hover:bg-orange-600",
                          !isCurrentMonth &&
                            isToday &&
                            "bg-blue-50 text-blue-600 font-medium hover:bg-blue-100"
                        )}
                      >
                        {month.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Year Selector */
              <div>
                <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowYearSelector(false);
                    setShowMonthSelector(true);
                  }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <h3 className="font-medium text-gray-900">Select Year</h3>
                  <div className="w-6"></div> {/* Spacer for alignment */}
                </div>

                {/* Years Grid */}
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {years.map((year) => {
                    const isCurrentYear = year === currentMonth.getFullYear();
                    const isToday = year === new Date().getFullYear();

                    return (
                    <button
                      type="button"
                      key={year}
                      onClick={() => handleYearSelect(year)}
                      className={cn(
                          "p-2 text-sm rounded-lg transition-colors cursor-pointer",
                          "hover:bg-orange-50 hover:text-orange-600",
                          isCurrentYear &&
                            "bg-orange-500 text-white hover:bg-orange-600",
                          !isCurrentYear &&
                            isToday &&
                            "bg-blue-50 text-blue-600 font-medium hover:bg-blue-100"
                        )}
                      >
                        {year}
                      </button>
                    );
                  })}
                </div>
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
    </div>
  );
};

export default DateSelector;
