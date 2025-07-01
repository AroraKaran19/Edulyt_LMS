"use client";
import { ChevronDown } from "lucide-react";
import React, { useState } from "react";
import CourseSearchBar from "./CourseSearchBar";
import { useCourseFilter } from "@/contexts/CourseFilterProvider";
import { cn } from "@/lib/utils";

const CoursesSection = () => {
  const { filters, selectedFilter, handleFilterClick } = useCourseFilter();
  const [filterShown, setFilterShown] = useState(false);

  return (
    <section className="courses-section w-full bg-white rounded-2xl py-10 flex flex-col items-center sm:px-[15%]">
      <p className="courses-section-header w-full text-left text-[44px] font-normal text-[#2B1508] font-coolvetica">
        Explore more <span className="text-[#f77124]">Courses</span>
      </p>
      <div className="search-container w-full mt-6 flex gap-6 items-stretch">
        <CourseSearchBar />
        <div
          className="courses-filter max-w-[190px] shrink-0 flex gap-2 items-center border border-black/10 rounded-xl p-2 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2)] px-8 relative cursor-pointer"
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
          <ChevronDown className={cn("size-4 text-[#2B1508] transition-transform duration-300 ease-in-out", filterShown ? "rotate-180" : "")} />
        </div>
      </div>
      {filterShown && (
        <div className="filter-options w-full mt-6 bg-[#FFF6F2] rounded-full flex gap-2 items-center animate-fade-from-top">
          {filters.map((filter, index) => (
            <div
              key={index}
              className={cn(
                `filter-option text-[16px] py-4 px-8 font-bold text-[#2B1508] rounded-full select-none cursor-pointer text-center flex gap-2 items-center justify-center`,
                selectedFilter?.some((f) => f.value === filter.value)
                  ? "bg-[linear-gradient(rgba(245,105,29,0.9)_0%,rgba(245,105,29,0.9)_100%)] text-white"
                  : "hover:bg-[rgba(247,113,36,0.1)] hover:text-[rgba(247,113,36,0.8)]"
              )}
              style={{ width: `${100 / filters.length}%` }}
              onClick={() => handleFilterClick(filter)}
            >
              <span className="text-[16px]">{filter.label}</span>
              {filter.featureBox && (
                <span className="text-[10px] font-normal px-1.5 py-0.75 rounded-full bg-[#F5691D] text-white">{filter.featureBox.value}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default CoursesSection;
