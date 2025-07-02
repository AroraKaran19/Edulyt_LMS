import React from "react";
import { cn } from "@/lib/utils";

const DiscountBadge = ({
  discount,
  className,
}: {
  discount: number;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "bg-[#F7AD24] rounded-xl px-2 py-1 text-white text-xs font-bold",
        className
      )}
    >
      {discount}% off
    </div>
  );
};

export default DiscountBadge;
