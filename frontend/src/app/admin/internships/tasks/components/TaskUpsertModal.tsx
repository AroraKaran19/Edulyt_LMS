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
import type { InternshipTaskTemplateDetail } from "@/types/internship-task";

type TaskBankQuestionRow = {
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
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [unlockAfterDays, setUnlockAfterDays] = useState("0");
  const [dueDays, setDueDays] = useState("7");
  const [scoreThreshold, setScoreThreshold] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const resetCreate = () => {
    setTitle("");
    setDescription("");
    setQuestionIds([]);
    setUnlockAfterDays("0");
    setDueDays("7");
    setScoreThreshold("0");
    setIsActive(true);
    setSubmitting(false);
    setLoadingDetail(false);
  };

  const fetchTaskQuestions = useCallback(
    async (page: number, search: string) => {
      const res = await apiClient.get(ENDPOINTS.internshipQuestions.adminList, {
        params: {
          page,
          limit: 15,
          search: search.trim() || undefined,
          usageFor: "task",
        },
      });
      const payload = res.data?.data as
        | {
            questions?: TaskBankQuestionRow[];
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
        setQuestionIds(
          Array.isArray(d.questions)
            ? d.questions.map((q) => String(q._id))
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
    if (!questionIds.length) {
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
      questions: questionIds,
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

          <InfiniteScrollSelect<TaskBankQuestionRow>
            label="Questions"
            placeholder="Search task-eligible questions…"
            multi
            value={questionIds}
            onChange={(v) =>
              setQuestionIds(Array.isArray(v) ? v : v ? [v] : [])
            }
            fetchOptions={fetchTaskQuestions}
            getOptionLabel={(q) => {
              const row = q as TaskBankQuestionRow;
              const t = (row.questionText ?? "").trim() || "Untitled";
              const short = t.length > 72 ? `${t.slice(0, 72)}…` : t;
              const pts =
                typeof row.score === "number" ? ` · ${row.score} pts` : "";
              return `${short}${pts} · ${row.usageType}`;
            }}
            getOptionValue={(q) => String((q as TaskBankQuestionRow)._id ?? "")}
            searchPlaceholder="Search question text…"
            emptyMessage="No questions with task/both usage. Add them in the question bank."
            dropdownPortal
          />

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
    </Modal>
  );
}
