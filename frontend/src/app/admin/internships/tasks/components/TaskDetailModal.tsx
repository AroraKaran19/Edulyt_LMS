"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { InternshipTaskTemplateDetail } from "@/types/internship-task";

type Props = {
  isOpen: boolean;
  taskId: string | null;
  onClose: () => void;
  onMutate: () => void;
  onEdit: (id: string) => void;
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
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

function creatorLabel(
  u: InternshipTaskTemplateDetail["createdBy"],
): string {
  if (!u) return "—";
  if (u.name?.trim()) return u.name.trim();
  const parts = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  if (u.email) return u.email;
  return u._id;
}

export default function TaskDetailModal({
  isOpen,
  taskId,
  onClose,
  onMutate,
  onEdit,
}: Props) {
  const [detail, setDetail] = useState<InternshipTaskTemplateDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen || !taskId) {
      setDetail(null);
      setConfirmDelete(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(
          ENDPOINTS.internshipTasks.adminById(taskId),
        );
        const d = res.data?.data as InternshipTaskTemplateDetail | undefined;
        if (!cancelled) setDetail(d ?? null);
      } catch {
        if (!cancelled) {
          toast.error("Could not load task template");
          onClose();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, taskId]);

  const handleDeleteConfirmed = async () => {
    if (!taskId) return;
    setDeleting(true);
    try {
      await apiClient.delete(ENDPOINTS.internshipTasks.adminById(taskId));
      toast.success("Task template deleted");
      onMutate();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not delete task template";
      toast.error(msg);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleEdit = () => {
    if (!taskId) return;
    onEdit(taskId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Task template details"
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
            Delete this task template permanently? Templates linked to an
            internship batch cannot be deleted until removed from those
            batches.
          </p>
          {detail?.title ? (
            <p className="text-sm text-gray-600 line-clamp-2 border border-gray-100 rounded-lg p-3 bg-gray-50">
              {detail.title}
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
              Title
            </p>
            <p className="text-gray-900 font-medium">{detail.title}</p>
          </div>

          {detail.description?.trim() ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Description
              </p>
              <p className="text-gray-800 text-sm whitespace-pre-wrap">
                {detail.description}
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Total score
              </p>
              <p className="text-gray-800 tabular-nums">{detail.totalScore}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Pass at (threshold)
              </p>
              <p className="text-gray-800 tabular-nums">
                {detail.scoreThreshold ?? 0}
              </p>
            </div>
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
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Unlock (days)
              </p>
              <p className="text-gray-800 tabular-nums">
                {detail.unlockAfterDays}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Due (days)
              </p>
              <p className="text-gray-800 tabular-nums">{detail.dueDays}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Questions ({detail.questions?.length ?? 0})
            </p>
            <ul className="max-h-48 overflow-y-auto space-y-2 border border-gray-100 rounded-lg p-2 bg-gray-50/50">
              {(detail.questions ?? []).map((q, i) => (
                <li
                  key={q._id}
                  className="text-sm text-gray-800 border-b border-gray-100 last:border-0 pb-2 last:pb-0"
                >
                  <span className="font-medium text-gray-500 mr-2">{i + 1}.</span>
                  <span className="line-clamp-2">{q.questionText}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {q.type?.toUpperCase()} · {q.score} pts · {q.usageType}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-xs text-gray-500 border-t border-gray-100 pt-3 space-y-1">
            <p>Created by: {creatorLabel(detail.createdBy)}</p>
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
