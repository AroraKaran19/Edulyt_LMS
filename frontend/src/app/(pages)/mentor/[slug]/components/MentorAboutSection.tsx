"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type MentorStat = {
  value: string;
  label: string;
};

export type MentorAboutSectionProps = {
  title?: string;
  stats: MentorStat[];
  description: string;
  className?: string;
};

const GRID_COLS: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

const MentorAboutSection = ({
  title = "About The Mentor",
  stats,
  description,
  className,
}: MentorAboutSectionProps) => {
  const gridColsClass = GRID_COLS[stats.length] ?? "sm:grid-cols-3";

  return (
    <section
      className={cn(
        "bg-white rounded-2xl p-4 sm:p-6",
        className
      )}
    >
      <p className="text-xl sm:text-2xl font-bold text-text-primary">
        {title}
      </p>

      <div className={cn("mt-4 grid grid-cols-1 gap-3", gridColsClass)}>
        {stats.map((s, idx) => (
          <div
            key={`${s.label}-${idx}`}
            className="rounded-xl border border-black/10 bg-white px-4 py-3 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.12)] text-center"
          >
            <p className="text-xl sm:text-2xl font-extrabold text-text-primary">
              {s.value}
            </p>
            <p className="text-xs sm:text-sm text-text-primary/90">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm sm:text-base text-text-primary/80 leading-relaxed">
        {description}
      </p>
    </section>
  );
};

export default MentorAboutSection;
