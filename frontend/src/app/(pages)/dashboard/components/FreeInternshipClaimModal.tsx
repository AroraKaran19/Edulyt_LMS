"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import { ENDPOINTS } from "@/constants/endpoints";
import apiClient from "@/configs/apiConfig";
import { useInternshipVouchers, type InternshipVoucher } from "@/hooks/useInternshipVouchers";
import type { InternshipPublicListing, InternshipEnrollPreviewBatch } from "@/types";
import { cn } from "@/lib/utils";
import { ChevronRight, Loader2, Tag } from "lucide-react";

type Step = "pick-internship" | "pick-batch" | "confirm";

interface Props {
  isOpen: boolean;
  /** The voucher to spend. */
  voucher: InternshipVoucher | null;
  onClose: () => void;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function FreeInternshipClaimModal({
  isOpen,
  voucher,
  onClose,
}: Props) {
  const { redeem } = useInternshipVouchers();

  const [step, setStep] = useState<Step>("pick-internship");
  const [internships, setInternships] = useState<InternshipPublicListing[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const [selectedInternship, setSelectedInternship] =
    useState<InternshipPublicListing | null>(null);
  const [batches, setBatches] = useState<InternshipEnrollPreviewBatch[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const [selectedBatch, setSelectedBatch] =
    useState<InternshipEnrollPreviewBatch | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset state whenever the modal opens/closes.
  useEffect(() => {
    if (!isOpen) {
      setStep("pick-internship");
      setSelectedInternship(null);
      setBatches([]);
      setSelectedBatch(null);
    }
  }, [isOpen]);

  // Load open internships when modal opens.
  const fetchInternships = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.internships.all, {
        params: { limit: 50 },
      });
      setInternships(
        (res.data?.data?.internships ?? []) as InternshipPublicListing[],
      );
    } catch {
      setInternships([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchInternships();
  }, [isOpen, fetchInternships]);

  // Load batches for the chosen internship.
  const fetchBatches = useCallback(async (slug: string) => {
    setBatchLoading(true);
    try {
      const res = await apiClient.get(
        `${ENDPOINTS.internships.bySlug}/${encodeURIComponent(slug)}/enroll-preview`,
      );
      setBatches(
        (res.data?.data?.batches ?? []) as InternshipEnrollPreviewBatch[],
      );
    } catch {
      setBatches([]);
    } finally {
      setBatchLoading(false);
    }
  }, []);

  const handleSelectInternship = (internship: InternshipPublicListing) => {
    setSelectedInternship(internship);
    setSelectedBatch(null);
    setBatches([]);
    setStep("pick-batch");
    if (internship.slug) fetchBatches(internship.slug);
  };

  const handleSelectBatch = (batch: InternshipEnrollPreviewBatch) => {
    setSelectedBatch(batch);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!voucher || !selectedInternship?._id || !selectedBatch?._id) return;
    setSubmitting(true);
    const ok = await redeem({
      voucherIdOrCode: voucher.code,
      internshipId: selectedInternship._id,
      batchId: selectedBatch._id,
    });
    setSubmitting(false);
    if (ok) onClose();
  };

  const titleMap: Record<Step, string> = {
    "pick-internship": "Choose an internship",
    "pick-batch": "Choose a batch",
    confirm: "Confirm enrollment",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titleMap[step]}
      className="max-w-lg w-full mx-4 max-h-[90vh]"
    >
      {/* Voucher badge */}
      {voucher && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl w-fit">
          <Tag className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-mono font-bold text-orange-700 tracking-widest">
            {voucher.code}
          </span>
          <span className="text-xs text-orange-600 ml-1">· 1 free seat</span>
        </div>
      )}

      {/* ── Step 1: pick internship ─────────────────────────────────────── */}
      {step === "pick-internship" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-500">
            Select the internship program you want to join with your voucher.
          </p>

          {listLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-orange-500 w-7 h-7" />
            </div>
          ) : internships.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No internships are available right now.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 overflow-y-auto max-h-[50vh] rounded-xl border border-gray-100">
              {internships.map((int) => (
                <li key={int._id ?? int.slug}>
                  <button
                    type="button"
                    onClick={() => handleSelectInternship(int)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-orange-50 transition-colors"
                  >
                    {int.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={int.thumbnail}
                        alt={int.title}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <span className="flex-1 text-sm font-medium text-gray-800 leading-snug">
                      {int.title}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Step 2: pick batch ──────────────────────────────────────────── */}
      {step === "pick-batch" && selectedInternship && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setStep("pick-internship")}
            className="text-xs text-orange-600 hover:underline self-start"
          >
            ← Back
          </button>
          <p className="text-sm font-semibold text-gray-800">
            {selectedInternship.title}
          </p>
          <p className="text-sm text-gray-500">Select the cohort you want to join.</p>

          {batchLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-orange-500 w-7 h-7" />
            </div>
          ) : batches.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No open batches at the moment.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 overflow-y-auto max-h-[50vh] rounded-xl border border-gray-100">
              {batches.map((b) => (
                <li key={b._id}>
                  <button
                    type="button"
                    onClick={() => handleSelectBatch(b)}
                    className="w-full flex flex-col gap-0.5 px-4 py-3 text-left hover:bg-orange-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-800">
                      {b.name}
                    </span>
                    {b.internshipStartDate && (
                      <span className="text-xs text-gray-500">
                        Starts {formatDate(b.internshipStartDate)}
                      </span>
                    )}
                    {b.entranceExam?.examStartAt && (
                      <span className="text-xs text-orange-600">
                        Exam from {formatDate(b.entranceExam.examStartAt)}
                        {b.entranceExam.examEndAt &&
                          ` to ${formatDate(b.entranceExam.examEndAt)}`}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Step 3: confirm ─────────────────────────────────────────────── */}
      {step === "confirm" && selectedInternship && selectedBatch && (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setStep("pick-batch")}
            className="text-xs text-orange-600 hover:underline self-start"
          >
            ← Back
          </button>

          <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
              Your selection
            </p>
            <p className="text-sm font-bold text-gray-900">
              {selectedInternship.title}
            </p>
            <p className="text-sm text-gray-700">
              Batch: <span className="font-medium">{selectedBatch.name}</span>
            </p>
            {selectedBatch.internshipStartDate && (
              <p className="text-xs text-gray-500">
                Starts {formatDate(selectedBatch.internshipStartDate)}
              </p>
            )}
            {selectedBatch.entranceExam?.examStartAt && (
              <p className="text-xs text-orange-700">
                Entrance exam: {formatDate(selectedBatch.entranceExam.examStartAt)}
                {selectedBatch.entranceExam.examEndAt &&
                  ` – ${formatDate(selectedBatch.entranceExam.examEndAt)}`}
              </p>
            )}
          </div>

          <p className="text-sm text-gray-600">
            Voucher <span className="font-mono font-bold text-orange-600">{voucher?.code}</span> will
            be marked as <strong>redeemed</strong> and cannot be used again.
          </p>

          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirm}
            className={cn(
              "w-full py-3 rounded-xl font-semibold text-white text-sm transition-all",
              "bg-orange-500 hover:bg-orange-600 active:scale-[0.98]",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2",
            )}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Enrolling…" : "Redeem voucher & enroll (free)"}
          </button>
        </div>
      )}
    </Modal>
  );
}
