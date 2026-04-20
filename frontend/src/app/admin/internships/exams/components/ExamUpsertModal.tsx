"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { InfiniteScrollSelect } from "@/components/ui/dropdown/InfiniteScrollSelect";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { InternshipExamTemplateDetail } from "@/types/internship-exam";

type ExamBankQuestionRow = {
  _id: string;
  questionText: string;
  type: string;
  usageType: string;
  score: number;
  isActive: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  examId?: string | null;
};

function toDatetimeLocalValue(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ExamUpsertModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  examId,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [thresholdScore, setThresholdScore] = useState("");
  const [examStartLocal, setExamStartLocal] = useState("");
  const [examEndLocal, setExamEndLocal] = useState("");
  const [examResultLocal, setExamResultLocal] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const resetCreate = () => {
    setTitle("");
    setDescription("");
    setQuestionIds([]);
    setThresholdScore("");
    setExamStartLocal("");
    setExamEndLocal("");
    setExamResultLocal("");
    setIsActive(true);
    setSubmitting(false);
    setLoadingDetail(false);
  };

  const fetchExamQuestions = useCallback(
    async (page: number, search: string) => {
      const res = await apiClient.get(ENDPOINTS.internshipQuestions.adminList, {
        params: {
          page,
          limit: 15,
          search: search.trim() || undefined,
          usageFor: "exam",
        },
      });
      const payload = res.data?.data as
        | {
            questions?: ExamBankQuestionRow[];
            totalPages?: number;
          }
        | undefined;
      const questions = payload?.questions ?? [];
      const totalPages =
        typeof payload?.totalPages === "number" && payload.totalPages >= 1
          ? payload.totalPages
          : 1;
      return { items: questions, totalPages };
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "create") {
      resetCreate();
      return;
    }

    if (!examId) return;

    let cancelled = false;
    (async () => {
      setLoadingDetail(true);
      try {
        const res = await apiClient.get(
          ENDPOINTS.internshipExams.adminById(examId),
        );
        const d = res.data?.data as InternshipExamTemplateDetail | undefined;
        if (cancelled || !d) return;
        setTitle(d.title ?? "");
        setDescription(d.description ?? "");
        setQuestionIds(
          Array.isArray(d.questions)
            ? d.questions.map((q) => String(q._id))
            : [],
        );
        setThresholdScore(
          typeof d.thresholdScore === "number"
            ? String(d.thresholdScore)
            : "",
        );
        setExamStartLocal(toDatetimeLocalValue(d.examStartAt));
        setExamEndLocal(toDatetimeLocalValue(d.examEndAt));
        setExamResultLocal(toDatetimeLocalValue(d.examResultAt));
        setIsActive(d.isActive !== false);
      } catch {
        if (!cancelled) {
          toast.error("Could not load exam template");
          onClose();
        }
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, examId, onClose]);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Title is required");
      return;
    }
    if (!questionIds.length) {
      toast.error("Select at least one question (exam or both usage)");
      return;
    }

    const payload: Record<string, unknown> = {
      title: trimmedTitle,
      description: description.trim(),
      questions: questionIds,
      isActive,
    };

    const ts = thresholdScore.trim();
    if (ts !== "") {
      const n = parseFloat(ts);
      if (Number.isNaN(n) || !Number.isFinite(n) || n < 0) {
        toast.error("Merit threshold must be a non-negative number");
        return;
      }
      payload.thresholdScore = n;
    } else {
      payload.thresholdScore = null;
    }

    const startStr = examStartLocal.trim();
    const endStr = examEndLocal.trim();
    if (startStr && endStr) {
      const s = new Date(startStr);
      const e = new Date(endStr);
      if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
        toast.error("Invalid exam start or end date-time");
        return;
      }
      if (e.getTime() <= s.getTime()) {
        toast.error("Exam end must be after exam start");
        return;
      }
      payload.examStartAt = s.toISOString();
      payload.examEndAt = e.toISOString();
    } else if (!startStr && !endStr) {
      payload.examStartAt = null;
      payload.examEndAt = null;
    } else {
      toast.error("Set both exam start and end, or clear both");
      return;
    }

    const resStr = examResultLocal.trim();
    if (!resStr) {
      toast.error("Results published date-time is required");
      return;
    }
    const r = new Date(resStr);
    if (Number.isNaN(r.getTime())) {
      toast.error("Invalid results publication date-time");
      return;
    }
    if (endStr && r.getTime() < new Date(endStr).getTime()) {
      toast.error("Results date must be on or after exam end");
      return;
    }
    payload.examResultAt = r.toISOString();

    setSubmitting(true);
    try {
      if (mode === "create") {
        await apiClient.post(ENDPOINTS.internshipExams.create, payload);
        toast.success("Exam template created");
      } else {
        if (!examId) {
          toast.error("Missing exam id");
          return;
        }
        await apiClient.patch(
          ENDPOINTS.internshipExams.adminById(examId),
          payload,
        );
        toast.success("Exam template updated");
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not save exam template";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle =
    mode === "create" ? "New exam template" : "Edit exam template";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      className="max-w-2xl w-full mx-4 max-h-[90vh]"
    >
      {mode === "edit" && loadingDetail ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          <p className="text-sm text-gray-500">Loading exam template…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Input
            label="Title"
            required
            placeholder="e.g. Entrance exam — July cohort"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <TextArea
            label="Description"
            placeholder="Instructions or context for admins (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <InfiniteScrollSelect<ExamBankQuestionRow>
            label="Questions"
            placeholder="Search exam-eligible questions…"
            multi
            value={questionIds}
            onChange={(v) =>
              setQuestionIds(Array.isArray(v) ? v : v ? [v] : [])
            }
            fetchOptions={fetchExamQuestions}
            getOptionLabel={(q) => {
              const row = q as ExamBankQuestionRow;
              const t = (row.questionText ?? "").trim() || "Untitled";
              const short = t.length > 72 ? `${t.slice(0, 72)}…` : t;
              const pts =
                typeof row.score === "number" ? ` · ${row.score} pts` : "";
              return `${short}${pts} · ${row.usageType}`;
            }}
            getOptionValue={(q) => String((q as ExamBankQuestionRow)._id ?? "")}
            searchPlaceholder="Search question text…"
            emptyMessage="No questions with exam/both usage. Add them in the question bank."
            dropdownPortal
          />

          <p className="text-xs text-gray-500 -mt-2">
            Total score is computed from the selected questions when you save.
          </p>

          <Input
            label="Merit threshold (optional)"
            type="number"
            min={0}
            step="any"
            placeholder="Leave empty if not an entrance exam"
            value={thresholdScore}
            onChange={(e) => setThresholdScore(e.target.value)}
          />
          <p className="text-xs text-gray-500 -mt-2">
            Minimum total score for the merit pool (entrance exams). Must not
            exceed the template&apos;s total score.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Exam starts (optional)"
              type="datetime-local"
              value={examStartLocal}
              onChange={(e) => setExamStartLocal(e.target.value)}
            />
            <Input
              label="Exam ends (optional)"
              type="datetime-local"
              value={examEndLocal}
              onChange={(e) => setExamEndLocal(e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            Wall-clock window for this template (includes time). Leave both
            empty if you only use unlock/due days relative to enrollment.
            Frozen on each learner submission when it is created.
          </p>

          <Input
            label="Results published"
            type="datetime-local"
            required
            value={examResultLocal}
            onChange={(e) => setExamResultLocal(e.target.value)}
          />
          <p className="text-xs text-gray-500 -mt-2">
            When learners can see official results. Must be on or after exam
            end if an exam window is set.
          </p>

          <CheckBoxContainer
            label="Exam template is active"
            checked={isActive}
            onChange={setIsActive}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <WhiteButton
              type="button"
              glow={false}
              disabled={submitting}
              onClick={onClose}
            >
              Cancel
            </WhiteButton>
            <OrangeButton
              type="button"
              glow={false}
              disabled={submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? "Saving…" : mode === "create" ? "Create" : "Save"}
            </OrangeButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
