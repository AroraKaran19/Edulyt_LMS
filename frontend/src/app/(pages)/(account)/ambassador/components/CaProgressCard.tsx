"use client";

import type { CaTaskMineRow } from "@/types/ca-task";

export default function CaProgressCard({ tasks }: { tasks: CaTaskMineRow[] }) {
  const points = tasks.filter((t) => t.status === "passed").reduce((s, t) => s + t.successPoints, 0);
  const openCount = tasks.filter((t) => t.status === "open").length;
  const missedCount = tasks.filter((t) => t.status === "missed").length;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-bold tracking-wide text-gray-500 uppercase">Your progress</h2>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900">{points}</p>
          <p className="text-xs text-gray-500">Points earned</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{openCount}</p>
          <p className="text-xs text-gray-500">Open now</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{missedCount}</p>
          <p className="text-xs text-gray-500">Missed</p>
        </div>
      </div>
    </section>
  );
}
