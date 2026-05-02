"use client";

import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PartnerFiltersButton({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2",
        "h-9 px-4 rounded-full",
        "border border-[#F77124] text-[#F77124] bg-white",
        "cursor-pointer hover:bg-[#FFF3EC] transition-colors",
        className
      )}
    >
      <span className="text-sm font-semibold">Filters</span>
      <SlidersHorizontal className="size-4" />
    </button>
  );
}
