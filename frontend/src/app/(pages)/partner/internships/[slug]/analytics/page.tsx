"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Download,
  FileCheck,
  Search,
  Stamp,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import PartnerCard from "@/components/ui/partner/PartnerCard";
import PartnerStatCard from "@/components/ui/partner/PartnerStatCard";
import Loader from "@/components/ui/Loader";
import PartnerExportButton from "@/components/ui/partner/PartnerExportButton";
import type { ExcelRow } from "@/lib/exportToExcel";
import usePartner, {
  type PartnerInternshipDetailResponse,
  type PartnerInternshipStudentRow,
  type PartnerInternshipStudentsResponse,
} from "@/hooks/usePartner";

/** pageSize is capped at 100 server-side, so exports fetch in 100-row pages. */
const EXPORT_PAGE_SIZE = 100;

/** The furthest funnel stage a student reached, as a plain label. */
function studentStatusLabel(s: PartnerInternshipStudentRow): string {
  if (s.certified) return "Certified";
  if (s.selected) return "Selected";
  if (s.appearedInExam) return "Exam Appeared";
  return "Enrolled";
}

// Same wording as the stat cards above the table.
const CHECKPOINTS = [
  "Enrolled",
  "Appeared in Exam",
  "Selected / Offer Letter",
  "Cleared with Certificate",
] as const;

/** Index of the furthest checkpoint reached; earlier ones count as reached too. */
const checkpointIndex = (s: PartnerInternshipStudentRow): number =>
  s.certified ? 3 : s.selected ? 2 : s.appearedInExam ? 1 : 0;

