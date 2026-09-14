"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCourse, type AdminCourseOption } from "@/hooks/useCourse";
import type { Brand } from "@/constants/brands";

interface CoursePickerProps {
  label?: string;
  required?: boolean;
  value: string;
  /** Reports the title too — the caller can't look it up without the catalogue. */
  onChange: (courseId: string, courseTitle: string) => void;
  /**
   * Title of the current selection. Needed when editing, because the selected
   * course may not appear in the first page the picker loads.
   */
  selectedLabel?: string;
  placeholder?: string;
  /** Adds an explicit "all / none" entry — used by the list filter. */
  clearLabel?: string;
  disabled?: boolean;
  className?: string;
  /** Lists this brand's courses only. Omit to list every brand. */
  brand?: Brand | "";
}

const PAGE_SIZE = 20;
/** Pixels from the bottom at which the next page is requested. */
const SCROLL_THRESHOLD = 120;

/**
 * Course dropdown that pages the catalogue in as you scroll instead of pulling
 * a fixed slice up front — the course list outgrew any single-request limit, so
 * the tail was simply unreachable.
 *
 * Searching goes through `/courses/admin/options`, which does whole-phrase
 * title matching. The public `/courses` search ORs every word across
 * title+description and then sorts randomly, so an exact title lands wherever
 * chance puts it, among unrelated courses.
 */
const CoursePicker: React.FC<CoursePickerProps> = ({
  label,
  required = false,
  value,
  onChange,
  selectedLabel,
  placeholder = "Select a course",
  clearLabel,
  disabled = false,
  className,
  brand,
}) => {
  const { getAdminCourseOptions } = useCourse();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [courses, setCourses] = useState<AdminCourseOption[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  /** Only the newest request may write state — pages can resolve out of order. */
  const activeRequest = useRef(0);

  const hasMore = page < totalPages;

  // Close on outside click.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      return;
    }
    setTimeout(() => searchRef.current?.focus(), 0);
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPage = useCallback(
    async (target: number, append: boolean) => {
      const reqId = ++activeRequest.current;
      setIsLoading(true);
      try {
        const result = await getAdminCourseOptions({
          page: target,
          limit: PAGE_SIZE,
          // Disabled courses are excluded: their watch page 404s, so a live
          // class scheduled against one is unreachable for every learner.
          isActive: true,
          ...(brand ? { brand } : {}),
          ...(debouncedSearch
            ? { search: debouncedSearch, searchTitleOnly: true }
            : {}),
          sortBy: "title",
          sortOrder: "asc",
        });
        if (reqId !== activeRequest.current) return;
        if (!result) return;

        setCourses((prev) =>
          append ? [...prev, ...result.courses] : result.courses,
        );
        setPage(result.page ?? target);
        setTotalPages(result.totalPages ?? 1);
      } finally {
        if (reqId === activeRequest.current) setIsLoading(false);
      }
    },
    [getAdminCourseOptions, debouncedSearch, brand],
  );

  // (Re)load page 1 whenever the dropdown opens or the search term settles.
  useEffect(() => {
    if (!isOpen) return;
    if (listRef.current) listRef.current.scrollTop = 0;
    void fetchPage(1, false);
  }, [isOpen, fetchPage]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || isLoading || !hasMore) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_THRESHOLD) {
      void fetchPage(page + 1, true);
    }
  }, [fetchPage, hasMore, isLoading, page]);

  const select = (courseId: string, courseTitle: string) => {
    onChange(courseId, courseTitle);
    setIsOpen(false);
  };

  // Prefer the label the parent knows; fall back to whatever is loaded.
  const displayLabel =
    (value && (selectedLabel || courses.find((c) => c._id === value)?.title)) ||
    "";

  return (
    <div className={cn("text-sm relative w-full", className)}>
      {label && (
        <label className="font-medium text-black mb-2 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
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
              "text-sm truncate",
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
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full pl-10 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div
              ref={listRef}
              onScroll={handleScroll}
              className="max-h-64 overflow-y-auto overscroll-contain"
            >
              {clearLabel && (
                <button
                  type="button"
                  onClick={() => select("", "")}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm hover:bg-orange-50 transition-colors",
                    !value && "bg-orange-100 text-orange-700 font-medium",
                  )}
                >
                  {clearLabel}
                </button>
              )}

              {courses.map((course) => (
                <button
                  key={course._id}
                  type="button"
                  onClick={() => select(course._id, course.title)}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm hover:bg-orange-50 transition-colors",
                    value === course._id &&
                      "bg-orange-100 text-orange-700 font-medium",
                  )}
                >
                  {course.title}
                </button>
              ))}

              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-3 text-xs text-gray-500">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-orange-500" />
                  Loading courses...
                </div>
              )}

              {!isLoading && courses.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  {debouncedSearch ? "No courses found" : "No courses available"}
                </div>
              )}

              {!isLoading && !hasMore && courses.length > 0 && (
                <div className="py-2 text-center text-[11px] text-gray-400">
                  End of list
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePicker;
