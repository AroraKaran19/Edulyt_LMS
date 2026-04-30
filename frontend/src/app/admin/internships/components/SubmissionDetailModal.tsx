"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";

// ─── Local types matching the serialized shape from the backend ───────────────

type PopulatedUser = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  name?: string;
};

type SnapshotOption = {
  optionId: string;
  text: string;
  isCorrect?: boolean;
};

type SnapshotQuestion = {
  questionId: string;
  questionText: string;
  type: "mcq" | "file_upload";
  score: number;
  options?: SnapshotOption[];
  referenceFile?: string;
};

type TaskSnapshot = {
  taskId: string;
  title: string;
  description?: string;
  questions: SnapshotQuestion[];
  totalScore: number;
  scoreThreshold: number;
  unlockAfterDays: number;
  dueDays: number;
  snapshotAt?: string;
};

type ExamSnapshot = {
  examId: string;
  examType?: "entrance" | "certification";
  title: string;
  description?: string;
  questions: SnapshotQuestion[];
  totalScore: number;
  thresholdScore?: number;
  examStartAt?: string;
  examEndAt?: string;
  examResultAt?: string;
  snapshotAt?: string;
};

type MCQResponse = {
  question: string;
  selectedOptions: string[];
  isCorrect?: boolean;
  awardedScore?: number;
};

type FileResponse = {
  question: string;
  currentFile: string;
  status: string;
  awardedScore?: number;
  reviewedAt?: string;
  reviewNote?: string;
  uploadHistory?: { file: string; uploadedAt: string }[];
};

type FullSubmission = {
  _id: string;
  submissionFor: "exam" | "task";
  examId?: string;
  taskId?: string;
  internshipId: string;
  batchId: string;
  userId: string | PopulatedUser;
  enrollmentId: string;
  templateSnapshot: TaskSnapshot | ExamSnapshot;
  mcqResponses: MCQResponse[];
  fileResponses: FileResponse[];
  totalAwardedScore: number;
  status: string;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  isOpen: boolean;
  submissionId: string | null;
  onClose: () => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function userLabel(u: string | PopulatedUser): string {
  if (typeof u === "string") return u;
  if (u.name?.trim()) return u.name.trim();
  const parts = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  if (u.email) return u.email;
  return u._id ? String(u._id) : "—";
}

function userEmail(u: string | PopulatedUser): string | null {
  if (typeof u === "object" && u.email) return u.email;
  return null;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-yellow-50 text-yellow-800 border-yellow-200",
  submitted: "bg-blue-50 text-blue-800 border-blue-200",
  partially_reviewed: "bg-orange-50 text-orange-800 border-orange-200",
  fully_reviewed: "bg-green-50 text-green-800 border-green-200",
};

const FILE_STATUS_STYLES: Record<string, string> = {
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  under_review: "bg-yellow-50 text-yellow-700 border-yellow-200",
  re_upload_requested: "bg-red-50 text-red-700 border-red-200",
  reviewed: "bg-green-50 text-green-700 border-green-200",
};

function StatusBadge({ status, styles }: { status: string; styles: Record<string, string> }) {
  const cls = styles[status] ?? "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
      {children}
    </p>
  );
}

// ─── MCQ question block ───────────────────────────────────────────────────────

