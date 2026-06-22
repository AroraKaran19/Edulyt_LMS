"use client";

import {
  useCallback,
  useEffect,
  useState,
  useRef,
  Suspense,
  useMemo,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Search,
  Trash2,
  User,
  BookOpen,
  Check,
  Ban,
} from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { InternshipEnrollmentListRow } from "@/types";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Pagination from "@/components/admin/Pagination";
import Input from "@/components/ui/inputs/Input";
import EntranceExamSubmissionModal from "../components/EntranceExamSubmissionModal";

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

function userName(u: InternshipEnrollmentListRow["user"]) {
  if (!u) return "—";
  if (u.name?.trim()) return u.name.trim();
  const n = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return n || u.email || "—";
}

function statusClass(s: string) {
  if (s === "enrolled" || s === "completed")
    return "bg-green-100 text-green-800 border-green-200";
  if (s === "in_merit_pool" || s === "exam_attempted")
    return "bg-amber-100 text-amber-800 border-amber-200";
  if (s === "exam_registered") return "bg-sky-100 text-sky-800 border-sky-200";
  if (s === "payment_pending")
    return "bg-orange-50 text-orange-900 border-orange-200";
  if (s === "admin_rejected")
    return "bg-gray-200 text-gray-700 border-gray-300";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

const COL_SPAN = 7;

const APPROVABLE_TO_ENROLLED = new Set([
  "exam_registered",
  "exam_attempted",
  "in_merit_pool",
]);

/** Statuses admin may reject (terminal `admin_rejected`) from this screen. */
const REJECTABLE_STATUSES = new Set([
  "exam_registered",
  "exam_attempted",
  "in_merit_pool",
  "payment_pending",
]);

function canApproveToEnrolled(status: string): boolean {
  return APPROVABLE_TO_ENROLLED.has(status);
}

function canRejectCandidate(status: string): boolean {
  return REJECTABLE_STATUSES.has(status);
}

function CohortContent() {
  const searchParams = useSearchParams();
  const internshipId = searchParams.get("internshipId") ?? "";
  const batchId = searchParams.get("batchId") ?? "";

  const [rows, setRows] = useState<InternshipEnrollmentListRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debounced, setDebounced] = useState("");
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const headerSelectRef = useRef<HTMLInputElement>(null);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => {
      setDebounced(searchText.trim());
      setPage(1);
    }, 400);
    return () => {
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, [searchText]);

  const load = useCallback(async () => {
    if (!internshipId || !batchId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.internshipEnrollments.adminList, {
        params: {
          page,
          limit: 20,
          internshipId,
          batchId,
          // Do not filter enrollmentType=merit: learners who took the exam then chose
          // "confirmed seat" become enrollmentType=paid and would disappear from this list.
          lifecycle: "all",
          meritPoolFirst: true,
          search: debounced || undefined,
        },
      });
      const d = res.data?.data as {
        enrollments?: InternshipEnrollmentListRow[];
        totalPages?: number;
        total?: number;
      };
      setRows(d?.enrollments ?? []);
      setTotalPages(d?.totalPages ?? 1);
      setTotal(d?.total ?? 0);
    } catch {
      toast.error("Failed to load enrollments for this cohort");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [internshipId, batchId, page, debounced]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSelected(new Set());
  }, [page, debounced, internshipId, batchId]);

  const rowIdsOnPage = useMemo(() => rows.map((r) => r._id), [rows]);
  const selectedOnPage = useMemo(
    () => rowIdsOnPage.filter((id) => selected.has(id)),
    [rowIdsOnPage, selected],
  );
  const allPageSelected =
    rowIdsOnPage.length > 0 && selectedOnPage.length === rowIdsOnPage.length;
  const somePageSelected =
    selectedOnPage.length > 0 && selectedOnPage.length < rowIdsOnPage.length;

  useEffect(() => {
    const el = headerSelectRef.current;
    if (el) {
      el.indeterminate = somePageSelected;
    }
  }, [somePageSelected, allPageSelected, rows.length]);

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    if (allPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        rowIdsOnPage.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        rowIdsOnPage.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const onBulkApprove = async () => {
    const toProcess = rows.filter(
      (r) => selected.has(r._id) && canApproveToEnrolled(r.status),
    );
    if (toProcess.length === 0) {
      toast.info(
        "Select learners in exam registered, exam attempted, or merit pool to enroll them.",
      );
      return;
    }
    if (
      !window.confirm(
        `Enroll ${toProcess.length} learner(s) in this program? Their status will be set to enrolled on the server.`,
      )
    ) {
      return;
    }
    setBulkLoading(true);
    try {
      const res = await apiClient.post(
        ENDPOINTS.internshipEnrollments.adminApproveToEnrolled,
        { enrollmentIds: toProcess.map((r) => r._id) },
      );
      const d = res.data?.data as { ok?: number; failed?: number } | undefined;
      const ok = d?.ok ?? 0;
      const fail = d?.failed ?? 0;
      setSelected(new Set());
      void load();
      if (ok) toast.success(`Enrolled ${ok} learner(s).`);
      if (fail) toast.error(`${fail} could not be enrolled.`);
    } catch {
      toast.error("Approve to enrolled failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const onBulkReject = async () => {
    const toProcess = rows.filter(
      (r) => selected.has(r._id) && canRejectCandidate(r.status),
    );
    if (toProcess.length === 0) {
      toast.info(
        "Select learners who can still be rejected (registered, attempted, merit pool, or payment pending).",
      );
      return;
    }
    if (
      !window.confirm(
        `Reject ${toProcess.length} candidate(s)? Their enrollment will be marked admin rejected and they cannot proceed on this admission.`,
      )
    ) {
      return;
    }
    setBulkLoading(true);
    try {
      const results = await Promise.allSettled(
        toProcess.map((r) =>
          apiClient.patch(ENDPOINTS.internshipEnrollments.adminUpdateStatus(r._id), {
            status: "admin_rejected",
          }),
        ),
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.length - ok;
      setSelected(new Set());
      void load();
      if (ok) toast.success(`Rejected ${ok} candidate(s).`);
      if (fail) toast.error(`${fail} could not be rejected.`);
    } catch {
      toast.error("Reject failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const onRejectOne = async (enrollmentId: string) => {
    const row = rows.find((r) => r._id === enrollmentId);
    if (!row || !canRejectCandidate(row.status)) return;
    if (
      !window.confirm(
        "Reject this candidate? Their enrollment will be marked admin rejected.",
      )
    ) {
      return;
    }
    setRejectingId(enrollmentId);
    try {
      await apiClient.patch(
        ENDPOINTS.internshipEnrollments.adminUpdateStatus(enrollmentId),
        { status: "admin_rejected" },
      );
      toast.success("Candidate rejected.");
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
      void load();
    } catch {
      toast.error("Reject failed");
    } finally {
      setRejectingId(null);
    }
  };

  const findSubmission = async (enrollmentId: string) => {
    try {
      const res = await apiClient.get(ENDPOINTS.internshipSubmissions.adminList, {
        params: {
          enrollmentId,
          submissionFor: "exam",
          limit: 1,
          page: 1,
        },
      });
      const list = res.data?.data as {
        submissions?: { _id: string }[];
      };
      const first = list?.submissions?.[0];
      if (first?._id) {
        setSubmissionId(first._id);
        return;
      }
      toast.info("This learner has not submitted the entrance exam yet.");
    } catch {
      toast.error("Could not look up submission");
    }
  };

  const onDelete = async (enrollmentId: string) => {
    if (!window.confirm("Remove this exam registration? This cannot be undone.")) {
      return;
    }
    try {
      await apiClient.delete(ENDPOINTS.internshipEnrollments.adminDelete(enrollmentId));
      toast.success("Registration removed");
      void load();
    } catch {
      toast.error("Delete failed");
    }
  };

  const cohortLabel = rows[0]?.batchSnapshot?.name ?? "This cohort";
  const programLabel =
    rows[0]?.internshipSnapshot?.title ?? rows[0]?.internship?.title ?? "Program";

  if (!internshipId || !batchId) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-gray-600">Missing internship or batch.</p>
        <Link
          href="/admin/internships/entrance-exams"
          className="text-orange-600 text-sm font-medium mt-2 inline-block"
        >
          ← All entrance exams
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <Link
            href="/admin/internships/entrance-exams"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-orange-600 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            All entrance exams
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Exam registrations
          </h1>
          <p className="text-gray-600 mt-1">
            {programLabel} · {cohortLabel} — admission pipeline for this cohort
            (merit or paid seat)
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by learner name, email…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              {selected.size > 0 ? (
                <span>
                  <span className="font-semibold text-gray-900">
                    {selected.size}
                  </span>{" "}
                  selected
                  {(() => {
                    const nApprove = rows.filter(
                      (r) =>
                        selected.has(r._id) && canApproveToEnrolled(r.status),
                    ).length;
                    const nReject = rows.filter(
                      (r) =>
                        selected.has(r._id) && canRejectCandidate(r.status),
                    ).length;
                    const parts: string[] = [];
                    if (nApprove > 0) parts.push(`${nApprove} can be enrolled`);
                    if (nReject > 0) parts.push(`${nReject} can be rejected`);
                    return parts.length > 0 ? (
                      <span className="text-gray-500">
                        {" "}
                        ({parts.join(" · ")})
                      </span>
                    ) : null;
                  })()}
                </span>
              ) : (
                <span className="text-gray-500">
                  Select candidates, then approve to enroll or reject.
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2 justify-end">
              {selected.size > 0 && (
                <WhiteButton
                  type="button"
                  glow={false}
                  onClick={() => setSelected(new Set())}
                  disabled={bulkLoading}
                  className="text-sm"
                >
                  Clear selection
                </WhiteButton>
              )}
              <WhiteButton
                type="button"
                glow={false}
                onClick={() => void onBulkReject()}
                disabled={
                  bulkLoading ||
                  rows.filter(
                    (r) =>
                      selected.has(r._id) && canRejectCandidate(r.status),
                  ).length === 0
                }
                className="text-sm text-red-700 border-red-200 hover:border-red-300"
              >
                {bulkLoading ? (
                  "Updating…"
                ) : (
                  <>
                    <Ban className="w-4 h-4 mr-1.5 inline" />
                    Reject selected
                  </>
                )}
              </WhiteButton>
              <OrangeButton
                type="button"
                glow={false}
                onClick={() => void onBulkApprove()}
                disabled={
                  bulkLoading ||
                  rows.filter(
                    (r) =>
                      selected.has(r._id) && canApproveToEnrolled(r.status),
                  ).length === 0
                }
                className="text-sm"
              >
                {bulkLoading ? (
                  "Updating…"
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1.5 inline" />
                    Approve to be enrolled
                  </>
                )}
              </OrangeButton>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-10 sm:w-12 px-3 sm:pl-4 sm:pr-0 py-4">
                    <input
                      ref={headerSelectRef}
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      checked={allPageSelected && rowIdsOnPage.length > 0}
                      onChange={toggleSelectAllPage}
                      disabled={loading || rows.length === 0}
                      aria-label="Select all on this page"
                    />
                  </th>
                  <th className="px-2 sm:px-4 py-4 text-left text-xs font-semibold text-gray-700 min-w-[160px]">
                    Learner
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 min-w-[180px]">
                    Program
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 tabular-nums">
                    Exam score
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">
                    Updated
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
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
                      <p className="text-gray-500 font-medium">
                        No enrollments for this cohort
                      </p>
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row._id} className="hover:bg-gray-50 transition-colors">
                      <td className="w-10 sm:w-12 px-3 sm:pl-4 sm:pr-0 py-4 align-top">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          checked={selected.has(row._id)}
                          onChange={() => toggleRow(row._id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${userName(row.user)}`}
                        />
                      </td>
                      <td className="px-2 sm:px-4 py-4 min-w-[160px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {userName(row.user)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {row.user?.email ?? "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 min-w-[180px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                          </div>
                          <span className="text-sm text-gray-900 line-clamp-2">
                            {row.internshipSnapshot?.title ??
                              row.internship?.title ??
                              "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border capitalize ${statusClass(
                            row.status,
                          )}`}
                        >
                          {row.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 tabular-nums">
                        {row.examScore != null ? (
                          row.examScore
                        ) : !row.examAttemptedAt &&
                          (row.enrollmentType === "merit" ||
                            row.enrollmentType == null) &&
                          row.status !== "exam_registered" ? (
                          <span className="text-rose-600 italic font-medium not-tabular-nums">
                            Didn&apos;t attempt
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 whitespace-nowrap min-w-[120px]">
                        {formatDate(row.updatedAt)}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-wrap gap-2">
                          <WhiteButton
                            type="button"
                            glow={false}
                            onClick={() => void findSubmission(row._id)}
                            className="shrink-0 py-2 px-3 text-sm"
                          >
                            <FileText className="w-4 h-4 mr-1.5 inline" />
                            View submission
                          </WhiteButton>
                          {canRejectCandidate(row.status) && (
                            <WhiteButton
                              type="button"
                              glow={false}
                              onClick={() => void onRejectOne(row._id)}
                              disabled={rejectingId === row._id}
                              className="shrink-0 py-2 px-3 text-sm text-red-700 border-red-200 hover:border-red-300"
                            >
                              <Ban className="w-4 h-4 mr-1.5 inline" />
                              {rejectingId === row._id ? "Rejecting…" : "Reject"}
                            </WhiteButton>
                          )}
                          <WhiteButton
                            type="button"
                            glow={false}
                            onClick={() => void onDelete(row._id)}
                            className="shrink-0 py-2 px-3 text-sm text-red-600 border-red-200 hover:border-red-300"
                          >
                            <Trash2 className="w-4 h-4 mr-1.5 inline" />
                            Delete
                          </WhiteButton>
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
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                disabled={loading}
              />
            </div>
          )}
        </div>
      </div>

      <EntranceExamSubmissionModal
        isOpen={!!submissionId}
        submissionId={submissionId}
        onClose={() => setSubmissionId(null)}
      />
    </>
  );
}

export default function EntranceExamCohortPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      }
    >
      <CohortContent />
    </Suspense>
  );
}
