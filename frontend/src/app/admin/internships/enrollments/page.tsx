"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  HelpCircle,
  User,
  Briefcase,
  Calendar,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import Select, { type SelectOption } from "@/components/ui/inputs/Select";
import AsyncSelect from "@/components/ui/inputs/AsyncSelect";
import Pagination from "@/components/admin/Pagination";
import InternshipAdminListShell from "../components/InternshipAdminListShell";
import type { InternshipEnrollmentListRow } from "@/types";
import EnrollmentExport, {
  type ExportDateRange,
  type ExportStatusOption,
} from "@/components/admin/EnrollmentExport";
import type { ExcelRow } from "@/lib/exportToExcel";
import { istDateOnlyToUtcIso, istEndOfDayToUtcIso } from "@/lib/ist";
import InternshipEnrollmentDetailModal from "./InternshipEnrollmentDetailModal";

/**
 * One control for the whole lifecycle. Values are either a lifecycle group
 * ("program" / "pipeline" / "all") or `s:` followed by one status or a
 * comma-separated group of them — the two used to be separate dropdowns that
 * could contradict each other, because the API lets a chosen status override
 * the lifecycle group silently.
 */
const STATUS_FILTER_DEFAULT = "program";

const DOCUMENTATION_STATUSES = [
  "pending_documentation",
  "docs_under_review",
  "re_pending_documentation",
  "offer_letter_pending",
].join(",");

const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: "program", label: "In program (all)", group: "In program" },
  {
    value: `s:${DOCUMENTATION_STATUSES}`,
    label: "Documentation pending",
    group: "In program",
  },
  { value: "s:enrolled", label: "Enrolled", group: "In program" },
  { value: "s:completed", label: "Completed", group: "In program" },
  { value: "s:paused", label: "Paused", group: "In program" },
  { value: "s:dropped", label: "Dropped", group: "In program" },
  { value: "s:revoked", label: "Revoked", group: "In program" },
  {
    value: "pipeline",
    label: "Exam & selection (all)",
    group: "Exam & selection",
  },
  {
    value: "s:exam_registered",
    label: "Exam registered",
    group: "Exam & selection",
  },
  {
    value: "s:exam_attempted",
    label: "Exam attempted",
    group: "Exam & selection",
  },
  {
    value: "s:in_merit_pool",
    label: "In merit pool",
    group: "Exam & selection",
  },
  {
    value: "s:payment_pending",
    label: "Payment pending",
    group: "Exam & selection",
  },
  { value: "s:admin_rejected", label: "Rejected", group: "Exam & selection" },
  { value: "all", label: "Every status", group: "Everything" },
];

const CERT_OUTCOME_FILTER_OPTIONS: SelectOption[] = [
  { value: "all", label: "Any certificate outcome" },
  { value: "certified", label: "Certified" },
  { value: "not_certified", label: "Not certified" },
  { value: "pending", label: "Awaiting evaluation" },
];

const ALL_INTERNSHIPS = "all";
const ALL_BATCHES = "all";

type CertOutcome = "certified" | "not_certified" | "pending";

/** Effective certificate outcome: an admin override wins over the computed verdict. */
function certOutcomeOf(row: InternshipEnrollmentListRow): CertOutcome {
  if (row.certificateOverride === "pass") return "certified";
  if (row.certificateOverride === "fail") return "not_certified";
  const v = row.certificateEvaluation?.verdict;
  if (v === "pass") return "certified";
  if (v === "fail") return "not_certified";
  return "pending";
}

const CERT_OUTCOME_BADGE: Record<
  CertOutcome,
  { label: string; className: string }
