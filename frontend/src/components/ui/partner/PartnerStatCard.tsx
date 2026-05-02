"use client";

import React from "react";
import { cn } from "@/lib/utils";

function splitDeltaText(text: string): { highlight: string; rest: string } | null {
  const trimmed = text.trim();
  const m = trimmed.match(/^([+-][\d,.]+%?)\s+(.*)$/);
  if (!m) return null;
  return { highlight: m[1], rest: m[2]?.trim() ?? "" };
}

export default function PartnerStatCard({
  icon,
  value,
  label,
  deltaText,
  className,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  deltaText?: string;
  className?: string;
}) {
  const deltaParts = deltaText ? splitDeltaText(deltaText) : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center sm:items-start rounded-3xl border border-[#EAECF0] bg-white px-2 py-3 sm:px-5 sm:py-5",
        "shadow-[0_1px_3px_rgba(16,24,40,0.08)]",
        className
      )}
    >
      <div className="flex w-full min-w-0 items-center gap-2.5 rounded-full bg-[#FFF3EC]">
        <div
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full bg-[#F77124]",
            "text-white [&_svg]:size-[18px]"
          )}
        >
          {icon}
        </div>
        <span className="min-w-0 truncate text-lg sm:text-xl font-bold tabular-nums leading-none tracking-tight text-[#1D2939]">
          {value}
        </span>
      </div>

      <p className="mt-3 text-sm sm:text-[15px] font-semibold leading-snug text-black">{label}</p>

      {deltaText ? (
        <p className="mt-1.5 text-sm font-medium leading-snug">
          {deltaParts ? (
            <>
              <span className="text-[#039855]">{deltaParts.highlight}</span>
              {deltaParts.rest ? (
                <>
                  {" "}
                  <span className="text-[#1D2939]">{deltaParts.rest}</span>
                </>
              ) : null}
            </>
          ) : (
            <span className="text-[#039855]">{deltaText}</span>
          )}
        </p>
      ) : null}
    </div>
  );
}
