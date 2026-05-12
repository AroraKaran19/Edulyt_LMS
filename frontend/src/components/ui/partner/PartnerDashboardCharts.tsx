"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  Legend,
} from "recharts";
import PartnerCard from "@/components/ui/partner/PartnerCard";
import type { PartnerMonthlyTrendPoint } from "@/hooks/usePartner";

const MONTH_LABELS = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function formatAxisLabel(month: number, year: number, showYearSuffix: boolean) {
  const m = MONTH_LABELS[month] ?? String(month);
  return showYearSuffix ? `${m} '${String(year).slice(-2)}` : m;
}

function toChartRows(points: PartnerMonthlyTrendPoint[]) {
  const ys = new Set(points.map((p) => p.year));
  const showYear = ys.size > 1;
  return points.map((p) => ({
    label: formatAxisLabel(p.month, p.year, showYear),
    newStudents: p.newStudents,
    courseEnrollments: p.courseEnrollments,
    internshipEnrollments: p.internshipEnrollments,
  }));
}

function TooltipPanel({
  active,
  payload,
  label,
  singleMetricName,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; dataKey?: string; name?: string }>;
  label?: string | number;
  singleMetricName?: string;
}) {
  if (!active || !payload?.length) return null;

  const labelText = label !== undefined ? String(label) : "";

  const rows =
    typeof singleMetricName === "string"
      ? [{ name: singleMetricName, value: payload[0]?.value ?? 0 }]
      : payload.map((p) => ({
          name: String(p.name ?? p.dataKey ?? ""),
          value: p.value ?? 0,
        }));

  return (
    <div className="rounded-lg border border-[#EAECF0] bg-[#1D2939] px-3 py-2.5 shadow-lg">
      <p className="text-xs font-semibold text-white/90">{labelText}</p>
      {rows.map((r) => (
        <p key={r.name} className="mt-1 text-xs text-white">
          {r.name}: <span className="font-semibold">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

export function PartnerNewStudentsTrendChart({
  monthlyTrend,
}: {
  monthlyTrend: PartnerMonthlyTrendPoint[];
}) {
  const chartData = toChartRows(monthlyTrend).map(({ label, newStudents }) => ({
    label,
    value: newStudents,
  }));

  return (
    <PartnerCard className="p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-[#1D2939] sm:text-base">
        New student signups by month
      </h3>
      <p className="mt-1 text-xs text-[#667085] sm:text-sm">
        Students joining with your college on their profile
      </p>
      <div className="mt-4 h-[220px] w-full sm:h-[260px]">
        {chartData.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-[#667085]">
            No data in this window
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="partnerSignupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F77124" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#F77124" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#EEF0F6"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#667085" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#667085" }}
                width={36}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                domain={[0, "auto"]}
              />
              <Tooltip
                cursor={{
                  stroke: "#F77124",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
                content={({ active, payload, label }) => (
                  <TooltipPanel
                    active={active}
                    label={label}
                    payload={payload}
                    singleMetricName="New students"
                  />
                )}
              />
              <Area
                type="monotone"
                dataKey="value"
                name="New students"
                stroke="#F77124"
                fill="url(#partnerSignupGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </PartnerCard>
  );
}

export function PartnerEnrollmentActivityChart({
  monthlyTrend,
}: {
  monthlyTrend: PartnerMonthlyTrendPoint[];
}) {
  const chartData = toChartRows(monthlyTrend).map(
    ({ label, courseEnrollments, internshipEnrollments }) => ({
      label,
      Courses: courseEnrollments,
      Internships: internshipEnrollments,
    }),
  );

  return (
    <PartnerCard className="p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-[#1D2939] sm:text-base">
        Enrollment activity by month
      </h3>
      <p className="mt-1 text-xs text-[#667085] sm:text-sm">
        Course and internship enrollment starts by your learners
      </p>
      <div className="mt-4 h-[220px] w-full sm:h-[260px]">
        {chartData.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-[#667085]">
            No data in this window
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#EEF0F6"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#667085" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#667085" }}
                width={36}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                domain={[0, "auto"]}
              />
              <Tooltip
                cursor={{ fill: "rgba(247,113,36,0.06)" }}
                content={({ active, payload, label }) => (
                  <TooltipPanel active={active} label={label} payload={payload} />
                )}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) => (
                  <span className="text-xs text-[#475467]">{value}</span>
                )}
              />
              <Bar dataKey="Courses" fill="#F77124" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Internships" fill="#475467" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </PartnerCard>
  );
}
