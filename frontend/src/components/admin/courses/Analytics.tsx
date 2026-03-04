"use client";
import { useState, useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import DropDown from "@/components/ui/dropdown/DropDown";
import Image from "next/image";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { ButtonLoader } from "@/components/ui/Loader";
import Link from "next/link";
import ImageComponent from "@/components/ui/ImageComponent";
import { InfiniteScrollSelect } from "@/components/ui/dropdown/InfiniteScrollSelect";
import { useCourse } from "@/hooks/useCourse";
import type { Course } from "@/types";

function formatMinutesToHours(minutes: number): string {
  if (minutes <= 0) return "0 min";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) {
    return m > 0 ? `${h}hr ${m}min` : `${h}hr`;
  }
  return `${m} min`;
}

const SORT_OPTIONS = ["Enrollments", "Revenue", "Rating"] as const;
const SORT_MAP = {
  Enrollments: "enrollments",
  Revenue: "revenue",
  Rating: "rating",
} as const;

const FILTER_OPTIONS = ["All Course", "In Progress", "Completed"] as const;
const FILTER_MAP = {
  "All Course": "all",
  "In Progress": "in_progress",
  Completed: "completed",
} as const;

const Analytics = () => {
  const { getAdminCourses } = useCourse();
  const [selectedFilter, setSelectedFilter] = useState<
    "All Course" | "In Progress" | "Completed"
  >("All Course");
  const [selectedSort, setSelectedSort] = useState<
    "Enrollments" | "Revenue" | "Rating"
  >("Enrollments");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const sortBy = SORT_MAP[selectedSort];
  const filterParam = FILTER_MAP[selectedFilter];
  const courseIdParam = selectedCourseId || undefined;

  const apiUrl = `/admin/courses-analytics?sortBy=${sortBy}&filter=${filterParam}${courseIdParam ? `&courseId=${encodeURIComponent(courseIdParam)}` : ""}`;

  const { data, error, isLoading } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const analytics = useMemo(() => {
    const raw = data?.data?.data;
    if (!raw) return null;
    return {
      totalCourses: raw.totalCourses ?? 0,
      totalEnrollments: raw.totalEnrollments ?? 0,
      totalRevenue: raw.totalRevenue ?? 0,
      totalAuthors: raw.totalAuthors ?? 0,
      completionRate: raw.completionRate ?? 0,
      completedCount: raw.completedCount ?? 0,
      notCompletedCount: raw.notCompletedCount ?? 0,
      averageCompletionTimeMinutes: raw.averageCompletionTimeMinutes ?? 0,
      growthRateVsPreviousPeriod: raw.growthRateVsPreviousPeriod ?? 0,
      popularCourses: raw.popularCourses ?? [],
    };
  }, [data?.data?.data]);

  const totalForBar =
    (analytics?.completedCount ?? 0) + (analytics?.notCompletedCount ?? 1);
  const completedPct =
    totalForBar > 0 ? (analytics?.completedCount ?? 0) / totalForBar : 0;
  const notCompletedPct =
    totalForBar > 0 ? (analytics?.notCompletedCount ?? 0) / totalForBar : 1;

  return (
    <div className="p-3 sm:p-4 md:p-6 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 sm:gap-0 mb-4 sm:mb-0">
        <h1 className="text-[#1D2939] font-bold text-lg sm:text-xl md:text-2xl font-coolvetica">
          Courses Analytics
        </h1>
        <span className="text-[#475467] font-medium font-coolvetica text-xs sm:text-sm">
          Courses / Analytics
        </span>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-10 gap-4 sm:gap-6">
          {/* Completion Rate Card */}
          <div className="xl:col-span-6 bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-[#EAECF0] min-w-0">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-[#667085] font-medium text-sm sm:text-base">
                  Courses Completion Rate
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                  {isLoading ? (
                    <ButtonLoader />
                  ) : (
                    <>
                      <span className="text-xl sm:text-2xl font-extrabold text-[#1D2939]">
                        {analytics?.completionRate ?? 0}%
                      </span>
                      <div className="flex items-center gap-1 text-xs font-medium">
                        <div className="bg-[#F6FEF9] rounded-md p-[6px] flex items-center gap-1">
                          {(analytics?.growthRateVsPreviousPeriod ?? 0) >= 0 ? (
                            <span className="text-[#12B669] flex items-center gap-1">
                              {analytics?.growthRateVsPreviousPeriod?.toFixed(
                                2,
                              )}
                              %
                              <TrendingUp className="size-3" />
                            </span>
                          ) : (
                            <span className="text-[#EF4444] flex items-center gap-1">
                              {analytics?.growthRateVsPreviousPeriod?.toFixed(
                                2,
                              )}
                              %
                              <TrendingDown className="size-3" />
                            </span>
                          )}
                        </div>
                        <span className="text-[#475467]">
                          than last 30 days
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-2">
                <DropDown
                  options={[...FILTER_OPTIONS]}
                  value={selectedFilter}
                  onChange={(e) =>
                    setSelectedFilter(e.target.value as typeof selectedFilter)
                  }
                  className="w-full sm:w-auto sm:min-w-[140px]"
                />
                <div className="flex-1 min-w-0">
                  <InfiniteScrollSelect<Course>
                    placeholder="All courses"
                    value={selectedCourseId}
                    onChange={(v) =>
                      setSelectedCourseId(
                        Array.isArray(v) ? (v[0] ?? "") : (v ?? ""),
                      )
                    }
                    fetchOptions={async (page, search) => {
                      const res = await getAdminCourses({
                        page,
                        limit: 15,
                        search: search || undefined,
                        searchTitleOnly: true,
                      });
                      const items = res?.courses ?? [];
                      const options =
                        page === 1 && !search
                          ? [
                              { value: "", label: "All courses" },
                              ...items.map((c) => ({
                                value: c._id ?? "",
                                label: c.title,
                                raw: c,
                              })),
                            ]
                          : items.map((c) => ({
                              value: c._id ?? "",
                              label: c.title,
                              raw: c,
                            }));
                      return {
                        items: options,
                        totalPages: res?.totalPages ?? 1,
                      };
                    }}
                    getOptionLabel={(c) => (c as Course).title ?? ""}
                    getOptionValue={(c) => (c as Course)._id ?? ""}
                    searchPlaceholder="Search courses..."
                    emptyMessage="No courses found"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div
                  className="h-5 sm:h-7 rounded-lg bg-[#4323F7] transition-all"
                  style={{ flex: completedPct || 0.01 }}
                />
                <div
                  className="h-5 sm:h-7 rounded-lg bg-[#F5742C] transition-all"
                  style={{ flex: notCompletedPct || 0.01 }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#4323F7] rounded-full shrink-0" />
                <span className="text-xs sm:text-sm text-[#232A3A] font-medium">
                  Completed ({analytics?.completedCount ?? 0})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#F5742C] rounded-full shrink-0" />
                <span className="text-xs sm:text-sm text-[#232A3A] font-medium">
                  Not Completed ({analytics?.notCompletedCount ?? 0})
                </span>
              </div>
            </div>
          </div>

          {/* Average Time & Summary Card */}
          <div className="xl:col-span-4 bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-[#EAECF0] min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-[#667085] font-medium text-sm sm:text-base">
                Average time for completion
              </h3>
              <Image
                src="/clock-icon.svg"
                alt="clock"
                width={28}
                height={28}
                className="sm:w-9 sm:h-9"
              />
            </div>
            <div className="mb-3 sm:mb-4">
              {isLoading ? (
                <ButtonLoader />
              ) : (
                <span className="text-xl sm:text-2xl font-extrabold text-[#1D2939]">
                  {formatMinutesToHours(
                    analytics?.averageCompletionTimeMinutes ?? 0,
                  )}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              <div className="text-left bg-[#1D29390F] border border-[#00000005] rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-[#667085]">
                  Total Courses
                </div>
                <div className="text-lg sm:text-2xl font-extrabold text-[#1D2939]">
                  {isLoading ? "—" : (analytics?.totalCourses ?? 0)}
                </div>
              </div>
              <div className="text-left bg-[#1D29390F] border border-[#00000005] rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-[#667085]">
                  Total Enrollments
                </div>
                <div className="text-lg sm:text-2xl font-extrabold text-[#1D2939]">
                  {isLoading ? "—" : (analytics?.totalEnrollments ?? 0)}
                </div>
              </div>
              <div className="text-left bg-[#1D29390F] border border-[#00000005] rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 min-w-0 col-span-2 sm:col-span-1">
                <div className="text-xs sm:text-sm font-medium text-[#667085]">
                  Total Authors
                </div>
                <div className="text-lg sm:text-2xl font-extrabold text-[#1D2939]">
                  {isLoading ? "—" : (analytics?.totalAuthors ?? 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Courses */}
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-[#EAECF0] min-h-[200px] min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <h3 className="text-[#667085] font-medium text-sm sm:text-base">
              Most Popular Courses
            </h3>
            <DropDown
              options={[...SORT_OPTIONS]}
              value={selectedSort}
              onChange={(e) =>
                setSelectedSort(e.target.value as typeof selectedSort)
              }
              className="w-full sm:w-auto sm:min-w-[140px]"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <ButtonLoader />
            </div>
          ) : (analytics?.popularCourses?.length ?? 0) > 0 ? (
            <div className="space-y-3">
              {analytics?.popularCourses?.map(
                (
                  course: {
                    _id: string;
                    title: string;
                    slug: string;
                    thumbnail?: string;
                    enrollments: number;
                    revenue: number;
                    averageRating: number;
                    totalReviews: number;
                  },
                  index: number,
                ) => (
                  <Link
                    key={index}
                    href={`/courses/${course.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors min-w-0"
                  >
                    <div className="w-12 h-10 sm:w-16 sm:h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {course.thumbnail ? (
                        <ImageComponent
                          src={course.thumbnail}
                          alt=""
                          width={64}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          —
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="font-medium text-gray-900 truncate text-sm sm:text-base">
                        {course.title}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-500">
                        <span>{course.enrollments} enrollments</span>
                        <span>₹{course.revenue?.toLocaleString() ?? 0}</span>
                        <span>
                          {course.averageRating?.toFixed(1) ?? 0}★ (
                          {course.totalReviews ?? 0})
                        </span>
                      </div>
                    </div>
                  </Link>
                ),
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-sm">
              No courses found. Create courses to see analytics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
