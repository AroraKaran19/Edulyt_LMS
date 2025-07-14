import React from 'react';
import { cn } from "@/lib/utils";
import { BookOpen, Search, ChevronDown } from "lucide-react";
import OrangeButton from "@/components/ui/OrangeButton";
import { Filter } from "@/types";

interface AddedCoursesContentProps {
  search: string;
  setSearch: (value: string) => void;
  filterShown: boolean;
  setFilterShown: (value: boolean) => void;
  filters: Filter[];
  selectedFilter: Filter[];
  isMobile: boolean;
  onFilterClick: (filter: Filter) => void;
}

const AddedCoursesContent: React.FC<AddedCoursesContentProps> = ({
  search,
  setSearch,
  filterShown,
  setFilterShown,
  filters,
  selectedFilter,
  isMobile,
  onFilterClick
}) => {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 border-b border-gray-200 bg-white" style={{ height: '84px' }}>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">
            Added Courses
          </h2>
          <p className="text-gray-600">
            Manage and view all your existing courses
          </p>
        </div>
        <OrangeButton className="text-sm font-semibold" blinkIcon>
          Add New Course
        </OrangeButton>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* Search and Filter Section */}
      <div className="search-container w-full mb-6 flex gap-6 items-stretch flex-col md:flex-row">
        {/* Search Bar */}
        <div className="courses-search-bar w-full bg-[#F5F5F5] p-4 shrink rounded-xl flex gap-2 items-center border border-black/10 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2)]">
          <Search className="size-6 text-black/30" />
          <input
            type="text"
            placeholder="Search course name by title or type"
            className="w-full h-full placeholder:text-black/30 bg-transparent outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Button */}
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

      {/* Filter Options */}
      {filterShown && (
        <div className={`filter-options w-full mb-6 bg-[#FFF6F2] rounded-full flex gap-2 items-stretch animate-fade-from-top p-2 border-2 border-[#F5691D] ${
          isMobile ? "overflow-scroll" : "overflow-x-auto"
        }`}>
          {filters.map((filter, index) => (
            <div
              key={index}
              className={cn(
                `filter-option text-[16px] py-2 px-4 font-bold text-[#2B1508] rounded-full select-none cursor-pointer text-center flex gap-2 items-center justify-center`,
                selectedFilter?.some((f) => f.value === filter.value)
                  ? "bg-[linear-gradient(rgba(245,105,29,0.9)_0%,rgba(245,105,29,0.9)_100%)] text-white"
                  : "hover:bg-[rgba(247,113,36,0.1)] hover:text-[rgba(247,113,36,0.8)]"
              )}
              style={{
                minWidth: isMobile ? "150px" : "auto",
                width: isMobile ? "auto" : `${100 / filters.length}%`,
                flexShrink: isMobile ? 0 : 1,
              }}
              onClick={() => onFilterClick(filter)}
            >
              <span className="text-lg">{filter.label}</span>
              {filter.featureBox && (
                <span className="text-[10px] font-normal px-1.5 py-0.75 rounded-full bg-[#F5691D] text-white">
                  {filter.featureBox.value}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Courses Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <BookOpen className="w-16 h-16 text-[#F77124] mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          No courses found
        </h3>
        <p className="text-gray-600 mb-6">
          {search 
            ? `No courses match "${search}"` 
            : "Start by adding your first course"}
        </p>
        <OrangeButton className="text-sm font-semibold" blinkIcon>
          Add Your First Course
        </OrangeButton>
      </div>
      </div>
    </div>
  );
};

export default AddedCoursesContent; 