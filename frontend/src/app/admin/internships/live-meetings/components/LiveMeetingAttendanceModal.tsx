"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Check, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { AdminLiveMeetingAttendanceResponse } from "@/types/internship-live-meeting";

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

function verdictBadge(verdict: "present" | "absent" | "pending") {
  if (verdict === "present") {
    return (
      <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
        Present
      </span>
    );
  }
  if (verdict === "absent") {
    return (
      <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
        Absent
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
      Pending
    </span>
  );
}

export default function LiveMeetingAttendanceModal({ meetingId, onClose }: Props) {
  const [data, setData] = useState<AdminLiveMeetingAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!meetingId) {
      setData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(
          ENDPOINTS.internshipLiveMeetings.adminAttendance(meetingId),
        );
        if (!cancelled) {
          setData(res.data?.data as AdminLiveMeetingAttendanceResponse);
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load attendance");
          onClose();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [meetingId, onClose]);

  const isOpen = meetingId !== null;
  const presentCount = data?.rows.filter((r) => r.verdict === "present").length ?? 0;
  const absentCount = data?.rows.filter((r) => r.verdict === "absent").length ?? 0;
  const pendingCount = data?.rows.filter((r) => r.verdict === "pending").length ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attendance"
      className="max-w-3xl w-full mx-4 max-h-[90vh]"
    >
      {loading ? (
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                      No enrolled students in this batch yet.
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row) => (
                    <tr key={row.enrollmentId}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <p className="font-medium line-clamp-1">{displayName(row.user)}</p>
                        {row.user.email ? (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {row.user.email}
                          </p>
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
                      <td className="px-4 py-3">{verdictBadge(row.verdict)}</td>
                    </tr>
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
