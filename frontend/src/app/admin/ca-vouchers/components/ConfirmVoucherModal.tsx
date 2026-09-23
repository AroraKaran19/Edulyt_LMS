"use client";

import type { ReactNode } from "react";
import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  warning?: ReactNode;
  confirmLabel: string;
  busyLabel: string;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmVoucherModal({
  open,
  title,
  children,
  warning,
  confirmLabel,
  busyLabel,
  busy,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal isOpen={open} onClose={busy ? () => undefined : onClose} title={title}>
      <div className="space-y-4">
        <div className="text-sm text-gray-700">{children}</div>
        {warning ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">{warning}</div>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
          <WhiteButton type="button" glow={false} disabled={busy} onClick={onClose}>
            Cancel
          </WhiteButton>
          <WhiteButton
            type="button"
            glow={false}
            className="border-red-300 text-red-600 hover:border-red-400"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? busyLabel : confirmLabel}
          </WhiteButton>
        </div>
      </div>
    </Modal>
  );
}
