"use client";
import { useState, useMemo } from "react";
import ImageComponent from "@/components/ui/ImageComponent";
import DropDown from "@/components/ui/dropdown/DropDown";
import AllUsersGraph from "./AllUsersGraph";
import NewSignpUsers from "./NewSignupusersGraph";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import CalenderBtn from "./CalenderBtn";
import { ButtonLoader } from "@/components/ui/Loader";
import { toast } from "react-toastify";

const AdminDashboard = () => {
  const filters = [
    {
      label: "Last 12 Months",
      value: 12,
    },
    {
      label: "Last 6 Months",
      value: 6,
    },
    {
      label: "Last 3 Months",
      value: 3,
    },
    {
      label: "Last Month",
      value: 1,
    },
  ];
  const [duration, setDuration] = useState(filters[0].value);

  const {
    data: dashboardStatsData,
    isLoading,
    error,
  } = useSWR(`/admin/dashboard-stats?duration=${duration}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: true,
    revalidateOnMount: true,
    dedupingInterval: 0, // Always fetch when duration changes
  });

  if (error) {
    toast.error(error.message);
  }

  // Memoized calculations to prevent unnecessary re-computations
  const dashboardStats = useMemo(() => {
    const data = dashboardStatsData?.data?.data;
    if (!data) return null;

    const usersByType = data.usersByType;
    const totalUsers = data.totalUsers; // Backend excludes admin/super-admin

    const instructorCount = usersByType?.instructor || 0;
    const studentCount = usersByType?.student || 0;
    const collaboratorCount = usersByType?.collaborator || 0;
    const totalForDistribution = instructorCount + studentCount + collaboratorCount;

    const instructorPercentage = totalForDistribution > 0
      ? Math.round((instructorCount / totalForDistribution) * 100)
      : 0;

    const studentPercentage = totalForDistribution > 0
      ? Math.round((studentCount / totalForDistribution) * 100)
      : 0;

    return {
      activeUsers: data.activeUsers,
      inactiveUsers: data.inactiveUsers,
      blockedUsers: data.blockedUsers,
      usersByType,
      totalUsers,
      instructorPercentage,
      studentPercentage,
      growthRate: data.timePeriod?.growthRate,
      chartData: data.chartData || [],
      timePeriod: data.timePeriod,
    };
  }, [dashboardStatsData?.data?.data]);

  const {
    totalUsers = 0,
    activeUsers = 0,
    inactiveUsers = 0,
    chartData = [],
    instructorPercentage = 0,
    studentPercentage = 0,
    growthRate = 0,
    timePeriod,
  } = dashboardStats || {};

  return (
    <div className="p-2 sm:px-4 sm:pb-2 flex flex-col gap-4 min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full bg-white pr-2 sm:pr-6 gap-2 sm:gap-0">
        {/* Title */}
        <h1 className="text-[#1D2939] font-bold text-xl sm:text-2xl font-coolvetica">
          User Analytics
        </h1>

        {/* User Profile Section */}
        <div className="flex items-center gap-4 sm:gap-8">
          <span className="text-[#475467] font-medium font-coolvetica text-xs sm:text-sm">
            Dashboard
          </span>
        </div>
      </div>

      {/* analytics banner */}
      <div className="space-y-4 sm:space-y-6 sm:pr-6">
        {/* Top Row - Two Cards with responsive split */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 sm:gap-6">
          <div className="lg:col-span-5 bg-white rounded-xl p-3 shadow-sm border border-[#EAECF0]">
            <div className="flex flex-row lg:items-center justify-between gap-3 lg:gap-0">
              <div className="">
                <h3 className="text-[#475467] font-medium text-sm sm:text-base">
                  Total Users
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-2">
                  {isLoading ? (
                    <ButtonLoader />
                  ) : (
                    <span className="text-xl sm:text-3xl font-extrabold text-[#1D2939]">
                      {totalUsers}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <div className="bg-[#F6FEF9] rounded-md p-[6px] flex items-center gap-1">
                      {growthRate > 0 ? (
                        <span className="text-[#12B669] flex items-center gap-1">
                          {growthRate}%
                          <TrendingUp className="size-3" />
                        </span>
                      ) : (
                        <span className="text-[#EF4444] flex items-center gap-1">
                          {growthRate}%
                          <TrendingDown className="size-3" />
                        </span>
                      )}
                    </div>
                    <span className="text-[#475467]">
                      {
                        filters.find((filter) => filter.value === duration)
                          ?.label
                      }
                    </span>
                  </div>
                </div>
              </div>

              <CalenderBtn
                filters={filters}
                activeFilter={duration}
                setFilter={setDuration}
              />
            </div>
          </div>
          <div className="lg:col-span-5 bg-white rounded-xl p-3 shadow-sm border border-[#EAECF0]">
            <div className="flex gap-2 text-left bg-[#1D29390F] border border-[#00000005] rounded-lg px-2 py-1">
              {isLoading ? (
                <>
                  {/* Instructor skeleton */}
                  <div className="bg-gray-300 animate-pulse px-2 py-1 rounded-lg justify-center items-center text-center flex flex-col gap-1 w-1/2">
                    <div className="h-4 bg-gray-400 rounded w-8"></div>
                    <div className="h-3 bg-gray-400 rounded w-16"></div>
                  </div>
                  {/* Student skeleton */}
                  <div className="bg-gray-300 animate-pulse px-2 py-1 rounded-lg justify-center items-center text-center flex flex-col gap-1 w-1/2">
                    <div className="h-4 bg-gray-400 rounded w-8"></div>
                    <div className="h-3 bg-gray-400 rounded w-12"></div>
                  </div>
                </>
              ) : (
                <>
                  {instructorPercentage > 0 && (
                    <div
                      className="bg-[#4323F7] px-2 py-1 rounded-lg justify-center items-center text-center flex flex-col gap-1"
                      style={{ width: `${instructorPercentage}%` }}
                    >
                      <div className="text-sm sm:text-base font-extrabold text-white">
                        {instructorPercentage}%
                      </div>
                      <div className="text-xs font-medium text-[#FFFFFFCC]">
                        Instructors
                      </div>
                    </div>
                  )}
                  {studentPercentage > 0 && (
                    <div
                      className="bg-[#F5742C] px-2 py-1 rounded-lg justify-center items-center text-center flex flex-col gap-1"
                      style={{ width: `${studentPercentage}%` }}
                    >
                      <div className="text-sm sm:text-base font-extrabold text-white">
                        {studentPercentage}%
                      </div>
                      <div className="text-xs font-medium text-[#FFFFFFCC]">
                        Students
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* graphs */}
      <div className="space-y-4 sm:space-y-6 sm:pr-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 sm:gap-6">
          {/* users graph */}
          <div className="lg:col-span-5 bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-[#EAECF0]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-0">
              <div className="">
                <h3 className="text-[#475467] font-medium text-sm sm:text-base">
                  Active Users
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-2">
                  <span className="text-xl sm:text-3xl font-extrabold text-[#1D2939]">
                    {activeUsers}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <AllUsersGraph
                totalUsers={totalUsers}
                activeUsers={activeUsers}
                inactiveUsers={inactiveUsers}
                chartData={chartData}
              />
            </div>
          </div>

          {/* new signups graph */}
          <div className="lg:col-span-5 bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-[#EAECF0]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-0">
              <div className="">
                <h3 className="text-[#475467] font-medium text-sm sm:text-base">
                  New Signups
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-2">
                  <span className="text-xl sm:text-3xl font-extrabold text-[#1D2939]">
                    {timePeriod?.newUsers}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <div className="bg-[#F6FEF9] rounded-md p-[6px] flex items-center gap-1">
                      {timePeriod?.growthRate > 0 ? (
                        <span className="text-[#12B669] flex items-center gap-1">
                          {timePeriod?.growthRate}%
                          <TrendingUp className="size-3" />
                        </span>
                      ) : (
                        <span className="text-[#EF4444] flex items-center gap-1">
                          {timePeriod?.growthRate}%
                          <TrendingDown className="size-3" />
                        </span>
                      )}
                    </div>
                    <span className="text-[#475467]">
                      {
                        filters.find((filter) => filter.value === duration)
                          ?.label
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <NewSignpUsers
                monthlyBreakdown={timePeriod?.monthlyBreakdown || []}
                duration={duration}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
