"use client";
import { ChevronDown, Loader2 } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import CourseSearchBar from "./CourseSearchBar";
import { useCourseFilter } from "@/contexts/CourseFilterProvider";
import { cn } from "@/lib/utils";
import FilterContainer from "./FilterContainer";
import CourseCard from "./CourseCard";

const CoursesSection = () => {
  const { search, filters, selectedFilter, handleFilterClick, courses, isFetching } =
    useCourseFilter();
  const [filterShown, setFilterShown] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth === 0 ? true : windowWidth <= 1046; // Default to true during SSR

  const filteredCourses = useMemo(() => {
    let filtered = courses;

    // Apply category filters
    const isAllSelected = selectedFilter?.some((f) => f.value === "all");
    if (!isAllSelected && selectedFilter?.length > 0) {
      const selectedCategories = selectedFilter.map((f) => {
        // Map filter values to course categories
        switch (f.value) {
          case "data-science":
            return "Data Science";
          case "machine-learning":
            return "Machine Learning";
          case "ai":
            return "AI";
          case "web-development":
            return "Web Development";
          default:
            return f.label;
        }
      });

      filtered = filtered.filter((course) =>
        selectedCategories.includes(course.category)
      );
    }

    // Apply search filter
    if (search && search.trim().length > 0) {
      const searchTerm = search.toLowerCase().trim();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm) ||
          course.category.toLowerCase().includes(searchTerm) ||
          course.instructor.some((instructor) =>
            instructor.name.toLowerCase().includes(searchTerm)
          )
      );
    }

    return filtered;
  }, [courses, selectedFilter, search]);

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
        <CourseSearchBar />
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
        {!isFetching ? (
          filteredCourses.length > 0 ? (
            filteredCourses.map((course, index) => (
              <CourseCard
                key={index}
                {...course}
                className="opacity-0 animate-course-card-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <p className="text-2xl font-bold text-[#2B1508] font-coolvetica mb-2">
                No courses found
              </p>
              <p className="text-lg text-[#2B1508]/70 text-center break-words overflow-wrap-anywhere max-w-full">
                {search ? (
                  <>
                    No results found for &quot;
                    <span className="font-medium break-all inline-block max-w-full">
                      {search.length > 50
                        ? `${search.substring(0, 50)}...`
                        : search}
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
          )
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 text-[#2B1508] animate-spin" />
            <p className="text-sm text-[#2B1508]/50 text-center mt-4 animate-fade-in">
              Fetching the best courses for you...
            </p>
          </div>
        )}
      </div>
      {!isFetching && filteredCourses.length > 8 && (
        <div className="load-more-button w-full flex justify-center mt-5">
          <button className="w-full sm:w-1/3 font-bold text-sm px-8 py-4 bg-black text-white rounded-xl cursor-pointer">
            Load More
          </button>
        </div>
      )}
    </section>
  );
};

export default CoursesSection;
