"use client";

import Link from "next/link";
import type { CaTaskMineRow, CaTaskMineStatus } from "@/types/ca-task";

const STATUS_LABEL: Record<CaTaskMineStatus, string> = {
  upcoming: "Upcoming",
  open: "Open",
  "in-review": "In review",
  passed: "Passed",
  failed: "Failed",
  missed: "Missed",
};

const STATUS_CLASS: Record<CaTaskMineStatus, string> = {
  upcoming: "bg-gray-100 text-gray-700",
  open: "bg-green-100 text-green-800",
  "in-review": "bg-amber-100 text-amber-800",
  passed: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  missed: "bg-red-100 text-red-800",
};

function daysUntil(iso: string | null): string {
  if (!iso) return "";
  const ms = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  return days <= 0 ? "due today" : `due in ${days} day${days === 1 ? "" : "s"}`;
}

export default function CaTaskList({ tasks }: { tasks: CaTaskMineRow[] }) {
  if (tasks.length === 0) {
    return <p className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">No tasks yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {tasks.map((t) => (
        <li key={t.id}>
          <Link
            href={`/ambassador/tasks/${t.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50 max-sm:text-base"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{t.title}</p>
              <p className="text-xs text-gray-500">
                {t.status === "open"
                  ? daysUntil(t.deadline)
                  : t.status === "upcoming" && t.opensAt
                    ? `opens ${new Date(t.opensAt).toLocaleDateString()}`
                    : `${t.successPoints} points`}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[t.status]}`}>
              {STATUS_LABEL[t.status]}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
