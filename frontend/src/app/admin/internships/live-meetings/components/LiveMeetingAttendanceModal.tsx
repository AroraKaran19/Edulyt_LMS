"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Check, X, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  AdminLiveMeetingAttendanceResponse,
  AdminLiveMeetingAttendanceRow,
} from "@/types/internship-live-meeting";

type Props = {
  meetingId: string | null;
  onClose: () => void;
};

function displayName(u: {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
}): string {
  const composed = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  if (composed) return composed;
  if (u.name) return u.name;
  return u.email ?? "—";
}

function verdictBadge(
  verdict: "present" | "absent" | "pending",
  overridden: boolean,
) {
  const base =
    "inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border";
  const styles =
    verdict === "present"
      ? "bg-green-100 text-green-800 border-green-200"
      : verdict === "absent"
        ? "bg-red-100 text-red-800 border-red-200"
        : "bg-amber-100 text-amber-800 border-amber-200";
  const label =
    verdict === "present" ? "Present" : verdict === "absent" ? "Absent" : "Pending";
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

export default function LiveMeetingAttendanceModal({ meetingId, onClose }: Props) {
  const [data, setData] = useState<AdminLiveMeetingAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!meetingId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(
        ENDPOINTS.internshipLiveMeetings.adminAttendance(meetingId),
      );
      setData(res.data?.data as AdminLiveMeetingAttendanceResponse);
    } catch {
      toast.error("Failed to load attendance");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [meetingId, onClose]);

  useEffect(() => {
    if (!meetingId) {
      setData(null);
      return;
    }
    void load();
  }, [meetingId, load]);

  const handleOverride = async (
    userId: string,
    verdict: "present" | "absent" | "clear",
  ) => {
    if (!meetingId || busyUserId) return;
    setBusyUserId(userId);
    try {
      const res = await apiClient.post(
        ENDPOINTS.internshipLiveMeetings.adminAttendanceOverride(meetingId),
        { userId, verdict },
      );
      setData(res.data?.data as AdminLiveMeetingAttendanceResponse);
      toast.success(
        verdict === "clear"
          ? "Reverted to computed attendance"
          : `Marked ${verdict}`,
      );
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update attendance";
      toast.error(msg);
    } finally {
      setBusyUserId(null);
    }
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
          <p className="text-sm text-gray-500">Loading…</p>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    Student
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                    Link 1
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                    Link 2
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    Verdict
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                    Mark
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      No enrolled students in this batch yet.
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row) => (
                    <AttendanceRow
                      key={row.enrollmentId}
                      row={row}
                      busy={busyUserId === row.user._id}
                      disabled={busyUserId !== null}
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
  row: AdminLiveMeetingAttendanceRow;
  busy: boolean;
  disabled: boolean;
  onOverride: (
    userId: string,
    verdict: "present" | "absent" | "clear",
  ) => void;
}) {
  const uid = row.user._id;

  return (
    <tr>
      <td className="px-4 py-3 text-sm text-gray-900">
        <p className="font-medium line-clamp-1">{displayName(row.user)}</p>
        {row.user.email ? (
          <p className="text-xs text-gray-500 line-clamp-1">{row.user.email}</p>
        ) : null}
      </td>
      <td className="px-4 py-3 text-center">
        {row.link1Clicked ? (
          <Check className="size-4 text-green-600 mx-auto" />
        ) : (
          <X className="size-4 text-gray-300 mx-auto" />
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {row.link2Clicked ? (
          <Check className="size-4 text-green-600 mx-auto" />
        ) : (
          <X className="size-4 text-gray-300 mx-auto" />
        )}
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
                onClick={() => onOverride(uid, "present")}
                className="rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Present
              </button>
              <button
                type="button"
                disabled={disabled || row.verdict === "absent"}
                onClick={() => onOverride(uid, "absent")}
                className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Absent
              </button>
              <button
                type="button"
                disabled={disabled || !row.overridden}
                onClick={() => onOverride(uid, "clear")}
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
