"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Calendar, Copy, Pencil, Play, Plus, Trash2, Users, Video } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { Button } from "@/components/ui/buttons/button";
// Generic admin list chrome — its own doc comment says it's aligned with the
// courses layout, so it's shared rather than internship-specific.
import InternshipAdminListShell from "../../internships/components/InternshipAdminListShell";
import CoursePicker from "./components/CoursePicker";
import LiveClassCreateModal from "./components/LiveClassCreateModal";
import LiveClassEditModal from "./components/LiveClassEditModal";
import LiveClassAttendanceModal from "./components/LiveClassAttendanceModal";
import DeleteLiveClassConfirmModal from "./components/DeleteLiveClassConfirmModal";
import { formatIstDateTime } from "@/lib/ist";
import type { LiveClass, LiveClassPhase } from "@/types/live-classes";
import BrandMark from "@/components/admin/BrandMark";
import BrandSelect from "@/components/admin/BrandSelect";
import type { BrandFilter } from "@/constants/brands";

const PAGE_SIZE = 10;
const COL_SPAN = 6;

function phaseChipClasses(phase: LiveClassPhase): string {
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

function phaseLabel(phase: LiveClassPhase): string {
  switch (phase) {
    case "not-activated":
      return "Not activated";
    case "link1-active":
      return "Attendance 1 live";
    case "link1-closed":
      return "Attendance 1 closed";
    case "link2-active":
      return "Attendance 2 live";
    case "closed":
      return "Closed";
  }
}

function AttendanceLinkRow({
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
    ? `Closes ${new Date(
        new Date(activatedAt).getTime() + expiryMins * 60_000,
      ).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
      })}`
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

export default function AdminLiveClassesPage() {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [brandFilter, setBrandFilter] = useState<BrandFilter>("all");
  const [viewMode, setViewMode] = useState<"all" | "ongoing">("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editLiveClass, setEditLiveClass] = useState<LiveClass | null>(null);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  /** Guards against a slow earlier page overwriting a newer one. */
  const activeRequest = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filtering and search are server-side, so a change resets to page 1.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, courseId, brandFilter, viewMode]);

  const fetchLiveClasses = useCallback(async () => {
    const reqId = ++activeRequest.current;
    setIsLoading(true);
    try {
      const url =
        viewMode === "ongoing"
          ? ENDPOINTS.liveClasses.ongoing
          : ENDPOINTS.liveClasses.adminList;
      const res = await apiClient.get(url, {
        params: {
          page,
          limit: PAGE_SIZE,
          ...(viewMode === "all" && courseId ? { courseId } : {}),
          ...(viewMode === "all" && brandFilter !== "all"
            ? { brand: brandFilter }
            : {}),
          ...(viewMode === "all" && debouncedSearch
            ? { search: debouncedSearch }
            : {}),
        },
      });
      if (reqId !== activeRequest.current) return;
      const data = res.data?.data as {
        liveClasses?: LiveClass[];
        total?: number;
        totalPages?: number;
      };
      setLiveClasses(data?.liveClasses ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 1);
    } catch {
      if (reqId !== activeRequest.current) return;
      toast.error("Failed to load live classes");
      setLiveClasses([]);
    } finally {
      if (reqId === activeRequest.current) setIsLoading(false);
    }
  }, [viewMode, page, courseId, brandFilter, debouncedSearch]);

  useEffect(() => {
    void fetchLiveClasses();
  }, [fetchLiveClasses]);

  const copyUrl = async (url: string) => {
    if (!url) {
      toast.error("This link has no URL yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const activate = async (liveClassId: string, slot: 1 | 2) => {
    const ok = window.confirm(
      `Activate attendance ${slot}? The expiry timer starts immediately and the link cannot be re-activated.`,
    );
    if (!ok) return;
    try {
      await apiClient.post(
        ENDPOINTS.liveClasses.adminActivate(liveClassId, slot),
      );
      toast.success(`Attendance ${slot} activated`);
      void fetchLiveClasses();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ??
        `Could not activate attendance ${slot}`;
      toast.error(msg);
    }
  };

  return (
    <>
      <InternshipAdminListShell
        title="Live Classes"
        subtitle="Schedule live classes per course with two attendance links."
        searchPlaceholder="Search live classes by name…"
        searchValue={search}
        onSearchChange={setSearch}
        showSearchRow={viewMode === "all"}
        filterExtras={
          <>
            <CoursePicker
              value={courseId}
              selectedLabel={courseTitle}
              onChange={(id, titleText) => {
                setCourseId(id);
                setCourseTitle(titleText);
              }}
              placeholder="All courses"
              clearLabel="All courses"
              className="w-full sm:w-72"
            />
            <BrandSelect
              label=""
              includeAll
              value={brandFilter}
              onChange={setBrandFilter}
              className="w-full sm:w-44"
            />
          </>
        }
        headerActions={
          <OrangeButton
            type="button"
            glow={false}
            className="inline-flex items-center gap-2"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" />
            New live class
          </OrangeButton>
        }
      >
        <div className="px-4 sm:px-6 pt-5 flex flex-wrap items-center gap-2">
          <Button
            variant={viewMode === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("all")}
            className={
              viewMode === "all"
                ? "bg-orange-500 text-white hover:bg-orange-600 cursor-pointer"
                : "cursor-pointer"
            }
          >
            All
          </Button>
          <Button
            variant={viewMode === "ongoing" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("ongoing")}
            className={
              viewMode === "ongoing"
                ? "bg-orange-500 text-white hover:bg-orange-600 cursor-pointer"
                : "cursor-pointer"
            }
          >
            Ongoing
          </Button>
          <span className="text-xs text-gray-500 ml-auto">
            {total} {total === 1 ? "live class" : "live classes"}
          </span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full min-w-[1040px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700">
                  Class
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700">
                  Course
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700">
                  Brand
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
              {isLoading ? (
                <tr>
                  <td colSpan={COL_SPAN} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                      <p className="text-gray-500 text-sm">Loading…</p>
                    </div>
                  </td>
                </tr>
              ) : liveClasses.length === 0 ? (
                <tr>
                  <td colSpan={COL_SPAN} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Video className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-500 font-medium">
                        {viewMode === "ongoing"
                          ? "No live classes running right now"
                          : "No live classes yet"}
                      </p>
                      {viewMode === "all" && (
                        <p className="text-gray-400 text-sm">
                          Click “New live class” to schedule one.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                liveClasses.map((lc) => (
                  <tr key={lc._id} className="hover:bg-gray-50 align-top">
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 max-w-[260px]">
                      <p className="font-medium line-clamp-1">{lc.title}</p>
                      {lc.meetingLink ? (
                        <a
                          href={lc.meetingLink}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-xs text-orange-600 hover:underline line-clamp-1"
                        >
                          {lc.meetingLink}
                        </a>
                      ) : (
                        <span className="text-xs text-red-600">
                          No meeting link set
                        </span>
                      )}
                      {lc.recordingLink ? (
                        <a
                          href={lc.recordingLink}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-xs text-violet-600 hover:underline line-clamp-1"
                        >
                          Recording: {lc.recordingLink}
                        </a>
                      ) : null}
                      <span
                        className={`mt-2 inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full border ${phaseChipClasses(lc.phase)}`}
                      >
                        {phaseLabel(lc.phase)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs text-gray-700 max-w-[200px]">
                      <p className="line-clamp-2">
                        {lc.course?.title ?? "-"}
                      </p>
                      {lc.instructor ? (
                        <p className="text-gray-400 mt-1 line-clamp-1">
                          {`${lc.instructor.firstName ?? ""} ${lc.instructor.lastName ?? ""}`.trim() ||
                            lc.instructor.email}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <BrandMark brand={lc.brand} />
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs text-gray-600 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3.5 text-gray-400" />
                        {formatIstDateTime(lc.startDateTime)}
                      </div>
                      <div className="text-gray-400 mt-0.5">
                        → {formatIstDateTime(lc.endDateTime)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs text-gray-700">
                      <div className="flex flex-col gap-2">
                        <AttendanceLinkRow
                          label="Attendance 1"
                          activatedAt={lc.link1.activatedAt}
                          expiryMins={lc.link1.expiryMins}
                          clickedCount={lc.link1.clickedCount}
                          onActivate={() => void activate(lc._id, 1)}
                          onCopy={() => void copyUrl(lc.link1.url)}
                        />
                        <AttendanceLinkRow
                          label="Attendance 2"
                          activatedAt={lc.link2.activatedAt}
                          expiryMins={lc.link2.expiryMins}
                          clickedCount={lc.link2.clickedCount}
                          onActivate={() => void activate(lc._id, 2)}
                          onCopy={() => void copyUrl(lc.link2.url)}
                        />
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setAttendanceId(lc._id)}
                          className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50"
                          title="View attendance"
                          aria-label="View attendance"
                        >
                          <Users className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditLiveClass(lc)}
                          className="p-2 rounded-lg text-orange-600 hover:bg-orange-50"
                          title="Edit live class"
                          aria-label="Edit live class"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({ id: lc._id, name: lc.title })
                          }
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                          title="Delete live class"
                          aria-label="Delete live class"
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
          <div className="flex items-center justify-center gap-2 px-6 py-5 border-t border-gray-200">
            <WhiteButton
              glow={false}
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </WhiteButton>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <OrangeButton
              glow={false}
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </OrangeButton>
          </div>
        )}
      </InternshipAdminListShell>

      <LiveClassCreateModal
        isOpen={createOpen}
        initialCourseId={courseId}
        initialCourseTitle={courseTitle}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void fetchLiveClasses()}
      />

      <LiveClassEditModal
        liveClass={editLiveClass}
        onClose={() => setEditLiveClass(null)}
        onSaved={() => void fetchLiveClasses()}
      />

      <LiveClassAttendanceModal
        liveClassId={attendanceId}
        onClose={() => setAttendanceId(null)}
      />

      <DeleteLiveClassConfirmModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => void fetchLiveClasses()}
      />
    </>
  );
}
