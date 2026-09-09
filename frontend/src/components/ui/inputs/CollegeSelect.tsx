import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
} from "react";
import axios from "axios";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, MessageCircle } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import Modal from "@/components/ui/Modal";
import type { IndianState } from "@/constants/indianStates";

// Admin WhatsApp number shown when a learner can't find their college in the
// directory. Keep in sync if the support contact rotates.
const COLLEGE_SUPPORT_WHATSAPP_NUMBER = "+918929252575";
const COLLEGE_SUPPORT_WHATSAPP_URL = `https://wa.me/${COLLEGE_SUPPORT_WHATSAPP_NUMBER}`;

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const PAGE_SIZE = 50;

export interface CollegeOption {
  _id: string;
  name: string;
  location: string;
  state?: IndianState;
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
  /** Fires with the formatted display string ("Name, Location") when the
   *  learner picks a college from the directory. Free-text entries are not
   *  supported — the dropdown is the only path to a value. */
  onChange?: (value: string) => void;
  /** Fires when the learner picks a college from the directory. Gives the
   *  canonical `_id` plus the original fields. */
  onSelect?: (college: {
    _id: string;
    name: string;
    location: string;
    state?: IndianState;
    display: string;
  }) => void;
  error?: string;
}

const CollegeSelect = ({
  label,
  labelClassName,
  required = false,
  className,
  placeholder = "Search and select your university / college",
  value,
  disabled = false,
  onChange,
  onSelect,
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
  const [helpOpen, setHelpOpen] = useState(false);
  const listboxId = useId();

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

  const selectedLabel = selectedCollege
    ? formatCollegeValue(selectedCollege)
    : value && value.trim().length > 0
      ? value
      : "";

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchTerm("");
  }, []);

  const handleCollegeSelect = useCallback(
    (college: CollegeOption) => {
      const collegeValue = formatCollegeValue(college);
      setIsOpen(false);
      setSearchTerm("");
      onChange?.(collegeValue);
      onSelect?.({
        _id: college._id,
        name: college.name,
        location: college.location,
        state: college.state,
        display: collegeValue,
      });
    },
    [onChange, onSelect],
  );

  const openHelpModal = useCallback(() => {
    setIsOpen(false);
    setHelpOpen(true);
  }, []);

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
        <div
          className={cn(
            "w-full bg-white border border-gray-300 rounded-xl",
            "hover:border-orange-400 hover:shadow-sm",
            "transition-all duration-200 ease-in-out",
            "flex items-center",
            "shadow-sm",
            isOpen && "border-orange-500 ring-2 ring-orange-500/20",
            error && "border-red-500",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <input
            ref={searchRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            autoComplete="off"
            disabled={disabled}
            // Open, the field IS the query box; closed, it shows what was
            // picked. The selection moves to the placeholder while typing so
            // it stays visible without blocking the query.
            value={isOpen ? searchTerm : selectedLabel}
            placeholder={isOpen ? selectedLabel || placeholder : placeholder}
            onFocus={() => setIsOpen(true)}
            // Reopens after the chevron closed it without the input ever
            // losing focus, where onFocus alone would not fire again.
            onClick={() => setIsOpen(true)}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                closeDropdown();
                e.currentTarget.blur();
              }
            }}
            className={cn(
              "w-full min-w-0 bg-transparent rounded-xl",
              "px-4 py-3.5 text-sm text-black outline-none",
              "placeholder:text-gray-500 disabled:cursor-not-allowed",
            )}
          />
          <button
            type="button"
            aria-label={isOpen ? "Close college list" : "Open college list"}
            disabled={disabled}
            onClick={() => {
              if (isOpen) {
                closeDropdown();
              } else {
                setIsOpen(true);
                searchRef.current?.focus();
              }
            }}
            className="shrink-0 pl-1 pr-4 py-3.5 disabled:cursor-not-allowed"
          >
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400 transition-transform duration-200" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-200" />
            )}
          </button>
        </div>

        {isOpen && (
          <div
            id={listboxId}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-[min(85vh,28rem)] overflow-hidden"
            style={{
              animation: "fadeIn 0.2s ease-out",
            }}
          >
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
                  Type to search the directory. If your college isn&apos;t
                  listed, use the &quot;Can&apos;t find your college?&quot;
                  link below to message an admin.
                </div>
              )}

              {showNoResults && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No directory match for{" "}
                  <span className="font-semibold">
                    &quot;{searchDebounce}&quot;
                  </span>
                  . Use the &quot;Can&apos;t find your college?&quot; link
                  below to message an admin.
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

            <div className="border-t border-gray-200 bg-gray-50 px-3 py-2.5">
              <button
                type="button"
                onClick={openHelpModal}
                className={cn(
                  "w-full rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                  "bg-white text-orange-700 border border-orange-200 hover:bg-orange-50",
                  "flex items-center justify-center gap-2",
                )}
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Can&apos;t find your college?
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      <Modal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Can't find your college?"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            If your university or college isn&apos;t listed in the directory,
            send us a WhatsApp message with your college name and location.
            Our admin team will add it and confirm back to you.
          </p>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
              WhatsApp
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">
              {COLLEGE_SUPPORT_WHATSAPP_NUMBER}
            </p>
          </div>
          <a
            href={COLLEGE_SUPPORT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors",
              "bg-green-500 text-white hover:bg-green-600",
              "flex items-center justify-center gap-2",
            )}
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Message admin on WhatsApp
          </a>
        </div>
      </Modal>
    </div>
  );
};

export default CollegeSelect;
