"use client";

import React from "react";
import { cn } from "@/lib/utils";

export default function PartnerCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-[#F2F4F7] shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
