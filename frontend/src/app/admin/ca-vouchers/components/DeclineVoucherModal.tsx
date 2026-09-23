"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import TextArea from "@/components/ui/inputs/TextArea";
import WhiteButton from "@/components/ui/buttons/WhiteButton";

const MAX_REASON = 300;

interface Props {
  request: { caName: string; courseTitle: string } | null;
  busy: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

/** Remount per request (keyed by the caller) so the reason starts empty. */
export default function DeclineVoucherModal({ request, busy, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState("");

  if (!request) return null;

  return (
    <Modal isOpen onClose={busy ? () => undefined : onClose} title={`Decline ${request.caName}'s request?`}>
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          They asked for <span className="font-semibold">{request.courseTitle}</span>. They see the reason on their
          desk, and can request again after the cooldown.
        </p>
        <TextArea
          label="Reason (optional)"
          placeholder="Let them know why"
          rows={3}
          lockHeight
          maxLength={MAX_REASON}
          showWordCount
          value={reason}
          setChange={setReason}
          disabled={busy}
          className="max-sm:text-base"
        />
        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
          <WhiteButton type="button" glow={false} disabled={busy} onClick={onClose}>
            Cancel
          </WhiteButton>
          <WhiteButton
            type="button"
            glow={false}
            className="border-red-300 text-red-600 hover:border-red-400"
            disabled={busy}
            onClick={() => onConfirm(reason.trim())}
          >
            {busy ? "Declining…" : "Decline request"}
          </WhiteButton>
        </div>
      </div>
    </Modal>
  );
}
