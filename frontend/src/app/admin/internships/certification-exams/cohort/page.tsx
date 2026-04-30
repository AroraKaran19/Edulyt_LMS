"use client";

import {
  useCallback,
  useEffect,
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
} from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { InternshipEnrollmentListRow } from "@/types";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import Input from "@/components/ui/inputs/Input";
import EntranceExamSubmissionModal from "../../entrance-exams/components/EntranceExamSubmissionModal";

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
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
  if (s === "paused")
    return "bg-violet-100 text-violet-800 border-violet-200";
  if (
    s === "dropped" ||
    s === "revoked"
  )
    return "bg-gray-200 text-gray-700 border-gray-300";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

const COL_SPAN = 5;

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
          lifecycle: "program",
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

  const findSubmission = async (enrollmentId: string) => {
    if (!examId) {
      toast.error("Missing certification exam id — use Open from the list page.");
      return;
    }
    try {
      const res = await apiClient.get(ENDPOINTS.internshipSubmissions.adminList, {
        params: {
          enrollmentId,
          submissionFor: "exam",
          examId,
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
      toast.info("This learner has not submitted the certification exam yet.");
    } catch {
      toast.error("Could not look up submission");
    }
  };

  const cohortLabel = rows[0]?.batchSnapshot?.name ?? "This cohort";
  const programLabel =
    rows[0]?.internshipSnapshot?.title ?? rows[0]?.internship?.title ?? "Program";

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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by learner name, email…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-2 sm:px-4 py-4 text-left text-xs font-semibold text-gray-700 min-w-[160px]">
                    Learner
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 min-w-[180px]">
                    Program
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                    Status
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
                  rows.map((row) => (
                    <tr key={row._id} className="hover:bg-gray-50 transition-colors">
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
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 whitespace-nowrap min-w-[120px]">
                        {formatDate(row.updatedAt)}
                      </td>
                      <td
                        className="px-4 sm:px-6 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <WhiteButton
                          type="button"
                          glow={false}
                          onClick={() => void findSubmission(row._id)}
                          className="shrink-0 py-2 px-3 text-sm"
                        >
                          <FileText className="w-4 h-4 mr-1.5 inline" />
                          View submission
                        </WhiteButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <p className="text-sm text-gray-700">
                Showing page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <WhiteButton
                  type="button"
                  glow={false}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  Previous
                </WhiteButton>
                <OrangeButton
                  type="button"
                  glow={false}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                >
                  Next
                </OrangeButton>
              </div>
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
