"use client";

import { cn } from "@/lib/utils";

export interface StatItem {
  value: string;
  label: string;
}

interface LearnerStatisticsGridProps {
  stats: StatItem[];
  className?: string;
}

export default function LearnerStatisticsGrid({
  stats,
  className,
}: LearnerStatisticsGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6",
        className
      )}
    >
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl sm:rounded-2xl flex flex-col items-center justify-center p-4 sm:p-4 border-2 border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-1 sm:mb-2">
            {stat.value}
          </div>
          <div className="text-xs sm:text-sm lg:text-base text-gray-700 text-center">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
