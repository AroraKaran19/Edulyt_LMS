"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  CheckCircle2,
  RotateCcw,
  Check,
  X,
  Loader2,
  Paperclip,
  MessageSquareQuote,
  Award,
} from "lucide-react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { cn } from "@/lib/utils";

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
  learnerComment?: string;
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

function initials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type PillStyle = { dot: string; pill: string };

const STATUS_STYLES: Record<string, PillStyle> = {
  draft: { dot: "bg-stone-400", pill: "bg-stone-100 text-stone-600 border-stone-200" },
  submitted: { dot: "bg-sky-500", pill: "bg-sky-50 text-sky-700 border-sky-200" },
  partially_reviewed: { dot: "bg-amber-500", pill: "bg-amber-50 text-amber-800 border-amber-200" },
  fully_reviewed: { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const FILE_STATUS_STYLES: Record<string, PillStyle> = {
  submitted: { dot: "bg-sky-500", pill: "bg-sky-50 text-sky-700 border-sky-200" },
  under_review: { dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700 border-amber-200" },
  re_upload_requested: { dot: "bg-rose-500", pill: "bg-rose-50 text-rose-700 border-rose-200" },
  reviewed: { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function StatusBadge({
  status,
  map,
}: {
  status: string;
  map: Record<string, PillStyle>;
}) {
  const s = map[status] ?? {
    dot: "bg-stone-400",
    pill: "bg-stone-100 text-stone-600 border-stone-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        s.pill,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.12em]">
      {children}
    </p>
  );
}

/** Score chip: shows awarded / max, tinted green once any credit is given. */
function ScorePill({ awarded, max }: { awarded: number | null; max: number }) {
  const credited = awarded !== null && awarded > 0;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold tabular-nums",
        credited
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-stone-200 bg-stone-50 text-stone-500",
      )}
    >
      <Award className="size-3.5" />
      {awarded ?? "—"}
      <span className="font-medium text-stone-400">/ {max}</span>
    </span>
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
    <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-stone-900 leading-relaxed">
          {question.questionText}
        </p>
        <ScorePill
          awarded={
            typeof response?.awardedScore === "number"
              ? response.awardedScore
              : null
          }
          max={question.score}
        />
      </div>

      {Array.isArray(question.options) && question.options.length > 0 && (
        <ul className="space-y-1.5">
          {question.options.map((opt) => {
            const isSelected = selectedSet.has(opt.optionId);
            const isCorrect = opt.isCorrect === true;
            return (
              <li
                key={opt.optionId}
                className={cn(
                  "flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg border transition-colors",
                  isSelected && isCorrect && "bg-emerald-50 border-emerald-200 text-emerald-900",
                  isSelected && !isCorrect && "bg-rose-50 border-rose-200 text-rose-900",
                  !isSelected && isCorrect && "bg-emerald-50/40 border-emerald-100 text-emerald-700",
                  !isSelected && !isCorrect && "bg-stone-50/60 border-stone-100 text-stone-600",
                )}
              >
                <span
                  className={cn(
                    "size-4 shrink-0 rounded-full border-2 flex items-center justify-center text-[10px] font-bold",
                    isSelected && isCorrect && "border-emerald-500 bg-emerald-500 text-white",
                    isSelected && !isCorrect && "border-rose-500 bg-rose-500 text-white",
                    !isSelected && isCorrect && "border-emerald-300 text-emerald-500",
                    !isSelected && !isCorrect && "border-stone-300",
                  )}
                >
                  {isSelected ? (isCorrect ? "✓" : "✗") : isCorrect ? "✓" : ""}
                </span>
                <span>{opt.text}</span>
                {isCorrect && (
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                    correct
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!response && (
        <p className="text-xs text-stone-400 italic">No answer recorded</p>
      )}

      {response && typeof response.isCorrect === "boolean" && (
        <p
          className={cn(
            "inline-flex items-center gap-1 text-xs font-semibold",
            response.isCorrect ? "text-emerald-600" : "text-rose-600",
          )}
        >
          {response.isCorrect ? <Check className="size-3.5" /> : <X className="size-3.5" />}
          {response.isCorrect ? "Correct" : "Incorrect"}
        </p>
      )}
    </div>
  );
}

// ─── File question block ──────────────────────────────────────────────────────

const FILE_ACCENT: Record<string, string> = {
  reviewed: "before:bg-emerald-400",
  re_upload_requested: "before:bg-rose-400",
  under_review: "before:bg-amber-400",
  submitted: "before:bg-sky-400",
};

function FileBlock({
  question,
  response,
  submissionId,
  reviewable,
  onReviewed,
}: {
  question: SnapshotQuestion;
  response: FileResponse | undefined;
  submissionId: string;
  reviewable: boolean;
  onReviewed: (updated: FullSubmission) => void;
}) {
  // null = just the two action buttons; "approve"/"resubmit" reveal the
  // focused input each action needs (credits / note).
  const [mode, setMode] = useState<null | "approve" | "resubmit">(null);
  const [score, setScore] = useState<string>(
    typeof response?.awardedScore === "number"
      ? String(response.awardedScore)
      : "",
  );
  const [note, setNote] = useState<string>(response?.reviewNote ?? "");
  const [busy, setBusy] = useState(false);

  const max = question.score;
  const awarded =
    typeof response?.awardedScore === "number" ? response.awardedScore : null;

  async function submitReview(status: "reviewed" | "re_upload_requested") {
    let awardedScore: number;
    if (status === "reviewed") {
      const parsed = Number(score);
      if (score.trim() === "" || Number.isNaN(parsed) || parsed < 0) {
        toast.error("Enter the marks before approving.");
        return;
      }
      if (parsed > max) {
        toast.error(`Marks cannot exceed ${max}.`);
        return;
      }
      awardedScore = parsed;
    } else {
      if (!note.trim()) {
        toast.error("Add a note telling the learner what to fix.");
        return;
      }
      // Requesting a resubmission always resets any previously allotted credits.
      awardedScore = 0;
    }
    setBusy(true);
    try {
      const res = await apiClient.patch(
        ENDPOINTS.internshipSubmissions.adminReviewFile(
          submissionId,
          question.questionId,
        ),
        { awardedScore, reviewNote: note.trim(), status },
      );
      onReviewed(res.data?.data as FullSubmission);
      toast.success(
        status === "reviewed" ? "Approved." : "Resubmission requested.",
      );
      setMode(null);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not save review.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  const sliderVal = Math.min(max, Math.max(0, Number(score) || 0));
  const presets = [
    { label: "0", value: 0 },
    { label: "½", value: Math.round(max / 2) },
    { label: "Full", value: max },
  ];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm",
        "before:absolute before:inset-y-0 before:left-0 before:w-1",
        response ? FILE_ACCENT[response.status] ?? "before:bg-stone-300" : "before:bg-stone-200",
      )}
    >
      <div className="space-y-3 p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-stone-900 leading-relaxed">
            {question.questionText}
          </p>
          <ScorePill awarded={awarded} max={max} />
        </div>

        {/* Attachments row */}
        <div className="flex flex-wrap items-center gap-2">
          {response ? (
            <StatusBadge status={response.status} map={FILE_STATUS_STYLES} />
          ) : null}
          {question.referenceFile && (
            <a
              href={question.referenceFile}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-100"
            >
              <Paperclip className="size-3.5" /> Input files
            </a>
          )}
          {response?.currentFile?.trim() ? (
            <a
              href={response.currentFile}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100"
            >
              <ExternalLink className="size-3.5" /> View submission
            </a>
          ) : response ? (
            <span className="text-xs text-stone-400">No file attached</span>
          ) : null}
        </div>

        {!response && (
          <p className="text-xs text-stone-400 italic">No answer recorded</p>
        )}

        {/* Notes */}
        {response?.learnerComment?.trim() ? (
          <div className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mb-0.5">
              Learner note
            </p>
            <p className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed">
              {response.learnerComment.trim()}
            </p>
          </div>
        ) : null}
        {response?.reviewNote ? (
          <div className="flex gap-2 rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2">
            <MessageSquareQuote className="size-3.5 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 mb-0.5">
                Reviewer note
              </p>
              <p className="text-xs text-amber-900 whitespace-pre-wrap leading-relaxed">
                {response.reviewNote}
              </p>
            </div>
          </div>
        ) : null}
        {response?.reviewedAt && (
          <p className="text-[11px] text-stone-400">
            Reviewed {formatDate(response.reviewedAt)}
          </p>
        )}

        {Array.isArray(response?.uploadHistory) &&
          response!.uploadHistory!.length > 1 && (
            <details className="text-xs text-stone-500">
              <summary className="cursor-pointer font-medium hover:text-stone-700">
                Upload history ({response!.uploadHistory!.length} attempts)
              </summary>
              <ul className="mt-1.5 space-y-1 pl-2 border-l-2 border-stone-100">
                {response!.uploadHistory!.map((h, i) => (
                  <li key={i} className="pl-2">
                    <a
                      href={h.file}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 hover:underline"
                    >
                      Attempt {i + 1}
                    </a>{" "}
                    <span className="text-stone-400">— {formatDate(h.uploadedAt)}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

        {/* ── Review actions ── */}
        {reviewable && (
          <div className="border-t border-stone-100 pt-3">
            {mode === null && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setScore(awarded !== null ? String(awarded) : "");
                    setMode("approve");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow active:scale-[0.98]"
                >
                  <CheckCircle2 className="size-4" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setMode("resubmit")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-600 transition-all hover:border-rose-300 hover:bg-rose-50 active:scale-[0.98]"
                >
                  <RotateCcw className="size-4" />
                  Request resubmission
                </button>
              </div>
            )}

            {/* Approve → allot credits */}
            {mode === "approve" && (
              <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                    Marks
                  </label>
                  <div className="flex items-baseline gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={max}
                      value={score}
                      autoFocus
                      onChange={(e) => setScore(e.target.value)}
                      className="w-16 rounded-lg border border-emerald-300 bg-white px-2 py-1 text-right text-sm font-bold tabular-nums text-emerald-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="0"
                    />
                    <span className="text-xs font-medium text-stone-400">/ {max}</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={max}
                  value={sliderVal}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full accent-emerald-600 cursor-pointer"
                />

                <div className="flex gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setScore(String(p.value))}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-[11px] font-semibold tabular-nums transition-colors",
                        sliderVal === p.value
                          ? "border-emerald-400 bg-emerald-100 text-emerald-800"
                          : "border-stone-200 bg-white text-stone-500 hover:border-emerald-300 hover:text-emerald-700",
                      )}
                    >
                      {p.label}
                      {p.label !== "0" && p.label !== "½" ? ` (${p.value})` : ""}
                    </button>
                  ))}
                </div>

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Feedback for the learner (optional)"
                  className="w-full resize-none rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void submitReview("reviewed")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-60 active:scale-[0.98]"
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    {busy ? "Saving…" : "Confirm approval"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setMode(null)}
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Resubmit → note + reset credits */}
            {mode === "resubmit" && (
              <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/50 p-3.5">
                <label className="block text-[11px] font-bold uppercase tracking-wide text-rose-800">
                  What should the learner fix?
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  autoFocus
                  placeholder="Explain what needs to change before they re-upload…"
                  className="w-full resize-none rounded-lg border border-rose-200 bg-white px-2.5 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10"
                />
                <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-600">
                  <RotateCcw className="size-3.5" />
                  Any allotted credits for this question reset to 0.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void submitReview("re_upload_requested")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-rose-700 disabled:opacity-60 active:scale-[0.98]"
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                    {busy ? "Saving…" : "Request resubmission"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setMode(null)}
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function SubmissionDetailModal({ isOpen, submissionId, onClose }: Props) {
  const [sub, setSub] = useState<FullSubmission | null>(null);
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [certOverride, setCertOverride] = useState<"pass" | "fail" | null>(null);
  const [savingOverride, setSavingOverride] = useState<
    "pass" | "fail" | "clear" | null
  >(null);

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
  const isCertification = isExam && examSnap?.examType === "certification";

  const showCertFinalize =
    isExam &&
    examSnap?.examType === "certification" &&
    (sub?.status === "submitted" || sub?.status === "partially_reviewed");

  // Load the learner's current certificate override so the Pass/Fail/Clear
  // control reflects state. Runs once per certification submission.
  useEffect(() => {
    const enrollmentId = sub?.enrollmentId;
    if (!isOpen || !isCertification || !enrollmentId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(
          ENDPOINTS.internshipEnrollments.adminById(enrollmentId),
        );
        const row = res.data?.data as
          | { certificateOverride?: "pass" | "fail" | null }
          | undefined;
        if (!cancelled) setCertOverride(row?.certificateOverride ?? null);
      } catch {
        /* non-fatal — leave the control in its default state */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, isCertification, sub?.enrollmentId]);

  async function handleCertificateOverride(verdict: "pass" | "fail" | "clear") {
    const enrollmentId = sub?.enrollmentId;
    if (!enrollmentId || savingOverride) return;
    setSavingOverride(verdict);
    try {
      const res = await apiClient.patch(
        ENDPOINTS.internshipEnrollments.adminCertificateOverride(enrollmentId),
        { verdict },
      );
      const row = res.data?.data as
        | { certificateOverride?: "pass" | "fail" | null }
        | undefined;
      setCertOverride(row?.certificateOverride ?? null);
      toast.success(
        verdict === "pass"
          ? "Passed — certificate issued"
          : verdict === "fail"
            ? "Marked as failed"
            : "Reverted to computed result",
      );
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "response" in e &&
        e.response &&
        typeof e.response === "object" &&
        "data" in e.response &&
        e.response.data &&
        typeof e.response.data === "object" &&
        "message" in e.response.data
          ? String((e.response.data as { message?: string }).message)
          : "Could not update certificate result";
      toast.error(msg);
    } finally {
      setSavingOverride(null);
    }
  }

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

  const totalScore = snap?.totalScore ?? 0;
  const pct =
    totalScore > 0 && sub
      ? Math.max(0, Math.min(100, Math.round((sub.totalAwardedScore / totalScore) * 100)))
      : 0;
  const learnerName = sub ? userLabel(sub.userId) : "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submission details"
      className="max-w-3xl w-full mx-4 max-h-[92vh]"
    >
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="size-8 animate-spin text-orange-500" />
          <p className="text-sm text-stone-500">Loading submission…</p>
        </div>
      ) : !sub ? (
        <p className="text-stone-500 text-center py-8">No data.</p>
      ) : (
        <div className="flex flex-col gap-5 overflow-y-auto max-h-[calc(92vh-7rem)] pr-1">
          {/* ── Hero: learner + status + score meter ── */}
          <div className="rounded-2xl border border-stone-200 bg-linear-to-br from-stone-50 to-white p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-sm font-bold text-amber-100">
                  {initials(learnerName)}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-stone-900 leading-tight truncate">
                    {learnerName}
                  </p>
                  {userEmail(sub.userId) && (
                    <p className="text-xs text-stone-500 truncate">
                      {userEmail(sub.userId)}
                    </p>
                  )}
                  <div className="mt-1.5">
                    <StatusBadge status={sub.status} map={STATUS_STYLES} />
                  </div>
                </div>
              </div>

              {/* Score meter */}
              <div className="min-w-[140px] shrink-0">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-2xl font-bold tabular-nums text-stone-900">
                    {sub.totalAwardedScore}
                  </span>
                  <span className="text-sm font-medium text-stone-400">
                    / {totalScore || "—"}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-stone-300",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                  {pct}% scored
                </p>
              </div>
            </div>

            {/* secondary meta */}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-stone-200/70 pt-3">
              <div>
                <SectionLabel>Type</SectionLabel>
                <p className="text-sm font-medium text-stone-800 capitalize">{sub.submissionFor}</p>
              </div>
              <div>
                <SectionLabel>Submitted</SectionLabel>
                <p className="text-sm font-medium text-stone-800">{formatDate(sub.submittedAt)}</p>
              </div>
              <div className="min-w-0">
                <SectionLabel>Batch ID</SectionLabel>
                <p className="font-mono text-xs text-stone-500 break-all">{sub.batchId}</p>
              </div>
            </div>
          </div>

          {/* ── Template info ── */}
          <div className="rounded-xl border border-stone-100 bg-stone-50/60 p-4 space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold text-stone-900 text-sm">{snap?.title ?? "—"}</p>
              <span className="text-[11px] text-stone-400 whitespace-nowrap shrink-0">
                Snapshot {formatDate((snap as { snapshotAt?: string })?.snapshotAt)}
              </span>
            </div>
            {snap?.description?.trim() && (
              <p className="text-xs text-stone-600 whitespace-pre-wrap leading-relaxed">
                {snap.description}
              </p>
            )}
            {examSnap && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1.5 text-[11px] text-stone-500">
                {examSnap.examStartAt && <span>Starts {formatDate(examSnap.examStartAt)}</span>}
                {examSnap.examEndAt && <span>Ends {formatDate(examSnap.examEndAt)}</span>}
                {examSnap.examResultAt && <span>Results {formatDate(examSnap.examResultAt)}</span>}
                {typeof examSnap.thresholdScore === "number" && (
                  <span>Merit threshold {examSnap.thresholdScore}</span>
                )}
                {examSnap.examType && (
                  <span className="font-semibold text-stone-700 capitalize">
                    {examSnap.examType} exam
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Questions & answers ── */}
          {(snap?.questions?.length ?? 0) > 0 && (
            <div className="space-y-3">
              <SectionLabel>Questions ({snap!.questions.length})</SectionLabel>
              <div className="space-y-3">
                {snap!.questions.map((q, i) => (
                  <div key={q.questionId} className="space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-400">
                      <span className="flex size-5 items-center justify-center rounded-md bg-stone-100 text-[10px] font-bold text-stone-600">
                        {i + 1}
                      </span>
                      Question {i + 1}
                    </span>
                    {q.type === "mcq" ? (
                      <MCQBlock question={q} response={mcqMap.get(q.questionId)} />
                    ) : (
                      <FileBlock
                        question={q}
                        response={fileMap.get(q.questionId)}
                        submissionId={sub._id}
                        reviewable={sub.status !== "draft"}
                        onReviewed={(updated) => setSub(updated)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showCertFinalize && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
              <p className="font-bold text-amber-900 text-sm mb-1">
                Certification final sign-off
              </p>
              <p className="text-xs text-amber-900/90 mb-3 leading-relaxed">
                MCQ scores are provisional until you finalize. Make sure every
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

          {isCertification && sub.enrollmentId ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 space-y-2">
              <p className="font-bold text-emerald-900 text-sm">
                Certificate result
              </p>
              <p className="text-xs text-emerald-900/90 leading-relaxed">
                {certOverride === "pass" ? (
                  <>
                    Manually <span className="font-semibold">passed</span> — the
                    certificate has been issued to the learner.
                  </>
                ) : certOverride === "fail" ? (
                  <>
                    Manually <span className="font-semibold">failed</span> —
                    certificate withheld.
                  </>
                ) : (
                  <>
                    Automatic — based on the exam score plus tasks &amp;
                    attendance. Use <span className="font-semibold">Pass</span> to
                    issue a certificate to a learner who fell short.
                  </>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={savingOverride !== null || certOverride === "pass"}
                  onClick={() => void handleCertificateOverride("pass")}
                  className="rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {savingOverride === "pass" ? "Passing…" : "Pass"}
                </button>
                <button
                  type="button"
                  disabled={savingOverride !== null || certOverride === "fail"}
                  onClick={() => void handleCertificateOverride("fail")}
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {savingOverride === "fail" ? "Failing…" : "Fail"}
                </button>
                <button
                  type="button"
                  disabled={savingOverride !== null || !certOverride}
                  onClick={() => void handleCertificateOverride("clear")}
                  title="Revert to the computed result"
                  className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {savingOverride === "clear" ? "Clearing…" : "Clear"}
                </button>
              </div>
            </div>
          ) : null}

          {/* ── Footer ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3">
            <div className="text-[11px] text-stone-400 flex flex-wrap gap-x-4">
              <span>Created {formatDate(sub.createdAt)}</span>
              <span>Updated {formatDate(sub.updatedAt)}</span>
            </div>
            <WhiteButton type="button" glow={false} onClick={onClose}>
              Close
            </WhiteButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
