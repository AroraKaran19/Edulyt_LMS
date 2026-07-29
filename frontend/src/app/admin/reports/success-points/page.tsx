"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import PlatformPointsReport from "./components/PlatformPointsReport";
import InternshipPointsReport from "./components/InternshipPointsReport";

type Part = "platform" | "internship";

const TABS: { key: Part; label: string; blurb: string }[] = [
  {
    key: "platform",
    label: "Platform",
    blurb: "Student wallet points — earned and spent",
  },
  {
    key: "internship",
    label: "Internship",
    blurb: "Certification score points — earned",
  },
];

/**
 * Success points report, split into the two systems that exist in the product:
 * the platform wallet (`Student.successPoints`) and internship certification
 * points (`InternshipEnrollment.internshipSuccessPoints`). They have different
 * ledgers and different semantics, so they never share a table.
 */
export default function SuccessPointsReportPage() {
  const [part, setPart] = useState<Part>("platform");

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="text-lg font-bold text-black sm:text-2xl">
          Success Points Report
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Points earned and spent per user. Totals cover every row matching the
          filters, not just the page on screen.
        </p>
      </div>

      {/* Two parts: platform wallet vs internship certification points. */}
      <div
        role="tablist"
        aria-label="Success points report parts"
        className="flex flex-wrap gap-2 border-b border-gray-200"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            type="button"
            aria-selected={part === tab.key}
            onClick={() => setPart(tab.key)}
            className={cn(
              "-mb-px rounded-t-lg border-b-2 px-4 py-2.5 text-left transition",
              part === tab.key
                ? "border-[#F77124] text-[#F77124]"
                : "border-transparent text-gray-500 hover:text-[#1D2939]",
            )}
          >
            <span className="block text-sm font-semibold">{tab.label}</span>
            <span className="block text-[11px] text-gray-400">{tab.blurb}</span>
          </button>
        ))}
      </div>

      {/* Unmounted rather than hidden, so switching parts does not keep two
          aggregations alive or refetch the inactive one on every filter edit. */}
      {part === "platform" ? (
        <PlatformPointsReport />
      ) : (
        <InternshipPointsReport />
      )}
    </div>
  );
}
