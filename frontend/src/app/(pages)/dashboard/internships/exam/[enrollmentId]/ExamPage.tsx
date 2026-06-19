"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, CircleDot, Loader2, Lock, Send } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { LearnerEntranceExam, LearnerEntranceExamQuestion } from "@/types";
import LearnerInternshipSubmissionFileField from "../../components/LearnerInternshipSubmissionFileField";

type SubmitStatus = "idle" | "submitting" | "submitted";

/** Discourages selecting / copying question text and MCQ options (learners can still use checkboxes and file fields). */
function ExamAntiCopyBlock({ children }: { children: ReactNode }) {
  return (
    <div
      className="select-none"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}

function MCQOption({
  opt,
  selected,
  onChange,
  disabled,
}: {
  opt: { optionId: string; text: string };
  selected: boolean;
  onChange: () => void;
  disabled: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border-2 p-3 sm:p-4 cursor-pointer transition-colors ${
        disabled
          ? "cursor-not-allowed opacity-70"
          : "hover:border-amber-400 hover:bg-amber-50/50"
      } ${
        selected ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-white"
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      <span
        className={`mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center ${
          selected
            ? "border-amber-500 bg-amber-500"
            : "border-stone-300 bg-white"
        }`}
      >
        {selected && (
          <svg
            className="h-3 w-3 text-white"
            viewBox="0 0 12 12"
            fill="currentColor"
          >
            <path
              d="M10 3L5 8.5 2 5.5"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="text-sm text-stone-800 leading-relaxed">{opt.text}</span>
    </label>
  );
}

function QuestionCard({
  q,
  index,
  answers,
  onChange,
  disabled,
  submissionId,
  fileUrls,
  fileComments,
  onFileUploaded,
  onLearnerCommentSaved,
}: {
  q: LearnerEntranceExamQuestion;
  index: number;
  answers: Record<string, string[]>;
  onChange: (qId: string, opts: string[]) => void;
  disabled: boolean;
  submissionId: string | null;
  fileUrls: Record<string, string>;
  fileComments: Record<string, string>;
  onFileUploaded: (qId: string, url: string) => void;
  onLearnerCommentSaved: (qId: string, comment: string) => void;
}) {
  const selected = answers[q.questionId] ?? [];
  const toggle = (optId: string) => {
    const next = selected.includes(optId)
      ? selected.filter((id) => id !== optId)
      : [...selected, optId];
    onChange(q.questionId, next);
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm">
      <ExamAntiCopyBlock>
        <div className="flex gap-3 mb-4">
          <span className="shrink-0 font-mono text-xs font-bold text-stone-400 pt-0.5">
            Q{index + 1}.
          </span>
          <p className="text-stone-900 font-medium leading-relaxed text-sm sm:text-base">
            {q.questionText}
          </p>
        </div>
        {q.type === "mcq" && q.options ? (
          <div className="flex flex-col gap-2 ml-6">
            {q.options.map((opt) => (
              <MCQOption
                key={opt.optionId}
                opt={opt}
                selected={selected.includes(opt.optionId)}
                onChange={() => toggle(opt.optionId)}
                disabled={disabled}
              />
            ))}
          </div>
        ) : null}
      </ExamAntiCopyBlock>
      {q.type === "mcq" ? null : (
        <div className="ml-6 mt-4 space-y-2 [&_input]:select-text [&_textarea]:select-text">
          <p className="text-sm text-stone-600 select-none">
            Upload a file and/or write your answer in the note below.{" "}
            {q.referenceFile ? (
              <a
                href={q.referenceFile}
                target="_blank"
                rel="noreferrer"
                className="text-amber-700 underline underline-offset-2 font-medium"
              >
                Project Input Files
              </a>
            ) : null}
          </p>
          {submissionId && (
            <LearnerInternshipSubmissionFileField
              submissionId={submissionId}
              questionId={q.questionId}
              disabled={disabled}
              currentFileUrl={fileUrls[q.questionId]}
              learnerComment={fileComments[q.questionId] ?? ""}
              onUploaded={(url) => onFileUploaded(q.questionId, url)}
              onLearnerCommentSaved={(comment) =>
                onLearnerCommentSaved(q.questionId, comment)
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function ExamPage() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();

  const [exam, setExam] = useState<LearnerEntranceExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [fileComments, setFileComments] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");

  const loadExam = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.get(
        ENDPOINTS.internshipEnrollments.meEntranceExam,
        { params: { enrollmentId } },
      );
      const data = res.data.data as LearnerEntranceExam;
      setExam(data);
      if (data.existingSubmissionId) {
        setSubmissionId(data.existingSubmissionId);
        try {
          const subRes = await apiClient.get(
            ENDPOINTS.internshipSubmissions.byId(data.existingSubmissionId),
          );
          const sub = subRes.data.data as {
            mcqResponses?: { question: string; selectedOptions: string[] }[];
            fileResponses?: {
              question: string;
              currentFile: string;
              learnerComment?: string;
            }[];
          };
          const initial: Record<string, string[]> = {};
          for (const r of sub.mcqResponses ?? []) {
            initial[r.question] = r.selectedOptions;
          }
          setAnswers(initial);
          const fu: Record<string, string> = {};
          const fc: Record<string, string> = {};
          for (const fr of sub.fileResponses ?? []) {
            if (fr.currentFile) fu[fr.question] = fr.currentFile;
            if (fr.learnerComment) fc[fr.question] = fr.learnerComment;
          }
          setFileUrls(fu);
          setFileComments(fc);
        } catch {
          // Non-fatal — start fresh
        }
      }
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not load the exam.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    void loadExam();
  }, [loadExam]);

  // ── Debounced answer saving ──────────────────────────────────────────────
  // Saving a PATCH on every option click produced a write storm that an
  // entry-tier DB can't keep up with during a live exam. Instead we keep the
  // latest answer per question in a buffer and flush it ~1.5s after the last
  // change (and always before submit / on tab hide). Local state updates
  // instantly so the UI is unaffected.
  const SAVE_DEBOUNCE_MS = 1500;
  const submissionIdRef = useRef<string | null>(null);
  const pendingSaves = useRef<Map<string, string[]>>(new Map());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    submissionIdRef.current = submissionId;
  }, [submissionId]);

  // Persist every buffered answer. Stable identity (reads refs, no deps).
  const flushPendingSaves = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const sid = submissionIdRef.current;
    if (!sid || pendingSaves.current.size === 0) return;
    const entries = Array.from(pendingSaves.current.entries());
    pendingSaves.current.clear();
    for (const [qId, opts] of entries) {
      try {
        await apiClient.patch(
          ENDPOINTS.internshipSubmissions.saveMcq(sid),
          { question: qId, selectedOptions: opts },
        );
      } catch {
        // Re-buffer so the next flush (e.g. on submit) retries it.
        pendingSaves.current.set(qId, opts);
      }
    }
  }, []);

  // Flush on unmount and when the tab is hidden (closing/switching away).
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flushPendingSaves();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      void flushPendingSaves();
    };
  }, [flushPendingSaves]);

  const handleAnswerChange = (qId: string, opts: string[]) => {
    setAnswers((prev) => ({ ...prev, [qId]: opts }));
    if (!submissionIdRef.current) return;
    // Buffer the latest answer for this question and (re)arm the debounce.
    pendingSaves.current.set(qId, opts);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void flushPendingSaves();
    }, SAVE_DEBOUNCE_MS);
  };

  const handleStart = async () => {
    if (!exam) return;
    try {
      const res = await apiClient.post(ENDPOINTS.internshipSubmissions.create, {
        submissionFor: "exam",
        examId: exam.examId,
        internshipId: exam.internshipId,
        batchId: exam.batchId,
        enrollmentId: exam.enrollmentId,
      });
      const created = res.data.data as { _id: string };
      setSubmissionId(created._id);
      setFileUrls({});
      setFileComments({});
      toast.success("Exam started — your answers save automatically.");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not start exam.";
      toast.error(msg);
    }
  };

  const handleSubmit = async () => {
    if (!submissionId) return;
    if (
      !window.confirm(
        "Submit your answers? You cannot change them after submitting.",
      )
    )
      return;
    setSubmitStatus("submitting");
    try {
      // Persist any buffered answers BEFORE finalizing — submit grades the
      // server-stored draft, so unflushed answers would otherwise be lost.
      await flushPendingSaves();
      await apiClient.post(
        ENDPOINTS.internshipSubmissions.submit(submissionId),
      );
      setSubmitStatus("submitted");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ??
        "Submit failed. Please try again.";
      toast.error(msg);
      setSubmitStatus("idle");
    }
  };

  const answeredCount = exam
    ? exam.questions.filter(
        (q) => q.type === "mcq" && (answers[q.questionId]?.length ?? 0) > 0,
      ).length
    : 0;
  const mcqCount = exam
    ? exam.questions.filter((q) => q.type === "mcq").length
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading exam…
      </div>
    );
  }

  if (errorMsg) {
    const isLocked =
      errorMsg.toLowerCase().includes("not yet") ||
      errorMsg.toLowerCase().includes("closed");
    return (
      <div className="py-12 max-w-xl mx-auto text-center">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-10 flex flex-col items-center gap-4">
          <Lock className="h-12 w-12 text-amber-600" />
          <p className="text-xl font-bold text-amber-950">
            {isLocked ? "Exam is locked" : "Exam unavailable"}
          </p>
          <p className="text-sm text-amber-900/80">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (submitStatus === "submitted") {
    return (
      <div className="py-8 max-w-xl mx-auto text-center">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 flex flex-col items-center gap-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          <p className="text-xl font-bold text-emerald-900">Exam submitted!</p>
          <p className="text-sm text-emerald-800">
            Your answers have been recorded. Results will be announced on{" "}
            {exam?.examResultAt
              ? new Date(exam.examResultAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "Asia/Kolkata",
                })
              : "the scheduled date"}
            .
          </p>
          <Link
            href="/dashboard/internships"
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-amber-200 hover:bg-stone-800 transition"
          >
            Back to My Internships
          </Link>
        </div>
      </div>
    );
  }

  if (!exam) return null;

  const isSubmitted = exam.existingSubmissionId && submitStatus !== "idle";
  const disabled = submitStatus === "submitting" || !!isSubmitted;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-800/70">
            Entrance exam
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">
            {exam.title}
          </h1>
          {exam.description && (
            <p className="text-sm text-stone-600 mt-1">{exam.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-stone-600 font-mono">
            <span>Total score: {exam.totalScore}</span>
            {exam.thresholdScore != null && (
              <span>Passing: {exam.thresholdScore}</span>
            )}
            {exam.examEndAt && (
              <span>
                Window closes (IST):{" "}
                {new Date(exam.examEndAt).toLocaleString("en-GB", {
                  timeZone: "Asia/Kolkata",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {submissionId && mcqCount > 0 && (
        <div className="mb-5 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${(answeredCount / mcqCount) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-stone-600 shrink-0">
            {answeredCount}/{mcqCount} answered
          </span>
        </div>
      )}

      {/* Start prompt */}
      {!submissionId && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/90 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-semibold text-amber-950">Ready to start?</p>
            <p className="text-sm text-amber-900/80 mt-0.5">
              Clicking Start will lock your attempt and begin recording answers.
              Make sure you have time before the window closes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleStart()}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-bold text-amber-200 hover:bg-stone-800 transition cursor-pointer"
          >
            <CircleDot className="h-4 w-4" />
            Start exam
          </button>
        </div>
      )}

      {/* Questions */}
      <div className="flex flex-col gap-4">
        {exam.questions.map((q, i) => (
          <QuestionCard
            key={q.questionId}
            q={q}
            index={i}
            answers={answers}
            onChange={(qId, opts) => void handleAnswerChange(qId, opts)}
            disabled={disabled || !submissionId}
            submissionId={submissionId}
            fileUrls={fileUrls}
            fileComments={fileComments}
            onFileUploaded={(qId, url) =>
              setFileUrls((prev) => ({ ...prev, [qId]: url }))
            }
            onLearnerCommentSaved={(qId, comment) =>
              setFileComments((prev) => ({ ...prev, [qId]: comment }))
            }
          />
        ))}
      </div>

      {/* Submit */}
      {submissionId && (
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-medium text-stone-800">
              Ready to submit?
            </p>
            <p className="text-xs text-stone-500 mt-0.5">
              Make sure you&apos;ve answered all questions. You cannot edit
              after submitting.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitStatus !== "idle"}
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-bold text-amber-200 hover:bg-stone-800 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitStatus === "submitting" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {submitStatus === "submitting" ? "Submitting…" : "Submit exam"}
          </button>
        </div>
      )}
    </div>
  );
}
