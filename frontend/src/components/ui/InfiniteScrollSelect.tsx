"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InfiniteScrollOption {
  value: string;
  label: string;
}

export interface InfiniteScrollLoadResult {
  items: InfiniteScrollOption[];
  hasMore: boolean;
}

interface BaseProps {
  value: string;
  onChange: (value: string, label: string) => void;
  placeholder?: string;
  /** Label shown for the sentinel "no selection" option at the top (e.g. "All courses"). Pass `null` to hide it. */
  allLabel?: string | null;
  className?: string;
  disabled?: boolean;
  /** Optional explicit label for the currently selected value — useful when the
   *  selected option may not be in the current page of async results. */
  selectedLabel?: string;
}

type Props = BaseProps &
  (
    | { options: InfiniteScrollOption[]; loadPage?: never }
    | {
        options?: never;
        loadPage: (
          page: number,
          q: string,
        ) => Promise<InfiniteScrollLoadResult>;
      }
  );

const PAGE_SIZE = 25;
const SCROLL_THRESHOLD_PX = 80;

export default function InfiniteScrollSelect(props: Props) {
  const {
    value,
    onChange,
    placeholder = "Select…",
    allLabel = "All",
    className,
    disabled,
    selectedLabel,
  } = props;

  const isAsync = "loadPage" in props && typeof props.loadPage === "function";

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [asyncItems, setAsyncItems] = useState<InfiniteScrollOption[]>([]);
  const [asyncPage, setAsyncPage] = useState(1);
  const [asyncHasMore, setAsyncHasMore] = useState(true);
  const [asyncLoading, setAsyncLoading] = useState(false);
  const [asyncError, setAsyncError] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Debounce the search input.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const loadPageFn = isAsync
    ? (props as { loadPage: NonNullable<Props["loadPage"]> }).loadPage
    : null;

  // Reset and reload when search changes, async loader identity changes, or dropdown opens.
  useEffect(() => {
    if (!isAsync || !open || !loadPageFn) return;
    let cancelled = false;
    setAsyncLoading(true);
    setAsyncError(null);
    setAsyncPage(1);
    (async () => {
      try {
        const res = await loadPageFn(1, debouncedSearch);
        if (cancelled) return;
        setAsyncItems(res.items);
        setAsyncHasMore(res.hasMore);
      } catch (e) {
        console.error("InfiniteScrollSelect load failed:", e);
        if (!cancelled) {
          setAsyncError("Could not load options.");
          setAsyncItems([]);
          setAsyncHasMore(false);
        }
      } finally {
        if (!cancelled) setAsyncLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAsync, open, debouncedSearch, loadPageFn]);

  // Focus search input on open.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => searchInputRef.current?.focus(), 20);
    return () => clearTimeout(t);
  }, [open]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDocClick(ev: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(ev.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const loadMore = useCallback(async () => {
    if (!isAsync || !loadPageFn || asyncLoading || !asyncHasMore) return;
    const nextPage = asyncPage + 1;
    setAsyncLoading(true);
    try {
      const res = await loadPageFn(nextPage, debouncedSearch);
      setAsyncItems((prev) => [...prev, ...res.items]);
      setAsyncHasMore(res.hasMore);
      setAsyncPage(nextPage);
    } catch (e) {
      console.error("InfiniteScrollSelect load-more failed:", e);
      setAsyncError("Could not load more.");
      setAsyncHasMore(false);
    } finally {
      setAsyncLoading(false);
    }
  }, [
    isAsync,
    loadPageFn,
    asyncLoading,
    asyncHasMore,
    asyncPage,
    debouncedSearch,
  ]);

  const onListScroll = useCallback(() => {
    if (!isAsync) return;
    const el = listRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < SCROLL_THRESHOLD_PX) {
      void loadMore();
    }
  }, [isAsync, loadMore]);

  // Sync-mode filtered options.
  const syncFiltered = useMemo(() => {
    if (isAsync) return [] as InfiniteScrollOption[];
    const all = (props as { options: InfiniteScrollOption[] }).options;
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return all;
    return all.filter((o) => o.label.toLowerCase().includes(q));
  }, [isAsync, props, debouncedSearch]);

  const items = isAsync ? asyncItems : syncFiltered;

  const selected = useMemo(() => {
    if (!value) return null;
    const match = items.find((i) => i.value === value);
    if (match) return match;
    if (selectedLabel) return { value, label: selectedLabel };
    return null;
  }, [items, value, selectedLabel]);

  const displayLabel = selected?.label ?? "";

  const handleSelect = (v: string, label: string) => {
    onChange(v, label);
    setOpen(false);
  };

  const clearSelection = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    onChange("", "");
  };

  const triggerClass = cn(
    "flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-colors hover:border-[#F77124]/50 focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20",
    disabled && "cursor-not-allowed opacity-60",
    className,
  );

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={triggerClass}
      >
        <span
          className={cn(
            "truncate text-left",
            !displayLabel && "text-gray-400",
          )}
        >
          {displayLabel || placeholder}
        </span>
        <span className="ml-2 flex shrink-0 items-center gap-1">
          {value && allLabel !== null && (
            <span
              role="button"
              tabIndex={-1}
              onClick={clearSelection}
              className="rounded p-0.5 text-[#98A2B3] hover:bg-gray-100 hover:text-[#475467]"
              aria-label="Clear selection"
            >
              <X className="size-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "size-4 text-[#98A2B3] transition-transform",
              open && "rotate-180",
            )}
          />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-lg border border-[#EAECF0] bg-white shadow-lg">
          <div className="border-b border-[#F2F4F7] p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-2.5 text-sm outline-none focus:border-[#F77124] focus:ring-1 focus:ring-[#F77124]/20"
              />
            </div>
          </div>
          <div
            ref={listRef}
            onScroll={onListScroll}
            className="max-h-64 overflow-y-auto"
          >
            {allLabel !== null && !debouncedSearch && (
              <button
                type="button"
                onClick={() => handleSelect("", "")}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50",
                  !value && "bg-[#FFF4EB] font-medium text-[#B45309]",
                )}
              >
                <span className="truncate">{allLabel}</span>
                {!value && <Check className="size-4 text-[#B45309]" />}
              </button>
            )}

            {items.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => handleSelect(opt.value, opt.label)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50",
                    isSelected && "bg-[#FFF4EB] font-medium text-[#B45309]",
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="size-4 shrink-0 text-[#B45309]" />
                  )}
                </button>
              );
            })}

            {isAsync && asyncLoading && (
              <div className="px-3 py-3 text-center text-xs text-[#667085]">
                Loading…
              </div>
            )}

            {!asyncLoading &&
              items.length === 0 &&
              (allLabel === null || debouncedSearch) && (
                <div className="px-3 py-6 text-center text-xs text-[#667085]">
                  No results.
                </div>
              )}

            {asyncError && (
              <div className="px-3 py-2 text-center text-xs text-red-600">
                {asyncError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { PAGE_SIZE as INFINITE_SCROLL_PAGE_SIZE };
