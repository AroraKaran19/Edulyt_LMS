"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import useCaTasks from "@/hooks/useCaTasks";

type Props = {
  isOpen: boolean;
  taskId: string | null;
  preview?: string;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteCaTaskConfirmModal({ isOpen, taskId, preview, onClose, onDeleted }: Props) {
  const { deleteAdmin } = useCaTasks();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!taskId) return;
    setDeleting(true);
    const ok = await deleteAdmin(taskId);
    setDeleting(false);
    if (!ok) return;
    toast.success("CA task deleted");
    onDeleted();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete this CA task?" className="max-w-md w-full mx-4">
      <p className="text-gray-700 text-sm mb-3">
        Any submissions already made keep their own record, but the task itself disappears from the admin list.
      </p>
      {preview ? (
        <p className="text-sm text-gray-600 line-clamp-3 border border-gray-100 rounded-lg p-3 bg-gray-50 mb-4">{preview}</p>
      ) : null}
      <div className="flex justify-end gap-2">
        <WhiteButton type="button" glow={false} disabled={deleting} onClick={onClose}>
          Cancel
        </WhiteButton>
        <OrangeButton
          type="button"
          glow={false}
          disabled={deleting}
          onClick={() => void handleDelete()}
          className="bg-red-600 hover:bg-red-700 border-red-600"
        >
          {deleting ? "Deleting..." : "Delete"}
        </OrangeButton>
      </div>
    </Modal>
  );
}
