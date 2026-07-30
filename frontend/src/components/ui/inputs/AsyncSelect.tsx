"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AsyncSelectItem {
  value: string;
  label: string;
}

export interface AsyncSelectPage {
  items: AsyncSelectItem[];
  hasMore: boolean;
}

interface Props {
  /** Fetches one page. `page` is 1-based; `search` is already debounced. */
  fetchPage: (page: number, search: string) => Promise<AsyncSelectPage>;
  value: string;
  onChange: (value: string, label: string) => void;
  /** Pinned first row, e.g. `{ value: "all", label: "All internships" }`. */
  allOption?: AsyncSelectItem;
  /**
   * Label for the current value. Needed because the selected item may sit on a
   * page that was never loaded (or was filtered out by a later search).
   */
  selectedLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  /** Dropdown panel width; defaults to matching the trigger. */
  panelClassName?: string;
}

/**
 * Searchable select whose options are paged in from the server as the list
 * scrolls. Use instead of `Select` when the option set is unbounded — `Select`
 * needs every option up front.
 */
export default function AsyncSelect({
  fetchPage,
  value,
  onChange,
  allOption,
  selectedLabel,
  placeholder = "Select an option",
  searchPlaceholder = "Search…",
  disabled = false,
  className,
  panelClassName,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [items, setItems] = useState<AsyncSelectItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  /** Guards against a scroll event firing another append mid-flight. */
  const loadingRef = useRef(false);
  /** Newest request wins; late replies from superseded searches are dropped. */
  const requestIdRef = useRef(0);

  const displayLabel =
    (value === allOption?.value ? allOption.label : selectedLabel) || "";

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setDebouncedSearch("");
      return;
    }
    const t = setTimeout(() => searchRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const load = useCallback(
    async (nextPage: number, search: string, append: boolean) => {
      // Only appends dedupe on an in-flight request — a new search must always
      // go out, or the list would keep showing results for the old term.
      if (append && loadingRef.current) return;
      const requestId = ++requestIdRef.current;
      loadingRef.current = true;
      setIsLoading(true);
      try {
        const res = await fetchPage(nextPage, search);
        if (requestId !== requestIdRef.current) return;
        setItems((prev) => (append ? [...prev, ...res.items] : res.items));
        setPage(nextPage);
        setHasMore(res.hasMore);
      } catch {
        if (requestId !== requestIdRef.current) return;
        if (!append) setItems([]);
        setHasMore(false);
      } finally {
        if (requestId === requestIdRef.current) {
          loadingRef.current = false;
          setIsLoading(false);
        }
      }
    },
    [fetchPage],
  );

  // First page on open, and again whenever the debounced search changes.
  useEffect(() => {
    if (!isOpen) return;
    void load(1, debouncedSearch, false);
  }, [isOpen, debouncedSearch, load]);

  // Pull the next page when the sentinel at the bottom of the list appears.
  useEffect(() => {
    if (!isOpen || !hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingRef.current) {
          void load(page + 1, debouncedSearch, true);
        }
      },
      { root: node.parentElement, rootMargin: "80px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isOpen, hasMore, page, debouncedSearch, load]);

  const select = (item: AsyncSelectItem) => {
    setIsOpen(false);
    onChange(item.value, item.label);
  };

  // The pinned "all" row is a local reset, so hide it once a search is typed.
  const showAllOption = allOption && !debouncedSearch;

  return (
    <div className={cn("text-sm relative w-full", className)} ref={rootRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        disabled={disabled}
        className={cn(
          "w-full px-4 py-3.5 text-left bg-white border rounded-xl",
          "focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
          "transition-all duration-200 ease-in-out outline-none",
          "flex items-center justify-between gap-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "shadow-sm hover:shadow-md",
          isOpen
            ? "border-orange-500 ring-2 ring-orange-500/20"
            : "border-gray-300 hover:border-orange-400",
        )}
      >
        <span
          className={cn(
            "truncate",
            displayLabel ? "text-black" : "text-gray-500",
          )}
        >
          {displayLabel || placeholder}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden",
            panelClassName ?? "w-full",
          )}
        >
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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

          <div className="max-h-64 overflow-y-auto overscroll-contain">
            {showAllOption && (
              <button
                type="button"
                onClick={() => select(allOption)}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-sm hover:bg-orange-50 transition-colors",
                  value === allOption.value &&
                    "bg-orange-100 text-orange-700 font-medium",
                )}
              >
                {allOption.label}
              </button>
            )}

            {items.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => select(item)}
                title={item.label}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-sm hover:bg-orange-50 transition-colors",
                  value === item.value &&
                    "bg-orange-100 text-orange-700 font-medium",
                )}
              >
                <span className="line-clamp-2">{item.label}</span>
              </button>
            ))}

            {!isLoading && items.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">
                {debouncedSearch ? "No matches" : "Nothing to show"}
              </div>
            )}

            {/* Watched by the observer — entering view pulls the next page. */}
            {hasMore && <div ref={sentinelRef} className="h-px" />}

            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
