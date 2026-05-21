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
  "#16A34A",
  "#DC2626",
  "#2563EB",
  "#A855F7",
];

const AUDIENCE_LABEL: Record<
  PartnerCourseCategorySlice["audience"],
  string
> = {
  "college-students": "College Students",
  professionals: "Professionals",
};

type ChartRow = Record<string, string | number>;

interface TooltipPayload {
  payload?: {
    categoryName?: string;
    enrollments?: number;
    completions?: number;
  };
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-lg border border-[#EAECF0] bg-white p-2 text-xs shadow-md">
      <p className="font-semibold text-[#101828]">{row.categoryName}</p>
      <p className="mt-0.5 text-[#475467]">
        Enrolled: <span className="font-semibold">{row.enrollments ?? 0}</span>
      </p>
      <p className="text-[#475467]">
        Completed:{" "}
        <span className="font-semibold">{row.completions ?? 0}</span>
      </p>
    </div>
  );
}

function AudiencePie({
  title,
  slices,
}: {
  title: string;
  slices: PartnerCourseCategorySlice[];
}) {
  const total = slices.reduce((sum, d) => sum + d.enrollments, 0);
  const chartData: ChartRow[] = slices.map((d) => ({
    categoryId: d.categoryId,
    categoryName: d.categoryName,
    enrollments: d.enrollments,
    completions: d.completions,
  }));

  return (
    <div className="flex flex-col">
      <p className="text-sm font-semibold text-[#1D2939]">{title}</p>
      <div className="mt-2 h-[240px] w-full">
        {total === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-[#667085]">
            No course enrollments yet
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
                outerRadius={86}
                innerRadius={44}
                paddingAngle={2}
              >
                {slices.map((slice, i) => (
                  <Cell
                    key={slice.categoryId}
                    fill={SLICE_COLORS[i % SLICE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      {slices.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
          {slices.map((slice, i) => (
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
              {slice.categoryName} ({slice.enrollments}/{slice.completions})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PartnerCategoryPie({
  data,
}: {
  data: PartnerCourseCategorySlice[];
}) {
  const collegeStudents = data.filter((d) => d.audience === "college-students");
  const professionals = data.filter((d) => d.audience === "professionals");

  return (
    <PartnerCard className="p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-[#1D2939] sm:text-base">
        Enrollments by category
      </h3>
      <p className="mt-1 text-xs text-[#667085] sm:text-sm">
        Share of your students&apos; course enrollments per category. Hover a
        slice to see enrollments and completions. Legend shows{" "}
        <span className="font-medium">enrolled / completed</span>.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AudiencePie
          title={AUDIENCE_LABEL["college-students"]}
          slices={collegeStudents}
        />
        <AudiencePie
          title={AUDIENCE_LABEL.professionals}
          slices={professionals}
        />
      </div>
    </PartnerCard>
  );
}
