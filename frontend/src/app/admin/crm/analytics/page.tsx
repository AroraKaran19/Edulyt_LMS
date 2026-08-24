"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import DateRangeFilter, {
  type DateRange,
} from "@/components/admin/DateRangeFilter";

/*
 * Palette validated with the dataviz palette checker against a white surface.
 *
 *   categorical (2 series)  #2a78d6, #eb6834
 *     worst adjacent CVD dE 24.7, normal-vision dE 33.6, both >= 3:1
 *   ordinal funnel ramp     #86b6ef -> #3987e5 -> #256abf -> #184f95
 *     monotone lightness, single hue, light end 2.11:1
 *
 * Do not substitute hexes by eye; re-run the checker.
 */
const SERIES_LEADS = "#2a78d6";
const SERIES_CONVERSIONS = "#eb6834";
const FUNNEL_RAMP = ["#86b6ef", "#3987e5", "#256abf", "#184f95"];
const BAR_HUE = "#2a78d6";
const INK_MUTED = "#6b7280";
const GRID = "#e5e7eb";

interface NamedCount {
  label: string;
  count: number;
}

interface LeaderRow {
  userId: string;
  name: string;
  role?: string;
  count: number;
}

interface Analytics {
  totals: {
    leads: number;
    converted: number;
    unassigned: number;
    conversionRate: number;
  };
  funnel: NamedCount[];
  lost: number;
  series: { day: string; leads: number; conversions: number }[];
  states: NamedCount[];
  colleges: NamedCount[];
  leaderboards: { generated: LeaderRow[]; converted: LeaderRow[] };
}

const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

const StatTile = ({
  label,
  value,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  suffix?: string;
  hint?: string;
}) => (
  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
    <div className="text-2xl font-bold tracking-tight text-gray-900">
      {value.toLocaleString("en-IN")}
      {suffix ? (
        <span className="ml-0.5 text-base font-semibold text-gray-500">
          {suffix}
        </span>
      ) : null}
    </div>
    <div className="mt-0.5 text-xs font-medium text-gray-600">{label}</div>
    {hint ? <div className="mt-0.5 text-[11px] text-gray-400">{hint}</div> : null}
  </div>
);

