import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import apiClient from "@/configs/apiConfig";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const PAGE_SIZE = 50;

export interface CollegeOption {
  _id: string;
  name: string;
  location: string;
}

interface ListCollegesResponse {
  colleges: CollegeOption[];
  total: number;
  page: number;
  totalPages: number;
}

interface ApiSuccessBody<T> {
  success: boolean;
  data: T;
  message?: string;
}

const formatCollegeValue = (c: CollegeOption) => `${c.name}, ${c.location}`;

const isCanceled = (err: unknown) =>
  axios.isAxiosError(err) && err.code === "ERR_CANCELED";

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
  const [searchDebounce, setSearchDebounce] = useState("");
  const [items, setItems] = useState<CollegeOption[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const searchDebounceRef = useRef(searchDebounce);
  searchDebounceRef.current = searchDebounce;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPage = useCallback(
    async (
      pageNum: number,
      search: string,
      signal: AbortSignal,
    ): Promise<ListCollegesResponse> => {
      const params = new URLSearchParams();
      params.set("page", String(pageNum));
      params.set("limit", String(PAGE_SIZE));
      if (search.trim()) params.set("search", search.trim());
      const res = await apiClient.get<ApiSuccessBody<ListCollegesResponse>>(
        `/colleges?${params.toString()}`,
        { signal, timeout: 30000 },
      );
      return res.data.data;
    },
    [],
  );

  /** Load first page when dropdown opens or search changes */
  useEffect(() => {
    if (!isOpen) return;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoadingInitial(true);
    setListError(null);
    setItems([]);
    setPage(0);
    setTotalPages(0);

    void (async () => {
      try {
        const data = await fetchPage(1, searchDebounce, ac.signal);
        setItems(data.colleges);
        setPage(data.page);
        setTotalPages(data.totalPages);
      } catch (e) {
        if (isCanceled(e)) return;
        console.error("Failed to load colleges:", e);
        setListError("Could not load colleges. Try again.");
      } finally {
        setLoadingInitial(false);
      }
    })();

    return () => {
      ac.abort();
    };
  }, [isOpen, searchDebounce, fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingInitial || loadingMore || page <= 0) return;
    if (page >= totalPages) return;

    const nextPage = page + 1;
    const ac = new AbortController();
    setLoadingMore(true);
    setListError(null);
    try {
      const data = await fetchPage(
        nextPage,
        searchDebounceRef.current,
        ac.signal,
      );
      setItems((prev) => {
        const seen = new Set(prev.map((c) => c._id));
        const next = [...prev];
        for (const c of data.colleges) {
          if (!seen.has(c._id)) {
            seen.add(c._id);
            next.push(c);
          }
        }
        return next;
      });
      setPage(data.page);
    } catch (e) {
      if (isCanceled(e)) return;
      console.error("Failed to load more colleges:", e);
      setListError("Could not load more.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingInitial, loadingMore, page, totalPages, fetchPage]);

  useEffect(() => {
    if (!isOpen) return;
    const root = scrollRootRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { root, rootMargin: "120px", threshold: 0 },
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, [isOpen, items.length, loadMore, page, totalPages, loadingInitial]);

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

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const selectedCollege = items.find((c) => formatCollegeValue(c) === value);

  const displayValue = selectedCollege
    ? formatCollegeValue(selectedCollege)
    : value && value.trim().length > 0
      ? value
      : placeholder;

  const handleCollegeSelect = useCallback(
    (college: CollegeOption) => {
      const collegeValue = formatCollegeValue(college);
      setIsOpen(false);
      setSearchTerm("");
      onChange?.(collegeValue);
    },
    [onChange],
  );

  const applyCustomCollege = useCallback(() => {
    const customValue = searchTerm.trim();
    if (!customValue) return;
    setIsOpen(false);
    setSearchTerm("");
    onChange?.(customValue);
  }, [onChange, searchTerm]);

  const showEmptyHint =
    !loadingInitial &&
    items.length === 0 &&
    !listError &&
    !searchDebounce.trim();

  const showNoResults =
    !loadingInitial &&
    items.length === 0 &&
    !listError &&
    searchDebounce.trim().length > 0;

  return (
    <div
      className={cn(
        plusJakartaSans.className,
        "text-sm relative",
        "w-full",
        className,
      )}
    >
      {label && (
        <label
          className={cn("font-medium text-black mb-2 block", labelClassName)}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

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
            error && "border-red-500",
          )}
          disabled={disabled}
        >
          <span
            className={cn(
              "text-sm truncate",
              !selectedCollege && !value?.trim()
                ? "text-gray-500"
                : "text-black",
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

        {isOpen && (
          <div
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-[min(85vh,28rem)] overflow-hidden"
            style={{
              animation: "fadeIn 0.2s ease-out",
            }}
          >
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

            <div ref={scrollRootRef} className="max-h-52 overflow-y-auto">
              {loadingInitial && (
                <div className="p-4 text-center text-gray-500">
                  Loading colleges...
                </div>
              )}

              {listError && (
                <div className="p-4 text-center text-sm text-red-600">
                  {listError}
                </div>
              )}

              {showEmptyHint && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No colleges loaded yet. Try a search, or enter your college
                  name in the box above and use &quot;Use this name as my
                  college&quot; at the bottom.
                </div>
              )}

              {showNoResults && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No directory match for{" "}
                  <span className="font-semibold">
                    &quot;{searchDebounce}&quot;
                  </span>
                  . You can still save it using the button below.
                </div>
              )}

              {!loadingInitial &&
                items.map((college) => {
                  const v = formatCollegeValue(college);
                  return (
                    <button
                      key={college._id}
                      type="button"
                      onClick={() => handleCollegeSelect(college)}
                      className={cn(
                        "w-full px-4 py-3 text-left text-sm hover:bg-orange-50",
                        "transition-colors duration-150 ease-in-out",
                        "focus:bg-orange-50 focus:outline-none",
                        "border-b border-gray-100 last:border-b-0",
                        value === v &&
                          "bg-orange-100 text-orange-700 font-medium",
                      )}
                    >
                      <div className="font-medium text-gray-900 truncate">
                        {college.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {college.location}
                      </div>
                    </button>
                  );
                })}

              {items.length > 0 && page < totalPages && (
                <>
                  <div
                    ref={sentinelRef}
                    className="h-px w-full shrink-0"
                    aria-hidden
                  />
                  {loadingMore && (
                    <div className="py-3 text-center text-xs text-gray-500">
                      Loading more…
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-3 py-2.5 space-y-2">
              <p className="text-xs text-gray-600 leading-snug">
                College not in the list? Type your full college name in the
                search field, then confirm here — it will be saved as you
                entered it.
              </p>
              <button
                type="button"
                onClick={applyCustomCollege}
                disabled={!searchTerm.trim()}
                className={cn(
                  "w-full rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                  searchTerm.trim()
                    ? "bg-orange-500 text-white shadow-sm hover:bg-orange-600"
                    : "cursor-not-allowed bg-gray-200 text-gray-500",
                )}
              >
                {searchTerm.trim()
                  ? `Use "${searchTerm.trim().length > 48 ? `${searchTerm.trim().slice(0, 45)}…` : searchTerm.trim()}" as my college`
                  : "Type a name above to use a custom college"}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default CollegeSelect;
