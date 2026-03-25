"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import NewCourseCard from "@/app/(pages)/internships/components/NewCourseCard";
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

  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    setPage(1);
    setCoursesList([]);
    setHasMore(true);
  }, [activeCategory]);
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

  // Update coursesList when new data arrives
  useEffect(() => {
    if (data?.data?.data?.courses) {
      const currentPage = data.data.data.page;
      const total = data.data.data.totalPages;
      setTotalPages(total || 1);

      if (currentPage === page) {
        setCoursesList(data.data.data.courses);
        setHasMore(currentPage < total);
        isLoadingRef.current = false;
      }
    } else if (
      data?.data?.data &&
      Array.isArray(data.data.data) &&
      data.data.data.length === 0
    ) {
      if (page === 1) {
        setCoursesList(staticCourses as any);
        setTotalPages(Math.ceil(staticCourses.length / 6) || 1);
      }
      setHasMore(false);
      isLoadingRef.current = false;
    }
  }, [data, page]);


  return (
    <div className="relative px-40 mt-12 sm:py-10">
      {/* Marker: Node icon + Header */}
      <div className="flex items-center relative gap-4 -translate-x-12 sm:-translate-x-22">
        <TimelineMarkerIcon size="big">🎓</TimelineMarkerIcon>
        <span className="text-xl sm:text-xl md:text-lg relative md:left-8 font-semibold text-gray-800">
          We Have Two Powerful Paths for You
        </span>
      </div>

      <div className="mt-10 sm:mt-4 ">
        <div className="flex flex-col gap-1 mb-6">
          <h2 className="text-xl sm:text-lg lg:text-xl font-semibold leading-tight">
            Our <span className="text-[#F77124]">Courses</span> <br className="sm:hidden" /> <span className="text-gray-900">(For Students)</span>
          </h2>
        </div>

        {/* Category filters container */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide" ref={scrollRef}>
          {filters.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                "shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition",
                activeCategory === cat.value
                  ? "bg-[#F77124] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
        <div className="mt-16 flex justify-center items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i + 1)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i + 1 === page ? "w-8 bg-[#F77124]" : "w-2 bg-gray-300 hover:bg-gray-400"
              )}
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div >
  );
}