/** Horizontal bars in plain HTML: exact numbers stay readable beside the bar. */
const BarList = ({
  rows,
  colors,
  empty,
}: {
  rows: NamedCount[];
  colors?: string[];
  empty: string;
}) => {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (rows.length === 0) {
    return <p className="px-4 py-8 text-center text-xs text-gray-500">{empty}</p>;
  }
  return (
    <ul className="space-y-2.5 px-4 py-4">
      {rows.map((row, i) => (
        <li key={row.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="truncate text-xs font-medium text-gray-700">
              {row.label}
            </span>
            <span className="shrink-0 text-xs font-semibold text-gray-900">
              {row.count.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-[4px] bg-gray-100">
            <div
              className="h-full rounded-[4px]"
              style={{
                width: `${Math.max(2, (row.count / max) * 100)}%`,
                backgroundColor: colors?.[i] ?? BAR_HUE,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};

const Panel = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
    <div className="border-b border-gray-100 px-4 py-3">
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      {subtitle ? (
        <p className="mt-0.5 text-[11px] text-gray-500">{subtitle}</p>
      ) : null}
    </div>
    {children}
  </section>
);

const LeaderTable = ({
  rows,
  metric,
  empty,
}: {
  rows: LeaderRow[];
  metric: string;
  empty: string;
}) => {
  if (rows.length === 0) {
    return <p className="px-4 py-8 text-center text-xs text-gray-500">{empty}</p>;
  }
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <table className="w-full text-xs">
      <thead className="bg-gray-50 text-left text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
        <tr>
          <th className="w-8 px-4 py-2">#</th>
          <th className="px-2 py-2">Name</th>
          <th className="px-2 py-2 text-right">{metric}</th>
          <th className="w-24 px-4 py-2" />
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((row, i) => (
          <tr key={row.userId}>
            <td className="px-4 py-2 tabular-nums text-gray-400">{i + 1}</td>
            <td className="px-2 py-2">
              <span className="font-medium text-gray-900">{row.name}</span>
              {row.role ? (
                <span className="ml-1.5 text-[10px] text-gray-400">
                  {row.role}
                </span>
              ) : null}
            </td>
            <td className="px-2 py-2 text-right font-semibold tabular-nums text-gray-900">
              {row.count.toLocaleString("en-IN")}
            </td>
            <td className="px-4 py-2">
              <div className="h-1.5 w-full overflow-hidden rounded-[4px] bg-gray-100">
                <div
                  className="h-full rounded-[4px]"
                  style={{
                    width: `${Math.max(3, (row.count / max) * 100)}%`,
                    backgroundColor: BAR_HUE,
                  }}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default function CrmAnalyticsPage() {
  const [range, setRange] = useState<DateRange>({});
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get("/crm/analytics", {
          params: { from: range.from, to: range.to },
        });
        if (cancelled) return;
        setData(res.data?.data ?? null);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const totals = data?.totals;
  const series = data?.series ?? [];

  return (
    <div className="w-full space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">CRM analytics</h1>
          <p className="text-xs text-gray-600">
            Lead volume, pipeline and who is generating and closing them.
          </p>
        </div>
        <DateRangeFilter onChange={setRange} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-gray-400" />
        </div>
      ) : !data ? (
        <p className="py-20 text-center text-sm text-gray-500">
          Analytics could not be loaded.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Leads captured" value={totals?.leads ?? 0} />
            <StatTile label="Converted" value={totals?.converted ?? 0} />
            <StatTile
              label="Conversion rate"
              value={totals?.conversionRate ?? 0}
              suffix="%"
            />
            <StatTile
              label="Unassigned"
              value={totals?.unassigned ?? 0}
              hint="Waiting for an owner"
            />
          </div>

          <Panel
            title="Leads and conversions"
            subtitle="Counted by the day each happened, in IST"
          >
            {series.length === 0 ? (
              <p className="px-4 py-12 text-center text-xs text-gray-500">
                No activity in this period.
              </p>
            ) : (
              <div className="px-2 py-4">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={series}
                    margin={{ top: 8, right: 16, bottom: 4, left: -12 }}
                  >
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis
                      dataKey="day"
                      tickFormatter={dayLabel}
                      tick={{ fontSize: 11, fill: INK_MUTED }}
                      axisLine={{ stroke: GRID }}
                      tickLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: INK_MUTED }}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                    />
                    <Tooltip
                      labelFormatter={(v) => dayLabel(String(v))}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 10,
                        border: `1px solid ${GRID}`,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="leads"
                      name="Leads"
                      stroke={SERIES_LEADS}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="conversions"
                      name="Conversions"
                      stroke={SERIES_CONVERSIONS}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                {/* Legend in markup rather than recharts', so identity is never
                    carried by colour alone at small sizes. */}
                <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-gray-600">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: SERIES_LEADS }}
                    />
                    Leads
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: SERIES_CONVERSIONS }}
                    />
                    Conversions
                  </span>
                </div>
              </div>
            )}
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title="Pipeline"
              subtitle={`Where leads stand now · ${data.lost.toLocaleString("en-IN")} lost`}
            >
              <BarList
                rows={data.funnel}
                colors={FUNNEL_RAMP}
                empty="Nothing in the pipeline yet."
              />
            </Panel>

            <Panel title="Top states" subtitle="By leads captured">
              <BarList rows={data.states} empty="No states recorded yet." />
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Top generators" subtitle="Marketers, sales and ambassadors">
              <LeaderTable
                rows={data.leaderboards.generated}
                metric="Leads"
                empty="No attributed leads yet."
              />
            </Panel>

            <Panel title="Top closers" subtitle="By conversions in this period">
              <LeaderTable
                rows={data.leaderboards.converted}
                metric="Converted"
                empty="No conversions yet."
              />
            </Panel>
          </div>

          <Panel title="Top colleges" subtitle="By leads captured">
            <BarList rows={data.colleges} empty="No colleges recorded yet." />
          </Panel>
        </>
      )}
    </div>
  );
}
