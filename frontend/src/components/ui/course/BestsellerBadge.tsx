import { cn } from "@/lib/utils";
import React from "react";

const BestsellerBadge = ({
  enrollStudents,
  className,
}: {
  enrollStudents: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "best-seller-badge px-2 py-1 bg-[linear-gradient(-270deg,rgba(247,191,36,0.4)_0%,rgba(255,217,195,0.23)_100%)] flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-2 items-start sm:items-center select-none rounded-md",
        className
      )}
    >
      <span className="text-[#F7AD24] text-xs sm:text-sm font-bold leading-tight">
        Best seller
      </span>
      <span className="text-[#f7ad2499] text-[10px] sm:text-xs font-bold leading-tight break-words max-w-full">
        (enrolled by{" "}
        <span className="inline-block">
          {enrollStudents}
        </span>{" "}
        students)
      </span>
    </div>
  );
};

export default BestsellerBadge;
