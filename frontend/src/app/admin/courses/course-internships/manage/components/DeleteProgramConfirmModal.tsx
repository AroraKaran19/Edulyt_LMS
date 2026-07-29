"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";

type Props = {
  program: { _id: string; title: string; courseCount: number } | null;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteProgramConfirmModal({
  program,
  onClose,
  onDeleted,
}: Props) {
  const [deleting, setDeleting] = useState(false);
  const isOpen = !!program;

  useEffect(() => {
    if (!isOpen) setDeleting(false);
  }, [isOpen]);

  const inUse = (program?.courseCount ?? 0) > 0;

  const handleDelete = async () => {
    if (!program) return;
    setDeleting(true);
    try {
      await apiClient.delete(ENDPOINTS.courseInternships.byId(program._id));
      toast.success("Program deleted");
      onDeleted();
    } catch (err: unknown) {
      // The server refuses while any course still offers it, and its message
      // names how many — surface that rather than a generic failure.
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not delete program";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete program?"
      className="max-w-md w-full mx-4"
    >
      {inUse ? (
        <p className="text-gray-700 text-sm mb-4">
          <span className="font-medium">{program?.title}</span> is offered by{" "}
          {program?.courseCount} course
          {program?.courseCount === 1 ? "" : "s"}. Remove it from those courses
          first — deleting it now would strand their internship offer.
        </p>
      ) : (
        <p className="text-gray-700 text-sm mb-4">
          This cannot be undone. No course currently offers{" "}
          <span className="font-medium">{program?.title}</span>.
        </p>
      )}
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
          disabled={deleting || inUse}
          onClick={() => void handleDelete()}
          className="bg-red-600 hover:bg-red-700 border-red-600"
        >
          {deleting ? "Deleting…" : "Delete"}
        </OrangeButton>
      </div>
    </Modal>
  );
}
