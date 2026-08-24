"use client";

import { useState } from "react";
import Input from "@/components/ui/inputs/Input";

export interface DateRange {
  from?: string;
  to?: string;
}

export type RangePreset =
  | "today"
  | "last7"
  | "prevMonth"
  | "all"
  | "custom";

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "last7", label: "Last 7 days" },
  { value: "prevMonth", label: "Previous month" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom" },
];

/*
 * Bounds are stamped with an explicit IST offset rather than a bare local
 * datetime. The server parses whatever arrives with `new Date`, so an offsetless
 * string would be read in the server's timezone while the aggregations bucket
 * days in IST, putting every boundary hours out.
 */
const IST = "+05:30";
const startOf = (day: string) => `${day}T00:00:00.000${IST}`;
const endOf = (day: string) => `${day}T23:59:59.999${IST}`;

/** Today as an IST calendar date, not the browser's. `en-CA` gives YYYY-MM-DD. */
const istToday = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

const shiftDays = (day: string, delta: number) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
};

const rangeFor = (preset: RangePreset, from: string, to: string): DateRange => {
  const today = istToday();
  switch (preset) {
    case "today":
      return { from: startOf(today), to: endOf(today) };
    case "last7":
      // Inclusive of today, so six days back is a seven day window.
      return { from: startOf(shiftDays(today, -6)), to: endOf(today) };
    case "prevMonth": {
      const [y, m] = today.split("-").map(Number);
      const prevMonth = m === 1 ? 12 : m - 1;
      const prevYear = m === 1 ? y - 1 : y;
      const pad = (n: number) => String(n).padStart(2, "0");
      const first = `${prevYear}-${pad(prevMonth)}-01`;
      // Day 0 of the following month is the last day of this one.
      const last = new Date(Date.UTC(prevYear, prevMonth, 0))
        .toISOString()
        .slice(0, 10);
      return { from: startOf(first), to: endOf(last) };
    }
    case "custom":
      if (!from && !to) return {};
      return {
        ...(from ? { from: startOf(from) } : {}),
        // A single day picked as both ends means that whole day.
        ...(to ? { to: endOf(to) } : {}),
      };
    case "all":
    default:
      return {};
  }
};

export default function DateRangeFilter({
  onChange,
  initial = "all",
}: {
  onChange: (range: DateRange) => void;
  initial?: RangePreset;
}) {
  const [preset, setPreset] = useState<RangePreset>(initial);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const pick = (next: RangePreset) => {
    setPreset(next);
    onChange(rangeFor(next, from, to));
  };

  const setCustom = (nextFrom: string, nextTo: string) => {
    setFrom(nextFrom);
    setTo(nextTo);
    onChange(rangeFor("custom", nextFrom, nextTo));
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => pick(p.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              preset === p.value
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === "custom" ? (
        <div className="flex items-end gap-2">
          <div className="w-36">
            <Input
              label="From"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setCustom(e.target.value, to)}
            />
          </div>
          <div className="w-36">
            <Input
              label="To"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setCustom(from, e.target.value)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
