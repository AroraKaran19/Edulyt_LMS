"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import Select from "@/components/ui/inputs/Select";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { InfiniteScrollSelect } from "@/components/ui/dropdown/InfiniteScrollSelect";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  InternshipExamTemplateDetail,
  ExamType,
} from "@/types/internship-exam";

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

const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  entrance: "Entrance",
  certification: "Certification",
};

/** Read-only info row for fields that cannot be changed after creation. */
function LockedField({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <Lock className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 select-none">
        {value ?? <span className="italic text-gray-400">—</span>}
      </div>
    </div>
  );
}

export default function ExamUpsertModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  examId,
}: Props) {
  // ── Create-only fields ──────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [examType, setExamType] = useState<ExamType>("entrance");
  const [thresholdScore, setThresholdScore] = useState("");

  // ── Always-editable fields ──────────────────────────────────────────────────
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [examResultLocal, setExamResultLocal] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Snapshot of locked values for display in edit mode
  const [lockedTitle, setLockedTitle] = useState("");
  const [lockedDescription, setLockedDescription] = useState("");
  const [lockedExamType, setLockedExamType] = useState<ExamType>("entrance");
  const [lockedThreshold, setLockedThreshold] = useState<number | undefined>(
    undefined,
  );
  const [lockedTotalScore, setLockedTotalScore] = useState<number>(0);

  const resetCreate = () => {
    setTitle("");
    setDescription("");
    setExamType("entrance");
    setThresholdScore("");
    setQuestionIds([]);
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
        | { questions?: ExamBankQuestionRow[]; totalPages?: number }
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

        // Locked fields (display-only in edit)
        setLockedTitle(d.title ?? "");
        setLockedDescription(d.description ?? "");
        setLockedExamType(d.examType ?? "entrance");
        setLockedThreshold(
          typeof d.thresholdScore === "number" ? d.thresholdScore : undefined,
        );
        setLockedTotalScore(
          typeof d.totalScore === "number" ? d.totalScore : 0,
        );

        // Editable fields
        setThresholdScore(
          typeof d.thresholdScore === "number" ? String(d.thresholdScore) : "",
        );
        setQuestionIds(
          Array.isArray(d.questions)
            ? d.questions.map((q) => String(q._id))
            : [],
        );
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
    if (mode === "create") {
      // ── Create: validate all fields ─────────────────────────────────────────
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        toast.error("Title is required");
        return;
      }
      const payload: Record<string, unknown> = {
        title: trimmedTitle,
        description: description.trim(),
        examType,
        questions: questionIds,
        isActive,
      };

      const ts = thresholdScore.trim();
      if (ts === "") {
        toast.error("Merit threshold is required");
        return;
      }
      const n = parseFloat(ts);
      if (Number.isNaN(n) || !Number.isFinite(n) || n < 0) {
        toast.error("Merit threshold must be a non-negative number");
        return;
      }
      payload.thresholdScore = n;

      await buildAndSubmitDates(payload);
    } else {
      // ── Edit: only mutable fields ────────────────────────────────────────────
      if (!examId) {
        toast.error("Missing exam id");
        return;
      }

      const ts = thresholdScore.trim();
      if (ts === "") {
        toast.error("Merit threshold is required");
        return;
      }
      const n = parseFloat(ts);
      if (Number.isNaN(n) || !Number.isFinite(n) || n < 0) {
        toast.error("Merit threshold must be a non-negative number");
        return;
      }

      const payload: Record<string, unknown> = {
        questions: questionIds,
        thresholdScore: n,
        isActive,
      };
      await buildAndSubmitDates(payload);
    }
  };

  const buildAndSubmitDates = async (payload: Record<string, unknown>) => {
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
    payload.examResultAt = r.toISOString();

    setSubmitting(true);
    try {
      if (mode === "create") {
        await apiClient.post(ENDPOINTS.internshipExams.create, payload);
        toast.success("Exam template created");
      } else {
        await apiClient.patch(
          ENDPOINTS.internshipExams.adminById(examId!),
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
          {/* ── CREATE: editable fields ──────────────────────────────────────── */}
          {mode === "create" && (
            <>
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

              <Select
                label="Exam type"
                required
                options={[
                  { value: "entrance", label: "Entrance" },
                  { value: "certification", label: "Certification" },
                ]}
                value={examType}
                onChange={(v) => setExamType(v as ExamType)}
                placeholder="Select type"
              />
            </>
          )}

          {/* ── EDIT: locked info panel ──────────────────────────────────────── */}
          {mode === "edit" && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Read-only fields
                </span>
              </div>
              <LockedField label="Title" value={lockedTitle} />
              {lockedDescription && (
                <LockedField label="Description" value={lockedDescription} />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <LockedField
                  label="Type"
                  value={EXAM_TYPE_LABELS[lockedExamType]}
                />
                <LockedField label="Total score" value={lockedTotalScore} />
              </div>
            </div>
          )}

          {/* ── ALWAYS EDITABLE ─────────────────────────────────────────────── */}
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
            label="Merit threshold"
            type="number"
            min={0}
            step="any"
            required
            placeholder="Minimum score to qualify"
            value={thresholdScore}
            onChange={(e) => setThresholdScore(e.target.value)}
          />
          <p className="text-xs text-gray-500 -mt-2">
            Minimum total score for the merit pool. Must not exceed the
            template&apos;s total score.
          </p>

          <Input
            label="Results published"
            type="datetime-local"
            required
            value={examResultLocal}
            onChange={(e) => setExamResultLocal(e.target.value)}
          />
          <p className="text-xs text-gray-500 -mt-2">
            When learners may see official results. Entrance and certification
            attempt windows are set per cohort or per learner on the server, not
            on this template.
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
              {submitting
                ? "Saving…"
                : mode === "create"
                  ? "Create"
                  : "Save changes"}
            </OrangeButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
