"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, RotateCw, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/inputs/Input";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { DeletionPreview } from "@/types/scholarship";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  testId: string | null;
  title: string;
};

const errorMessage = (error: unknown, fallback: string): string => {
  const e = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
  };
  return (
    e?.response?.data?.error?.message || e?.response?.data?.message || fallback
  );
};

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

export default function DeleteScholarshipTestConfirmModal({
  isOpen,
  onClose,
  onDeleted,
  testId,
  title,
}: Props) {
  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const loadPreview = useCallback(async () => {
    if (!testId) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get(
        ENDPOINTS.scholarshipTests.adminDeletionPreview(testId),
      );
      setPreview(res.data?.data as DeletionPreview);
    } catch (error) {
      toast.error(errorMessage(error, "Could not check what deletion affects"));
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [testId, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setConfirmText("");
    setPreview(null);
    void loadPreview();
  }, [isOpen, loadPreview]);

  const confirm = async () => {
    if (!testId) return;
    setDeleting(true);
    try {
      await apiClient.delete(ENDPOINTS.scholarshipTests.adminById(testId));
      toast.success("Campaign deleted");
      onDeleted();
      onClose();
    } catch (error) {
      // A checkout can start between the preview and this click, so a 409 here
      // refreshes the counts rather than closing on a stale picture.
      toast.error(errorMessage(error, "Could not delete the campaign"));
      void loadPreview();
    } finally {
      setDeleting(false);
    }
  };

  const titleMatches = confirmText.trim() === title.trim();
  const canDelete =
    !!preview && !preview.blocked && titleMatches && !deleting && !isLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete campaign"
      className="max-w-lg w-full mx-4"
    >
      {isLoading || !preview ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          <p className="text-sm text-gray-500">
            Checking what this affects…
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {preview.blocked ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-amber-900">
                  Cannot delete this campaign yet
                </p>
                {/* Server-authored: rewriting it on the client would let the
                    wording drift from the counts it is describing. */}
                <p className="text-sm text-amber-900">
                  {preview.blockedReason}
                </p>
                <p className="text-xs text-amber-800 mt-1">
                  Deleting now would break those payments. Wait for them to
                  finish or fail, then try again.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700">
                Deletes <strong>{title}</strong>, its coupon, and{" "}
                <strong className="tabular-nums">
                  {plural(
                    preview.unclaimedEntitlements,
                    "unclaimed entitlement",
                    "unclaimed entitlements",
                  )}
                </strong>
                .
              </p>
              <p className="text-sm text-gray-700">
                <strong className="tabular-nums">
                  {plural(preview.redemptions, "redemption", "redemptions")}
                </strong>{" "}
                and{" "}
                <strong className="tabular-nums">
                  {plural(
                    preview.attempts,
                    "attempt record",
                    "attempt records",
                  )}
                </strong>{" "}
                are kept for reporting.
              </p>
              {preview.redemptions > 0 ? (
                <p className="text-xs text-gray-500">
                  The coupon is retired rather than removed, so past orders still
                  resolve their code.
                </p>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <Input
                  label={`Type the campaign title to confirm`}
                  placeholder={title}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                />
                {confirmText.length > 0 && !titleMatches ? (
                  <p className="text-xs text-red-600">
                    That does not match the campaign title.
                  </p>
                ) : null}
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <WhiteButton
              type="button"
              glow={false}
              disabled={deleting}
              onClick={onClose}
            >
              Cancel
            </WhiteButton>
            {preview.blocked ? (
              <WhiteButton
                type="button"
                glow={false}
                onClick={() => void loadPreview()}
                className="inline-flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                Check again
              </WhiteButton>
            ) : (
              <button
                type="button"
                disabled={!canDelete}
                onClick={() => void confirm()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting…" : "Delete campaign"}
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
