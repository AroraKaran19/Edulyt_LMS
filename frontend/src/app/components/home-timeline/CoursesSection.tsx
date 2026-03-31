"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import NewCourseCard from "@/components/ui/NewCourseCard";
import { Course } from "@/types";
import { ENDPOINTS } from "@/constants/endpoints";
import { fetcher } from "@/lib/utils";
import useSWR from "swr";
import { useCategory } from "@/hooks/useCategory";
import { Category } from "@/types/category";
import Loader from "@/components/ui/Loader";
import {
  courseCategories as staticCategories,
  courses as staticCourses,
} from "@/constants/internshipData";
import TimelineMarkerIcon from "./TimelineMarkerIcon";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FilterItem {
  label: string;
  value: string;
  count?: string;
}


export default function CoursesSection() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [filters, setFilters] = useState<FilterItem[]>(() => [
    { label: "All", value: "all" },
    ...staticCategories.map((c) => ({
      label: c.name,
      value: c.name.toLowerCase(), // Prioritize name-based matching for static data fallback
      count: c.count,
    })),
  ]);
  const { getHomePageCategories } = useCategory();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(1);
  const [isPaginationHovered, setIsPaginationHovered] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      const list = await getHomePageCategories();
      console.log("debug=>", list);
      if (list?.length) {
        // Merge dynamic categories with static counts if available, or just use dynamic
        const dynamicFilters = list.map((c: Category) => {
          const staticMatch = staticCategories.find(
            (sc) => sc.name.toLowerCase() === c.name.toLowerCase()
          );
          return {
            label: c.name,
            value: c._id || "",
            count: staticMatch?.count || "50+",
          };
        });

        setFilters([{ label: "All", value: "all" }, ...dynamicFilters]);
      }
    };
    loadCategories();
  }, [getHomePageCategories]);

  const buildApiUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", "6");

    if (activeCategory && activeCategory !== "all") {
      params.append("categories", activeCategory);
    }

    const url = `${ENDPOINTS.courses.all}?${params.toString()}`;
    return url;
  }, [page, activeCategory]);

  const { data, error, isLoading } = useSWR(buildApiUrl(), fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryInterval: 5000,
    dedupingInterval: 1000 * 60, // 1 minute
  });

  const apiPayload = data?.data?.data;
  const apiCourses = apiPayload?.courses;
  const apiTotalPages = apiPayload?.totalPages;
  const totalPages =
    typeof apiTotalPages === "number"
      ? apiTotalPages
      : typeof apiTotalPages === "string" && apiTotalPages.trim() !== ""
        ? Number(apiTotalPages)
        : !isLoading && page === 1
          ? Math.ceil(staticCourses.length / 6) || 1
          : 1;

  const safeTotalPages =
    Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1;

  const coursesList: Course[] =
    Array.isArray(apiCourses) ? apiCourses : !isLoading && page === 1 ? staticCourses : [];

  // Keep dots count small (<= 5) and slide the visible window as page changes.
  const DOTS_TO_SHOW = 7;
  const safeActivePage = Math.min(Math.max(page, 1), safeTotalPages);
  const visibleDotsCount = Math.min(DOTS_TO_SHOW, safeTotalPages);
  const halfWindow = Math.floor(visibleDotsCount / 2);
  let startDot = Math.max(1, safeActivePage - halfWindow);
  startDot = Math.min(startDot, safeTotalPages - visibleDotsCount + 1);
  const endDot = Math.min(safeTotalPages, startDot + visibleDotsCount - 1);
  const visiblePages = Array.from(
    { length: endDot - startDot + 1 },
    (_, i) => startDot + i
  );

  // Auto swipe: cycle pages automatically (pauses while hovering pagination).
  useEffect(() => {
    if (safeTotalPages <= 1 || isPaginationHovered) return;
    const id = window.setInterval(() => {
      setPage((p) => (p >= safeTotalPages ? 1 : p + 1));
    }, 5000);
    return () => window.clearInterval(id);
  }, [safeTotalPages, isPaginationHovered]);


  return (
    <div className="relative px-4 sm:px-10 lg:px-40 mt-12 sm:py-10">
      {/* Marker: Node icon + Header */}
      <div className="flex items-center relative gap-4 -translate-x-5 sm:-translate-x-22">
        <TimelineMarkerIcon size="big">🎓</TimelineMarkerIcon>
        {/* <span className="text-xl sm:text-xl md:text-lg relative md:left-8 font-semibold text-gray-800"> */}
        <h3 className="text-base sm:text-xl md:text-xl relative md:left-7 font-semibold text-gray-800">
          We Have Two Powerful Paths for You
        </h3>
      </div>

      <div className="">
        <div className="flex flex-col gap-1 mt-6 mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight">
            Our <span className="text-[#F77124]">Courses</span> <br className="sm:hidden" /> <span className="text-gray-900 font-medium">(For Students)</span>
          </h2>
        </div>

        {/* Category filters container */}
        <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-4 justify-between items-center h-10 sm:h-12 rounded-full overflow-x-auto bg-[#F66F221F] scrollbar-hide" ref={scrollRef}>
          {filters.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                setActiveCategory(cat.value);
                setPage(1);
              }}
              className={cn(
                "shrink-0 inline-flex items-center h-full gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2.5 font-semibold transition",
                "text-xs sm:text-sm font-medium",
                activeCategory === cat.value
                  ? "bg-linear-to-b from-[#F5891D] to-[#F5691D] text-white"
                  : "text-gray-700"
              )}
            >
              <span>{cat.label}</span>
              {cat.count && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold",
                    activeCategory === cat.value
                      ? "bg-black/20 text-white"
                      : "bg-gray-200 text-gray-700"
                  )}
                >
                  {cat.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Course grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:gap-10">
          {isLoading && coursesList.length === 0 ? (
            <div className="col-span-full flex justify-center py-20">
              <Loader size="lg" variant="spinner" />
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-12 text-gray-500 font-medium">
              Could not load courses.
            </div>
          ) : coursesList.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 font-medium">
              No courses found for this category.
            </div>
          ) : (
            coursesList.map((course, index) => (
              <NewCourseCard
                key={`${course._id || course.slug}-${index}`}
                course={course}
                className="opacity-0 animate-course-card-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              />
            ))
          )}
        </div>

        {/* Pagination Controls - Dot Slider */}
        <div
          className="mt-16 flex justify-center items-center gap-4"
          onMouseEnter={() => setIsPaginationHovered(true)}
          onMouseLeave={() => setIsPaginationHovered(false)}
        >
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safeActivePage <= 1}
            className={cn(
              "h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center transition",
              safeActivePage <= 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-800 hover:bg-gray-50"
            )}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {visiblePages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                pageNumber === safeActivePage
                  ? "w-8 bg-[#F77124]"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              )}
              aria-label={`Page ${pageNumber}`}
            />
          ))}

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(safeTotalPages, p + 1))}
            disabled={safeActivePage >= safeTotalPages}
            className={cn(
              "h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center transition",
              safeActivePage >= safeTotalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-800 hover:bg-gray-50"
            )}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div >
  );
}
