"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { ChevronLeft, Loader2 } from "lucide-react";
import useCaTasks from "@/hooks/useCaTasks";
import { useUpload } from "@/hooks/useUpload";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import TextArea from "@/components/ui/inputs/TextArea";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import type { CaTaskAttemptView } from "@/types/ca-task";

type SubmitAnswer = { questionId: string; selectedOptions?: string[]; fileUrl?: string; comment?: string };
type DraftAnswer = { selectedOptions: string[]; fileUrl: string; comment: string };

function emptyDraft(): DraftAnswer {
  return { selectedOptions: [], fileUrl: "", comment: "" };
}

export default function CaTaskAttemptPage() {
  const params = useParams<{ taskId: string }>();
  const taskId = typeof params?.taskId === "string" ? params.taskId : "";
  const { getAttempt, submit } = useCaTasks();

  const [attempt, setAttempt] = useState<CaTaskAttemptView | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, DraftAnswer>>({});
  const [resubmitDrafts, setResubmitDrafts] = useState<Record<string, DraftAnswer>>({});
  const [submitting, setSubmitting] = useState(false);
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    (async () => {
      const result = await getAttempt(taskId);
      if (cancelled) return;
      if (!result) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setDrafts(Object.fromEntries(result.questions.map((q) => [q.questionId, emptyDraft()])));
      setAttempt(result);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const questionsById = useMemo(
    () => new Map((attempt?.questions ?? []).map((q) => [q.questionId, q])),
    [attempt?.questions],
  );

  const setDraft = (questionId: string, patch: Partial<DraftAnswer>) => {
    setDrafts((prev) => ({ ...prev, [questionId]: { ...(prev[questionId] ?? emptyDraft()), ...patch } }));
  };

  const setResubmitDraft = (questionId: string, patch: Partial<DraftAnswer>) => {
    setResubmitDrafts((prev) => ({ ...prev, [questionId]: { ...(prev[questionId] ?? emptyDraft()), ...patch } }));
  };

  const submitAll = async () => {
    if (!attempt?.questions.length) return;
    const answers: SubmitAnswer[] = attempt.questions.map((q) => {
      const draft = drafts[q.questionId] ?? emptyDraft();
      if (q.type === "mcq") return { questionId: q.questionId, selectedOptions: draft.selectedOptions };
      return { questionId: q.questionId, fileUrl: draft.fileUrl, comment: draft.comment };
    });
    const missingFile = attempt.questions.some((q) => q.type === "file_upload" && !(drafts[q.questionId]?.fileUrl));
    if (missingFile) {
      toast.error("Upload a file for every question before submitting.");
      return;
    }
    setSubmitting(true);
    const result = await submit(taskId, answers);
    setSubmitting(false);
    if (!result) return;
    setAttempt(result);
    toast.success("Submitted");
  };

  const resubmitOne = async (questionId: string) => {
    const draft = resubmitDrafts[questionId];
    if (!draft?.fileUrl) {
      toast.error("Upload a file before resubmitting.");
      return;
    }
    setResubmittingId(questionId);
    const result = await submit(taskId, [{ questionId, fileUrl: draft.fileUrl, comment: draft.comment }]);
    setResubmittingId(null);
    if (!result) return;
    setAttempt(result);
    toast.success("Resubmitted");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (notFound || !attempt) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <h1 className="text-xl font-bold text-gray-900">This task isn&apos;t available.</h1>
        <Link href="/ambassador" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:underline">
          <ChevronLeft className="size-4" />
          Back to your dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
      <Link href="/ambassador" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
        <ChevronLeft className="size-4" />
        Back to your dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{attempt.task.title}</h1>
        {attempt.task.description ? <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{attempt.task.description}</p> : null}
        <p className="mt-2 text-xs text-gray-500">
          Pass score {attempt.task.passScore} of {attempt.task.totalScore} - {attempt.task.successPoints} points on passing
        </p>
      </div>

      {!attempt.submission ? (
        <>
          <div className="flex flex-col gap-4">
            {attempt.questions.map((q, idx) => (
              <div key={q.questionId} className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm font-medium text-gray-900">
                  {idx + 1}. {q.questionText}
                </p>
                {q.type === "mcq" ? (
                  <div className="mt-3 flex flex-col gap-2">
                    {(q.options ?? []).map((opt) => {
                      const checked = (drafts[q.questionId]?.selectedOptions ?? []).includes(opt.optionId);
                      return (
                        <label key={opt.optionId} className="flex items-center gap-2 text-sm text-gray-800 max-sm:text-base">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const current = drafts[q.questionId]?.selectedOptions ?? [];
                              const next = e.target.checked ? [...current, opt.optionId] : current.filter((id) => id !== opt.optionId);
                              setDraft(q.questionId, { selectedOptions: next });
                            }}
                            className="size-4 accent-orange-500"
                          />
                          {opt.text}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 flex flex-col gap-3">
                    <CaFileUpload
                      value={drafts[q.questionId]?.fileUrl ?? ""}
                      onUploaded={(url) => setDraft(q.questionId, { fileUrl: url })}
                      onRemove={() => setDraft(q.questionId, { fileUrl: "" })}
                    />
                    <TextArea
                      label="Comment (optional)"
                      className="max-sm:text-base"
                      rows={2}
                      value={drafts[q.questionId]?.comment ?? ""}
                      onChange={(e) => setDraft(q.questionId, { comment: e.target.value })}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <OrangeButton type="button" glow={false} className="w-full justify-center" disabled={submitting} onClick={() => void submitAll()}>
            {submitting ? "Submitting..." : "Submit"}
          </OrangeButton>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          {attempt.submission.status === "reviewed" ? (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                attempt.submission.passed ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
              }`}
            >
              {attempt.submission.passed ? "Passed" : "Not passed"} - {attempt.submission.totalAwardedScore} of{" "}
              {attempt.task.totalScore} (pass at {attempt.task.passScore})
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              Submitted. Waiting on review for any file answers.
            </div>
          )}

          {attempt.submission.mcqResponses.map((r, idx) => {
            const q = questionsById.get(r.question);
            return (
              <div key={r.question} className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm font-medium text-gray-900">{q?.questionText ?? `Question ${idx + 1}`}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {(r.selectedOptions ?? [])
                    .map((id) => q?.options?.find((o) => o.optionId === id)?.text ?? id)
                    .join(", ") || "No answer"}
                </p>
                {typeof r.awardedScore === "number" ? (
                  <p className="mt-1 text-xs text-gray-500">{r.awardedScore} points</p>
                ) : null}
              </div>
            );
          })}

          {attempt.submission.fileResponses.map((r, idx) => {
            const q = questionsById.get(r.question);
            const rejected = r.status === "rejected";
            return (
              <div key={r.question} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-gray-900">{q?.questionText ?? `Question ${idx + 1}`}</p>
                  {r.status ? <StatusBadge status={r.status} /> : null}
                </div>
                {r.currentFile ? (
                  <a
                    href={r.currentFile}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs text-orange-600 hover:underline"
                  >
                    View your upload
                  </a>
                ) : null}
                {r.learnerComment ? <p className="mt-1 text-xs text-gray-600 whitespace-pre-wrap">{r.learnerComment}</p> : null}
                {r.reviewNote ? <p className="mt-1 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">Reviewer note: {r.reviewNote}</p> : null}

                {rejected ? (
                  <div className="mt-3 flex flex-col gap-3 border-t border-gray-100 pt-3">
                    <CaFileUpload
                      value={resubmitDrafts[r.question]?.fileUrl ?? ""}
                      onUploaded={(url) => setResubmitDraft(r.question, { fileUrl: url })}
                      onRemove={() => setResubmitDraft(r.question, { fileUrl: "" })}
                    />
                    <TextArea
                      label="Comment (optional)"
                      className="max-sm:text-base"
                      rows={2}
                      value={resubmitDrafts[r.question]?.comment ?? ""}
                      onChange={(e) => setResubmitDraft(r.question, { comment: e.target.value })}
                    />
                    <WhiteButton
                      type="button"
                      glow={false}
                      disabled={resubmittingId === r.question}
                      onClick={() => void resubmitOne(r.question)}
                    >
                      {resubmittingId === r.question ? "Resubmitting..." : "Resubmit"}
                    </WhiteButton>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const cls =
    status === "approved"
      ? "bg-emerald-100 text-emerald-800"
      : status === "rejected"
        ? "bg-red-100 text-red-800"
        : "bg-amber-100 text-amber-800";
  const label = status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending review";
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}

function CaFileUpload({ value, onUploaded, onRemove }: { value: string; onUploaded: (url: string) => void; onRemove: () => void }) {
  const { uploadFile, isUploading } = useUpload();

  const handleUpload = async (file: File, folder: string): Promise<string> => {
    const result = await uploadFile(file, folder);
    if (result.success && result.data?.url) {
      onUploaded(result.data.url);
      return result.data.url;
    }
    throw new Error(result.error || "Upload failed");
  };

  return (
    <UploadMediaContainer
      type="document"
      mediaUrl={value || undefined}
      mediaSource={value ? "upload" : undefined}
      folderName="ca-task-answers"
      isUploading={isUploading}
      showConfirmation={false}
      onFileUpload={handleUpload}
      onFileRemove={onRemove}
    />
  );
}
