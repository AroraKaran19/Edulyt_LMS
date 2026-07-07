"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import { ENDPOINTS } from "@/constants/endpoints";
import apiClient from "@/configs/apiConfig";
import { type InternshipVoucher } from "@/hooks/useInternshipVouchers";
import {
  fetchMyInternshipEnrollmentsPage,
  notifyDashboardMyInternshipsChanged,
} from "@/hooks/useMyInternshipEnrollments";
import type {
  InternshipPublicListing,
  InternshipEnrollPreviewBatch,
  InternshipEnrollmentListRow,
} from "@/types";
import { cn } from "@/lib/utils";
import { ChevronRight, Info, Loader2, Tag } from "lucide-react";

type Step =
  | "loading"
  | "existing-list"
  | "pick-internship"
  | "pick-batch"
  | "confirm";

interface Props {
  isOpen: boolean;
  /** The voucher to spend. */
  voucher: InternshipVoucher | null;
  onClose: () => void;
  /** Called after a voucher is successfully redeemed (parent should refetch). */
  onRedeemed?: () => void;
}

/**
 * Entrance-flow statuses a voucher can upgrade in place (mirrors the backend
 * `upgradeableStatuses` in `redeemInternshipVoucher`). When the learner has an
 * enrollment in one of these, the voucher confirms that exact internship+batch
 * — so we lock the picker to it instead of letting them choose freely.
 */
const UPGRADEABLE_STATUSES = [
  "exam_registered",
  "exam_attempted",
  "admin_rejected",
];

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

/** Normalised view of an existing enrollment the voucher can confirm. */
interface ExistingChoice {
  enrollmentId: string;
  internshipId: string;
  slug: string;
  title: string;
  batchId: string;
  batchName: string;
  startDate?: string;
}

function toExistingChoice(
  row: InternshipEnrollmentListRow,
): ExistingChoice | null {
  const internshipId = row.internship?._id;
  const slug = row.internship?.slug ?? row.internshipSnapshot?.slug;
  const title =
    row.internship?.title ?? row.internshipSnapshot?.title ?? "Internship";
  const batchId = row.batchSnapshot?.batchId;
  const batchName = row.batchSnapshot?.name;
  if (!internshipId || !slug || !batchId || !batchName) return null;
  return {
    enrollmentId: row._id,
    internshipId,
    slug,
    title,
    batchId,
    batchName,
    startDate: row.batchSnapshot?.internshipStartDate,
  };
}

