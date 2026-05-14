"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";

type Props = {
  target: { id: string; name: string } | null;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteLiveMeetingConfirmModal({
  target,
  onClose,
  onDeleted,
}: Props) {
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!target) return;
    setSubmitting(true);
    try {
      await apiClient.delete(ENDPOINTS.internshipLiveMeetings.adminById(target.id));
      toast.success("Live meeting deleted");
      onDeleted();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Failed to delete";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={target !== null}
      onClose={onClose}
      title="Delete live meeting?"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-700">
          This permanently deletes
          <span className="font-semibold"> {target?.name ?? "this meeting"} </span>
          and any attendance records for it. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <WhiteButton type="button" glow={false} disabled={submitting} onClick={onClose}>
            Cancel
          </WhiteButton>
          <OrangeButton
            type="button"
            glow={false}
            disabled={submitting}
            onClick={() => void handleDelete()}
          >
            {submitting ? "Deleting…" : "Delete"}
          </OrangeButton>
        </div>
      </div>
    </Modal>
  );
}
