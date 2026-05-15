"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import PartnerCard from "@/components/ui/partner/PartnerCard";
import type { PartnerCourseCategorySlice } from "@/hooks/usePartner";

const SLICE_COLORS = [
  "#F77124",
  "#475467",
  "#12B76A",
  "#7A5AF8",
  "#F59E0B",
  "#0BA5EC",
  "#EE46BC",
  "#98A2B3",
];

export default function PartnerCategoryPie({
  data,
}: {
  data: PartnerCourseCategorySlice[];
}) {
  const total = data.reduce((sum, d) => sum + d.enrollments, 0);
  // recharts' `Pie` data prop expects rows with a string index signature.
  const chartData: Record<string, string | number>[] = data.map((d) => ({
    categoryId: d.categoryId,
    categoryName: d.categoryName,
    enrollments: d.enrollments,
  }));

  return (
    <PartnerCard className="p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-[#1D2939] sm:text-base">
        Enrolments by category
      </h3>
      <p className="mt-1 text-xs text-[#667085] sm:text-sm">
        Share of your students&apos; course enrolments per category
      </p>
      <div className="mt-4 h-[260px] w-full">
        {total === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-[#667085]">
            No course enrolments yet
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="enrollments"
                nameKey="categoryName"
                cx="50%"
                cy="50%"
                outerRadius={92}
                innerRadius={48}
                paddingAngle={2}
              >
                {data.map((slice, i) => (
                  <Cell
                    key={slice.categoryId}
                    fill={SLICE_COLORS[i % SLICE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} enrolments`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      {total > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {data.map((slice, i) => (
            <li
              key={slice.categoryId}
              className="flex items-center gap-1.5 text-xs text-[#475467]"
            >
              <span
                className="inline-block size-2.5 rounded-full"
                style={{
                  backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length],
                }}
              />
              {slice.categoryName} ({slice.enrollments})
            </li>
          ))}
        </ul>
      )}
    </PartnerCard>
  );
}