export default function FreeInternshipClaimModal({
  isOpen,
  voucher,
  onClose,
  onRedeemed,
}: Props) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("loading");
  const [redeeming, setRedeeming] = useState(false);

  // Existing-enrollment (restricted) flow.
  const [existingChoices, setExistingChoices] = useState<ExistingChoice[]>([]);
  const [selectedExisting, setSelectedExisting] =
    useState<ExistingChoice | null>(null);

  // Free-pick flow (no existing enrollment).
  const [internships, setInternships] = useState<InternshipPublicListing[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [selectedInternship, setSelectedInternship] =
    useState<InternshipPublicListing | null>(null);
  const [batches, setBatches] = useState<InternshipEnrollPreviewBatch[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] =
    useState<InternshipEnrollPreviewBatch | null>(null);

  // Reset state whenever the modal closes.
  useEffect(() => {
    if (!isOpen) {
      setStep("loading");
      setRedeeming(false);
      setExistingChoices([]);
      setSelectedExisting(null);
      setSelectedInternship(null);
      setBatches([]);
      setSelectedBatch(null);
    }
  }, [isOpen]);

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

  // On open: check for existing entrance registrations. If found, lock the
  // flow to those; otherwise fall back to the free internship/batch picker.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setStep("loading");
    (async () => {
      try {
        const page = await fetchMyInternshipEnrollmentsPage({
          page: 1,
          limit: 50,
          statuses: UPGRADEABLE_STATUSES,
        });
        if (cancelled) return;
        const choices = page.enrollments
          .map(toExistingChoice)
          .filter((c): c is ExistingChoice => c !== null);
        if (choices.length > 0) {
          setExistingChoices(choices);
          // Single registration → jump straight to confirm.
          if (choices.length === 1) {
            setSelectedExisting(choices[0]);
            setStep("confirm");
          } else {
            setStep("existing-list");
          }
          return;
        }
        // No existing registration — open the free picker.
        setStep("pick-internship");
        void fetchInternships();
      } catch {
        if (cancelled) return;
        // On failure, don't block the learner — fall back to free picker.
        setStep("pick-internship");
        void fetchInternships();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, fetchInternships]);

  // Load batches for the chosen internship (free-pick flow only).
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

  /** Build the enroll-form URL and navigate (free-pick flow only). */
  const goToEnrollForm = (slug: string, batchId: string) => {
    if (!voucher) return;
    const params = new URLSearchParams({
      flow: "seat",
      batchId,
      voucher: voucher.code,
    });
    onClose();
    router.push(
      `/internships/${encodeURIComponent(slug)}/enroll?${params.toString()}`,
    );
  };

  /**
   * Redeem the voucher directly against an existing registration. The
   * entrance registration already captured the enrollment form, so there's
   * nothing to re-fill — the backend upgrades that row in place and keeps the
   * stored answers.
   */
  const redeemForExisting = async (choice: ExistingChoice) => {
    if (!voucher) return;
    setRedeeming(true);
    try {
      await apiClient.post(ENDPOINTS.internshipVouchers.redeem, {
        voucherIdOrCode: voucher.code,
        internshipId: choice.internshipId,
        batchId: choice.batchId,
      });
      toast.success("Voucher redeemed — your seat is confirmed!");
      notifyDashboardMyInternshipsChanged();
      onRedeemed?.();
      onClose();
      router.push("/dashboard/internships");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to redeem voucher. Please try again.";
      toast.error(msg);
      setRedeeming(false);
    }
  };

  const handleConfirm = () => {
    if (selectedExisting) {
      void redeemForExisting(selectedExisting);
      return;
    }
    if (selectedInternship?.slug && selectedBatch?._id) {
      goToEnrollForm(selectedInternship.slug, selectedBatch._id);
    }
  };

  const titleMap: Record<Step, string> = {
    loading: "Claim your voucher",
    "existing-list": "Confirm your internship",
    "pick-internship": "Choose an internship",
    "pick-batch": "Choose a batch",
    confirm: "Confirm enrollment",
  };

  const contactAdminNote = (
    <div className="flex items-start gap-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5">
      <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
      <p className="text-xs text-gray-500 leading-relaxed">
        Your voucher confirms the batch you already registered for. To switch
        to a different batch or internship, please contact your program admin.
      </p>
    </div>
  );

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

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {step === "loading" && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-orange-500 w-7 h-7" />
        </div>
      )}

      {/* ── Existing registrations: restricted list ──────────────────────── */}
      {step === "existing-list" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-500">
            You&apos;re already registered for the internship
            {existingChoices.length === 1 ? "" : "s"} below. Pick which one to
            confirm with your voucher.
          </p>
          <ul className="divide-y divide-gray-100 overflow-y-auto max-h-[50vh] rounded-xl border border-gray-100">
            {existingChoices.map((c) => (
              <li key={c.enrollmentId}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExisting(c);
                    setStep("confirm");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-orange-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-snug">
                      {c.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Batch: {c.batchName}
                      {c.startDate
                        ? ` · Starts ${formatDate(c.startDate)}`
                        : ""}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
          {contactAdminNote}
        </div>
      )}

      {/* ── Step 1: pick internship (free-pick flow) ─────────────────────── */}
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
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <span className="flex-1 text-sm font-medium text-gray-800 leading-snug">
                      {int.title}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Step 2: pick batch (free-pick flow) ──────────────────────────── */}
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

      {/* ── Step 3: confirm ──────────────────────────────────────────────── */}
      {step === "confirm" &&
        (selectedExisting || (selectedInternship && selectedBatch)) && (
          <div className="flex flex-col gap-4">
            {/* Back button — only when there's somewhere to go back to. */}
            {selectedExisting ? (
              existingChoices.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExisting(null);
                    setStep("existing-list");
                  }}
                  className="text-xs text-orange-600 hover:underline self-start"
                >
                  ← Back
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={() => setStep("pick-batch")}
                className="text-xs text-orange-600 hover:underline self-start"
              >
                ← Back
              </button>
            )}

            <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 space-y-1.5">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                Your selection
              </p>
              <p className="text-sm font-bold text-gray-900">
                {selectedExisting
                  ? selectedExisting.title
                  : selectedInternship?.title}
              </p>
              <p className="text-sm text-gray-700">
                Batch:{" "}
                <span className="font-medium">
                  {selectedExisting
                    ? selectedExisting.batchName
                    : selectedBatch?.name}
                </span>
              </p>
              {(() => {
                const startDate = selectedExisting
                  ? selectedExisting.startDate
                  : selectedBatch?.internshipStartDate;
                return startDate ? (
                  <p className="text-xs text-gray-500">
                    Starts {formatDate(startDate)}
                  </p>
                ) : null;
              })()}
              {!selectedExisting && selectedBatch?.entranceExam?.examStartAt && (
                <p className="text-xs text-orange-700">
                  Entrance exam:{" "}
                  {formatDate(selectedBatch.entranceExam.examStartAt)}
                  {selectedBatch.entranceExam.examEndAt &&
                    ` – ${formatDate(selectedBatch.entranceExam.examEndAt)}`}
                </p>
              )}
            </div>

            {/* Existing registration → remind them switching needs admin. */}
            {selectedExisting && contactAdminNote}

            <p className="text-sm text-gray-600">
              {selectedExisting ? (
                <>
                  Your registration details are already on file from your exam
                  signup no form to fill again. Voucher{" "}
                  <span className="font-mono font-bold text-orange-600">
                    {voucher?.code}
                  </span>{" "}
                  will be marked <strong>redeemed</strong> (single use) and your
                  seat moves to the documentation step.
                </>
              ) : (
                <>
                  Continue to fill the enrollment form. Voucher{" "}
                  <span className="font-mono font-bold text-orange-600">
                    {voucher?.code}
                  </span>{" "}
                  will be applied on submission and marked as{" "}
                  <strong>redeemed</strong> (it cannot be used again).
                </>
              )}
            </p>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={redeeming}
              className={cn(
                "w-full py-3 rounded-xl font-semibold text-white text-sm transition-all",
                "bg-orange-500 hover:bg-orange-600 active:scale-[0.98]",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2",
              )}
            >
              {redeeming && <Loader2 className="w-4 h-4 animate-spin" />}
              {selectedExisting
                ? redeeming
                  ? "Confirming…"
                  : "Confirm my seat"
                : "Continue to enrollment form"}
            </button>
          </div>
        )}
    </Modal>
  );
}
