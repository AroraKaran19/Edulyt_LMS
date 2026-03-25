import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

interface College {
  "Name of the college": string;
  State: string;
}

// Virtualized list component for better performance
const VirtualizedCollegeList = React.memo(
  ({
    colleges,
    onSelect,
    selectedValue,
  }: {
    colleges: College[];
    onSelect: (college: College) => void;
    selectedValue?: string;
  }) => {
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
    const containerRef = useRef<HTMLDivElement>(null);
    const itemHeight = 60; // Approximate height of each item

    const handleScroll = useCallback(
      (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        const start = Math.floor(scrollTop / itemHeight);
        const end = Math.min(start + 20, colleges.length); // Show 20 items at a time

        setVisibleRange({ start, end });
      },
      [colleges.length, itemHeight]
    );

    const visibleColleges = colleges.slice(
      visibleRange.start,
      visibleRange.end
    );
    const totalHeight = colleges.length * itemHeight;

    return (
      <div
        ref={containerRef}
        className="relative"
        style={{ height: Math.min(totalHeight, 240) }}
        onScroll={handleScroll}
      >
        <div className="relative">
          <div
            style={{
              transform: `translateY(${visibleRange.start * itemHeight}px)`,
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {visibleColleges.map((college, index) => (
              <button
                key={`${college["Name of the college"]}-${
                  visibleRange.start + index
                }`}
                type="button"
                onClick={() => onSelect(college)}
                className={cn(
                  "w-full px-4 py-3 text-left text-sm hover:bg-orange-50",
                  "transition-colors duration-150 ease-in-out",
                  "focus:bg-orange-50 focus:outline-none",
                  "border-b border-gray-100 last:border-b-0",
                  selectedValue ===
                    `${college["Name of the college"]}, ${college["State"]}` &&
                    "bg-orange-100 text-orange-700 font-medium"
                )}
                style={{ height: itemHeight }}
              >
                <div className="font-medium text-gray-900 truncate">
                  {college["Name of the college"]}
                </div>
                <div className="text-xs text-gray-500 mt-1 truncate">
                  {college["State"]}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

interface CollegeSelectProps {
  label?: string;
  labelClassName?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
  value?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  error?: string;
}

const CollegeSelect = ({
  label,
  labelClassName,
  required = false,
  className,
  placeholder = "Search and select your college",
  value,
  disabled = false,
  onChange,
  error,
}: CollegeSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchDebounce, setSearchDebounce] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Debounce search term to avoid excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load colleges data with caching
  useEffect(() => {
    const loadColleges = async () => {
      try {
        // Check if data is already cached
        const cachedData = sessionStorage.getItem("colleges-data");
        if (cachedData) {
          const data = JSON.parse(cachedData);
          setColleges(data);
          setIsLoading(false);
          return;
        }

        const response = await fetch("/colleges.json");
        const data = await response.json();

        // Cache the data for future use
        sessionStorage.setItem("colleges-data", JSON.stringify(data));

        setColleges(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load colleges:", error);
        setIsLoading(false);
      }
    };

    loadColleges();
  }, []);

  // Memoized filtered colleges with performance optimizations
  const filteredColleges = useMemo(() => {
    if (!searchDebounce.trim()) {
      // Return first 50 colleges when no search term
      return colleges.slice(0, 50);
    }

    const searchLower = searchDebounce.toLowerCase();
    const filtered = colleges.filter((college) => {
      const collegeName = college["Name of the college"].toLowerCase();
      const state = college["State"].toLowerCase();

      // More efficient search - check if search term is at the beginning first
      return (
        collegeName.startsWith(searchLower) ||
        collegeName.includes(searchLower) ||
        state.includes(searchLower)
      );
    });

    // Sort by relevance (exact matches first, then partial matches)
    return filtered
      .sort((a, b) => {
        const aName = a["Name of the college"].toLowerCase();
        const bName = b["Name of the college"].toLowerCase();

        // Prioritize exact matches
        if (aName.startsWith(searchLower) && !bName.startsWith(searchLower))
          return -1;
        if (!aName.startsWith(searchLower) && bName.startsWith(searchLower))
          return 1;

        // Then alphabetical order
        return aName.localeCompare(bName);
      })
      .slice(0, 100); // Limit to 100 results for performance
  }, [colleges, searchDebounce]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const selectedCollege = colleges.find(
    (college) =>
      `${college["Name of the college"]}, ${college["State"]}` === value
  );

  const displayValue = selectedCollege
    ? `${selectedCollege["Name of the college"]}, ${selectedCollege["State"]}`
    : value && value.trim().length > 0
      ? value
      : placeholder;

  const handleCollegeSelect = useCallback(
    (college: College) => {
      const collegeValue = `${college["Name of the college"]}, ${college["State"]}`;
      setIsOpen(false);
      setSearchTerm("");
      if (onChange) {
        onChange(collegeValue);
      }
    },
    [onChange]
  );

  const handleCustomCollegeSelect = useCallback(() => {
    const customValue = searchDebounce.trim();
    if (!customValue) return;
    setIsOpen(false);
    setSearchTerm("");
    if (onChange) {
      onChange(customValue);
    }
  }, [onChange, searchDebounce]);

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
            "w-full px-4 py-3.5 text-left bg-white border border-gray-300 rounded-xl",
            "focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
            "hover:border-orange-400 hover:shadow-sm",
            "transition-all duration-200 ease-in-out outline-none",
            "flex items-center justify-between",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "shadow-sm hover:shadow-md",
            isOpen && "border-orange-500 ring-2 ring-orange-500/20",
            error && "border-red-500"
          )}
          disabled={disabled}
        >
          <span
            className={cn(
              "text-sm truncate",
              !selectedCollege ? "text-gray-500" : "text-black"
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
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search colleges..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            {/* College List with Virtualization */}
            <div className="max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading colleges...
                </div>
              ) : filteredColleges.length === 0 ? (
                <div className="p-4 flex flex-col items-center justify-center gap-3 text-center text-gray-500">
                  {searchDebounce.trim() ? (
                    <>
                      <p className="text-sm">
                        No colleges found for{" "}
                        <span className="font-semibold">
                          &quot;{searchDebounce}&quot;
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={handleCustomCollegeSelect}
                        className="mt-1 inline-flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-orange-600"
                      >
                        Use this as my college
                      </button>
                    </>
                  ) : (
                    <p className="text-sm">Start typing to search colleges</p>
                  )}
                </div>
              ) : (
                <VirtualizedCollegeList
                  colleges={filteredColleges}
                  onSelect={handleCollegeSelect}
                  selectedValue={value}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default CollegeSelect;
