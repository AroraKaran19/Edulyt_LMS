"use client";

import type { CaMeetingMineItem } from "@/types/ca-meeting";

const VERDICT_LABEL: Record<CaMeetingMineItem["myVerdict"], string> = {
  present: "Present",
  absent: "Absent",
  pending: "Pending",
};

const VERDICT_CLASS: Record<CaMeetingMineItem["myVerdict"], string> = {
  present: "bg-emerald-100 text-emerald-800",
  absent: "bg-red-100 text-red-800",
  pending: "bg-amber-100 text-amber-800",
};

function formatSchedule(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * `attendUrl` is only present while this CA's own checkpoint is live and they
 * have not already clicked it (see `listCaMeetingsMine` on the backend), so a
 * truthy value is exactly when the "Mark attendance" button should show.
 */
export default function CaMeetingsList({ meetings }: { meetings: CaMeetingMineItem[] }) {
  if (meetings.length === 0) {
    return <p className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">No meetings yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {meetings.map((m) => {
        const checkpointLive = m.phase === "link1-active" || m.phase === "link2-active";
        return (
          <li key={m.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{m.name}</p>
                <p className="text-xs text-gray-500">{formatSchedule(m.startDateTime)}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${VERDICT_CLASS[m.myVerdict]}`}>
                {VERDICT_LABEL[m.myVerdict]}
              </span>
            </div>
            {m.attendUrl ? (
              <a
                href={m.attendUrl}
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-amber-50 hover:bg-amber-800 max-sm:text-base"
              >
                Mark attendance
              </a>
            ) : checkpointLive ? (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 max-sm:text-base">
                A checkpoint is live for this meeting. You&apos;ve already marked it.
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
