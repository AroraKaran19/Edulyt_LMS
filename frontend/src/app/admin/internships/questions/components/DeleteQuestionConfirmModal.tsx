"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";

type Props = {
  isOpen: boolean;
  questionId: string | null;
  preview?: string;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteQuestionConfirmModal({
  isOpen,
  questionId,
  preview,
  onClose,
  onDeleted,
}: Props) {
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) setDeleting(false);
  }, [isOpen]);

  const handleDelete = async () => {
    if (!questionId) return;
    setDeleting(true);
    try {
      await apiClient.delete(
        ENDPOINTS.internshipQuestions.adminById(questionId),
      );
      toast.success("Question deleted");
      onDeleted();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not delete question";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete question?"
      className="max-w-md w-full mx-4"
    >
      <p className="text-gray-700 text-sm mb-3">
        This cannot be undone. Questions linked to exam or task templates cannot
        be deleted until removed from those templates.
      </p>
      {preview ? (
        <p className="text-sm text-gray-600 line-clamp-3 border border-gray-100 rounded-lg p-3 bg-gray-50 mb-4">
          {preview}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <WhiteButton
          type="button"
          glow={false}
          disabled={deleting}
          onClick={onClose}
        >
          Cancel
        </WhiteButton>
        <OrangeButton
          type="button"
          glow={false}
          disabled={deleting}
          onClick={() => void handleDelete()}
          className="bg-red-600 hover:bg-red-700 border-red-600"
        >
          {deleting ? "Deleting…" : "Delete"}
        </OrangeButton>
      </div>
    </Modal>
  );
}
