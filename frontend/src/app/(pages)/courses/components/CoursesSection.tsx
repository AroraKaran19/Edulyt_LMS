"use client";
import { ChevronDown, Loader2 } from "lucide-react";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import CourseSearchBar from "./CourseSearchBar";
import { cn, fetcher, buildQueryString } from "@/lib/utils";
import FilterContainer from "./FilterContainer";
import CourseCard from "./CourseCard";
import { ENDPOINTS } from "@/constants/endpoints";
import { getErrorUIConfig } from "@/configs/errorUIConfig";
import Error from "@/components/ui/Error";
import useSWR from "swr";
import { Course, Filter } from "@/types";

const CoursesSection = () => {
  // Local state management instead of context
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<Filter[]>([{ label: "All", value: "all" }]);
  const [filterShown, setFilterShown] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [page, setPage] = useState(1);

  // Define filters locally
  const filters: Filter[] = [
    { label: "All", value: "all" },
    { label: "Data Science", value: "data-science" },
    { label: "Machine Learning", value: "machine-learning" },
    { label: "AI", value: "ai" },
    { label: "Web Development", value: "web-development" },
  ];

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when debounced search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Build complete URL with query string
  const apiUrl = useMemo(() => {
    const queryString = buildQueryString(debouncedSearch, selectedFilter, page);
    return queryString ? `${ENDPOINTS.courses.all}?${queryString}` : ENDPOINTS.courses.all;
  }, [debouncedSearch, selectedFilter, page]);

  // SWR hook with dynamic URL
  const { data, error, isLoading } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  });

  const courses = data?.data?.courses || [];

  // Handle filter selection
  const handleFilterClick = useCallback((filter: Filter) => {
    setSelectedFilter(prev => {
      if (filter.value === "all") {
        return [filter];
      }
      
      // Remove "all" if it exists and we're selecting a specific filter
      const withoutAll = prev.filter(f => f.value !== "all");
      
      // Check if filter is already selected
      const isSelected = withoutAll.some(f => f.value === filter.value);
      
      if (isSelected) {
        // Remove the filter
        const newFilters = withoutAll.filter(f => f.value !== filter.value);
        return newFilters.length === 0 ? [{ label: "All", value: "all" }] : newFilters;
      } else {
        // Add the filter
        return [...withoutAll, filter];
      }
    });
    
    // Reset page when filters change
    setPage(1);
  }, []);

  // Handle search change (immediate UI update, debounced API call)
  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
    // Note: debouncedSearch will be updated by useEffect after 500ms
  }, []);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    setPage(prev => prev + 1);
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
    if (isLoading) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-16">
          <Loader2 className="w-10 h-10 text-[#2B1508] animate-spin" />
          <p className="text-sm text-[#2B1508]/50 text-center mt-4 animate-fade-in">
            {search !== debouncedSearch ? "Searching..." : "Fetching the best courses for you..."}
          </p>
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

    if (!courses || courses.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12">
          <p className="text-2xl font-bold text-[#2B1508] font-coolvetica mb-2">
            No courses found
          </p>
          <p className="text-lg text-[#2B1508]/70 text-center break-words overflow-wrap-anywhere max-w-full">
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
          <p className="text-sm text-[#2B1508]/50 text-center mt-2">
            Try adjusting your search terms or filters
          </p>
        </div>
      );
    }

    return courses.map((course: Course, index: number) => (
      <CourseCard
        key={index}
        course={course}
        className="opacity-0 animate-course-card-fade-in"
        style={{ animationDelay: `${index * 100}ms` }}
      />
    ));
  };

  return (
    <section className="courses-section w-full bg-white rounded-2xl py-10 px-4 flex flex-col items-center sm:px-[15%]">
      <p
        className={cn(
          "courses-section-header w-full text-[44px] font-normal text-[#2B1508] font-coolvetica",
          isMobile ? "text-center" : "text-left"
        )}
      >
        Explore more <span className="text-[#f77124]">Courses</span>
      </p>
      <div className="search-container w-full mt-6 flex gap-6 items-stretch flex-col md:flex-row">
        <CourseSearchBar 
          search={search}
          onSearchChange={handleSearchChange}
        />
        <div
          className="courses-filter md:max-w-[190px] shrink-0 flex gap-2 items-center justify-center border border-black/10 rounded-xl p-2 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2)] px-8 relative cursor-pointer"
          onClick={() => setFilterShown(!filterShown)}
        >
          <span className="text-[16px] font-bold text-[#2B1508] select-none">
            Filter{" "}
            {selectedFilter?.some((f) => f.value === "all")
              ? ""
              : selectedFilter?.length
              ? `(${selectedFilter.length})`
              : ""}
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-[#2B1508] transition-transform duration-300 ease-in-out",
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
      <div className="courses-container w-full mt-6 md:mt-13 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderContent()}
      </div>
      {!isLoading && courses.length > 8 && (
        <div className="load-more-button w-full flex justify-center mt-5">
          <button 
            className="w-full sm:w-1/3 font-bold text-sm px-8 py-4 bg-black text-white rounded-xl cursor-pointer"
            onClick={handleLoadMore}
          >
            Load More
          </button>
        </div>
      )}
    </section>
  );
};

export default CoursesSection;
