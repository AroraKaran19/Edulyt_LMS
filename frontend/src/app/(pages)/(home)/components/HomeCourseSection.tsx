"use client";
import Link from "next/link";
import Loader from "@/components/ui/Loader";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { getErrorUIConfig } from "@/configs/errorUIConfig";
import Error from "@/components/ui/Error";
import useSWR from "swr";
import { Course } from "@/types";
import { Filter } from "@/types";
import { ENDPOINTS } from "@/constants/endpoints";
import { fetcher } from "@/lib/utils";
import { useCategory } from "@/hooks/useCategory";
import { Category } from "@/types/category";
import CourseCard from "../../programs/components/CourseCard";
import FilterContainer from "../../programs/components/FilterContainer";

const HomeCourseSection = ({
  audience,
}: {
  audience: "college-students" | "professionals";
}) => {
  const [selectedFilter, setSelectedFilter] = useState<Filter[]>([
    { label: "All", value: "all" },
  ]);
  const [windowWidth, setWindowWidth] = useState(0);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([
    { label: "All", value: "all" },
  ]);

  const { getHomePageCategories } = useCategory();

  useEffect(() => {
    const fetchHomePageCategories = async () => {
      const categories = await getHomePageCategories();
      if (categories && categories.length > 0) {
        const categoryFilters: Filter[] = [
          { label: "All", value: "all" },
          ...categories.map((category: Category) => ({
            label: category.name,
            value: category._id || "",
          })),
        ];
        setFilters(categoryFilters);
      }
    };
    fetchHomePageCategories();
  }, [getHomePageCategories]);

  useEffect(() => {
    setAllCourses([]);
    setHasMore(false);
  }, [selectedFilter]);

  const buildApiUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append("page", "1");
    params.append("limit", "6");
    params.append("audience", audience);

    const categories = selectedFilter
      .filter((filter) => filter.value !== "all")
      .map((filter) => filter.value);

    if (categories.length > 0) {
      params.append("categories", categories.join(","));
    }

    const url = `${ENDPOINTS.courses.all}?${params.toString()}`;
    return url;
  }, [selectedFilter]);

  const { data, error, isLoading } = useSWR(buildApiUrl(), fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryInterval: 5000,
    dedupingInterval: 1000 * 60, // 1 minutes
  });

  useEffect(() => {
    if (data?.data?.data?.courses) {
      const currentPage = data.data.data.page;
      const totalPages = data.data.data.totalPages;
      if (currentPage === 1) {
        setAllCourses(data.data.data.courses);
        setHasMore(currentPage < totalPages);
      }
    } else if (
      data?.data?.data &&
      Array.isArray(data.data.data) &&
      data.data.data.length === 0
    ) {
      setHasMore(false);
    }
  }, [data]);

  const handleFilterClick = useCallback((filter: Filter) => {
    setSelectedFilter((prev) => {
      if (filter.value === "all") {
        return [filter];
      }

      const withoutAll = prev.filter((f) => f.value !== "all");

      const isSelected = withoutAll.some((f) => f.value === filter.value);

      if (isSelected) {
        const newFilters = withoutAll.filter((f) => f.value !== filter.value);
        return newFilters.length === 0
          ? [{ label: "All", value: "all" }]
          : newFilters;
      } else {
        return [...withoutAll, filter];
      }
    });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth === 0 ? true : windowWidth <= 1046;

  const renderContent = () => {
    if (isLoading && allCourses.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <Loader size="lg" variant="spinner" />
        </div>
      );
    }

    if (error) {
      const errorConfig = getErrorUIConfig(error);
      return (
        <div className="col-span-full">
          <Error
            icon={errorConfig.icon}
            iconSize="lg"
            iconColor={errorConfig.iconColor}
            title={errorConfig.title}
            description={errorConfig.description}
            containerHeight="h-64"
          />
        </div>
      );
    }

    if (!isLoading && allCourses.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12">
          <p className="text-2xl font-bold text-text-primary font-coolvetica mb-2">
            No programs found
          </p>
          <p className="text-lg text-text-primary/70 text-center wrap-break-words overflow-wrap-anywhere max-w-full">
            No programs match the selected filters
          </p>
          <p className="text-sm text-text-primary/50 text-center mt-2">
            Try a different category
          </p>
        </div>
      );
    }

    return (
      <div className="w-full h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-fr">
          {allCourses.map((course: Course, index: number) => (
            <CourseCard
              key={`${course._id || course.slug}-${index}`}
              course={course}
              className="opacity-0 animate-course-card-fade-in"
              style={{ animationDelay: "100ms" }}
            />
          ))}
        </div>
        {hasMore && allCourses.length > 0 && (
          <div className="w-full flex justify-center pt-8">
            <Link
              href="/programs"
              className={cn(
                "inline-flex items-center justify-center bg-white text-black rounded-2xl border border-gray-200 shadow-[inset_0_-2px_2px_0_rgba(0,0,0,0.1)]",
                "px-8 py-2.5 text-sm font-semibold cursor-pointer",
                "lg:px-4 lg:py-2.5",
              )}
            >
              View all programs
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="courses-section w-full bg-white rounded-2xl flex flex-col items-center">
      <FilterContainer
        filters={filters}
        selectedFilter={selectedFilter}
        isMobile={isMobile}
        handleFilterClick={handleFilterClick}
      />
      <div className="courses-container w-full mt-6 md:mt-13">
        {renderContent()}
      </div>
    </section>
  );
};

export default HomeCourseSection;
