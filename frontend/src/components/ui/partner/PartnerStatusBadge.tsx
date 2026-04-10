"use client";

import { cn } from "@/lib/utils";

export default function PartnerStatusBadge({
  status,
}: {
  status: "Active" | "Closed" | string;
}) {
  const isActive = status.toLowerCase() === "active";
  return (
    <span
      className={cn(
        "text-sm font-medium",
        isActive ? "text-[#12B669]" : "text-[#EF4444]"
      )}
    >
      {status}
    </span>
  );
}
