import { cn } from "@/lib/utils";
import React from "react";

const BestsellerBadge = ({
  enrollStudents,
  className,
  text1ClassName,
  text2ClassName,
}: {
  enrollStudents: number;
  className?: string;
  text1ClassName?: string;
  text2ClassName?: string;
}) => {

  const formattedEnrollStudents = enrollStudents >= 1000000 
    ? `${(enrollStudents / 1000000).toFixed(1).replace(/\.0$/, '')}M`
    : enrollStudents >= 1000 
    ? `${(enrollStudents / 1000).toFixed(1).replace(/\.0$/, '')}K`
    : enrollStudents.toString();

  return (
    <div
      className={cn(
        "best-seller-badge px-2 py-1 bg-[linear-gradient(-270deg,rgba(247,191,36,0.4)_0%,rgba(255,217,195,0.23)_100%)] flex flex-col md:flex-row md:flex-wrap gap-1 md:gap-2 items-start md:items-center select-none",
        className
      )}
    >
      <span
        className={cn(
          "text-[#F7AD24] text-xs sm:text-sm font-bold leading-tight",
          text1ClassName
        )}
      >
        Best seller
      </span>
      <span
        className={cn(
          "text-[#f7ad2499] text-[10px] leading-none sm:text-xs font-bold break-words max-w-full",
          text2ClassName
        )}
      >
        (enrolled by <span className="inline-block">{formattedEnrollStudents}</span> students)
      </span>
    </div>
  );
};

export default BestsellerBadge;
