"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Download, ChevronDown } from "lucide-react";
import ImageComponent from "@/components/ui/ImageComponent";
import { Course } from "@/types";
import EmptyState from "../components/applications/EmptyState";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "All" },
  { label: "In Progress" },
  { label: "Completed" },
  { label: "Newly bought" },
];

// Filter options similar to CoursesSection
const filterOptions = [
  { label: "All Categories", value: "all" },
  { label: "Data Science", value: "data-science" },
  { label: "Machine Learning", value: "machine-learning" },
  { label: "AI", value: "ai" },
  { label: "Web Development", value: "web-development" },
];

// Sort options
const sortOptions = [
  { label: "Recently Added", value: "recent" },
  { label: "Progress (High to Low)", value: "progress-desc" },
  { label: "Progress (Low to High)", value: "progress-asc" },
  { label: "Course Name (A-Z)", value: "name-asc" },
  { label: "Course Name (Z-A)", value: "name-desc" },
  { label: "Duration (Short to Long)", value: "duration-asc" },
  { label: "Duration (Long to Short)", value: "duration-desc" },
];

const CoursesPage = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedFilters, setSelectedFilters] = useState([
    { label: "All Categories", value: "all" },
  ]);
  const [selectedSort, setSelectedSort] = useState(sortOptions[0]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Handle filter selection
  const handleFilterClick = useCallback(
    (filter: { label: string; value: string }) => {
      setSelectedFilters((prev) => {
        if (filter.value === "all") {
          return [filter];
        }

        const withoutAll = prev.filter((f) => f.value !== "all");
        const isSelected = withoutAll.some((f) => f.value === filter.value);

        if (isSelected) {
          const newFilters = withoutAll.filter((f) => f.value !== filter.value);
          return newFilters.length === 0
            ? [{ label: "All Categories", value: "all" }]
            : newFilters;
        } else {
          return [...withoutAll, filter];
        }
      });
    },
    []
  );

  // Handle filter dropdown toggle
  const handleFilterToggle = useCallback(() => {
    setIsFilterOpen(!isFilterOpen);
    setIsSortOpen(false); // Close sort dropdown when opening filter
  }, [isFilterOpen]);

  // Handle sort selection
  const handleSortClick = useCallback(
    (sort: { label: string; value: string }) => {
      setSelectedSort(sort);
      setIsSortOpen(false);
    },
    []
  );

  // Handle sort dropdown toggle
  const handleSortToggle = useCallback(() => {
    setIsSortOpen(!isSortOpen);
    setIsFilterOpen(false); // Close filter dropdown when opening sort
  }, [isSortOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest(".filter-dropdown") ||
        target.closest(".sort-dropdown")
      )
        return;
      setIsFilterOpen(false);
      setIsSortOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Mock data - replace with actual courses array
  const courses = Array.from({ length: 0 }, (_, idx) => {
    const course: Course = {} as Course;
    const progress = [0, 12, 100][idx % 3];
    const showCertificate = progress === 100;
    return { course, progress, showCertificate };
  });

  return (
    <div className="py-4">
      {/* Conditional rendering based on courses array length */}
      {courses.length === 0 ? (
        <EmptyState
          title="Courses"
          description="No courses found! Buy courses to get courses."
          buttonText="Explore for Courses!"
          href="/courses"
        />
      ) : (
        <>
          {/* Header and Tabs */}
          <div className="flex flex-col mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-3 sm:mb-4">
                My Courses
              </h1>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
                <div className="flex gap-1 sm:gap-2 rounded-lg border border-[#F66F221F] bg-[#FFF6F2] p-1 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.label}
                      className={`px-2 sm:px-4 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        activeTab === tab.label
                          ? "bg-orange-500 text-white shadow"
                          : "text-black hover:bg-gray-200"
                      }`}
                      onClick={() => setActiveTab(tab.label)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search, Filter, Sort */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end w-full lg:w-auto">
                  <div className="relative order-1 sm:order-0">
                    <input
                      type="text"
                      placeholder="Search a course by its name, title or author name"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="placeholder:text-[#0000003D] placeholder:text-xs w-full sm:w-[280px] md:w-[349px] h-10 sm:h-12 px-3 sm:px-4 pr-10 sm:pr-12 bg-[#F5F5F5] rounded-xl border border-[#00000026] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-[0px_4px_4px_0px_#00000012_inset]"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 p-1.5 sm:p-2 rounded-lg hover:bg-orange-600 transition cursor-pointer"
                      title="Search"
                    >
                      <Search className="size-5 text-white" />
                    </button>
                  </div>
                  <div className="flex gap-2 order-2 sm:order-0">
                    {/* Filter Button with Dropdown */}
                    <div className="relative filter-dropdown">
                      <button
                        type="button"
                        onClick={handleFilterToggle}
                        className="flex items-center gap-1 border border-[#00000026] rounded-lg px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-bold text-[#2B1508] hover:bg-gray-200 cursor-pointer"
                      >
                        <span className="hidden sm:inline">Filter</span>
                        <span className="sm:hidden">Filter</span>
                        <Filter className="size-5" />
                        {selectedFilters.some((f) => f.value !== "all") && (
                          <span className="ml-1 text-orange-600">
                            (
                            {
                              selectedFilters.filter((f) => f.value !== "all")
                                .length
                            }
                            )
                          </span>
                        )}
                      </button>

                      {/* Filter Dropdown */}
                      {isFilterOpen && (
                        <div className="absolute top-full mt-2 right-0 w-56 bg-white text-text-primary rounded-xl shadow-2xl border border-gray-100/50 backdrop-blur-sm p-2 z-50">
                          <div className="bg-linear-to-r from-gray-50 to-gray-100/30 rounded-lg p-1">
                            {filterOptions.map((filter) => (
                              <button
                                key={filter.value}
                                onClick={() => handleFilterClick(filter)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-white/80 hover:shadow-sm rounded-lg transition-all duration-200 ease-in-out cursor-pointer group"
                              >
                                <div
                                  className={cn(
                                    "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors duration-200",
                                    selectedFilters.some(
                                      (f) => f.value === filter.value
                                    )
                                      ? "bg-orange-100 border-orange-600"
                                      : "bg-gray-100 border-gray-300 group-hover:border-orange-300"
                                  )}
                                >
                                  {selectedFilters.some(
                                    (f) => f.value === filter.value
                                  ) && (
                                    <div className="w-2 h-2 bg-orange-600 rounded-full" />
                                  )}
                                </div>
                                <span className="font-medium text-gray-700 text-left group-hover:text-gray-900 transition-colors duration-200">
                                  {filter.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sort Button with Dropdown */}
                    <div className="relative sort-dropdown">
                      <button
                        type="button"
                        onClick={handleSortToggle}
                        className="flex items-center gap-1 border border-[#00000026] rounded-lg px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-bold text-[#2B1508] hover:bg-gray-200 cursor-pointer"
                      >
                        <span className="hidden sm:inline">Sort by</span>
                        <span className="sm:hidden">Sort</span>
                        <ChevronDown
                          className={cn(
                            "size-5 transition-transform duration-200",
                            isSortOpen ? "rotate-180" : ""
                          )}
                        />
                      </button>

                      {/* Sort Dropdown */}
                      {isSortOpen && (
                        <div className="absolute top-full mt-2 right-0 w-64 bg-white text-text-primary rounded-xl shadow-2xl border border-gray-100/50 backdrop-blur-sm p-2 z-50">
                          <div className="bg-linear-to-r from-gray-50 to-gray-100/30 rounded-lg p-1">
                            {sortOptions.map((sort) => (
                              <button
                                key={sort.value}
                                onClick={() => handleSortClick(sort)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-white/80 hover:shadow-sm rounded-lg transition-all duration-200 ease-in-out cursor-pointer group"
                              >
                                <div
                                  className={cn(
                                    "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors duration-200",
                                    selectedSort.value === sort.value
                                      ? "bg-orange-100 border-orange-600"
                                      : "bg-gray-100 border-gray-300 group-hover:border-orange-300"
                                  )}
                                >
                                  {selectedSort.value === sort.value && (
                                    <div className="w-2 h-2 bg-orange-600 rounded-full" />
                                  )}
                                </div>
                                <span className="font-medium text-left text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                                  {sort.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {courses.map(({ course, progress, showCertificate }, idx) => (
              <div
                key={`${course._id}-${idx}`}
                className="bg-white border border-[#0000001F] rounded-xl flex flex-col justify-between p-3 sm:p-4 w-full shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="relative w-full  rounded-xl overflow-hidden mb-2 sm:mb-3">
                    <ImageComponent
                      src="/courses-demo-image.png"
                      alt="certificate"
                      width={300}
                      height={226}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-[#00000078] text-white text-xs px-2 sm:px-3 py-1 rounded-full flex gap-1 font-medium">
                      <span className="hidden sm:inline">5 Episodes</span>
                      <span className="sm:hidden">5 Ep</span>
                      <span>•</span>
                      <span className="hidden sm:inline">4 Modules</span>
                      <span className="sm:hidden">4 Mod</span>
                    </div>
                  </div>
                  <div className="font-extrabold text-xs sm:text-sm mb-2 text-black line-clamp-2">
                    Data Science: Zero to Hundred
                  </div>
                  <div className="flex gap-1 sm:gap-2 overflow-x-auto">
                    <div className="bg-[#EEEEEE] rounded-[34px] p-[2px] border-2 border-white flex items-center gap-1 sm:gap-2 shrink-0">
                      <ImageComponent
                        src="/user.svg"
                        alt="user"
                        width={20}
                        height={20}
                        className="sm:w-6 sm:h-6 rounded-full border border-white"
                      />
                      <span className="text-xs sm:text-sm text-gray-700 font-medium hidden sm:inline">
                        John Doe
                      </span>
                      <span className="text-xs sm:text-sm text-gray-700 font-medium sm:hidden">
                        JD
                      </span>
                    </div>
                    <div className="bg-[#EEEEEE] rounded-[34px] p-[2px] border-2 border-white flex items-center gap-1 sm:gap-2 shrink-0">
                      <ImageComponent
                        src="/user.svg"
                        alt="user"
                        width={20}
                        height={20}
                        className="sm:w-6 sm:h-6 rounded-full border border-white"
                      />
                      <span className="text-xs sm:text-sm text-gray-700 font-medium hidden sm:inline">
                        John Doe
                      </span>
                      <span className="text-xs sm:text-sm text-gray-700 font-medium sm:hidden">
                        JD
                      </span>
                    </div>
                    <div className="bg-[#EEEEEE] rounded-[34px] p-[2px] border-2 border-white flex items-center gap-1 sm:gap-2 shrink-0">
                      <span className="text-xs sm:text-sm text-gray-700 font-medium m-[2px]">
                        +1
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 pt-2 sm:pt-3">
                  {/* Circular progress bar */}
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 sm:w-10 sm:h-10 -rotate-90deg"
                      viewBox="0 0 40 40"
                    >
                      <circle
                        cx="20"
                        cy="20"
                        r="18"
                        fill="none"
                        stroke="#F3F4F6"
                        strokeWidth="4"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="18"
                        fill="none"
                        stroke={
                          progress === 100
                            ? "#22C55E"
                            : progress > 0
                            ? "#A259FF"
                            : "#E5E7EB"
                        }
                        strokeWidth="4"
                        strokeDasharray={2 * Math.PI * 18}
                        strokeDashoffset={
                          2 * Math.PI * 18 * (1 - progress / 100)
                        }
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-black">
                      {progress}%
                    </span>
                    <span className="text-[8px] sm:text-[10px] font-medium text-[#00000080]">
                      Your progress
                    </span>
                  </div>

                  <div className="flex-1" />

                  {progress === 100 && showCertificate ? (
                    <button
                      type="button"
                      className="flex items-center gap-1 sm:gap-2 bg-linear-to-b from-[#F5691D] to-[#F9792A] text-white rounded-lg px-2 sm:px-2 py-1.5 sm:py-2 text-[10px] font-semibold hover:from-[#F5691D] hover:to-[#F9792A] transition cursor-pointer border border-[#00000021] shadow-[0px_0px_0px_4px_rgba(246,140,34,0.22),0px_0px_0px_2px_rgba(246,140,34,0.22)]"
                    >
                      <Download size={14} className="sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">
                        Download certificate
                      </span>
                      <span className="sm:hidden">Download</span>
                    </button>
                  ) : progress > 0 ? (
                    <button
                      type="button"
                      className="flex items-center gap-1 sm:gap-2 bg-white border border-[#00000021] text-[#656565] rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-xs font-bold hover:bg-gray-100 transition cursor-pointer shadow-[0px_-3px_3.7px_0px_#0146E721_inset]"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="flex items-center gap-1 sm:gap-2 bg-white border border-[#00000021] text-[#656565] rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-xs font-bold hover:bg-gray-100 transition cursor-pointer shadow-[0px_-3px_3.7px_0px_#0146E721_inset]"
                    >
                      <span className="hidden sm:inline">Start watching</span>
                      <span className="sm:hidden">Start</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CoursesPage;
