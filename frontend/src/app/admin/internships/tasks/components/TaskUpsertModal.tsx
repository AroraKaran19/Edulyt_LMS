"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import QuestionPickerModal, {
  type PickerQuestion,
} from "@/components/admin/internships/QuestionPickerModal";
import { ListPlus, Lock, X } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { InternshipTaskTemplateDetail } from "@/types/internship-task";

/** Read-only display field used in edit mode for locked values. */
function LockedField({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
        {label} <Lock className="w-3 h-3 text-gray-400" />
      </label>
      <div className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700">
        {value}
      </div>
    </div>
  );
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  taskId?: string | null;
};

export default function TaskUpsertModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  taskId,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<PickerQuestion[]>(
    [],
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [unlockAfterDays, setUnlockAfterDays] = useState("0");
  const [dueDays, setDueDays] = useState("7");
  const [scoreThreshold, setScoreThreshold] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const resetCreate = () => {
    setTitle("");
    setDescription("");
    setSelectedQuestions([]);
    setUnlockAfterDays("0");
    setDueDays("7");
    setScoreThreshold("0");
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

    if (!taskId) return;

    let cancelled = false;
    (async () => {
      setLoadingDetail(true);
      try {
        const res = await apiClient.get(
          ENDPOINTS.internshipTasks.adminById(taskId),
        );
        const d = res.data?.data as InternshipTaskTemplateDetail | undefined;
        if (cancelled || !d) return;
        setTitle(d.title ?? "");
        setDescription(d.description ?? "");
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
        setUnlockAfterDays(String(d.unlockAfterDays ?? 0));
        setDueDays(String(d.dueDays ?? 0));
        setScoreThreshold(String(d.scoreThreshold ?? 0));
        setIsActive(d.isActive !== false);
      } catch {
        if (!cancelled) {
          toast.error("Could not load task template");
          onClose();
        }
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, taskId]);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Title is required");
      return;
    }
    if (!selectedQuestions.length) {
      toast.error("Select at least one question (task or both usage)");
      return;
    }
    const unlock = parseInt(unlockAfterDays, 10);
    const due = parseInt(dueDays, 10);
    if (Number.isNaN(unlock) || unlock < 0) {
      toast.error("Unlock (days) must be a non-negative integer");
      return;
    }
    if (Number.isNaN(due) || due < 0) {
      toast.error("Due (days) must be a non-negative integer");
      return;
    }
    if (due < unlock) {
      toast.error("Due days must be greater than or equal to unlock days");
      return;
    }

    const thresholdRaw = parseFloat(scoreThreshold);
    if (Number.isNaN(thresholdRaw) || !Number.isFinite(thresholdRaw) || thresholdRaw < 0) {
      toast.error("Score threshold must be a non-negative number");
      return;
    }

    const payload = {
      title: trimmedTitle,
      description: description.trim(),
      questions: selectedQuestions.map((q) => q._id),
      unlockAfterDays: unlock,
      dueDays: due,
      scoreThreshold: thresholdRaw,
      isActive,
    };

    setSubmitting(true);
    try {
      if (mode === "create") {
        await apiClient.post(ENDPOINTS.internshipTasks.create, payload);
        toast.success("Task template created");
      } else {
        if (!taskId) {
          toast.error("Missing task id");
          return;
        }
        await apiClient.patch(
          ENDPOINTS.internshipTasks.adminById(taskId),
          payload,
        );
        toast.success("Task template updated");
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not save task template";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle =
    mode === "create" ? "New task template" : "Edit task template";

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
          <p className="text-sm text-gray-500">Loading task template…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* ── CREATE: editable fields ───────────────────────────────── */}
          {mode === "create" && (
            <>
              <Input
                label="Title"
                required
                placeholder="e.g. Week 1 — API integration"
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

            </>
          )}

          {/* ── EDIT: locked info panel ───────────────────────────────── */}
          {mode === "edit" && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Read-only fields
                </span>
              </div>
              <LockedField label="Title" value={title} />
              {description && <LockedField label="Description" value={description} />}
            </div>
          )}

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
            Score threshold cannot exceed that total.
          </p>

          <Input
            label="Score threshold"
            type="number"
            min={0}
            step="any"
            required
            placeholder="0"
            value={scoreThreshold}
            onChange={(e) => setScoreThreshold(e.target.value)}
          />
          <p className="text-xs text-gray-500 -mt-2">
            Minimum total points a learner must score to pass this task.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Unlock after (days)"
              type="number"
              min={0}
              required
              placeholder="0"
              value={unlockAfterDays}
              onChange={(e) => setUnlockAfterDays(e.target.value)}
            />
            <Input
              label="Due after (days)"
              type="number"
              min={0}
              required
              placeholder="7"
              value={dueDays}
              onChange={(e) => setDueDays(e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            The template stores the same day counts for everyone; each
            learner&apos;s actual dates depend on when they enrolled.
            Someone who enrolls Monday and someone who enrolls Friday get
            different calendar unlock and due times, but the same offset
            from their own enrollment. Unlock: days after enroll before the
            task appears. Due: days after enroll for the deadline (e.g. 7 =
            due 7 days after they enrolled). Due must be on or after unlock.
          </p>

          <CheckBoxContainer
            label="Task template is active"
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

      <QuestionPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        usageFor="task"
        selected={selectedQuestions}
        onApply={(qs) => setSelectedQuestions(qs)}
      />
    </Modal>
  );
}
