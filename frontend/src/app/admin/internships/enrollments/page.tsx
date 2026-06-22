"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { HelpCircle, User, Briefcase } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import Select from "@/components/ui/inputs/Select";
import Pagination from "@/components/admin/Pagination";
import InternshipAdminListShell from "../components/InternshipAdminListShell";
import type { InternshipEnrollmentListRow } from "@/types";
import InternshipEnrollmentDetailModal from "./InternshipEnrollmentDetailModal";

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All (in this group)" },
  { value: "enrolled", label: "Enrolled" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
  { value: "dropped", label: "Dropped" },
  { value: "revoked", label: "Revoked" },
];

const LIFECYCLE_FILTER_OPTIONS: { value: string; label: string }[] = [
  {
    value: "program",
    label: "In program (enrolled, completed, …)",
  },
  { value: "pipeline", label: "Exam & selection only" },
  { value: "all", label: "Every status" },
];

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

const COL_SPAN = 8;

export default function InternshipEnrollmentsAdminPage() {
  const [rows, setRows] = useState<InternshipEnrollmentListRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lifecycleFilter, setLifecycleFilter] = useState("program");
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

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 10,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== "all") params.status = statusFilter;
      params.lifecycle = lifecycleFilter;

      const res = await apiClient.get(
        ENDPOINTS.internshipEnrollments.adminList,
        {
          params,
        },
      );
      const d = res.data?.data as {
        enrollments?: InternshipEnrollmentListRow[];
        totalPages?: number;
        total?: number;
      };
      setRows(d?.enrollments ?? []);
      setTotalPages(d?.totalPages ?? 1);
      setTotal(d?.total ?? 0);
    } catch {
      toast.error("Failed to load internship enrollments");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, lifecycleFilter]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    statusFilter !== "all" ||
    lifecycleFilter !== "program";

  return (
    <>
      <InternshipAdminListShell
        title="Internship enrollments"
        subtitle="Learners who are in the program (enrolled, completed, and similar). Use the lifecycle filter to include exam/selection pipeline, or use Entrance exams for cohort tools."
        searchPlaceholder="Search by learner email, name, internship title, or batch…"
        searchValue={search}
        onSearchChange={setSearch}
        filterExtras={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="sm:w-64">
              <Select
                options={LIFECYCLE_FILTER_OPTIONS}
                value={lifecycleFilter}
                onChange={(val) => {
                  setLifecycleFilter(val);
                  setPage(1);
                }}
                placeholder="Lifecycle"
              />
            </div>
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
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px]">
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
                        <p className="text-gray-400 text-sm">
                          Try adjusting search or status
                        </p>
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
