"use client";

import { cn } from "@/lib/utils";

export default function PartnerViewButton({
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
        "inline-flex items-center justify-center",
        "h-8 px-5 rounded-full",
        "border border-[#F77124] text-[#F77124] bg-white",
        "cursor-pointer hover:bg-[#FFF3EC] transition-colors",
        "text-xs font-semibold",
        className
      )}
    >
      View
    </button>
  );
}
