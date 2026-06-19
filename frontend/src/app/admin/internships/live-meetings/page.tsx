"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Calendar,
  Copy,
  Pencil,
  Play,
  Plus,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import Select from "@/components/ui/inputs/Select";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import InternshipAdminListShell from "../components/InternshipAdminListShell";
import LiveMeetingCreateModal from "./components/LiveMeetingCreateModal";
import LiveMeetingEditModal from "./components/LiveMeetingEditModal";
import LiveMeetingAttendanceModal from "./components/LiveMeetingAttendanceModal";
import DeleteLiveMeetingConfirmModal from "./components/DeleteLiveMeetingConfirmModal";
import type {
  AdminLiveMeetingListItem,
  LiveMeetingPhase,
} from "@/types/internship-live-meeting";

type InternshipOption = { _id: string; title: string };
type BatchOption = { _id: string; name: string };

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
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
    return "—";
  }
}

function phaseChipClasses(phase: LiveMeetingPhase): string {
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

function phaseLabel(phase: LiveMeetingPhase): string {
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
              active
                ? "bg-green-100 text-green-800"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {active ? "Live" : "Not opened"}
          </span>
        </div>
        <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
          <span className="tabular-nums">{clickedCount} clicks</span>
          <span className="text-gray-300">·</span>
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

export default function AdminLiveMeetingsPage() {
  const [internships, setInternships] = useState<InternshipOption[]>([]);
  const [internshipId, setInternshipId] = useState<string>("");
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [batchId, setBatchId] = useState<string>("");

  const [meetings, setMeetings] = useState<AdminLiveMeetingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<AdminLiveMeetingListItem | null>(
    null,
  );
  const [attendanceMeetingId, setAttendanceMeetingId] = useState<string | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Load internships once.
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get(
          `${ENDPOINTS.internships.admin.all}?page=1&limit=200`,
        );
        const list =
          (res.data?.data?.internships ?? []) as { _id: string; title: string }[];
        setInternships(
          list.map((i) => ({ _id: String(i._id), title: i.title })),
        );
      } catch {
        toast.error("Failed to load internships");
      }
    })();
  }, []);

  // When an internship is selected, load its batches.
  useEffect(() => {
    if (!internshipId) {
      setBatches([]);
      setBatchId("");
      return;
    }
    (async () => {
      try {
        const res = await apiClient.get(
          `${ENDPOINTS.internships.admin.byId}/${internshipId}`,
        );
        const data = res.data?.data as { batches?: { _id: string; name: string }[] };
        const list = (data?.batches ?? []).map((b) => ({
          _id: String(b._id),
          name: b.name,
        }));
        setBatches(list);
        setBatchId("");
      } catch {
        toast.error("Failed to load batches");
        setBatches([]);
      }
    })();
  }, [internshipId]);

  const fetchMeetings = useCallback(async () => {
    if (!internshipId || !batchId) {
      setMeetings([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.internshipLiveMeetings.adminList, {
        params: { internshipId, batchId, page: 1, limit: 100 },
      });
      const list = (res.data?.data?.meetings ?? []) as AdminLiveMeetingListItem[];
      setMeetings(list);
    } catch {
      toast.error("Failed to load live meetings");
      setMeetings([]);
    } finally {
      setIsLoading(false);
    }
  }, [internshipId, batchId]);

  useEffect(() => {
    void fetchMeetings();
  }, [fetchMeetings]);

  const internshipOptions = useMemo(
    () => internships.map((i) => ({ value: i._id, label: i.title })),
    [internships],
  );
  const batchOptions = useMemo(
    () => batches.map((b) => ({ value: b._id, label: b.name })),
    [batches],
  );

  const canCreate = Boolean(internshipId && batchId);

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
    try {
      await apiClient.post(
        ENDPOINTS.internshipLiveMeetings.adminActivate(meetingId, slot),
      );
      toast.success(`Link ${slot} activated`);
      void fetchMeetings();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? `Could not activate link ${slot}`;
      toast.error(msg);
    }
  };

  return (
    <>
      <InternshipAdminListShell
        title="Live meetings"
        subtitle="Schedule one-off live meetings per batch with two attendance links."
        searchPlaceholder="Pick an internship + batch above to filter…"
        searchValue=""
        onSearchChange={() => {}}
        showSearchRow={false}
        headerActions={
          <OrangeButton
            type="button"
            glow={false}
            disabled={!canCreate}
            className="inline-flex items-center gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            New meeting
          </OrangeButton>
        }
      >
        <div className="px-4 sm:px-6 pt-6 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Internship"
            required
            placeholder="Choose internship"
            value={internshipId}
            options={internshipOptions}
            searchable
            onChange={setInternshipId}
          />
          <Select
            label="Batch"
            required
            placeholder={
              !internshipId
                ? "Pick an internship first"
                : batchOptions.length === 0
                  ? "No batches"
                  : "Choose batch"
            }
            value={batchId}
            options={batchOptions}
            disabled={!internshipId || batchOptions.length === 0}
            onChange={setBatchId}
          />
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full min-w-[960px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700">
                  Meeting
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Schedule
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 w-[420px]">
                  Attendance
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!canCreate ? (
                <tr>
                  <td colSpan={COL_SPAN} className="px-6 py-12 text-center text-sm text-gray-500">
                    Choose an internship and a batch to view its meetings.
                  </td>
                </tr>
              ) : isLoading ? (
                <tr>
                  <td colSpan={COL_SPAN} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                      <p className="text-gray-500 text-sm">Loading…</p>
                    </div>
                  </td>
                </tr>
              ) : meetings.length === 0 ? (
                <tr>
                  <td colSpan={COL_SPAN} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Video className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-500 font-medium">
                        No live meetings yet
                      </p>
                      <p className="text-gray-400 text-sm">
                        Click “New meeting” to schedule one for this batch.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                meetings.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-50 align-top">
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
                      {m.endDateTime ? (
                        <div className="text-gray-400 mt-0.5">
                          → {formatDateTime(m.endDateTime)}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs text-gray-700">
                      <div className="flex flex-col gap-2">
                        <AttendanceRow
                          label="Attendance 1"
                          activatedAt={m.link1.activatedAt}
                          expiryMins={m.link1.expiryMins}
                          clickedCount={m.link1.clickedCount}
                          onActivate={() => void activate(m._id, 1)}
                          onCopy={() => void copyUrl(m.link1.url)}
                        />
                        <AttendanceRow
                          label="Attendance 2"
                          activatedAt={m.link2.activatedAt}
                          expiryMins={m.link2.expiryMins}
                          clickedCount={m.link2.clickedCount}
                          onActivate={() => void activate(m._id, 2)}
                          onCopy={() => void copyUrl(m.link2.url)}
                        />
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setAttendanceMeetingId(m._id)}
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
                          onClick={() =>
                            setDeleteTarget({ id: m._id, name: m.name })
                          }
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
      </InternshipAdminListShell>

      <LiveMeetingCreateModal
        isOpen={createOpen}
        internshipId={internshipId}
        batchId={batchId}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void fetchMeetings()}
      />

      <LiveMeetingEditModal
        meeting={editMeeting}
        onClose={() => setEditMeeting(null)}
        onSaved={() => void fetchMeetings()}
      />

      <LiveMeetingAttendanceModal
        meetingId={attendanceMeetingId}
        onClose={() => setAttendanceMeetingId(null)}
      />

      <DeleteLiveMeetingConfirmModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => void fetchMeetings()}
      />
    </>
  );
}
