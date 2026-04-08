"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Filter, ChevronDown, FileX, Loader2 } from "lucide-react";
import { Course } from "@/types";
import EmptyState from "../components/applications/EmptyState";
import { cn } from "@/lib/utils";
import useUserEnrollments from "@/hooks/useUserEnrollments";
import { Enrollment } from "@/types/enrollment";
import CourseCard from "./components/CourseCard";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";

const tabs = [
  { label: "All" },
  { label: "In Progress" },
  { label: "Completed" },
  { label: "Newly bought" },
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFilters, setSelectedFilters] = useState([
    { label: "All Categories", value: "all" },
  ]);
  const [selectedSort, setSelectedSort] = useState(sortOptions[0]);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    getUserEnrollments,
    isLoading,
    error,
    calculateProgress,
    shouldShowCertificate,
  } = useUserEnrollments();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch enrollments
  const fetchEnrollments = useCallback(async () => {
    const status =
      activeTab === "All"
        ? undefined
        : activeTab === "In Progress"
          ? "active"
          : activeTab === "Completed"
            ? "completed"
            : undefined;

    // For "Newly bought" tab, fetch all enrollments to filter client-side
    // For other tabs, use normal pagination
    const limit = activeTab === "Newly bought" ? 1000 : 12;
    const page = activeTab === "Newly bought" ? 1 : currentPage;

    const result = await getUserEnrollments({
      page,
      limit,
      status,
      search: debouncedSearch || undefined,
      sortBy: selectedSort.value as
        | "recent"
        | "progress-desc"
        | "progress-asc"
        | "name-asc"
        | "name-desc"
        | "duration-asc"
        | "duration-desc",
    });

    if (result) {
      // Filter for "Newly bought" tab - only show direct enrollments (not trial, gift, or promotion)
      let filteredEnrollments = result.enrollments;
      if (activeTab === "Newly bought") {
        filteredEnrollments = result.enrollments.filter(
          (enrollment) => enrollment.enrollmentSource === "direct",
        );

        // Client-side pagination for filtered results
        const startIndex = (currentPage - 1) * 12;
        const endIndex = startIndex + 12;
        filteredEnrollments = filteredEnrollments.slice(startIndex, endIndex);
      }

      setEnrollments(filteredEnrollments);
      // Recalculate pagination for filtered results
      if (activeTab === "Newly bought") {
        const allDirectEnrollments = result.enrollments.filter(
          (enrollment) => enrollment.enrollmentSource === "direct",
        );
        const filteredTotal = allDirectEnrollments.length;
        const filteredTotalPages = Math.ceil(filteredTotal / 12);
        setTotalPages(filteredTotalPages);
        setTotal(filteredTotal);
      } else {
        setTotalPages(result.totalPages);
        setTotal(result.total);
      }
    }
  }, [
    activeTab,
    currentPage,
    debouncedSearch,
    selectedSort.value,
    getUserEnrollments,
  ]);

  // Fetch enrollments when dependencies change
  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // Handle tab change
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when changing tabs
  }, []);

  // Handle search change
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

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
    [],
  );

  // Handle sort selection
  const handleSortClick = useCallback(
    (sort: { label: string; value: string }) => {
      setSelectedSort(sort);
      setIsSortOpen(false);
    },
    [],
  );

  // Handle sort dropdown toggle
  const handleSortToggle = useCallback(() => {
    setIsSortOpen(!isSortOpen);
  }, [isSortOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(".sort-dropdown")) return;
      setIsSortOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Check if we're showing search results
  const isSearchActive = debouncedSearch.trim().length > 0;
  const hasEnrollments = enrollments.length > 0;
  const isSearching = search !== debouncedSearch && search.trim().length > 0;

  // Empty state config when no courses match current filter (tabs stay visible)
  const emptyStateConfig = !isSearchActive
    ? (() => {
        switch (activeTab) {
          case "Completed":
            return {
              title: "Completed",
              description:
                "You haven't completed any courses yet. Keep learning to complete your courses!",
              buttonText: "See All Courses",
              onClick: () => handleTabChange("All"),
            };
          case "In Progress":
            return {
              title: "In Progress",
              description:
                "You don't have any courses in progress. Start learning to see your progress!",
              buttonText: "See All Courses",
              onClick: () => handleTabChange("All"),
            };
          case "Newly bought":
            return {
              title: "Newly Bought",
              description:
                "You haven't purchased any courses recently. Your newly bought courses will appear here.",
              buttonText: "See All Courses",
              onClick: () => handleTabChange("All"),
            };
          default:
            return {
              title: "Courses",
              description: "No courses found! Buy courses to get courses.",
              buttonText: "Explore for Courses!",
              href: "/courses",
            };
        }
      })()
    : null;

  return (
    <div className="py-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={fetchEnrollments}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Header and Tabs - always visible */}
          <div className="flex flex-col mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-3 sm:mb-4">
                My Courses
              </h1>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
                <div className="flex gap-1 sm:gap-2 rounded-lg border border-[#F66F221F] bg-white p-1 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.label}
                      className={`px-2 sm:px-4 py-1 sm:py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        activeTab === tab.label
                          ? "bg-orange-500 text-white shadow"
                          : "text-black hover:bg-gray-200"
                      }`}
                      onClick={() => handleTabChange(tab.label)}
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
                      onChange={(e) => handleSearchChange(e.target.value)}
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
                            isSortOpen ? "rotate-180" : "",
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
                                      : "bg-gray-100 border-gray-300 group-hover:border-orange-300",
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

          {/* Results Section */}
          {isSearching ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] py-12">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
              <p className="text-gray-600">Searching courses...</p>
            </div>
          ) : isSearchActive && !hasEnrollments ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <FileX className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No Courses Found
              </h2>
              <p className="text-gray-600 text-center max-w-md mb-6">
                We couldn't find any courses matching "{debouncedSearch}". Try
                searching with a different term or check your spelling.
              </p>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="cursor-pointer px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors shadow-md"
              >
                Clear Search
              </button>
            </div>
          ) : !hasEnrollments && emptyStateConfig ? (
            <div className="mt-8">
              <EmptyState
                title={emptyStateConfig.title}
                description={emptyStateConfig.description}
                buttonText={emptyStateConfig.buttonText}
                href={
                  "href" in emptyStateConfig ? emptyStateConfig.href : undefined
                }
                onClick={
                  "onClick" in emptyStateConfig
                    ? emptyStateConfig.onClick
                    : undefined
                }
              />
            </div>
          ) : (
            <>
              {/* Courses Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                {enrollments.map((enrollment, idx) => {
                  const course = enrollment.courseId as Course; // Backend populates courseId as Course object
                  const progress = calculateProgress(enrollment);
                  const showCertificate = shouldShowCertificate(enrollment);

                  return (
                    <CourseCard
                      key={`${course._id}-${idx}`}
                      course={course}
                      enrollment={enrollment}
                      progress={progress}
                      showCertificate={showCertificate}
                    />
                  );
                })}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 &&
            !isSearching &&
            !(isSearchActive && !hasEnrollments) && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <WhiteButton
                  glow={false}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </WhiteButton>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <WhiteButton
                        glow={false}
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </WhiteButton>
                    );
                  })}
                </div>
                <OrangeButton
                  glow={false}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </OrangeButton>
              </div>
            )}
        </>
      )}
    </div>
  );
};

export default CoursesPage;