> = {
  certified: {
    label: "Certified",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  not_certified: {
    label: "Not certified",
    className: "bg-rose-100 text-rose-800 border-rose-200",
  },
  pending: {
    label: "Awaiting",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

const ENROLLMENT_TYPE_OPTIONS: SelectOption[] = [
  { value: "all", label: "All paths" },
  { value: "merit", label: "Merit" },
  { value: "paid", label: "Paid" },
];

const labelOf = (options: SelectOption[], value: string) =>
  options.find((o) => o.value === value)?.label ?? value;

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
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

function userDisplayName(u: InternshipEnrollmentListRow["user"]) {
  if (!u) return "—";
  if (u.name?.trim()) return u.name.trim();
  const n = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return n || u.email || "—";
}

function statusBadgeClass(status: string) {
  if (status === "enrolled")
    return "bg-green-100 text-green-800 border-green-200";
  if (status === "completed")
    return "bg-blue-100 text-blue-800 border-blue-200";
  if (status === "in_merit_pool" || status === "exam_attempted")
    return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "exam_registered")
    return "bg-sky-100 text-sky-800 border-sky-200";
  if (status === "payment_pending")
    return "bg-orange-100 text-orange-800 border-orange-200";
  if (
    status === "dropped" ||
    status === "revoked" ||
    status === "admin_rejected"
  )
    return "bg-gray-200 text-gray-700 border-gray-300";
  if (status === "paused")
    return "bg-violet-100 text-violet-800 border-violet-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

const EXPORT_STATUS_OPTIONS: ExportStatusOption[] = [
  { value: "pending_documentation", label: "Pending documentation", group: "In program" },
  { value: "docs_under_review", label: "Docs under review", group: "In program" },
  { value: "re_pending_documentation", label: "Docs resubmission", group: "In program" },
  { value: "offer_letter_pending", label: "Offer letter pending", group: "In program" },
  { value: "enrolled", label: "Enrolled", group: "In program" },
  { value: "completed", label: "Completed", group: "In program" },
  { value: "paused", label: "Paused", group: "In program" },
  { value: "dropped", label: "Dropped", group: "In program" },
  { value: "revoked", label: "Revoked", group: "In program" },
  { value: "exam_registered", label: "Exam registered", group: "Exam & selection" },
  { value: "exam_attempted", label: "Exam attempted", group: "Exam & selection" },
  { value: "in_merit_pool", label: "In merit pool", group: "Exam & selection" },
  { value: "payment_pending", label: "Payment pending", group: "Exam & selection" },
  { value: "admin_rejected", label: "Rejected", group: "Exam & selection" },
];

const PROGRAM_STATUSES = EXPORT_STATUS_OPTIONS.filter(
  (o) => o.group === "In program",
).map((o) => o.value);
const PIPELINE_STATUSES = EXPORT_STATUS_OPTIONS.filter(
  (o) => o.group === "Exam & selection",
).map((o) => o.value);

const PAGE_SIZE = 10;
// The admin list endpoint caps `limit` at 100.
const EXPORT_CHUNK = 100;

function fetcherFor(params: Record<string, string>) {
  return async (page: number, limit: number) => {
    const res = await apiClient.get(ENDPOINTS.internshipEnrollments.adminList, {
      params: { ...params, page, limit },
    });
    const d = res.data?.data as {
      enrollments?: InternshipEnrollmentListRow[];
      totalPages?: number;
      total?: number;
    };
    return {
      items: d?.enrollments ?? [],
      totalPages: d?.totalPages ?? 1,
      total: d?.total ?? 0,
    };
  };
}

function toExcelRow(row: InternshipEnrollmentListRow): ExcelRow {
  return {
    Learner: userDisplayName(row.user),
    Email: row.user?.email ?? "",
    Internship: row.internship?.title ?? "",
    Batch: row.batchSnapshot?.name ?? "",
    Path: row.enrollmentType === "merit" ? "Merit" : row.enrollmentType === "paid" ? "Paid" : "",
    Status: formatStatus(row.status),
    Certificate: CERT_OUTCOME_BADGE[certOutcomeOf(row)].label,
    Points: row.internshipSuccessPoints ?? 0,
    Enrolled: row.enrolledAt ? formatDate(row.enrolledAt) : "",
    Updated: row.updatedAt ? formatDate(row.updatedAt) : "",
  };
}

const COL_SPAN = 9;

export default function InternshipEnrollmentsAdminPage() {
  const [rows, setRows] = useState<InternshipEnrollmentListRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_DEFAULT);
  const [certOutcomeFilter, setCertOutcomeFilter] = useState("all");
  const [enrollmentTypeFilter, setEnrollmentTypeFilter] = useState("all");
  const [internshipFilter, setInternshipFilter] = useState(ALL_INTERNSHIPS);
  const [internshipLabel, setInternshipLabel] = useState("");
  const [batchFilter, setBatchFilter] = useState(ALL_BATCHES);
  const [batches, setBatches] = useState<{ _id: string; name: string }[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [enrolledFrom, setEnrolledFrom] = useState("");
  const [enrolledTo, setEnrolledTo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]);

  // Internship picker feed — paged in as the dropdown scrolls, so the page
  // never pulls the whole catalogue (or its populated relations) up front.
  const fetchInternshipOptions = useCallback(
    async (optionsPage: number, optionsSearch: string) => {
      const res = await apiClient.get(ENDPOINTS.internships.admin.options, {
        params: { page: optionsPage, limit: 20, search: optionsSearch },
      });
      const d = res.data?.data as {
        items?: { _id: string; title: string }[];
        hasMore?: boolean;
      };
      return {
        items: (d?.items ?? []).map((i) => ({
          value: String(i._id),
          label: i.title,
        })),
        hasMore: Boolean(d?.hasMore),
      };
    },
    [],
  );

  // Batches of the selected internship. Cleared whenever the internship changes
  // so a stale cohort can never stay applied to a different programme.
  useEffect(() => {
    if (internshipFilter === ALL_INTERNSHIPS) {
      setBatches([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setIsLoadingBatches(true);
      try {
        const res = await apiClient.get(
          `${ENDPOINTS.internships.admin.byId}/${internshipFilter}`,
        );
        const data = res.data?.data as {
          batches?: { _id: string; name: string }[];
        };
        if (!cancelled) {
          setBatches(
            (data?.batches ?? []).map((b) => ({
              _id: String(b._id),
              name: b.name,
            })),
          );
        }
      } catch {
        if (!cancelled) setBatches([]);
      } finally {
        if (!cancelled) setIsLoadingBatches(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [internshipFilter]);

  const batchOptions = useMemo<SelectOption[]>(
    () => [
      { value: ALL_BATCHES, label: "All batches" },
      ...batches.map((b) => ({ value: b._id, label: b.name })),
    ],
    [batches],
  );

  const filterParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    // Either a lifecycle group or an explicit `s:`-prefixed status list —
    // never both, so the two can no longer disagree.
    if (statusFilter.startsWith("s:")) {
      params.status = statusFilter.slice(2);
      params.lifecycle = "all";
    } else {
      params.lifecycle = statusFilter;
    }
    if (certOutcomeFilter !== "all")
      params.certificateOutcome = certOutcomeFilter;
    if (enrollmentTypeFilter !== "all")
      params.enrollmentType = enrollmentTypeFilter;
    if (internshipFilter !== ALL_INTERNSHIPS)
      params.internshipId = internshipFilter;
    if (batchFilter !== ALL_BATCHES) params.batchId = batchFilter;
    const from = istDateOnlyToUtcIso(enrolledFrom);
    const to = istEndOfDayToUtcIso(enrolledTo);
    if (from) params.enrolledFrom = from;
    if (to) params.enrolledTo = to;
    return params;
  }, [
    debouncedSearch,
    statusFilter,
    certOutcomeFilter,
    enrollmentTypeFilter,
    internshipFilter,
    batchFilter,
    enrolledFrom,
    enrolledTo,
  ]);

  const fetchPage = useMemo(() => fetcherFor(filterParams), [filterParams]);

  const fetchRangePage = useCallback(
    (range: ExportDateRange, statuses: string[]) => {
      const rest = { ...filterParams };
      delete rest.status;
      delete rest.enrolledFrom;
      delete rest.enrolledTo;
      return fetcherFor({
        ...rest,
        ...range,
        lifecycle: "all",
        status: statuses.join(","),
      });
    },
    [filterParams],
  );

  const defaultExportStatuses = useMemo(() => {
    if (statusFilter.startsWith("s:")) return statusFilter.slice(2).split(",");
    if (statusFilter === "program") return PROGRAM_STATUSES;
    if (statusFilter === "pipeline") return PIPELINE_STATUSES;
    return EXPORT_STATUS_OPTIONS.map((o) => o.value);
  }, [statusFilter]);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const d = await fetchPage(page, PAGE_SIZE);
      setRows(d.items);
      setTotalPages(d.totalPages);
      setTotal(d.total);
    } catch {
      toast.error("Failed to load internship enrollments");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage, page]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);


  /** Filters tucked behind "More filters" — the badge counts these. */
  const moreFiltersCount =
    (enrollmentTypeFilter !== "all" ? 1 : 0) +
    (certOutcomeFilter !== "all" ? 1 : 0) +
    (enrolledFrom || enrolledTo ? 1 : 0);

  const chips: { key: string; label: string; onClear: () => void }[] = [];
  if (statusFilter !== STATUS_FILTER_DEFAULT) {
    chips.push({
      key: "status",
      label: labelOf(STATUS_FILTER_OPTIONS, statusFilter),
      onClear: () => {
        setStatusFilter(STATUS_FILTER_DEFAULT);
        setPage(1);
      },
    });
  }
  if (internshipFilter !== ALL_INTERNSHIPS) {
    chips.push({
      key: "internship",
      label: internshipLabel || "Internship",
      onClear: () => {
        setInternshipFilter(ALL_INTERNSHIPS);
        setInternshipLabel("");
        setBatchFilter(ALL_BATCHES);
        setPage(1);
      },
    });
  }
  if (batchFilter !== ALL_BATCHES) {
    chips.push({
      key: "batch",
      label: `Batch: ${labelOf(batchOptions, batchFilter)}`,
      onClear: () => {
        setBatchFilter(ALL_BATCHES);
        setPage(1);
      },
    });
  }
  if (enrollmentTypeFilter !== "all") {
    chips.push({
      key: "path",
      label: `Path: ${labelOf(ENROLLMENT_TYPE_OPTIONS, enrollmentTypeFilter)}`,
      onClear: () => {
        setEnrollmentTypeFilter("all");
        setPage(1);
      },
    });
  }
  if (certOutcomeFilter !== "all") {
    chips.push({
      key: "certificate",
      label: labelOf(CERT_OUTCOME_FILTER_OPTIONS, certOutcomeFilter),
      onClear: () => {
        setCertOutcomeFilter("all");
        setPage(1);
      },
    });
  }
  if (enrolledFrom || enrolledTo) {
    chips.push({
      key: "enrolled",
      label: `Enrolled ${enrolledFrom || "any"} → ${enrolledTo || "any"}`,
      onClear: () => {
        setEnrolledFrom("");
        setEnrolledTo("");
        setPage(1);
      },
    });
  }

  const hasActiveFilters = chips.length > 0 || Boolean(debouncedSearch);

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter(STATUS_FILTER_DEFAULT);
    setInternshipFilter(ALL_INTERNSHIPS);
    setInternshipLabel("");
    setBatchFilter(ALL_BATCHES);
    setEnrollmentTypeFilter("all");
    setCertOutcomeFilter("all");
    setEnrolledFrom("");
    setEnrolledTo("");
    setPage(1);
  };

  return (
    <>
      <InternshipAdminListShell
        title="Internship enrollments"
        subtitle="Learners across the internship lifecycle. Opens on everyone in the program; switch Status to reach the exam and selection pipeline."
        headerActions={
          <EnrollmentExport
            fileName="internship-enrollments"
            statusOptions={EXPORT_STATUS_OPTIONS}
            defaultStatuses={defaultExportStatuses}
            currentRows={rows}
            currentPage={page}
            totalPages={totalPages}
            pageSize={PAGE_SIZE}
            chunkSize={EXPORT_CHUNK}
            fetchTablePage={fetchPage}
            fetchRangePage={fetchRangePage}
            statusOf={(r) => r.status}
            toExcelRow={toExcelRow}
            defaultDateFrom={enrolledFrom}
            defaultDateTo={enrolledTo}
            disabled={isLoading}
          />
        }
        searchPlaceholder="Search by learner email, name, internship title, or batch…"
        searchValue={search}
        onSearchChange={setSearch}
        filterExtras={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="sm:w-56">
              <Select
                options={STATUS_FILTER_OPTIONS}
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
                placeholder="Status"
              />
            </div>
            <div className="sm:w-56">
              <AsyncSelect
                fetchPage={fetchInternshipOptions}
                value={internshipFilter}
                selectedLabel={internshipLabel}
                onChange={(val, label) => {
                  setInternshipFilter(val);
                  setInternshipLabel(val === ALL_INTERNSHIPS ? "" : label);
                  // A cohort only means something inside one programme.
                  setBatchFilter(ALL_BATCHES);
                  setPage(1);
                }}
                allOption={{ value: ALL_INTERNSHIPS, label: "All internships" }}
                placeholder="All internships"
                searchPlaceholder="Search internships…"
                // Titles run long; let the panel outgrow the trigger.
                panelClassName="w-[min(26rem,80vw)]"
              />
            </div>
            <div className="sm:w-48">
              <Select
                options={batchOptions}
                value={batchFilter}
                onChange={(val) => {
                  setBatchFilter(val);
                  setPage(1);
                }}
                placeholder={
                  internshipFilter === ALL_INTERNSHIPS
                    ? "Pick an internship"
                    : isLoadingBatches
                      ? "Loading batches…"
                      : "All batches"
                }
                disabled={internshipFilter === ALL_INTERNSHIPS}
                searchable={batches.length > 8}
                searchPlaceholder="Search batches…"
              />
            </div>
          </div>
        }
        filterRow2={
          <div className="w-full flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMoreFilters((v) => !v)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  showMoreFilters || moreFiltersCount > 0
                    ? "border-orange-300 bg-orange-50 text-orange-700"
                    : "border-gray-300 bg-white text-gray-600 hover:border-orange-400"
                }`}
                aria-expanded={showMoreFilters}
              >
                <SlidersHorizontal className="w-4 h-4" />
                More filters
                {moreFiltersCount > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1.5 text-[11px] font-bold text-white">
                    {moreFiltersCount}
                  </span>
                )}
              </button>

              {chips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 py-1 pl-3 pr-1.5 text-xs font-medium text-gray-700"
                >
                  <span className="max-w-[220px] truncate">{chip.label}</span>
                  <button
                    type="button"
                    onClick={chip.onClear}
                    aria-label={`Remove filter ${chip.label}`}
                    className="rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-semibold text-gray-500 underline hover:text-gray-700 cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {showMoreFilters && (
              <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="sm:w-44">
                  <Select
                    options={ENROLLMENT_TYPE_OPTIONS}
                    value={enrollmentTypeFilter}
                    onChange={(val) => {
                      setEnrollmentTypeFilter(val);
                      setPage(1);
                    }}
                    placeholder="Path"
                  />
                </div>
                <div className="sm:w-56">
                  <Select
                    options={CERT_OUTCOME_FILTER_OPTIONS}
                    value={certOutcomeFilter}
                    onChange={(val) => {
                      setCertOutcomeFilter(val);
                      setPage(1);
                    }}
                    placeholder="Certificate"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 shrink-0">
                    Enrolled
                  </span>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      title="Enrolled from"
                      value={enrolledFrom}
                      onChange={(e) => {
                        setEnrolledFrom(e.target.value);
                        setPage(1);
                      }}
                      className="pl-9 pr-3 py-3.5 border border-gray-300 rounded-xl bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all shadow-sm w-[152px]"
                    />
                  </div>
                  <span className="text-gray-400 text-sm shrink-0">to</span>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      title="Enrolled to"
                      value={enrolledTo}
                      onChange={(e) => {
                        setEnrolledTo(e.target.value);
                        setPage(1);
                      }}
                      className="pl-9 pr-3 py-3.5 border border-gray-300 rounded-xl bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 hover:border-orange-400 transition-all shadow-sm w-[152px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1160px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 min-w-[160px]">
                  Learner
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 min-w-[140px]">
                  Internship
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700">
                  Batch
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Path
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700">
                  Certificate
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 tabular-nums">
                  Points
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Enrolled
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Updated
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
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={COL_SPAN} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <HelpCircle className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-500 font-medium">
                        No enrollments found
                      </p>
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={clearAllFilters}
                          className="text-sm font-semibold text-orange-600 underline hover:text-orange-700 cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailId(row._id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setDetailId(row._id);
                      }
                    }}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 sm:px-6 py-4 min-w-[160px]">
                      <div className="flex items-center gap-2 min-w-0">
                        {row.user?.profilePicture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.user.profilePicture}
                            alt={userDisplayName(row.user)}
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-orange-600" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {userDisplayName(row.user)}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {row.user?.email ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 min-w-[140px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                          <Briefcase className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-sm text-gray-900 line-clamp-2">
                          {row.internship?.title ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 max-w-[180px]">
                      <span className="line-clamp-2">
                        {row.batchSnapshot?.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {row.enrollmentType ? (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                            row.enrollmentType === "merit"
                              ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          {row.enrollmentType === "merit" ? "Merit" : "Paid"}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border capitalize ${statusBadgeClass(
                          row.status,
                        )}`}
                      >
                        {formatStatus(row.status)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const badge = CERT_OUTCOME_BADGE[certOutcomeOf(row)];
                        return (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 tabular-nums">
                      {row.internshipSuccessPoints ?? 0}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(row.enrolledAt)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(row.updatedAt)}
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
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={isLoading}
            />
          </div>
        )}
      </InternshipAdminListShell>

      <InternshipEnrollmentDetailModal
        isOpen={!!detailId}
        enrollmentId={detailId}
        onClose={() => setDetailId(null)}
        onUpdated={() => void fetchRows()}
      />
    </>
  );
}
