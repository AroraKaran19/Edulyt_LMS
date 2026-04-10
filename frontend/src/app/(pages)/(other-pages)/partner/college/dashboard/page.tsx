"use client";

import {
  BookOpen,
  Briefcase,
  GraduationCap,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import PartnerCard from "@/components/ui/partner/PartnerCard";
import PartnerFiltersButton from "@/components/ui/partner/PartnerFiltersButton";
import PartnerStatCard from "@/components/ui/partner/PartnerStatCard";
import PartnerStatusBadge from "@/components/ui/partner/PartnerStatusBadge";
import PartnerViewButton from "@/components/ui/partner/PartnerViewButton";
import { collegePartnerDashboardJson } from "../../dummyData";
import { useState } from "react";
import { cn } from "@/lib/utils";

const data = collegePartnerDashboardJson;

/** Static classes so Tailwind can scan arbitrary `bg-[#…]` and Edge Tools avoids inline styles. */
const DONUT_LEGEND_DOT_CLASS: Record<string, string> = {
  "#F77124": "bg-[#F77124]",
  "#F7C948": "bg-[#F7C948]",
  "#12B669": "bg-[#12B669]",
  "#111827": "bg-[#111827]",
  "#A16207": "bg-[#A16207]",
};

const statIcons = [
  <Users key="a" className="size-5" />,
  <BookOpen key="b" className="size-5" />,
  <Briefcase key="c" className="size-5" />,
  <GraduationCap key="d" className="size-5" />,
];

export default function CollegePartnerDashboardPage() {
  const [range, setRange] = useState<"weekly" | "monthly">("monthly");

  const pieData = data.topCoursesDonut.map((d) => ({
    name: d.name,
    value: d.percent,
    color: d.color,
  }));

  return (
    <div className="p-2 sm:p-4 py-6 space-y-4">
      <h1 className="text-lg sm:text-2xl font-semibold text-black">
        Welcome Back
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
        {data.stats.map((s, i) => (
          <PartnerStatCard
            key={s.key}
            icon={statIcons[i] ?? statIcons[0]}
            value={s.value}
            label={s.label}
            deltaText={s.delta}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PartnerCard className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="text-base sm:text-xl font-semibold text-black">
              Students Enrollment
            </h2>
            <div className="flex rounded-lg border border-[#EAECF0] p-0.5 bg-[#F9FAFB] text-xs font-semibold">
              <button
                type="button"
                className={cn(
                  "cursor-pointer rounded-md px-2 py-1",
                  range === "weekly"
                    ? "bg-white shadow-sm text-[#1D2939]"
                    : "text-[#667085]"
                )}
                onClick={() => setRange("weekly")}
              >
                Weekly
              </button>
              <button
                type="button"
                className={cn(
                  "cursor-pointer rounded-md px-2 py-1",
                  range === "monthly"
                    ? "bg-[#F77124] text-white"
                    : "text-[#667085]"
                )}
                onClick={() => setRange("monthly")}
              >
                Monthly
              </button>
            </div>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.enrollmentLineMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F7" />
                <XAxis dataKey="month" tick={{ fill: "#667085", fontSize: 12 }} />
                <YAxis tick={{ fill: "#667085", fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalStudents"
                  name="Total Students"
                  stroke="#111827"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="enrolledInCourses"
                  name="Students Enrolled in courses"
                  stroke="#F77124"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </PartnerCard>

        <PartnerCard className="p-4 sm:p-5">
          <h2 className="text-base sm:text-xl font-semibold text-black mb-3">
            Top Performing Courses
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-[220px] w-full sm:w-[200px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 w-full space-y-2">
              {data.topCoursesDonut.map((row) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2 text-[#475467]">
                    <span
                      className={cn(
                        "size-2.5 rounded-full",
                        DONUT_LEGEND_DOT_CLASS[row.color] ?? "bg-[#667085]"
                      )}
                    />
                    {row.name}
                  </span>
                  <span className="font-semibold text-[#1D2939]">
                    {row.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </PartnerCard>
      </div>

      <PartnerCard className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-xl font-semibold text-black">
            Courses &amp; Internships
          </h2>
          <PartnerFiltersButton onClick={() => {}} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left border-b border-[#F2F4F7]">
                <th className="pb-3 font-semibold text-black">Program Name</th>
                <th className="pb-3 font-semibold text-black">Type</th>
                <th className="pb-3 font-semibold text-black">No. of students</th>
                <th className="pb-3 font-semibold text-black">State</th>
                <th className="pb-3 font-semibold text-right text-black">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.coursesTable.map((row, idx) => (
                <tr
                  key={`${row.programName}-${idx}`}
                  className="border-b border-[#F2F4F7] last:border-0"
                >
                  <td className="py-3 font-medium text-[#1D2939]">
                    {row.programName}
                  </td>
                  <td className="py-3 text-[#475467]">{row.type}</td>
                  <td className="py-3 text-[#475467]">{row.students}</td>
                  <td className="py-3">
                    <PartnerStatusBadge status={row.state} />
                  </td>
                  <td className="py-3 text-right">
                    <PartnerViewButton />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PartnerCard>
    </div>
  );
}
