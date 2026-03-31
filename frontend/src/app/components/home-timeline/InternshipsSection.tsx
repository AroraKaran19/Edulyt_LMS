"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import TimelineMarkerIcon from "./TimelineMarkerIcon";
import NewCourseCard from "@/components/ui/NewCourseCard";
import { internshipListingToCourse } from "@/lib/utils/internshipListingToCourse";
import {
  courseCategories,
  courses,
  type Course as InternshipItem,
  type CourseCategory,
} from "@/constants/internshipData";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function InternshipsSection() {
  const [activeCategory, setActiveCategory] = useState<string>(
    courseCategories.find((c) => c.isActive)?.name ?? courseCategories[0]?.name ?? ""
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaginationHovered, setIsPaginationHovered] = useState(false);
  const perPage = 6;
  const totalPages = Math.ceil(courses.length / perPage) || 1;
  const safeTotalPages = Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1;
  const safeActivePage = Math.min(Math.max(currentPage, 0), safeTotalPages - 1);

  const start = safeActivePage * perPage;
  const visible = courses.slice(start, start + perPage);

  // Keep dots count small (<= 5) and slide the visible window as page changes.
  const DOTS_TO_SHOW = 5;
  const visibleDotsCount = Math.min(DOTS_TO_SHOW, safeTotalPages);
  const halfWindow = Math.floor(visibleDotsCount / 2);
  let startDot = Math.max(0, safeActivePage - halfWindow);
  startDot = Math.min(startDot, safeTotalPages - visibleDotsCount);
  const endDot = Math.min(safeTotalPages - 1, startDot + visibleDotsCount - 1);
  const visiblePages = Array.from(
    { length: endDot - startDot + 1 },
    (_, i) => startDot + i
  );

  // Auto swipe: cycle pages automatically (pauses while hovering pagination).
  useEffect(() => {
    if (safeTotalPages <= 1 || isPaginationHovered) return;
    const id = window.setInterval(() => {
      setCurrentPage((p) => (p >= safeTotalPages - 1 ? 0 : p + 1));
    }, 5000);
    return () => window.clearInterval(id);
  }, [safeTotalPages, isPaginationHovered]);

  return (
    <div className="relative px-0 sm:px-4 mt-8 sm:mt-12 sm:py-10">
      {/* Marker Row */}
      <div className="flex items-center relative gap-4 -translate-x-[22px] sm:-translate-x-22">
        <TimelineMarkerIcon size="big">💼</TimelineMarkerIcon>
        <h3 className="text-base sm:text-xl md:text-xl relative md:left-7 font-semibold text-gray-800">
          We Have Two Powerful Paths for You
        </h3>
      </div>

      <div className="pl-8 sm:pl-0">
        <div className="flex flex-col gap-1 mt-6 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight">
              Our <span className="text-[#F77124]">Internships Programs</span>
            </h2>
        </div>

        <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-4 justify-between items-center h-10 sm:h-12 rounded-full  overflow-x-auto bg-[#F66F221F] scrollbar-hide">
          {courseCategories.map((cat: CourseCategory) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => {
                setActiveCategory(cat.name);
                setCurrentPage(0);
              }}
              className={cn(
                "shrink-0 inline-flex items-center h-full gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2.5 font-semibold transition",
                "text-xs sm:text-sm font-medium",
                activeCategory === cat.name
                  ? "bg-linear-to-b from-[#F5891D] to-[#F5691D] text-white"
                  : "text-gray-700"
              )}
            >
              <span>{cat.name}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold",
                  activeCategory === cat.name
                    ? "bg-black/20 text-white"
                    : "bg-gray-200 text-gray-700"
                )}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 auto-rows-fr">
          {visible.map((internship: InternshipItem, i) => (
            <NewCourseCard
              key={internship.id}
              course={internshipListingToCourse(internship)}
              enrollHref="/internships"
              className="opacity-0 animate-course-card-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>

        <div
          className="mt-6 sm:mt-8 flex justify-center items-center gap-4"
          onMouseEnter={() => setIsPaginationHovered(true)}
          onMouseLeave={() => setIsPaginationHovered(false)}
        >
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={safeActivePage <= 0}
            className={cn(
              "h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center transition",
              safeActivePage <= 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-800 hover:bg-gray-50"
            )}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {visiblePages.map((pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              onClick={() => setCurrentPage(pageIndex)}
              className={cn(
                "h-2 rounded-full transition-colors",
                pageIndex === safeActivePage
                  ? "w-8 bg-[#F77124]"
                  : "w-2 bg-gray-300"
              )}
              aria-label={`Page ${pageIndex + 1}`}
            />
          ))}

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(safeTotalPages - 1, p + 1))}
            disabled={safeActivePage >= safeTotalPages - 1}
            className={cn(
              "h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center transition",
              safeActivePage >= safeTotalPages - 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-800 hover:bg-gray-50"
            )}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
