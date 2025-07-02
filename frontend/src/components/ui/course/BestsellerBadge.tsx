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
        "best-seller-badge px-2 bg-[linear-gradient(-270deg,rgba(247,191,36,0.4)_0%,rgba(255,217,195,0.23)_100%)] flex gap-2 items-center select-none",
        className
      )}
    >
      <p className="text-[#F7AD24] text-sm font-bold">Best seller</p>
      <span className="text-[#f7ad2499] text-xs font-bold">
        (enrolled by {enrollStudents} students)
      </span>
    </div>
  );
};

export default BestsellerBadge;
