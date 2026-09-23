"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Calendar, Copy, Pencil, Play, Plus, Trash2, Users, Video } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Pagination from "@/components/admin/Pagination";
import InternshipAdminListShell from "../../internships/components/InternshipAdminListShell";
import useCaMeetings from "@/hooks/useCaMeetings";
import CaMeetingCreateModal from "./components/CaMeetingCreateModal";
import CaMeetingEditModal from "./components/CaMeetingEditModal";
import CaMeetingAttendanceModal from "./components/CaMeetingAttendanceModal";
import DeleteCaMeetingConfirmModal from "./components/DeleteCaMeetingConfirmModal";
import type { CaMeetingAdminRow, CheckpointPhase } from "@/types/ca-meeting";

function formatDateTime(iso?: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function phaseChipClasses(phase: CheckpointPhase): string {
  switch (phase) {
    case "not-activated":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "link1-active":
    case "link2-active":
      return "bg-green-100 text-green-800 border-green-200";
    case "link1-closed":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "closed":
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function phaseLabel(phase: CheckpointPhase): string {
  switch (phase) {
    case "not-activated":
      return "Not activated";
    case "link1-active":
      return "Link 1 live";
    case "link1-closed":
      return "Link 1 closed";
    case "link2-active":
      return "Link 2 live";
    case "closed":
      return "Closed";
  }
}

const COL_SPAN = 4;

function AttendanceRow({
  label,
  activatedAt,
  expiryMins,
  clickedCount,
  onActivate,
  onCopy,
}: {
  label: string;
  activatedAt: string | null;
  expiryMins: number;
  clickedCount: number;
  onActivate: () => void;
  onCopy: () => void;
}) {
  const active = activatedAt != null;
  const closesAtLabel = active
    ? `Closes ${new Date(new Date(activatedAt).getTime() + expiryMins * 60_000).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}`
    : `${expiryMins}m window`;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">{label}</span>
          <span
            className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${
              active ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
            }`}
          >
            {active ? "Live" : "Not opened"}
          </span>
        </div>
        <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
          <span className="tabular-nums">{clickedCount} clicks</span>
          <span className="text-gray-300">.</span>
          <span>{closesAtLabel}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onActivate}
        disabled={active}
        className="shrink-0 px-2.5 py-1.5 text-xs rounded-md border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
        title={active ? "Already activated" : `Activate ${label}`}
      >
        <Play className="size-3" />
        Activate
      </button>
      <button
        type="button"
        onClick={onCopy}
        className="shrink-0 px-2.5 py-1.5 text-xs rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 inline-flex items-center gap-1"
        title={`Copy ${label} URL`}
      >
        <Copy className="size-3" />
        Copy URL
      </button>
    </div>
  );
}

export default function CaMeetingsAdminPage() {
  const { listAdmin, activateAdmin, isLoading } = useCaMeetings();
  const [meetings, setMeetings] = useState<CaMeetingAdminRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<CaMeetingAdminRow | null>(null);
  const [attendanceMeetingId, setAttendanceMeetingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchMeetings = async () => {
    const result = await listAdmin(page, 50);
    setMeetings(result?.meetings ?? []);
    setTotalPages(result?.totalPages ?? 1);
    setTotal(result?.total ?? 0);
  };

  useEffect(() => {
    void fetchMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const activate = async (meetingId: string, slot: 1 | 2) => {
    const ok = window.confirm(
      `Activate link ${slot}? The expiry timer starts immediately and the link cannot be re-activated.`,
    );
    if (!ok) return;
    const result = await activateAdmin(meetingId, slot);
    if (!result) return;
    toast.success(`Link ${slot} activated`);
    void fetchMeetings();
  };

  return (
    <>
      <InternshipAdminListShell
        title="CA meetings"
        subtitle="One-off meetings for every active Campus Ambassador, with two-checkpoint attendance."
        searchPlaceholder=""
        searchValue=""
        onSearchChange={() => {}}
        showSearchRow={false}
        headerActions={
          <OrangeButton
            type="button"
            glow={false}
            className="inline-flex items-center gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            New meeting
          </OrangeButton>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700">Meeting</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Schedule</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 w-[420px]">Attendance</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading && meetings.length === 0 ? (
                <tr>
                  <td colSpan={COL_SPAN} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                      <p className="text-gray-500 text-sm">Loading...</p>
                    </div>
                  </td>
                </tr>
              ) : meetings.length === 0 ? (
                <tr>
                  <td colSpan={COL_SPAN} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Video className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-500 font-medium">No CA meetings yet</p>
                      <p className="text-gray-400 text-sm">Click &quot;New meeting&quot; to schedule one.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                meetings.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 align-top">
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 max-w-[280px]">
                      <p className="font-medium line-clamp-1">{m.name}</p>
                      <a
                        href={m.meetingLink}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-xs text-orange-600 hover:underline line-clamp-1"
                      >
                        {m.meetingLink}
                      </a>
                      {m.recordingLink ? (
                        <a
                          href={m.recordingLink}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-xs text-violet-600 hover:underline line-clamp-1"
                        >
                          Recording: {m.recordingLink}
                        </a>
                      ) : null}
                      <span
                        className={`mt-2 inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full border ${phaseChipClasses(m.phase)}`}
                      >
                        {phaseLabel(m.phase)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs text-gray-600 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3.5 text-gray-400" />
                        {formatDateTime(m.startDateTime)}
                      </div>
                      {m.endDateTime ? <div className="text-gray-400 mt-0.5">to {formatDateTime(m.endDateTime)}</div> : null}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs text-gray-700">
                      <div className="flex flex-col gap-2">
                        <AttendanceRow
                          label="Attendance 1"
                          activatedAt={m.link1.activatedAt}
                          expiryMins={m.link1.expiryMins}
                          clickedCount={m.link1.clickedCount}
                          onActivate={() => void activate(m.id, 1)}
                          onCopy={() => void copyUrl(m.link1.url)}
                        />
                        <AttendanceRow
                          label="Attendance 2"
                          activatedAt={m.link2.activatedAt}
                          expiryMins={m.link2.expiryMins}
                          clickedCount={m.link2.clickedCount}
                          onActivate={() => void activate(m.id, 2)}
                          onCopy={() => void copyUrl(m.link2.url)}
                        />
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setAttendanceMeetingId(m.id)}
                          className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50"
                          title="View attendance"
                          aria-label="View attendance"
                        >
                          <Users className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditMeeting(m)}
                          className="p-2 rounded-lg text-orange-600 hover:bg-orange-50"
                          title="Edit meeting"
                          aria-label="Edit meeting"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ id: m.id, name: m.name })}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                          title="Delete meeting"
                          aria-label="Delete meeting"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 sm:px-6">
            <p className="text-sm text-gray-700">{total} total</p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} disabled={isLoading} />
          </div>
        )}
      </InternshipAdminListShell>

      <CaMeetingCreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => void fetchMeetings()} />

      <CaMeetingEditModal meeting={editMeeting} onClose={() => setEditMeeting(null)} onSaved={() => void fetchMeetings()} />

      <CaMeetingAttendanceModal meetingId={attendanceMeetingId} onClose={() => setAttendanceMeetingId(null)} />

      <DeleteCaMeetingConfirmModal target={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={() => void fetchMeetings()} />
    </>
  );
}
