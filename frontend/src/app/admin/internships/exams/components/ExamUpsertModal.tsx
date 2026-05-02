"use client";

import { useEffect, useState } from "react";
import { Lock, ListPlus, X } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import Select from "@/components/ui/inputs/Select";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import QuestionPickerModal, {
  type PickerQuestion,
} from "@/components/admin/internships/QuestionPickerModal";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  InternshipExamTemplateDetail,
  ExamType,
} from "@/types/internship-exam";

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
  const [selectedQuestions, setSelectedQuestions] = useState<PickerQuestion[]>(
    [],
  );
  const [pickerOpen, setPickerOpen] = useState(false);
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
    setSelectedQuestions([]);
    setExamResultLocal("");
    setIsActive(true);
    setSubmitting(false);
    setLoadingDetail(false);
  };

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
        setSelectedQuestions(
          Array.isArray(d.questions)
            ? d.questions.map((q) => ({
                _id: String(q._id),
                questionText: q.questionText ?? "",
                type: q.type ?? "",
                usageType: q.usageType ?? "",
                score: typeof q.score === "number" ? q.score : 0,
                category: q.category ?? null,
              }))
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
        questions: selectedQuestions.map((q) => q._id),
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
        questions: selectedQuestions.map((q) => q._id),
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Questions
              </span>
              <span className="text-xs text-gray-500 tabular-nums">
                {selectedQuestions.length} selected · Total score{" "}
                {selectedQuestions.reduce((s, q) => s + (q.score || 0), 0)}
              </span>
            </div>
            <WhiteButton
              type="button"
              glow={false}
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center justify-center gap-2"
            >
              <ListPlus className="w-4 h-4" />
              {selectedQuestions.length === 0
                ? "Add questions"
                : "Add or remove questions"}
            </WhiteButton>
            {selectedQuestions.length > 0 ? (
              <ul className="rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-[220px] overflow-y-auto">
                {selectedQuestions.map((q) => (
                  <li
                    key={q._id}
                    className="flex items-start gap-3 px-3 py-2 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 line-clamp-1">
                        {q.questionText || "Untitled"}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {q.category ? (
                          <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {q.category}
                          </span>
                        ) : null}
                        <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-gray-50 text-gray-600 tabular-nums">
                          {q.score} pts
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedQuestions((prev) =>
                          prev.filter((x) => x._id !== q._id),
                        )
                      }
                      className="p-1 rounded-lg text-red-500 hover:bg-red-50"
                      aria-label="Remove question"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
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

      <QuestionPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        usageFor="exam"
        selected={selectedQuestions}
        onApply={(qs) => setSelectedQuestions(qs)}
      />
    </Modal>
  );
}
