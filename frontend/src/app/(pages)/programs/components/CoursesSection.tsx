"use client";
import { ChevronDown } from "lucide-react";
import Loader from "@/components/ui/Loader";
import { useState, useEffect, useCallback, useRef } from "react";
import CourseSearchBar from "./CourseSearchBar";
import { cn } from "@/lib/utils";
import FilterContainer from "./FilterContainer";
import CourseCard from "./CourseCard";
import { getErrorUIConfig } from "@/configs/errorUIConfig";
import Error from "@/components/ui/Error";
import useSWR from "swr";
import { Course } from "@/types";
import { Filter } from "@/types";
import { ENDPOINTS } from "@/constants/endpoints";
import { fetcher } from "@/lib/utils";
import { useCategory } from "@/hooks/useCategory";
import { Category } from "@/types/category";

const CoursesSection = () => {
  // Local state management instead of context
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<Filter[]>([
    { label: "All", value: "all" },
  ]);
  const [filterShown, setFilterShown] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [page, setPage] = useState(1);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([
    { label: "All", value: "all" },
  ]);
  const lastLoadTimeRef = useRef(0);
  const isLoadingRef = useRef(false);
  const coursesSectionRef = useRef<HTMLElement>(null);

  const { getHomePageCategories } = useCategory();

  // Fetch homepage categories on mount
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
    setPage(1);
    setAllCourses([]);
    setHasMore(true);
  }, [debouncedSearch, selectedFilter]);

  // Build API URL with filters and search
  const buildApiUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", "10");

    if (debouncedSearch) {
      params.append("search", debouncedSearch);
    }

    // Convert selected filters to categories (excluding "all")
    const categories = selectedFilter
      .filter((filter) => filter.value !== "all")
      .map((filter) => filter.value);

    if (categories.length > 0) {
      params.append("categories", categories.join(","));
    }

    const url = `${ENDPOINTS.courses.all}?${params.toString()}`;
    return url;
  }, [page, debouncedSearch, selectedFilter]);

  const { data, error, isLoading } = useSWR(buildApiUrl(), fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryInterval: 5000,
    dedupingInterval: 1000 * 60, // 1 minutes
  });

  // Update allCourses when new data arrives
  useEffect(() => {
    if (data?.data?.data?.courses) {
      const currentPage = data.data.data.page;
      const totalPages = data.data.data.totalPages;

      if (currentPage === page) {
        if (page === 1) {
          setAllCourses(data.data.data.courses);
        } else {
          setAllCourses((prev) => [...prev, ...data.data.data.courses]);
        }
        setHasMore(currentPage < totalPages);
        setIsLoadingMore(false);
        isLoadingRef.current = false;
      }
    } else if (
      data?.data?.data &&
      Array.isArray(data.data.data) &&
      data.data.data.length === 0
    ) {
      // Handle case when API returns empty array (no courses found)
      setHasMore(false);
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  }, [data, page]);

  // Load more function
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoadingRef.current) {
      isLoadingRef.current = true;
      setIsLoadingMore(true);
      setPage((prev) => prev + 1);
    }
  }, [isLoadingMore, hasMore]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (!coursesSectionRef.current) return;

    const coursesSection = coursesSectionRef.current;
    const coursesSectionBottom =
      coursesSection.offsetTop + coursesSection.offsetHeight;
    const windowBottom = window.scrollY + window.innerHeight;
    const isNearBottom = windowBottom >= coursesSectionBottom - 100;
    const now = Date.now();

    if (
      isNearBottom &&
      hasMore &&
      !isLoadingMore &&
      now - lastLoadTimeRef.current > 1000
    ) {
      lastLoadTimeRef.current = now;
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore, page]);

  // Attach scroll listener to window
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

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

    setPage(1);
  }, []);

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
  }, []);

  const handleDebouncedSearch = useCallback((debouncedValue: string) => {
    setDebouncedSearch(debouncedValue);
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
            No courses found
          </p>
          <p className="text-lg text-text-primary/70 text-center wrap-break-words overflow-wrap-anywhere max-w-full">
            {debouncedSearch ? (
              <>
                No results found for &quot;
                <span className="font-medium break-all inline-block max-w-full">
                  {debouncedSearch.length > 50
                    ? `${debouncedSearch.substring(0, 50)}...`
                    : debouncedSearch}
                </span>
                &quot;
              </>
            ) : (
              "No courses match the selected filters"
            )}
          </p>
          <p className="text-sm text-text-primary/50 text-center mt-2">
            Try adjusting your search terms or filters
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
              style={
                { animationDelay: "100ms" }
              }
            />
          ))}
        </div>
        {isLoadingMore && (
          <div className="w-full flex items-center justify-center py-4">
            <Loader
              size="md"
              variant="spinner"
              text="Loading more courses..."
              showText={true}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <section
      ref={coursesSectionRef}
      className="courses-section w-full bg-white rounded-2xl py-10 px-4 flex flex-col items-center sm:px-[15%] md:px-[10%] xl:px-[15%]"
    >
      <p
        className={cn(
          "courses-section-header w-full text-[44px] font-normal text-text-primary font-coolvetica",
          isMobile ? "text-center" : "text-left"
        )}
      >
        Explore more <span className="text-primary">Courses</span>
      </p>
      <div className="search-container w-full mt-6 flex gap-6 items-stretch flex-col md:flex-row">
        <CourseSearchBar
          search={search}
          onSearchChange={handleSearchChange}
          onDebouncedSearch={handleDebouncedSearch}
          debounceDelay={500}
        />
        <div
          className="courses-filter md:max-w-[190px] shrink-0 flex gap-2 items-center justify-center border border-black/10 rounded-xl p-2 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2)] px-8 relative cursor-pointer"
          onClick={() => setFilterShown(!filterShown)}
        >
          <span className="text-[16px] font-bold text-text-primary select-none">
            Filter{" "}
            {selectedFilter?.some((f) => f.value === "all")
              ? ""
              : selectedFilter?.length
              ? `(${selectedFilter.length})`
              : ""}
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-text-primary transition-transform duration-300 ease-in-out",
              filterShown ? "rotate-180" : ""
            )}
          />
        </div>
      </div>
      {filterShown && (
        <FilterContainer
          filters={filters}
          selectedFilter={selectedFilter}
          isMobile={isMobile}
          handleFilterClick={handleFilterClick}
        />
      )}
      <div className="courses-container w-full mt-6 md:mt-13">
        {renderContent()}
      </div>
    </section>
  );
};

export default CoursesSection;
