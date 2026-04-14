"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import type { Assessment } from "@/types/assessment";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";
import {
  MOCK_BATCHES,
  MOCK_FILE_POOL,
  MOCK_INTERNSHIPS,
  MOCK_MCQ_POOL,
} from "./mockData";

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(s: string) {
  const t = Date.parse(s);
  return Number.isNaN(t) ? new Date() : new Date(t);
}

type Props = {
  open: boolean;
  onClose: () => void;
  /** null = create */
  editing: Assessment | null;
  onSave: (row: Assessment) => void;
};

const AssessmentEditorModal = ({ open, onClose, editing, onSave }: Props) => {
  const [internshipId, setInternshipId] = useState("");
  const [batchId, setBatchId] = useState<string>("");
  const [submissionType, setSubmissionType] = useState<"mcq" | "file">("mcq");
  const [mcqSelected, setMcqSelected] = useState<Set<string>>(new Set());
  const [fileSelected, setFileSelected] = useState<Set<string>>(new Set());
  const [assessmentPoints, setAssessmentPoints] = useState(100);
  const [startStr, setStartStr] = useState("");
  const [endStr, setEndStr] = useState("");
  const [isActive, setIsActive] = useState(true);

  const batchesForInternship = useMemo(
    () => MOCK_BATCHES.filter((b) => b.internshipId === internshipId),
    [internshipId],
  );

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setInternshipId(editing.internship);
      setBatchId(editing.batch ?? "");
      setSubmissionType(editing.submissionType);
      if (editing.submissionType === "mcq") {
        setMcqSelected(new Set(editing.mcqQuestions));
        setFileSelected(new Set());
      } else {
        setFileSelected(new Set(editing.fileQuestions));
        setMcqSelected(new Set());
      }
      setAssessmentPoints(editing.assessmentPoints);
      setStartStr(toLocalInputValue(new Date(editing.duration.startDate)));
      setEndStr(toLocalInputValue(new Date(editing.duration.endDate)));
      setIsActive(editing.isActive);
    } else {
      const first = MOCK_INTERNSHIPS[0];
      setInternshipId(first._id);
      setBatchId("");
      setSubmissionType("mcq");
      setMcqSelected(new Set([MOCK_MCQ_POOL[0]._id]));
      setFileSelected(new Set([MOCK_FILE_POOL[0]._id]));
      setAssessmentPoints(100);
      const now = new Date();
      const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      setStartStr(toLocalInputValue(now));
      setEndStr(toLocalInputValue(week));
      setIsActive(true);
    }
  }, [open, editing]);

  useEffect(() => {
    if (
      !internshipId ||
      (batchId !== "" &&
        !batchesForInternship.some((b) => String(b.batchIndex) === batchId))
    ) {
      setBatchId("");
    }
  }, [internshipId, batchesForInternship, batchId]);

  if (!open) return null;

  const base = {
    internship: internshipId,
    ...(batchId ? { batch: batchId } : {}),
    assessmentPoints,
    duration: {
      startDate: fromLocalInputValue(startStr),
      endDate: fromLocalInputValue(endStr),
    },
    createdBy: editing?.createdBy ?? "admin-local",
    isActive,
    ...(editing?._id ? { _id: editing._id } : {}),
    createdAt: editing?.createdAt,
    updatedAt: editing?.updatedAt,
  };

  const handleSave = () => {
    if (submissionType === "mcq") {
      const mcqQuestions = [...mcqSelected];
      if (mcqQuestions.length === 0) {
        toast.warning("Select at least one MCQ question.");
        return;
      }
      const row: Assessment = {
        ...base,
        submissionType: "mcq",
        mcqQuestions,
      };
      if (!editing?._id) row._id = `asmt-${Date.now()}`;
      onSave(row);
    } else {
      const fileQuestions = [...fileSelected];
      if (fileQuestions.length === 0) {
        toast.warning("Select at least one file prompt.");
        return;
      }
      const row: Assessment = {
        ...base,
        submissionType: "file",
        fileQuestions,
      };
      if (!editing?._id) row._id = `asmt-${Date.now()}`;
      onSave(row);
    }
    onClose();
  };

  const toggleMcq = (id: string) => {
    setMcqSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFile = (id: string) => {
    setFileSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 cursor-default"
        aria-label="Close dialog backdrop"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-gray-200">
        <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {editing ? "Edit assessment" : "New assessment"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 cursor-pointer"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internship
            </label>
            <select
              value={internshipId}
              onChange={(e) => setInternshipId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              {MOCK_INTERNSHIPS.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batch scope
            </label>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">All batches (internship-wide)</option>
              {batchesForInternship.map((b) => (
                <option
                  key={`${b.internshipId}-${b.batchIndex}`}
                  value={String(b.batchIndex)}
                >
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Submission type
            </span>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="stype"
                  checked={submissionType === "mcq"}
                  onChange={() => setSubmissionType("mcq")}
                />
                <span className="text-sm">MCQ</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="stype"
                  checked={submissionType === "file"}
                  onChange={() => setSubmissionType("file")}
                />
                <span className="text-sm">File upload</span>
              </label>
            </div>
          </div>

          {submissionType === "mcq" ? (
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">
                MCQ questions
              </span>
              <ul className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
                {MOCK_MCQ_POOL.map((q) => (
                  <li key={q._id} className="flex gap-2 items-start p-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={mcqSelected.has(q._id)}
                      onChange={() => toggleMcq(q._id)}
                    />
                    <span className="text-sm text-gray-800">{q.preview}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">
                File prompts
              </span>
              <ul className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
                {MOCK_FILE_POOL.map((q) => (
                  <li key={q._id} className="flex gap-2 items-start p-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={fileSelected.has(q._id)}
                      onChange={() => toggleFile(q._id)}
                    />
                    <span className="text-sm text-gray-800">{q.preview}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Input
            label="Total points (if qualified)"
            type="number"
            min={1}
            value={assessmentPoints}
            onChange={(e) => setAssessmentPoints(Number(e.target.value) || 0)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Window start
              </label>
              <input
                type="datetime-local"
                value={startStr}
                onChange={(e) => setStartStr(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Window end
              </label>
              <input
                type="datetime-local"
                value={endStr}
                onChange={(e) => setEndStr(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span className="text-sm text-gray-800">Active</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <WhiteButton type="button" onClick={onClose}>
            Cancel
          </WhiteButton>
          <OrangeButton type="button" onClick={handleSave}>
            Save locally
          </OrangeButton>
        </div>
      </div>
    </div>
  );
};

export default AssessmentEditorModal;