function MCQBlock({
  question,
  response,
}: {
  question: SnapshotQuestion;
  response: MCQResponse | undefined;
}) {
  const selectedSet = new Set(response?.selectedOptions ?? []);
  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-900 font-medium leading-snug">
          {question.questionText}
        </p>
        <span className="shrink-0 text-xs text-gray-500 tabular-nums whitespace-nowrap">
          {typeof response?.awardedScore === "number"
            ? `${response.awardedScore} / ${question.score}`
            : `— / ${question.score}`}{" "}
          pts
        </span>
      </div>

      {Array.isArray(question.options) && question.options.length > 0 && (
        <ul className="space-y-1">
          {question.options.map((opt) => {
            const isSelected = selectedSet.has(opt.optionId);
            const isCorrect = opt.isCorrect === true;
            let cls =
              "flex items-center gap-2 text-sm px-2 py-1 rounded-md border text-gray-700 border-transparent";
            if (isSelected && isCorrect)
              cls += " bg-green-50 border-green-200 text-green-800";
            else if (isSelected && !isCorrect)
              cls += " bg-red-50 border-red-200 text-red-800";
            else if (!isSelected && isCorrect)
              cls += " bg-green-50/50 border-green-100 text-green-700";
            else cls += " bg-gray-50 border-gray-100";

            return (
              <li key={opt.optionId} className={cls}>
                <span className="size-4 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                  style={{
                    borderColor: isSelected
                      ? isCorrect ? "#16a34a" : "#dc2626"
                      : isCorrect ? "#86efac" : "#d1d5db",
                    backgroundColor: isSelected
                      ? isCorrect ? "#dcfce7" : "#fee2e2"
                      : "transparent",
                  }}>
                  {isSelected ? (isCorrect ? "✓" : "✗") : isCorrect ? "✓" : ""}
                </span>
                <span>{opt.text}</span>
                {isCorrect && (
                  <span className="ml-auto text-xs font-medium text-green-700">
                    correct
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!response && (
        <p className="text-xs text-gray-400 italic">No answer recorded</p>
      )}

      {response && typeof response.isCorrect === "boolean" && (
        <p className={`text-xs font-semibold ${response.isCorrect ? "text-green-600" : "text-red-600"}`}>
          {response.isCorrect ? "Correct" : "Incorrect"}
        </p>
      )}
    </div>
  );
}

// ─── File question block ──────────────────────────────────────────────────────

function FileBlock({
  question,
  response,
}: {
  question: SnapshotQuestion;
  response: FileResponse | undefined;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-900 font-medium leading-snug">
          {question.questionText}
        </p>
        <span className="shrink-0 text-xs text-gray-500 tabular-nums whitespace-nowrap">
          {typeof response?.awardedScore === "number"
            ? `${response.awardedScore} / ${question.score}`
            : `— / ${question.score}`}{" "}
          pts
        </span>
      </div>

      {question.referenceFile && (
        <a
          href={question.referenceFile}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          <ExternalLink className="size-3" /> Reference file
        </a>
      )}

      {response ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <StatusBadge status={response.status} styles={FILE_STATUS_STYLES} />
            <a
              href={response.currentFile}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <ExternalLink className="size-3" /> View submission
            </a>
          </div>
          {response.reviewNote && (
            <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded px-2 py-1">
              <span className="font-medium">Reviewer note:</span>{" "}
              {response.reviewNote}
            </p>
          )}
          {response.reviewedAt && (
            <p className="text-xs text-gray-400">
              Reviewed: {formatDate(response.reviewedAt)}
            </p>
          )}
          {Array.isArray(response.uploadHistory) &&
            response.uploadHistory.length > 1 && (
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">
                  Upload history ({response.uploadHistory.length} attempts)
                </summary>
                <ul className="mt-1 space-y-0.5 pl-2">
                  {response.uploadHistory.map((h, i) => (
                    <li key={i}>
                      <a
                        href={h.file}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Attempt {i + 1}
                      </a>{" "}
                      — {formatDate(h.uploadedAt)}
                    </li>
                  ))}
                </ul>
              </details>
            )}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">No file uploaded</p>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function SubmissionDetailModal({ isOpen, submissionId, onClose }: Props) {
  const [sub, setSub] = useState<FullSubmission | null>(null);
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    if (!isOpen || !submissionId) {
      setSub(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(
          ENDPOINTS.internshipSubmissions.adminById(submissionId),
        );
        if (!cancelled) {
          setSub((res.data?.data as FullSubmission) ?? null);
        }
      } catch {
        if (!cancelled) {
          toast.error("Could not load submission details");
          onClose();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, submissionId, onClose]);

  const snap = sub?.templateSnapshot;
  const isExam = sub?.submissionFor === "exam";
  const examSnap = isExam ? (snap as ExamSnapshot | undefined) : undefined;

  const showCertFinalize =
    isExam &&
    examSnap?.examType === "certification" &&
    (sub?.status === "submitted" || sub?.status === "partially_reviewed");

  async function handleFinalizeCertification() {
    if (!submissionId) return;
    setFinalizing(true);
    try {
      const res = await apiClient.post(
        ENDPOINTS.internshipSubmissions.adminFinalizeCertification(submissionId),
      );
      setSub((res.data?.data as FullSubmission) ?? null);
      toast.success("Certification review finalized");
    } catch {
      toast.error("Could not finalize certification review");
    } finally {
      setFinalizing(false);
    }
  }

  const mcqMap = new Map<string, MCQResponse>(
    (sub?.mcqResponses ?? []).map((r) => [r.question, r]),
  );
  const fileMap = new Map<string, FileResponse>(
    (sub?.fileResponses ?? []).map((r) => [r.question, r]),
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submission details"
      className="max-w-3xl w-full mx-4 max-h-[92vh]"
    >
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          <p className="text-sm text-gray-500">Loading submission…</p>
        </div>
      ) : !sub ? (
        <p className="text-gray-500 text-center py-8">No data.</p>
      ) : (
        <div className="flex flex-col gap-5 overflow-y-auto max-h-[calc(92vh-7rem)] pr-1">

          {/* ── Meta row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <SectionLabel>Learner</SectionLabel>
              <p className="text-gray-900 font-medium">{userLabel(sub.userId)}</p>
              {userEmail(sub.userId) && (
                <p className="text-xs text-gray-500">{userEmail(sub.userId)}</p>
              )}
            </div>
            <div>
              <SectionLabel>Status</SectionLabel>
              <StatusBadge status={sub.status} styles={STATUS_STYLES} />
            </div>
            <div>
              <SectionLabel>Score</SectionLabel>
              <p className="text-gray-900 font-semibold tabular-nums">
                {sub.totalAwardedScore}{" "}
                <span className="text-gray-400 font-normal">
                  / {snap?.totalScore ?? "—"}
                </span>
              </p>
            </div>
            <div>
              <SectionLabel>Type</SectionLabel>
              <p className="text-gray-800 capitalize">{sub.submissionFor}</p>
            </div>
            <div>
              <SectionLabel>Batch ID</SectionLabel>
              <p className="text-gray-800 font-mono text-xs break-all">{sub.batchId}</p>
            </div>
            <div>
              <SectionLabel>Submitted</SectionLabel>
              <p className="text-gray-800">{formatDate(sub.submittedAt)}</p>
            </div>
          </div>

          {/* ── Template info ── */}
          <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/50 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-gray-900 text-sm">{snap?.title ?? "—"}</p>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                Snapshot: {formatDate((snap as { snapshotAt?: string })?.snapshotAt)}
              </span>
            </div>
            {snap?.description?.trim() && (
              <p className="text-xs text-gray-600 whitespace-pre-wrap">{snap.description}</p>
            )}
            {examSnap && (
              <div className="flex flex-wrap gap-3 pt-1 text-xs text-gray-600">
                {examSnap.examStartAt && (
                  <span>Exam starts: {formatDate(examSnap.examStartAt)}</span>
                )}
                {examSnap.examEndAt && (
                  <span>Exam ends: {formatDate(examSnap.examEndAt)}</span>
                )}
                {examSnap.examResultAt && (
                  <span>Results at: {formatDate(examSnap.examResultAt)}</span>
                )}
                {typeof examSnap.thresholdScore === "number" && (
                  <span>Merit threshold: {examSnap.thresholdScore}</span>
                )}
                {examSnap.examType && (
                  <span className="font-medium text-gray-800">
                    Exam type: {examSnap.examType}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Questions & answers ── */}
          {(snap?.questions?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <SectionLabel>
                Questions ({snap!.questions.length})
              </SectionLabel>
              <div className="space-y-2">
                {snap!.questions.map((q, i) => (
                  <div key={q.questionId}>
                    <p className="text-xs text-gray-400 mb-1">Q{i + 1}</p>
                    {q.type === "mcq" ? (
                      <MCQBlock
                        question={q}
                        response={mcqMap.get(q.questionId)}
                      />
                    ) : (
                      <FileBlock
                        question={q}
                        response={fileMap.get(q.questionId)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Footer timestamps ── */}
          <div className="text-xs text-gray-400 border-t border-gray-100 pt-2 flex flex-wrap gap-3">
            <span>Created: {formatDate(sub.createdAt)}</span>
            <span>Updated: {formatDate(sub.updatedAt)}</span>
          </div>

          {showCertFinalize && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
              <p className="font-semibold text-amber-900 mb-1">
                Certification final sign-off
              </p>
              <p className="text-amber-900/90 mb-2">
                MCQ scores are provisional until you finalize. Ensure every
                file-upload question is scored, then close the review.
              </p>
              <OrangeButton
                type="button"
                glow={false}
                disabled={finalizing}
                onClick={() => void handleFinalizeCertification()}
              >
                {finalizing ? "Finalizing…" : "Finalize certification review"}
              </OrangeButton>
            </div>
          )}

          <div className="flex justify-end pt-1 gap-2">
            <WhiteButton type="button" glow={false} onClick={onClose}>
              Close
            </WhiteButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
