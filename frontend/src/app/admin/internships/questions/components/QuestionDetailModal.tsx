"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { InternshipQuestionDetail } from "../types";

type Props = {
  isOpen: boolean;
  questionId: string | null;
  onClose: () => void;
  onMutate: () => void;
  onEdit: (id: string) => void;
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function QuestionDetailModal({
  isOpen,
  questionId,
  onClose,
  onMutate,
  onEdit,
}: Props) {
  const [detail, setDetail] = useState<InternshipQuestionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen || !questionId) {
      setDetail(null);
      setConfirmDelete(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(
          ENDPOINTS.internshipQuestions.adminById(questionId),
        );
        const d = res.data?.data as InternshipQuestionDetail | undefined;
        if (!cancelled) setDetail(d ?? null);
      } catch {
        if (!cancelled) {
          toast.error("Could not load question");
          onClose();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, questionId]); // omit onClose: unstable identity would refetch

  const handleDeleteConfirmed = async () => {
    if (!questionId) return;
    setDeleting(true);
    try {
      await apiClient.delete(
        ENDPOINTS.internshipQuestions.adminById(questionId),
      );
      toast.success("Question deleted");
      onMutate();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not delete question";
      toast.error(msg);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleEdit = () => {
    if (!questionId) return;
    onEdit(questionId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Question details"
      className="max-w-lg w-full mx-4 max-h-[90vh]"
    >
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      ) : confirmDelete ? (
        <div className="space-y-4">
          <p className="text-gray-700">
            Delete this question permanently? This cannot be undone if it is not
            linked to any exam or task template.
          </p>
          {detail?.questionText ? (
            <p className="text-sm text-gray-500 line-clamp-3 border border-gray-100 rounded-lg p-3 bg-gray-50">
              {detail.questionText}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <WhiteButton
              type="button"
              glow={false}
              disabled={deleting}
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </WhiteButton>
            <OrangeButton
              type="button"
              glow={false}
              disabled={deleting}
              onClick={() => void handleDeleteConfirmed()}
              className="bg-red-600 hover:bg-red-700 border-red-600"
            >
              {deleting ? "Deleting…" : "Delete"}
            </OrangeButton>
          </div>
        </div>
      ) : !detail ? (
        <p className="text-gray-500 text-center py-6">No data.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Question
            </p>
            <p className="text-gray-900 whitespace-pre-wrap">{detail.questionText}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Type
              </p>
              <p className="text-gray-800 uppercase">{detail.type}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Usage
              </p>
              <p className="text-gray-800 capitalize">{detail.usageType}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Score
              </p>
              <p className="text-gray-800 tabular-nums">{detail.score}</p>
            </div>
            {detail.type === "mcq" ? (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Negative marks
                </p>
                <p className="text-gray-800 tabular-nums">
                  {detail.negativeScore && detail.negativeScore > 0
                    ? `−${detail.negativeScore}`
                    : "—"}
                </p>
              </div>
            ) : null}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Active
              </p>
              <span
                className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${
                  detail.isActive
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                }`}
              >
                {detail.isActive ? "Yes" : "No"}
              </span>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Category
              </p>
              <p className="text-gray-800">
                {detail.category?.trim() ? detail.category : "—"}
              </p>
            </div>
          </div>

          {detail.type === "mcq" && detail.options && detail.options.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Options (correct marked)
              </p>
              <ul className="space-y-2">
                {detail.options.map((o, i) => (
                  <li
                    key={o._id ?? i}
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                      o.isCorrect
                        ? "border-green-200 bg-green-50/80 text-green-900"
                        : "border-gray-200 bg-white text-gray-800"
                    }`}
                  >
                    <span className="font-medium text-gray-500 shrink-0">
                      {i + 1}.
                    </span>
                    <span className="flex-1">{o.text}</span>
                    {o.isCorrect ? (
                      <span className="text-xs font-semibold text-green-700 shrink-0">
                        Correct
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {detail.type === "file_upload" ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Project Input Files
              </p>
              <p className="text-sm text-gray-800 break-all">
                {detail.referenceFile?.trim()
                  ? detail.referenceFile
                  : "—"}
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500 border-t border-gray-100 pt-3">
            <p>Created: {formatDate(detail.createdAt)}</p>
            <p>Updated: {formatDate(detail.updatedAt)}</p>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-100">
            <WhiteButton type="button" glow={false} onClick={onClose}>
              Close
            </WhiteButton>
            <WhiteButton
              type="button"
              glow={false}
              className="inline-flex items-center gap-2 text-red-600 border-red-200 hover:border-red-300"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-4" />
              Delete
            </WhiteButton>
            <OrangeButton
              type="button"
              glow={false}
              className="inline-flex items-center gap-2"
              onClick={handleEdit}
            >
              <Pencil className="size-4" />
              Edit
            </OrangeButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