function CheckpointDots({ student }: { student: PartnerInternshipStudentRow }) {
  const reached = checkpointIndex(student);

  return (
    <div
      role="img"
      aria-label={`Checkpoint ${reached + 1} of ${CHECKPOINTS.length}: ${CHECKPOINTS[reached]}`}
      className="flex items-center"
    >
      {CHECKPOINTS.map((name, i) => (
        <div key={name} className="flex items-center" aria-hidden="true">
          {i > 0 && (
            <span
              className={cn(
                "h-0.5 w-3",
                i <= reached ? "bg-[#F77124]" : "bg-gray-200",
              )}
            />
          )}
          <span className="group relative flex size-4 items-center justify-center">
            <span
              className={cn(
                "size-2.5 rounded-full border-2 transition-transform group-hover:scale-125",
                i <= reached
                  ? "border-[#F77124] bg-[#F77124]"
                  : "border-gray-300 bg-white",
              )}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1D2939] px-2 py-1 text-[11px] leading-tight font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {name}
              <span
                className={cn(
                  "block text-[10px] font-normal",
                  i <= reached ? "text-[#FDBA8C]" : "text-gray-400",
                )}
              >
                {i <= reached ? "Reached" : "Not yet"}
              </span>
              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1D2939]" />
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

type StatusFilter = "all" | "enrolled" | "exam" | "selected" | "certified";

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "enrolled", label: "Enrolled only" },
  { value: "exam", label: "Exam Appeared" },
  { value: "selected", label: "Selected" },
  { value: "certified", label: "Certified" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function PartnerInternshipAnalyticsPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug ?? "");
  const { getInternshipDetail, getInternshipStudents } = usePartner();
  const [data, setData] = useState<PartnerInternshipDetailResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [studentsData, setStudentsData] =
    useState<PartnerInternshipStudentsResponse | null>(null);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Load the analytics header (totals + per-batch counts).
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const d = await getInternshipDetail(slug);
        if (cancelled) return;
        setData(d);
        setSelectedBatchIds(new Set(d.batches.map((b) => b.batchId)));
      } catch (e) {
        console.error("Internship analytics load failed:", e);
        if (!cancelled) toast.error("Could not load internship analytics.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, getInternshipDetail]);

  // Debounce the search box; committing a new term resets to the first page.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetch the paginated student list whenever a query input changes.
  useEffect(() => {
    if (!slug || !data) return;
    // No batch selected → nothing to show; skip the request.
    if (selectedBatchIds.size === 0) {
      setStudentsData({ items: [], total: 0, page: 1, pageSize });
      return;
    }
    let cancelled = false;
    setStudentsLoading(true);
    (async () => {
      try {
        const allSelected = selectedBatchIds.size === data.batches.length;
        const res = await getInternshipStudents(slug, {
          page,
          pageSize,
          q: search,
          status: statusFilter,
          batchIds: allSelected ? undefined : [...selectedBatchIds],
        });
        if (!cancelled) setStudentsData(res);
      } catch (e) {
        console.error("Internship students load failed:", e);
        if (!cancelled) toast.error("Could not load students.");
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    slug,
    data,
    page,
    pageSize,
    search,
    statusFilter,
    selectedBatchIds,
    getInternshipStudents,
  ]);

  const selectedBatches = useMemo(() => {
    if (!data) return [];
    return data.batches.filter((b) => selectedBatchIds.has(b.batchId));
  }, [data, selectedBatchIds]);

  const selectedTotals = useMemo(() => {
    return selectedBatches.reduce(
      (acc, b) => ({
        enrolled: acc.enrolled + b.counts.enrolled,
        appearedInExam: acc.appearedInExam + b.counts.appearedInExam,
        selected: acc.selected + b.counts.selected,
        certified: acc.certified + b.counts.certified,
      }),
      { enrolled: 0, appearedInExam: 0, selected: 0, certified: 0 },
    );
  }, [selectedBatches]);

  const toggleBatch = (batchId: string) => {
    setPage(1);
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  };

  if (isLoading && !data) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader size="xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <PartnerCard className="p-6 text-center">
          <h2 className="text-base font-semibold text-gray-900">
            Internship analytics unavailable
          </h2>
          <Link
            href="/partner/internships"
            className="mt-3 inline-block text-sm font-semibold text-[#F77124]"
          >
            Back to internships
          </Link>
        </PartnerCard>
      </div>
    );
  }

  const { internship, batches } = data;
  const allBatchesSelected =
    batches.length > 0 && selectedBatchIds.size === batches.length;

  const students = studentsData?.items ?? [];
  const total = studentsData?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(total, page * pageSize);

  const buildStudentRows = async (): Promise<ExcelRow[]> => {
    const allSelected = selectedBatchIds.size === batches.length;
    const filters = {
      q: search,
      status: statusFilter,
      batchIds: allSelected ? undefined : [...selectedBatchIds],
    };
    const first = await getInternshipStudents(slug, {
      page: 1,
      pageSize: EXPORT_PAGE_SIZE,
      ...filters,
    });
    const totalPages = Math.max(1, Math.ceil(first.total / EXPORT_PAGE_SIZE));
    const rest =
      totalPages > 1
        ? await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              getInternshipStudents(slug, {
                page: i + 2,
                pageSize: EXPORT_PAGE_SIZE,
                ...filters,
              }),
            ),
          )
        : [];
    const rows = [first, ...rest].flatMap((res) => res.items);
    return rows.map((s) => ({
      "Student Name": s.name,
      Email: s.email,
      Batch: s.batchName,
      Status: studentStatusLabel(s),
      "Offer Letter": s.selected ? "Received" : "Not received",
      "Offer Letter URL": s.offerLetterUrl ?? "",
      Certificate: s.certified ? "Issued" : "Not issued",
      "Certificate URL": s.certificateUrl ?? "",
    }));
  };

  return (
    <div className="space-y-4 p-2 py-6 sm:p-4">
      <Link
        href="/partner/internships"
        className="inline-flex items-center gap-1 text-sm font-medium text-[#475467] hover:text-[#1D2939]"
      >
        <ChevronLeft className="size-4" />
        Back to internships
      </Link>

      <h1 className="text-lg font-semibold text-black sm:text-2xl">
        {internship.title}
      </h1>

      <div>
        <p className="mb-2 text-sm font-semibold text-[#101828]">
          {allBatchesSelected
            ? "Totals across all batches"
            : `Totals across ${selectedBatchIds.size} selected ${selectedBatchIds.size === 1 ? "batch" : "batches"}`}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-4">
          <PartnerStatCard
            icon={<Users className="size-5" />}
            value={String(selectedTotals.enrolled)}
            label="Enrolled"
          />
          <PartnerStatCard
            icon={<FileCheck className="size-5" />}
            value={String(selectedTotals.appearedInExam)}
            label="Appeared in Exam"
          />
          <PartnerStatCard
            icon={<Stamp className="size-5" />}
            value={String(selectedTotals.selected)}
            label="Selected / Offer Letter"
          />
          <PartnerStatCard
            icon={<Award className="size-5" />}
            value={String(selectedTotals.certified)}
            label="Cleared with Certificate"
          />
        </div>
      </div>

      <PartnerCard className="p-4 sm:p-5">
        {batches.length === 0 ? (
          <p className="text-sm text-[#667085]">
            None of your students have enrolled in this internship yet.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="text-base font-semibold text-black sm:text-xl">
                Student lists by batch
              </h2>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-[#344054]">Status</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as StatusFilter);
                      setPage(1);
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
                  >
                    {STATUS_FILTER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <PartnerExportButton
                  getRows={buildStudentRows}
                  fileName={`${internship.title}-students`}
                  sheetName="Students"
                  disabled={total === 0}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[#344054]">
                  Batches
                </span>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setSelectedBatchIds(
                        new Set(batches.map((b) => b.batchId)),
                      );
                    }}
                    className="text-[#F77124] hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setSelectedBatchIds(new Set());
                    }}
                    className="text-[#475467] hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {batches.map((b) => {
                  const active = selectedBatchIds.has(b.batchId);
                  return (
                    <button
                      type="button"
                      key={b.batchId}
                      onClick={() => toggleBatch(b.batchId)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border-[#F77124] bg-[#FFF4EB] text-[#B45309]"
                          : "border-gray-300 bg-white text-[#475467] hover:border-[#F77124]/50",
                      )}
                    >
                      {b.name}
                      <span
                        className={cn(
                          "ml-1.5 text-[10px]",
                          active ? "text-[#B45309]/70" : "text-[#98A2B3]",
                        )}
                      >
                        {b.counts.enrolled}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative mt-4 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search by name or email"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
              />
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-[#F2F4F7] text-left">
                    <th className="pb-3 font-semibold text-black">
                      Student Name
                    </th>
                    <th className="pb-3 font-semibold text-black">Email</th>
                    <th className="pb-3 font-semibold text-black">Batch</th>
                    <th className="pb-3 font-semibold text-black">
                      Checkpoints
                    </th>
                    <th className="pb-3 font-semibold text-black">
                      Offer Letter
                    </th>
                    <th className="pb-3 font-semibold text-black">
                      Certificate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-gray-500"
                      >
                        {studentsLoading
                          ? "Loading students…"
                          : selectedBatchIds.size === 0
                            ? "Select at least one batch to view students."
                            : search.trim()
                              ? "No students matched your search."
                              : statusFilter === "all"
                                ? "No students in the selected batches."
                                : "No students match this status filter."}
                      </td>
                    </tr>
                  ) : (
                    students.map((s, i) => (
                      <tr
                        key={`${s.email}-${s.batchId}-${i}`}
                        className="border-b border-[#F2F4F7] last:border-0"
                      >
                        <td className="py-3 font-medium text-[#1D2939]">
                          {s.name}
                        </td>
                        <td className="py-3 text-[#344054]">{s.email}</td>
                        <td className="py-3 text-[#475467]">{s.batchName}</td>
                        <td className="py-3">
                          <CheckpointDots student={s} />
                        </td>
                        <td className="py-3">
                          {s.offerLetterUrl ? (
                            <a
                              href={s.offerLetterUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-md bg-[#F77124] px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#e0631a]"
                            >
                              <Download className="size-3.5" />
                              Download
                            </a>
                          ) : (
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                                s.selected
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-gray-100 text-gray-600",
                              )}
                            >
                              {s.selected ? "Received" : "Not received"}
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          {s.certificateUrl ? (
                            <a
                              href={s.certificateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-md bg-[#F77124] px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#e0631a]"
                            >
                              <Download className="size-3.5" />
                              Download
                            </a>
                          ) : (
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                                s.certified
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-gray-100 text-gray-500",
                              )}
                            >
                              {s.certified ? "Issued" : "Not issued"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-[#F2F4F7] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-xs text-[#475467]">
                <label className="flex items-center gap-2">
                  <span>Rows per page</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <span>
                  {total === 0
                    ? "0 students"
                    : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || studentsLoading}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-[#344054] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="size-4" />
                  Prev
                </button>
                <span className="px-2 text-xs font-medium text-[#475467]">
                  Page {page} of {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page >= pageCount || studentsLoading}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-[#344054] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </PartnerCard>
    </div>
  );
}
