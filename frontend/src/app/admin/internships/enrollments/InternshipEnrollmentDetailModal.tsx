"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/inputs/Select";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { toast } from "react-toastify";
import type { InternshipEnrollmentListRow } from "@/types";
import type { InternshipBatches } from "@/types/internship";
import InternshipEnrollmentApplicationModal from "./InternshipEnrollmentApplicationModal";

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatShortDate(iso?: string | Date) {
  if (!iso) return "—";
  try {
    const d = iso instanceof Date ? iso : new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function userLabel(u: InternshipEnrollmentListRow["user"]) {
  if (!u) return "—";
  if (u.name?.trim()) return u.name.trim();
  const n = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return n || u.email || u._id;
}

const DISQUALIFIED_BATCH_MOVE_STATUSES = new Set([
  "admin_rejected",
  "dropped",
  "revoked",
]);

type Props = {
  isOpen: boolean;
  enrollmentId: string | null;
  onClose: () => void;
  /** Called after batch or status is updated successfully */
  onUpdated?: () => void;
};

export default function InternshipEnrollmentDetailModal({
  isOpen,
  enrollmentId,
  onClose,
  onUpdated,
}: Props) {
  const [detail, setDetail] = useState<InternshipEnrollmentListRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [batchOptions, setBatchOptions] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [savingBatch, setSavingBatch] = useState(false);
  const [savingComplete, setSavingComplete] = useState(false);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !enrollmentId) {
      setDetail(null);
      setBatchOptions([]);
      setSelectedBatchId("");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(
          ENDPOINTS.internshipEnrollments.adminById(enrollmentId),
        );
        const d = res.data?.data as InternshipEnrollmentListRow | undefined;
        if (!cancelled) setDetail(d ?? null);
      } catch {
        if (!cancelled) {
          toast.error("Could not load enrollment");
          onClose();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, enrollmentId, onClose]);

  useEffect(() => {
    if (!isOpen) setApplicationModalOpen(false);
  }, [isOpen]);

  useEffect(() => {
    if (!detail?.internship?._id || !isOpen) {
      setBatchOptions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingBatches(true);
      try {
        const res = await apiClient.get(
          `${ENDPOINTS.internships.admin.byId}/${detail.internship!._id}`,
        );
        const internship = res.data?.data as { batches?: InternshipBatches[] } | undefined;
        const batches = Array.isArray(internship?.batches) ? internship!.batches : [];
        const opts = [...batches]
          .filter((b) => b?.isActive !== false)
          .sort((a, b) => {
            const ta = new Date(a.internshipStartDate).getTime();
            const tb = new Date(b.internshipStartDate).getTime();
            return ta - tb;
          })
          .map((b) => ({
            value: String(b._id),
            label: `${b.name} · starts ${formatShortDate(b.internshipStartDate)}`,
          }));
        if (!cancelled) setBatchOptions(opts);
      } catch {
        if (!cancelled) {
          toast.error("Could not load cohort list");
          setBatchOptions([]);
        }
      } finally {
        if (!cancelled) setLoadingBatches(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detail?.internship?._id, isOpen]);

  useEffect(() => {
    const bid = detail?.batchSnapshot?.batchId;
    setSelectedBatchId(typeof bid === "string" ? bid : "");
  }, [detail?.batchSnapshot?.batchId]);

  const canMoveBatch =
    detail &&
    !DISQUALIFIED_BATCH_MOVE_STATUSES.has(detail.status) &&
    batchOptions.length > 0;

  const canMarkComplete =
    detail && (detail.status === "enrolled" || detail.status === "paused");

  const currentBatchId = detail?.batchSnapshot?.batchId ?? "";
  const batchDirty =
    selectedBatchId &&
    currentBatchId &&
    selectedBatchId !== currentBatchId;

  async function handleSaveBatch() {
    if (!enrollmentId || !batchDirty || savingBatch) return;
    setSavingBatch(true);
    try {
      const res = await apiClient.patch(
        ENDPOINTS.internshipEnrollments.adminChangeBatch(enrollmentId),
        { batchId: selectedBatchId },
      );
      const row = res.data?.data as InternshipEnrollmentListRow | undefined;
      if (row) setDetail(row);
      toast.success("Cohort updated");
      onUpdated?.();
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "response" in e &&
        e.response &&
        typeof e.response === "object" &&
        "data" in e.response &&
        e.response.data &&
        typeof e.response.data === "object" &&
        "message" in e.response.data
          ? String((e.response.data as { message?: string }).message)
          : "Could not update cohort";
      toast.error(msg);
    } finally {
      setSavingBatch(false);
    }
  }

  async function handleMarkCompleted() {
    if (!enrollmentId || !detail || savingComplete) return;
    setSavingComplete(true);
    try {
      const res = await apiClient.patch(
        ENDPOINTS.internshipEnrollments.adminUpdateStatus(enrollmentId),
        { status: "completed" },
      );
      const row = res.data?.data as InternshipEnrollmentListRow | undefined;
      if (row) setDetail(row);
      toast.success("Marked as completed");
      onUpdated?.();
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "response" in e &&
        e.response &&
        typeof e.response === "object" &&
        "data" in e.response &&
        e.response.data &&
        typeof e.response.data === "object" &&
        "message" in e.response.data
          ? String((e.response.data as { message?: string }).message)
          : "Could not update status";
      toast.error(msg);
    } finally {
      setSavingComplete(false);
    }
  }

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Internship enrollment"
      className="max-w-lg w-full mx-4 max-h-[90vh]"
    >
      {loading ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      ) : !detail ? (
        <p className="text-gray-500 text-center py-6">No data.</p>
      ) : (
        <div className="flex flex-col gap-3 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Learner
            </p>
            <p className="text-gray-900 font-medium">{userLabel(detail.user)}</p>
            {detail.user?.email ? (
              <p className="text-xs text-gray-500">{detail.user.email}</p>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Internship
            </p>
            <p className="text-gray-900">{detail.internship?.title ?? "—"}</p>
          </div>
          {detail.batchSnapshot ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Batch (current)
              </p>
              <p className="text-gray-900">{detail.batchSnapshot.name}</p>
              <p className="text-xs text-gray-500">
                Starts {formatDate(detail.batchSnapshot.internshipStartDate)}
              </p>
            </div>
          ) : null}

          <div className="rounded-lg border border-stone-200 bg-white px-3 py-3 space-y-2">
            <p className="text-xs font-semibold text-stone-700 uppercase">
              Registration form
            </p>
            {detail.applicationAnswers &&
            Object.keys(detail.applicationAnswers).length > 0 ? (
              <WhiteButton
                glow={false}
                type="button"
                className="w-full text-sm"
                onClick={() => setApplicationModalOpen(true)}
              >
                View submitted application
              </WhiteButton>
            ) : (
              <p className="text-xs text-stone-500 leading-relaxed">
                No registration snapshot on file for this enrollment.
              </p>
            )}
          </div>

          {canMoveBatch ? (
            <div className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-3 space-y-2">
              <p className="text-xs font-semibold text-amber-900 uppercase">
                Move to another cohort
              </p>
              <p className="text-xs text-amber-900/90 leading-snug">
                Same internship only. The learner cannot already have a seat in the
                target cohort. Task unlock dates still follow{" "}
                <span className="font-medium">Enrolled at</span> below.
              </p>
              <Select
                placeholder={
                  loadingBatches ? "Loading cohorts…" : "Select cohort"
                }
                options={batchOptions}
                value={selectedBatchId}
                disabled={loadingBatches || savingBatch}
                onChange={(v) => setSelectedBatchId(v)}
                searchable
                searchPlaceholder="Search cohort…"
              />
              <OrangeButton
                type="button"
                glow={false}
                className="w-full sm:w-auto"
                disabled={
                  !batchDirty || savingBatch || loadingBatches || !selectedBatchId
                }
                onClick={() => void handleSaveBatch()}
              >
                {savingBatch ? "Saving…" : "Update cohort"}
              </OrangeButton>
            </div>
          ) : null}

          {!canMoveBatch &&
          detail &&
          !DISQUALIFIED_BATCH_MOVE_STATUSES.has(detail.status) &&
          !loadingBatches &&
          batchOptions.length === 0 ? (
            <p className="text-xs text-gray-500">
              No active cohorts on this internship — add or activate batches in the
              internship editor first.
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Path
              </p>
              <p className="text-gray-800 capitalize">
                {detail.enrollmentType ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Status
              </p>
              <p className="text-gray-800">{detail.status.replace(/_/g, " ")}</p>
            </div>
            {typeof detail.examScore === "number" ? (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Exam score
                </p>
                <p className="text-gray-800 tabular-nums">{detail.examScore}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Success points
              </p>
              <p className="text-gray-800 tabular-nums">
                {detail.internshipSuccessPoints}
              </p>
            </div>
          </div>

          {canMarkComplete ? (
            <div className="rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-3 space-y-2">
              <p className="text-xs font-semibold text-blue-900 uppercase">
                Complete enrollment
              </p>
              <p className="text-xs text-blue-900/90 leading-snug">
                Sets status to <span className="font-medium">completed</span>{" "}
                (learners who finished the program or when you need to close the
                seat administratively).
              </p>
              <OrangeButton
                type="button"
                glow={false}
                className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 border-blue-800"
                disabled={savingComplete}
                onClick={() => void handleMarkCompleted()}
              >
                {savingComplete ? "Updating…" : "Mark as completed"}
              </OrangeButton>
            </div>
          ) : null}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Enrolled at
            </p>
            <p className="text-gray-800">{formatDate(detail.enrolledAt)}</p>
          </div>
          <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
            Updated {formatDate(detail.updatedAt)}
          </div>
        </div>
      )}
    </Modal>
      <InternshipEnrollmentApplicationModal
        isOpen={applicationModalOpen}
        onClose={() => setApplicationModalOpen(false)}
        answers={detail?.applicationAnswers}
        submittedAtIso={detail?.applicationSubmittedAt}
        cohortName={detail?.batchSnapshot?.name}
      />
    </>
  );
}
