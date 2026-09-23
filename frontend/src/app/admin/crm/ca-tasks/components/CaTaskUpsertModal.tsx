"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/inputs/Input";
import TextArea from "@/components/ui/inputs/TextArea";
import CheckBoxContainer from "@/components/ui/inputs/CheckBoxContainer";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import QuestionPickerModal, { type PickerQuestion } from "@/components/admin/internships/QuestionPickerModal";
import { ListPlus, Lock, X } from "lucide-react";
import useCaTasks from "@/hooks/useCaTasks";

/** Read-only display field used in edit mode for locked values. */
function LockedField({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
        {label} <Lock className="w-3 h-3 text-gray-400" />
      </label>
      <div className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700">{value}</div>
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

export default function CaTaskUpsertModal({ isOpen, onClose, onSuccess, mode, taskId }: Props) {
  const { getAdmin, createAdmin, updateAdmin } = useCaTasks();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<PickerQuestion[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [startFromDay, setStartFromDay] = useState("0");
  const [endOnDay, setEndOnDay] = useState("7");
  const [passScore, setPassScore] = useState("0");
  const [successPoints, setSuccessPoints] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const resetCreate = () => {
    setTitle("");
    setDescription("");
    setSelectedQuestions([]);
    setStartFromDay("0");
    setEndOnDay("7");
    setPassScore("0");
    setSuccessPoints("0");
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
      const d = await getAdmin(taskId);
      if (cancelled) return;
      if (!d) {
        onClose();
        setLoadingDetail(false);
        return;
      }
      setTitle(d.title ?? "");
      setDescription(d.description ?? "");
      setSelectedQuestions(
        Array.isArray(d.questions)
          ? d.questions.map((q) => ({
              _id: q.id,
              questionText: q.questionText ?? "",
              type: q.type ?? "",
              usageType: "task",
              score: typeof q.score === "number" ? q.score : 0,
              category: q.category ?? null,
            }))
          : [],
      );
      setStartFromDay(String(d.startFromDay ?? 0));
      setEndOnDay(String(d.endOnDay ?? 0));
      setPassScore(String(d.passScore ?? 0));
      setSuccessPoints(String(d.successPoints ?? 0));
      setIsActive(d.isActive !== false);
      setLoadingDetail(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, taskId]);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Title is required");
      return;
    }
    if (!selectedQuestions.length) {
      toast.error("Select at least one question");
      return;
    }
    const start = parseInt(startFromDay, 10);
    const end = parseInt(endOnDay, 10);
    if (Number.isNaN(start) || start < 0) {
      toast.error("Opens on day must be a non-negative integer");
      return;
    }
    if (Number.isNaN(end) || end < start) {
      toast.error("Closes on day must be on or after the opens day");
      return;
    }

    const passRaw = parseFloat(passScore);
    if (Number.isNaN(passRaw) || !Number.isFinite(passRaw) || passRaw < 0) {
      toast.error("Pass score must be a non-negative number");
      return;
    }

    const successPointsNum = parseInt(successPoints, 10);
    if (Number.isNaN(successPointsNum) || successPointsNum < 0) {
      toast.error("Success points must be a non-negative integer");
      return;
    }

    const payload = {
      title: trimmedTitle,
      description: description.trim(),
      questionIds: selectedQuestions.map((q) => q._id),
      startFromDay: start,
      endOnDay: end,
      passScore: passRaw,
      successPoints: successPointsNum,
      isActive,
    };

    setSubmitting(true);
    const result = mode === "create" ? await createAdmin(payload) : taskId ? await updateAdmin(taskId, payload) : null;
    setSubmitting(false);
    if (!result) return;
    toast.success(mode === "create" ? "CA task created" : "CA task updated");
    onSuccess();
    onClose();
  };

  const modalTitle = mode === "create" ? "New CA task" : "Edit CA task";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} className="max-w-2xl w-full mx-4 max-h-[90vh]">
      {mode === "edit" && loadingDetail ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          <p className="text-sm text-gray-500">Loading CA task...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {mode === "create" && (
            <>
              <Input
                label="Title"
                required
                placeholder="e.g. Week 1: Campus poster drop"
                className="max-sm:text-base"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <TextArea
                label="Description"
                placeholder="Instructions or context for admins (optional)"
                className="max-sm:text-base"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </>
          )}

          {mode === "edit" && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Read-only fields</span>
              </div>
              <LockedField label="Title" value={title} />
              {description && <LockedField label="Description" value={description} />}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Questions</span>
              <span className="text-xs text-gray-500 tabular-nums">
                {selectedQuestions.length} selected - Total score {selectedQuestions.reduce((s, q) => s + (q.score || 0), 0)}
              </span>
            </div>
            <WhiteButton
              type="button"
              glow={false}
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center justify-center gap-2"
            >
              <ListPlus className="w-4 h-4" />
              {selectedQuestions.length === 0 ? "Add questions" : "Add or remove questions"}
            </WhiteButton>
            {selectedQuestions.length > 0 ? (
              <ul className="rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-[220px] overflow-y-auto">
                {selectedQuestions.map((q) => (
                  <li key={q._id} className="flex items-start gap-3 px-3 py-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 line-clamp-1">{q.questionText || "Untitled"}</p>
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
                      onClick={() => setSelectedQuestions((prev) => prev.filter((x) => x._id !== q._id))}
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
            Total marks are computed from the selected questions when you save. The pass score cannot exceed that total.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Input
                label="Pass score (marks)"
                type="number"
                min={0}
                step="any"
                required
                placeholder="0"
                className="max-sm:text-base"
                value={passScore}
                onChange={(e) => setPassScore(e.target.value)}
              />
              <p className="text-xs text-gray-500">Minimum marks a CA must score to pass this task.</p>
            </div>
            <div className="flex flex-col gap-1">
              <Input
                label="Success points"
                type="number"
                min={0}
                required
                placeholder="0"
                className="max-sm:text-base"
                value={successPoints}
                onChange={(e) => setSuccessPoints(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Internship success points: added to the CA&apos;s points total (not the wallet) the moment they pass this task. The total decides their completion documents.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Opens on day"
              type="number"
              min={0}
              required
              placeholder="0"
              className="max-sm:text-base"
              value={startFromDay}
              onChange={(e) => setStartFromDay(e.target.value)}
            />
            <Input
              label="Closes on day"
              type="number"
              min={0}
              required
              placeholder="7"
              className="max-sm:text-base"
              value={endOnDay}
              onChange={(e) => setEndOnDay(e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            Days count from each CA&apos;s joining date in IST, starting at 0: day 0 is the joining date itself, day 1
            is the next day. The task opens at 12:00 AM on the opens day and closes at 11:59 PM on the closes day. For
            example, opens 0 and closes 6 covers the CA&apos;s first 7 days.
          </p>

          <CheckBoxContainer label="Task is active" checked={isActive} onChange={setIsActive} />

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <WhiteButton type="button" glow={false} disabled={submitting} onClick={onClose}>
              Cancel
            </WhiteButton>
            <OrangeButton type="button" glow={false} disabled={submitting} onClick={() => void handleSubmit()}>
              {submitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
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
