"use client";
import { Clock3 } from "lucide-react";
import useDashboardStats from "@/hooks/useDashboardStats";
import Loader from "@/components/ui/Loader";

const AvgTimeSection = () => {
  const { stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex w-full h-max gap-2 sm:gap-3 md:gap-4 border border-gray-200 rounded-lg p-3 sm:p-4 md:p-5 justify-center items-center">
        <Loader size="sm" variant="spinner" />
      </div>
    );
  }

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div className="flex w-full h-max gap-2 sm:gap-3 md:gap-4 border border-gray-200 rounded-lg p-3 sm:p-4 md:p-5 justify-center items-center">
      <div className="icon-container h-max p-2 sm:p-2.5 bg-[#FFEFE6] rounded-lg shrink-0 flex items-center justify-center">
        <Clock3 className="size-4 sm:size-5 md:size-6 stroke-white fill-orange-500" />
      </div>
      <div className="flex flex-col">
        <h2 className="text-xs sm:text-sm md:text-base font-medium">
          Average Time Spent
        </h2>
        <p className="text-xl sm:text-2xl md:text-3xl text-text-primary font-bold">
          {formatTime(stats.averageTimePerSession)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Total: {formatTime(stats.totalTimeSpent)}
        </p>
      </div>
    </div>
  );
};

export default AvgTimeSection;
