"use client";

import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import useCaApplications from "@/hooks/useCaApplications";

interface Props {
  application: { id: string; name: string } | null;
  onClose: () => void;
  onSuccess: () => void;
  /** Called when the request fails (e.g. someone else already decided this
   *  row), so the caller can refresh the list instead of leaving it stale. */
  onFailed?: () => void;
}

export default function DeclineCaModal({ application, onClose, onSuccess, onFailed }: Props) {
  const { decline, isLoading } = useCaApplications();

  if (!application) return null;

  const onConfirm = async () => {
    const ok = await decline(application.id);
    if (ok) {
      toast.success("Application declined");
      onSuccess();
    } else {
      onFailed?.();
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Decline ${application.name}?`}>
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          The application is deleted. They won&apos;t be told, and they can apply again.
        </p>
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          This can&apos;t be undone. Their encrypted UPI ID is deleted with it.
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <WhiteButton type="button" glow={false} disabled={isLoading} onClick={onClose}>
            Keep it
          </WhiteButton>
          <WhiteButton
            type="button"
            glow={false}
            className="border-red-300 text-red-600 hover:border-red-400"
            disabled={isLoading}
            onClick={() => void onConfirm()}
          >
            {isLoading ? "Declining…" : "Decline and delete"}
          </WhiteButton>
        </div>
      </div>
    </Modal>
  );
}
