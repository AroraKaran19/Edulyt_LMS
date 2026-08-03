"use client";

import { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { istDateAndTimeToUtcIso } from "@/lib/ist";

type ReachabilityRow = {
  months: number;
  endDate: string;
  reachableCount: number;
  totalCount: number;
  reachablePoints: number;
  totalPoints: number;
};

type Props = { batchIndex: number };

function formatEnd(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return "—";
  }
}

/**
 * Shows which learner durations can actually reach the batch's selected tasks.
 * Task calendars are authored in day offsets from the cohort start while each
 * learner's window is their own chosen duration — without this an admin cannot
 * see that a 90-day calendar leaves 1-month learners with almost nothing.
 */
export default function BatchTaskReachabilityPanel({ batchIndex }: Props) {
  const cohortStartRaw = useWatch({
    name: `batches.${batchIndex}.internshipStartDate` as const,
  });
  const cohortStartTimeRaw = useWatch({
    name: `batches.${batchIndex}.internshipStartTime` as const,
  });
  const idsRaw = useWatch({
    name: `batches.${batchIndex}.taskTemplateIds` as const,
  });

  // Preview against the same IST instant that will be saved, so the day offsets
  // shown here match the windows the learner actually gets.
  const cohortStart =
    istDateAndTimeToUtcIso(
      String(cohortStartRaw ?? ""),
      String(cohortStartTimeRaw ?? ""),
    ) ?? "";
  const taskTemplateIds: string[] = Array.isArray(idsRaw)
    ? (idsRaw as string[])
    : [];

  const [rows, setRows] = useState<ReachabilityRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const idsKey = taskTemplateIds.join(",");

  useEffect(() => {
    if (!cohortStart || taskTemplateIds.length === 0) {
      setRows(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiClient
      .post(ENDPOINTS.internshipTasks.adminReachabilityPreview, {
        cohortStart,
        taskTemplateIds,
      })
      .then((res) => {
        if (cancelled) return;
        const payload = res.data?.data as
          | { rows?: ReachabilityRow[] }
          | undefined;
        setRows(payload?.rows ?? null);
      })
      .catch(() => {
        if (!cancelled) setRows(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cohortStart, idsKey]);

  if (!cohortStart || taskTemplateIds.length === 0) return null;
  if (loading && !rows) {
    return (
      <p className="mt-2 text-[11px] text-gray-400">Checking reachability…</p>
    );
  }
  if (!rows) return null;

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3">
      <p className="text-[11px] font-semibold text-gray-700">
        Reachable by duration
      </p>
      <p className="mt-0.5 text-[11px] text-gray-500">
        A learner only earns points from tasks that open inside their own
        duration and leave them at least 5 days.
      </p>
      <ul className="mt-2 space-y-1">
        {rows.map((r) => {
          const none = r.reachableCount === 0;
          return (
            <li
              key={r.months}
              className={
                none
                  ? "flex items-center gap-2 text-[11px] font-medium text-amber-700"
                  : "flex items-center gap-2 text-[11px] text-gray-600"
              }
            >
              {none ? (
                <AlertTriangle className="h-3 w-3 shrink-0" />
              ) : (
                <span className="h-3 w-3 shrink-0" />
              )}
              <span className="w-12 tabular-nums">{r.months} mo</span>
              <span className="w-20 text-gray-400">
                ends {formatEnd(r.endDate)}
              </span>
              <span className="tabular-nums">
                {r.reachableCount} of {r.totalCount} tasks
              </span>
              <span className="tabular-nums text-gray-400">
                {r.reachablePoints} of {r.totalPoints} pts
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
