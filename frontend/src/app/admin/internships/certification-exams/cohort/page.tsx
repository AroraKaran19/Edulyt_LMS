"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  Suspense,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Search,
  User,
  BookOpen,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { InternshipEnrollmentListRow } from "@/types";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Pagination from "@/components/admin/Pagination";
import Input from "@/components/ui/inputs/Input";
import SubmissionDetailModal from "../../components/SubmissionDetailModal";

/** Certification score for one learner, derived from their exam submission. */
type ScoreInfo = {
  awarded: number;
  total: number;
  threshold?: number;
  finalized: boolean;
};

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
  if (s === "paused") return "bg-violet-100 text-violet-800 border-violet-200";
  if (s === "dropped" || s === "revoked")
    return "bg-gray-200 text-gray-700 border-gray-300";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

/** A certificate can be force-passed/failed for anyone still in the program. */
function canOverride(status: string): boolean {
  return status !== "dropped" && status !== "revoked";
}

const COL_SPAN = 7;

function CohortContent() {
  const searchParams = useSearchParams();
  const internshipId = searchParams.get("internshipId") ?? "";
  const batchId = searchParams.get("batchId") ?? "";
  const examId = searchParams.get("examId") ?? "";

  const [rows, setRows] = useState<InternshipEnrollmentListRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debounced, setDebounced] = useState("");
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, ScoreInfo>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [overridingId, setOverridingId] = useState<string | null>(null);
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
      const res = await apiClient.get(
        ENDPOINTS.internshipEnrollments.adminList,
        {
          params: {
            page,
            limit: 20,
            internshipId,
            batchId,
            lifecycle: "program",
            search: debounced || undefined,
          },
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
      toast.error("Failed to load enrollments for this cohort");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [internshipId, batchId, page, debounced]);

  useEffect(() => {
    void load();
  }, [load]);

  // Selection resets whenever the visible set changes.
  useEffect(() => {
    setSelected(new Set());
  }, [page, debounced, internshipId, batchId]);

  // Certification scores live on each learner's exam submission, not on the
  // enrollment — so pull every submission for this exam/cohort once (paginated,
  // the API caps at 50/page) and index it by enrollment.
  const loadScores = useCallback(async () => {
    if (!examId || !batchId) return;
    try {
      const map: Record<string, ScoreInfo> = {};
      let p = 1;
      let pages = 1;
      do {
        const res = await apiClient.get(
          ENDPOINTS.internshipSubmissions.adminList,
          {
            params: {
              submissionFor: "exam",
              examId,
              batchId,
              page: p,
              limit: 50,
            },
          },
        );
        const d = res.data?.data as {
          submissions?: {
            enrollmentId?: string;
            totalAwardedScore?: number;
            status?: string;
            templateSnapshot?: { totalScore?: number; thresholdScore?: number };
          }[];
          totalPages?: number;
        };
        for (const s of d?.submissions ?? []) {
          const eid = String(s.enrollmentId ?? "");
          if (!eid) continue;
          map[eid] = {
            awarded:
              typeof s.totalAwardedScore === "number" ? s.totalAwardedScore : 0,
            total: s.templateSnapshot?.totalScore ?? 0,
            threshold: s.templateSnapshot?.thresholdScore,
            finalized: s.status === "fully_reviewed",
          };
        }
        pages = d?.totalPages ?? 1;
        p += 1;
      } while (p <= pages);
      setScores(map);
    } catch {
      /* score column will just show "—"; not fatal */
    }
  }, [examId, batchId]);

  useEffect(() => {
    void loadScores();
  }, [loadScores]);

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
    if (headerSelectRef.current) {
      headerSelectRef.current.indeterminate = somePageSelected;
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
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) rowIdsOnPage.forEach((id) => next.delete(id));
      else rowIdsOnPage.forEach((id) => next.add(id));
      return next;
    });
  };

  const overrideVerb = (v: "pass" | "fail" | "clear") =>
    v === "pass" ? "Passed" : v === "fail" ? "Marked failed" : "Reset";

  const onBulkOverride = async (verdict: "pass" | "fail") => {
    const toProcess = rows.filter(
      (r) => selected.has(r._id) && canOverride(r.status),
    );
    if (toProcess.length === 0) {
      toast.info("Select learners to update their certificate result.");
      return;
    }
    const label =
      verdict === "pass"
        ? `Issue certificates to ${toProcess.length} learner(s)? This overrides the computed result.`
        : `Mark ${toProcess.length} learner(s) as failed and withhold their certificate?`;
    if (!window.confirm(label)) return;
    setBulkLoading(true);
    try {
      const results = await Promise.allSettled(
        toProcess.map((r) =>
          apiClient.patch(
            ENDPOINTS.internshipEnrollments.adminCertificateOverride(r._id),
            { verdict },
          ),
        ),
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.length - ok;
      setSelected(new Set());
      void load();
      if (ok) toast.success(`${overrideVerb(verdict)} ${ok} learner(s).`);
      if (fail) toast.error(`${fail} could not be updated.`);
    } catch {
      toast.error("Bulk update failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const onOverrideOne = async (
    enrollmentId: string,
    verdict: "pass" | "fail" | "clear",
  ) => {
    const row = rows.find((r) => r._id === enrollmentId);
    if (!row || !canOverride(row.status)) return;
    if (
      verdict !== "clear" &&
      !window.confirm(
        verdict === "pass"
          ? "Issue this learner's certificate (override the computed result)?"
          : "Mark this learner as failed and withhold their certificate?",
      )
    ) {
      return;
    }
    setOverridingId(enrollmentId);
    try {
      await apiClient.patch(
        ENDPOINTS.internshipEnrollments.adminCertificateOverride(enrollmentId),
        { verdict },
      );
      toast.success(`${overrideVerb(verdict)}.`);
      void load();
    } catch {
      toast.error("Could not update certificate result");
    } finally {
      setOverridingId(null);
    }
  };

  const findSubmission = async (enrollmentId: string) => {
    if (!examId) {
      toast.error(
        "Missing certification exam id — use Open from the list page.",
      );
      return;
    }
    try {
      const res = await apiClient.get(
        ENDPOINTS.internshipSubmissions.adminList,
        {
          params: {
            enrollmentId,
            submissionFor: "exam",
            examId,
            limit: 1,
            page: 1,
          },
        },
      );
      const list = res.data?.data as { submissions?: { _id: string }[] };
      const first = list?.submissions?.[0];
      if (first?._id) {
        setSubmissionId(first._id);
        return;
      }
      toast.info("This learner has not submitted the certification exam yet.");
    } catch {
      toast.error("Could not look up submission");
    }
  };

  const cohortLabel = rows[0]?.batchSnapshot?.name ?? "This cohort";
  const programLabel =
    rows[0]?.internshipSnapshot?.title ??
    rows[0]?.internship?.title ??
    "Program";

  const nSelectable = rows.filter(
    (r) => selected.has(r._id) && canOverride(r.status),
  ).length;

  if (!internshipId || !batchId || !examId) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-gray-600">Missing internship, batch, or exam.</p>
        <Link
          href="/admin/internships/certification-exams"
          className="text-orange-600 text-sm font-medium mt-2 inline-block"
        >
          ← All certification exams
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <Link
            href="/admin/internships/certification-exams"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-orange-600 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            All certification exams
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Certification exam submissions
          </h1>
          <p className="text-gray-600 mt-1">
            {programLabel} · {cohortLabel} — enrolled learners in this cohort
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
                  {nSelectable !== selected.size && (
                    <span className="text-gray-500">
                      {" "}
                      ({nSelectable} eligible)
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-gray-500">
                  Select learners, then pass (issue certificate) or fail.
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
                onClick={() => void onBulkOverride("fail")}
                disabled={bulkLoading || nSelectable === 0}
                className="text-sm text-red-700 border-red-200 hover:border-red-300"
              >
                {bulkLoading ? (
                  "Updating…"
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1.5 inline" />
                    Fail selected
                  </>
                )}
              </WhiteButton>
              <OrangeButton
                type="button"
                glow={false}
                onClick={() => void onBulkOverride("pass")}
                disabled={bulkLoading || nSelectable === 0}
                className="text-sm"
              >
                {bulkLoading ? (
                  "Updating…"
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1.5 inline" />
                    Pass selected
                  </>
                )}
              </OrangeButton>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
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
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 tabular-nums whitespace-nowrap">
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
                        No enrolled learners for this cohort yet
                      </p>
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const score = scores[row._id];
                    const passedScore =
                      score && typeof score.threshold === "number"
                        ? score.awarded >= score.threshold
                        : null;
                    const override = row.certificateOverride;
                    return (
                      <tr
                        key={row._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="w-10 sm:w-12 px-3 sm:pl-4 sm:pr-0 py-4 align-top">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            checked={selected.has(row._id)}
                            onChange={() => toggleRow(row._id)}
                            onClick={(e) => e.stopPropagation()}
                            disabled={!canOverride(row.status)}
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
                          {override && (
                            <div
                              className={`mt-1 text-[11px] font-semibold ${
                                override === "pass"
                                  ? "text-green-700"
                                  : "text-rose-600"
                              }`}
                            >
                              {override === "pass"
                                ? "✓ Passed (manual)"
                                : "✕ Failed (manual)"}
                            </div>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm whitespace-nowrap tabular-nums">
                          {score ? (
                            <div className="flex flex-col">
                              <span
                                className={
                                  !score.finalized
                                    ? "text-gray-700"
                                    : passedScore === false
                                      ? "text-rose-600 font-medium"
                                      : "text-green-700 font-medium"
                                }
                              >
                                {score.awarded}
                                {score.total ? ` / ${score.total}` : ""}
                              </span>
                              {!score.finalized && (
                                <span className="text-[11px] text-amber-600 not-tabular-nums">
                                  in review
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 not-tabular-nums italic">
                              not attempted
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 whitespace-nowrap min-w-[120px]">
                          {formatDate(row.updatedAt)}
                        </td>
                        <td
                          className="px-4 sm:px-6 py-4 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <WhiteButton
                              type="button"
                              glow={false}
                              onClick={() => void findSubmission(row._id)}
                              className="shrink-0 py-2 px-3 text-sm"
                            >
                              <FileText className="w-4 h-4 mr-1.5 inline" />
                              View
                            </WhiteButton>
                            {canOverride(row.status) && (
                              <>
                                <button
                                  type="button"
                                  disabled={overridingId === row._id}
                                  onClick={() =>
                                    void onOverrideOne(row._id, "pass")
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Pass
                                </button>
                                <button
                                  type="button"
                                  disabled={overridingId === row._id}
                                  onClick={() =>
                                    void onOverrideOne(row._id, "fail")
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Fail
                                </button>
                                {override && (
                                  <button
                                    type="button"
                                    disabled={overridingId === row._id}
                                    onClick={() =>
                                      void onOverrideOne(row._id, "clear")
                                    }
                                    className="text-xs font-semibold text-gray-500 hover:text-gray-700 underline underline-offset-2 disabled:opacity-50"
                                  >
                                    Clear
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
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

      <SubmissionDetailModal
        isOpen={!!submissionId}
        submissionId={submissionId}
        onClose={() => {
          setSubmissionId(null);
          void load();
        }}
      />
    </>
  );
}

export default function CertificationExamCohortPage() {
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
