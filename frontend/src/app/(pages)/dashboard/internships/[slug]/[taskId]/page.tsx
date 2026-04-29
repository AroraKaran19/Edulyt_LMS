"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Eye,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { LearnerProgramDetail, LearnerTaskRow } from "@/types";

// ─── Shared MCQ UI (identical to exam page) ───────────────────────────────────

type SnapshotQuestion = {
  questionId: string;
  questionText: string;
  type: "mcq" | "file_upload";
  score: number;
  options?: { optionId: string; text: string }[];
  referenceFile?: string;
};

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
      } ${selected ? "border-amber-500 bg-amber-50" : "border-stone-200 bg-white"}`}
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
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 3L5 8.5 2 5.5" />
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
}: {
  q: SnapshotQuestion;
  index: number;
  answers: Record<string, string[]>;
  onChange: (qId: string, opts: string[]) => void;
  disabled: boolean;
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
      ) : (
        <div className="ml-6 rounded-xl border border-stone-100 bg-stone-50 px-4 py-3 text-sm text-stone-500">
          File-upload question — submit your file when prompted.
          {q.referenceFile && (
            <a
              href={q.referenceFile}
              target="_blank"
              rel="noreferrer"
              className="ml-2 text-amber-700 underline underline-offset-2 font-medium"
            >
              Reference file
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SubmitStatus = "idle" | "submitting" | "submitted";

type SubmissionShape = {
  _id: string;
  status: string;
  mcqResponses?: { question: string; selectedOptions: string[] }[];
  templateSnapshot?: {
    questions?: SnapshotQuestion[];
    title?: string;
    description?: string;
    totalScore?: number;
    scoreThreshold?: number;
  };
  totalAwardedScore?: number;
};

export default function InternshipTaskPage() {
  const params = useParams<{ slug: string; taskId: string }>();
  const slug = decodeURIComponent(params.slug ?? "");
  const taskId = decodeURIComponent(params.taskId ?? "");

  const programHref = `/dashboard/internships/${encodeURIComponent(slug)}`;

  const [task, setTask] = useState<LearnerTaskRow | null>(null);
  const [enrollment, setEnrollment] = useState<
    LearnerProgramDetail["enrollment"] | null
  >(null);
  const [pointsPurchase, setPointsPurchase] = useState<
    LearnerProgramDetail["internshipSuccessPointPurchase"] | undefined
  >(undefined);
  const [submission, setSubmission] = useState<SubmissionShape | null>(null);
  const [questions, setQuestions] = useState<SnapshotQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");

  const loadProgram = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ data: LearnerProgramDetail }>(
        ENDPOINTS.internshipEnrollments.meProgramBySlug(slug),
      );
      const detail = res.data.data;
      const found = detail.tasks.find((t) => t._id === taskId);
      if (!found) {
        setError("This task isn’t available for you yet.");
        return;
      }
      setTask(found);
      setEnrollment(detail.enrollment);
      setPointsPurchase(detail.internshipSuccessPointPurchase);

      // Load existing submission if present
      if (found.submission) {
        const subRes = await apiClient.get<{ data: SubmissionShape }>(
          ENDPOINTS.internshipSubmissions.byId(found.submission._id),
        );
        const sub = subRes.data.data;
        setSubmission(sub);
        setSubmissionId(sub._id);
        setQuestions(sub.templateSnapshot?.questions ?? []);

        if (sub.status === "draft") {
          const init: Record<string, string[]> = {};
          for (const r of sub.mcqResponses ?? []) {
            init[r.question] = r.selectedOptions;
          }
          setAnswers(init);
        }
        if (sub.status !== "draft") {
          setSubmitStatus("submitted");
        }
      }
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Failed to load task.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [slug, taskId]);

  useEffect(() => {
    void loadProgram();
  }, [loadProgram]);

  const handleStart = async () => {
    if (!task || !enrollment) return;
    try {
      const res = await apiClient.post<{ data: SubmissionShape }>(
        ENDPOINTS.internshipSubmissions.create,
        {
          submissionFor: "task",
          taskId: task._id,
          internshipId: enrollment.internshipId,
          batchId: enrollment.batchId,
          enrollmentId: enrollment._id,
        },
      );
      const sub = res.data.data;
      setSubmission(sub);
      setSubmissionId(sub._id);
      setQuestions(sub.templateSnapshot?.questions ?? []);
      toast.success("Task started — your answers save automatically.");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not start task.";
      toast.error(msg);
    }
  };

  const handleAnswerChange = async (qId: string, opts: string[]) => {
    setAnswers((prev) => ({ ...prev, [qId]: opts }));
    if (!submissionId) return;
    try {
      await apiClient.patch(
        ENDPOINTS.internshipSubmissions.saveMcq(submissionId),
        { question: qId, selectedOptions: opts },
      );
    } catch {
      // silent — local state preserved; final submit is the gate
    }
  };

  const handleSubmit = async () => {
    if (!submissionId) return;
    if (
      !window.confirm(
        "Submit your task? You cannot change answers after submitting.",
      )
    )
      return;
    setSubmitStatus("submitting");
    try {
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

  const mcqCount = questions.filter((q) => q.type === "mcq").length;
  const answeredCount = questions.filter(
    (q) => q.type === "mcq" && (answers[q.questionId]?.length ?? 0) > 0,
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-stone-500">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading task…
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="py-12 max-w-xl mx-auto text-center space-y-4">
        <ClipboardList className="mx-auto h-10 w-10 text-stone-300" />
        <p className="text-stone-700 font-medium">
          {error ?? "Task not found"}
        </p>
      </div>
    );
  }

  // ── Submitted / reviewed screen ──
  if (submitStatus === "submitted") {
    const isReviewed =
      submission?.status === "fully_reviewed" ||
      submission?.status === "partially_reviewed";
    return (
      <div className="py-8 max-w-xl mx-auto text-center">
        <div
          className={`rounded-2xl border p-8 flex flex-col items-center gap-4 ${
            isReviewed
              ? "border-emerald-200 bg-emerald-50"
              : "border-violet-200 bg-violet-50"
          }`}
        >
          {isReviewed ? (
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          ) : (
            <Eye className="h-12 w-12 text-violet-500" />
          )}
          <p className="text-xl font-bold text-stone-900">
            {isReviewed ? "Task reviewed!" : "Task submitted!"}
          </p>
          <p className="text-sm text-stone-600">
            {isReviewed
              ? `You scored ${submission?.totalAwardedScore ?? 0} / ${submission?.templateSnapshot?.totalScore ?? task.totalScore} points.`
              : "Your submission is under review. Check back later for your score."}
          </p>
          <Link
            href={programHref}
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-amber-200 hover:bg-stone-800 transition"
          >
            Back to Program
          </Link>
        </div>
      </div>
    );
  }

  const taskTitle = submission?.templateSnapshot?.title ?? task.title;
  const taskDesc =
    submission?.templateSnapshot?.description ?? task.description;
  const totalScore =
    submission?.templateSnapshot?.totalScore ?? task.totalScore;
  const disabled = submitStatus === "submitting";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Task header */}
      <div className="mb-6 rounded-2xl border border-amber-200/80 bg-white px-5 py-4 space-y-1">
        <p className="text-xs font-semibold tracking-widest text-amber-800/70 capitalize">
          {task.taskType} task
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
          {taskTitle}
        </h1>
        {taskDesc && <p className="text-sm text-stone-600 mt-1">{taskDesc}</p>}
        <div className="flex flex-wrap gap-4 pt-2 text-xs text-stone-600 font-mono">
          {totalScore > 0 && <span>Total score: {totalScore}</span>}
          {task.scoreThreshold > 0 && (
            <span>Pass threshold: {task.scoreThreshold}</span>
          )}
          <span>
            Due:{" "}
            {new Date(task.dueAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        {pointsPurchase && enrollment ? (
          <div className="mt-3 pt-3 border-t border-amber-100">
            <Link
              href={`${programHref}#buy-success-points`}
              className="text-xs font-semibold text-amber-900 hover:text-amber-950 underline underline-offset-2"
            >
              Buy internship success points
            </Link>
          </div>
        ) : null}
      </div>

      {/* Progress */}
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
              Your answers save automatically as you pick options.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleStart()}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-bold text-amber-200 hover:bg-stone-800 transition cursor-pointer"
          >
            <CircleDot className="h-4 w-4" />
            Start task
          </button>
        </div>
      )}

      {/* Questions */}
      {questions.length > 0 && (
        <div className="flex flex-col gap-4">
          {questions.map((q, i) => (
            <QuestionCard
              key={q.questionId}
              q={q}
              index={i}
              answers={answers}
              onChange={(qId, opts) => void handleAnswerChange(qId, opts)}
              disabled={disabled || !submissionId}
            />
          ))}
        </div>
      )}

      {/* Submit */}
      {submissionId && (
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-medium text-stone-800">
              Ready to submit?
            </p>
            <p className="text-xs text-stone-500 mt-0.5">
              You cannot edit your answers after submitting.
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
            {submitStatus === "submitting" ? "Submitting…" : "Submit task"}
          </button>
        </div>
      )}
    </div>
  );
}
