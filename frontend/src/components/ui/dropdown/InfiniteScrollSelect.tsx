"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InfiniteScrollSelectOption<T = unknown> {
  value: string;
  label: string;
  raw?: T;
}

export interface InfiniteScrollSelectProps<T = unknown> {
  label?: string;
  placeholder?: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  fetchOptions: (
    page: number,
    search: string,
  ) => Promise<{
    items: InfiniteScrollSelectOption<T>[] | { _id?: string; name?: string }[];
    totalPages: number;
    total?: number;
  }>;
  multi?: boolean;
  getOptionLabel?: (item: T | { _id?: string; name?: string }) => string;
  getOptionValue?: (item: T | { _id?: string; name?: string }) => string;
  className?: string;
  dropdownClassName?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

const DEFAULT_PAGE_SIZE = 15;

function normalizeOptions<T>(
  items: InfiniteScrollSelectOption<T>[] | { _id?: string; name?: string }[],
  getOptionLabel?: (item: any) => string,
  getOptionValue?: (item: any) => string,
): InfiniteScrollSelectOption<T>[] {
  if (!items?.length) return [];
  const first = items[0];
  const isAlreadyNormalized = "value" in first && "label" in first;
  if (isAlreadyNormalized) {
    return items as InfiniteScrollSelectOption<T>[];
  }
  return (items as { _id?: string; name?: string }[]).map((item) => ({
    value: getOptionValue ? getOptionValue(item) : (item._id ?? ""),
    label: getOptionLabel
      ? getOptionLabel(item)
      : (((item as { name?: string }).name || item._id) ?? ""),
    raw: item as T,
  }));
}

export function InfiniteScrollSelect<T = unknown>({
  label,
  placeholder = "Select...",
  value,
  onChange,
  fetchOptions,
  multi = false,
  getOptionLabel,
  getOptionValue,
  className,
  dropdownClassName,
  disabled,
  searchPlaceholder = "Search...",
  emptyMessage = "No options found",
}: InfiniteScrollSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<InfiniteScrollSelectOption<T>[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounce search input so list refetches without an "Apply search" button
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput, isOpen]);

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
  const displayLabel =
    selectedValues.length === 0
      ? placeholder
      : multi && selectedValues.length > 1
        ? `${selectedValues.length} selected`
        : (() => {
            const firstId = selectedValues[0];
            const opt = options.find((o) => o.value === firstId);
            return opt ? opt.label : firstId;
          })();

  const loadPage = useCallback(
    async (pageNum: number, searchTerm: string, append: boolean) => {
      setLoading(true);
      try {
        const result = await fetchOptions(pageNum, searchTerm);
        const normalized = normalizeOptions(
          result.items,
          getOptionLabel as any,
          getOptionValue as any,
        );
        setOptions((prev) => (append ? [...prev, ...normalized] : normalized));
        setTotalPages(result.totalPages);
      } finally {
        setLoading(false);
      }
    },
    [fetchOptions, getOptionLabel, getOptionValue],
  );

  useEffect(() => {
    if (!isOpen) return;
    setPage(1);
    loadPage(1, search, false);
  }, [isOpen, search]);

  // Load initial options on mount for displaying selected values
  useEffect(() => {
    loadPage(1, "", false);
  }, []);

  const handleScroll = useCallback(() => {
    const list = listRef.current;
    if (!list || loading || page >= totalPages) return;
    const { scrollTop, scrollHeight, clientHeight } = list;
    if (scrollHeight - scrollTop - clientHeight < 80) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPage(nextPage, search, true);
    }
  }, [page, totalPages, loading, search, loadPage]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.addEventListener("scroll", handleScroll);
    return () => list.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (opt: InfiniteScrollSelectOption<T>) => {
    if (multi) {
      const next = selectedValues.includes(opt.value)
        ? selectedValues.filter((v) => v !== opt.value)
        : [...selectedValues, opt.value];
      onChange(next);
    } else {
      onChange(opt.value);
      setIsOpen(false);
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multi ? [] : "");
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          "w-full min-h-[40px] px-3 py-2 text-left bg-white border border-gray-300 rounded-lg",
          "focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none",
          "flex items-center justify-between gap-2 text-sm",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isOpen && "border-orange-500 ring-1 ring-orange-500/20",
        )}
      >
        <span
          className={cn(
            !displayLabel || displayLabel === placeholder
              ? "text-gray-500"
              : "text-gray-900",
          )}
        >
          {displayLabel}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selectedValues.length > 0 && (
            <span
              onClick={clearSelection}
              className="p-0.5 rounded hover:bg-gray-200 cursor-pointer"
              title="Clear"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </span>
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden",
            dropdownClassName,
          )}
        >
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                (e.preventDefault(), setSearch(searchInput))
              }
              placeholder={searchPlaceholder}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
            />
          </div>
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto"
            onScroll={handleScroll}
          >
            {loading && options.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">
                Loading...
              </div>
            ) : options.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">
                {emptyMessage}
              </div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleOption(opt)}
                  className={cn(
                    "w-full px-3 py-2.5 text-left text-sm hover:bg-orange-50 transition-colors",
                    selectedValues.includes(opt.value) &&
                      "bg-orange-100 text-orange-800 font-medium",
                  )}
                >
                  {opt.label}
                </button>
              ))
            )}
            {loading && options.length > 0 && (
              <div className="py-2 text-center text-xs text-gray-400">
                Loading more...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InfiniteScrollSelect;
