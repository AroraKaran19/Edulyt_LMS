"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Check, X, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import useCaMeetings from "@/hooks/useCaMeetings";
import type { CaMeetingAttendanceResponse, CaMeetingAttendanceRow } from "@/types/ca-meeting";

type Props = {
  meetingId: string | null;
  onClose: () => void;
};

function verdictBadge(verdict: "present" | "absent" | "pending", overridden: boolean) {
  const base = "inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border";
  const styles =
    verdict === "present"
      ? "bg-green-100 text-green-800 border-green-200"
      : verdict === "absent"
        ? "bg-red-100 text-red-800 border-red-200"
        : "bg-amber-100 text-amber-800 border-amber-200";
  const label = verdict === "present" ? "Present" : verdict === "absent" ? "Absent" : "Pending";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${base} ${styles}`}>{label}</span>
      {overridden ? (
        <span className="inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-600 border border-gray-200">
          manual
        </span>
      ) : null}
    </span>
  );
}

export default function CaMeetingAttendanceModal({ meetingId, onClose }: Props) {
  const { getAttendanceAdmin, overrideAdmin } = useCaMeetings();
  const [data, setData] = useState<CaMeetingAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyApplicationId, setBusyApplicationId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!meetingId) return;
    setLoading(true);
    const result = await getAttendanceAdmin(meetingId);
    setLoading(false);
    if (!result) {
      onClose();
      return;
    }
    setData(result);
  }, [meetingId, onClose, getAttendanceAdmin]);

  useEffect(() => {
    if (!meetingId) {
      setData(null);
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  const handleOverride = async (applicationId: string, verdict: "present" | "absent" | "clear") => {
    if (!meetingId || busyApplicationId) return;
    setBusyApplicationId(applicationId);
    const result = await overrideAdmin(meetingId, applicationId, verdict);
    setBusyApplicationId(null);
    if (!result) return;
    setData(result);
    toast.success(verdict === "clear" ? "Reverted to computed attendance" : `Marked ${verdict}`);
  };

  const isOpen = meetingId !== null;
  const presentCount = data?.rows.filter((r) => r.verdict === "present").length ?? 0;
  const absentCount = data?.rows.filter((r) => r.verdict === "absent").length ?? 0;
  const pendingCount = data?.rows.filter((r) => r.verdict === "pending").length ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attendance"
      className="max-w-3xl lg:max-w-5xl xl:max-w-6xl w-full mx-4 max-h-[90vh]"
    >
      {loading && !data ? (
        <div className="flex flex-col items-center gap-2 py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      ) : !data ? (
        <p className="text-sm text-gray-500 py-6 text-center">No data.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-900">{data.meeting.name}</span>
              <span className="text-gray-500 ml-2">
                {new Date(data.meeting.startDateTime).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center gap-3 ml-auto text-xs">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {presentCount} present
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {absentCount} absent
              </span>
              {pendingCount > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {pendingCount} pending
                </span>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Campus Ambassador</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Link 1</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Link 2</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Verdict</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Mark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      No active Campus Ambassadors were in this meeting&apos;s window yet.
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row) => (
                    <AttendanceRow
                      key={row.application.id}
                      row={row}
                      busy={busyApplicationId === row.application.id}
                      disabled={busyApplicationId !== null}
                      onOverride={handleOverride}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}

function AttendanceRow({
  row,
  busy,
  disabled,
  onOverride,
}: {
  row: CaMeetingAttendanceRow;
  busy: boolean;
  disabled: boolean;
  onOverride: (applicationId: string, verdict: "present" | "absent" | "clear") => void;
}) {
  const applicationId = row.application.id;

  return (
    <tr>
      <td className="px-4 py-3 text-sm text-gray-900">
        <p className="font-medium line-clamp-1">{row.application.name}</p>
      </td>
      <td className="px-4 py-3 text-center">
        {row.link1Clicked ? <Check className="size-4 text-green-600 mx-auto" /> : <X className="size-4 text-gray-300 mx-auto" />}
      </td>
      <td className="px-4 py-3 text-center">
        {row.link2Clicked ? <Check className="size-4 text-green-600 mx-auto" /> : <X className="size-4 text-gray-300 mx-auto" />}
      </td>
      <td className="px-4 py-3">{verdictBadge(row.verdict, row.overridden)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          {busy ? (
            <Loader2 className="size-4 animate-spin text-gray-400" />
          ) : (
            <>
              <button
                type="button"
                disabled={disabled || row.verdict === "present"}
                onClick={() => onOverride(applicationId, "present")}
                className="rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Present
              </button>
              <button
                type="button"
                disabled={disabled || row.verdict === "absent"}
                onClick={() => onOverride(applicationId, "absent")}
                className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Absent
              </button>
              <button
                type="button"
                disabled={disabled || !row.overridden}
                onClick={() => onOverride(applicationId, "clear")}
                title="Revert to computed attendance"
                className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
