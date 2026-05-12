"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/inputs/Select";
import Input from "@/components/ui/inputs/Input";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { useUpload } from "@/hooks/useUpload";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { toast } from "react-toastify";
import type { InternshipEnrollmentListRow } from "@/types";
import type { InternshipBatches } from "@/types/internship";
import InternshipEnrollmentApplicationModal from "./InternshipEnrollmentApplicationModal";

const AADHAR_RE = /^[2-9]\d{11}$/;

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

const REVOKABLE_STATUSES = new Set([
  "pending_documentation",
  "docs_under_review",
  "offer_letter_pending",
  "re_pending_documentation",
  "enrolled",
  "paused",
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

  // Revoke state
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [savingRevoke, setSavingRevoke] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  // Documentation verify state (docs_under_review)
  const [verifyingDocs, setVerifyingDocs] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Documentation edit state
  const [editingDocs, setEditingDocs] = useState(false);
  const [editAadhar, setEditAadhar] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [editPhotoS3Key, setEditPhotoS3Key] = useState("");
  const [editPhotoSource, setEditPhotoSource] = useState<
    "upload" | "url" | undefined
  >(undefined);
  const [savingDocs, setSavingDocs] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const {
    uploadFile: uploadDocFile,
    isUploading: docPhotoUploading,
    error: docPhotoUploadError,
  } = useUpload();

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
    // Reset documentation edit/verify state when the modal closes or switches enrollment.
    setEditingDocs(false);
    setEditAadhar("");
    setEditPhotoUrl("");
    setEditPhotoS3Key("");
    setEditPhotoSource(undefined);
    setDocsError(null);
    setShowRejectForm(false);
    setRejectionNote("");
    setVerifyError(null);
    setShowRevokeConfirm(false);
    setRevokeError(null);
  }, [isOpen, enrollmentId]);

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

  const canRevoke = detail && REVOKABLE_STATUSES.has(detail.status);

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

  async function handleRevoke() {
    if (!enrollmentId || !detail || savingRevoke) return;
    setRevokeError(null);
    setSavingRevoke(true);
    try {
      const res = await apiClient.patch(
        ENDPOINTS.internshipEnrollments.adminUpdateStatus(enrollmentId),
        { status: "revoked" },
      );
      const row = res.data?.data as InternshipEnrollmentListRow | undefined;
      if (row) setDetail(row);
      toast.success("Enrollment revoked");
      setShowRevokeConfirm(false);
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
          : "Could not revoke enrollment";
      setRevokeError(msg);
    } finally {
      setSavingRevoke(false);
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

  function startEditDocs() {
    setDocsError(null);
    setEditAadhar(detail?.documentation?.aadharCardNumber ?? "");
    setEditPhotoUrl(detail?.documentation?.learnerPhoto ?? "");
    setEditPhotoS3Key(detail?.documentation?.learnerPhotoS3Key ?? "");
    setEditPhotoSource(
      detail?.documentation?.learnerPhoto ? "upload" : undefined,
    );
    setEditingDocs(true);
  }

  function cancelEditDocs() {
    setEditingDocs(false);
    setDocsError(null);
  }

  async function handleEditDocPhotoUpload(file: File, folder: string) {
    const result = await uploadDocFile(file, folder);
    if (result.success && result.data) {
      setEditPhotoUrl(result.data.url);
      setEditPhotoS3Key(result.data.s3Key);
      setEditPhotoSource("upload");
      return result.data.url;
    }
    throw new Error(result.error || "Upload failed");
  }

  function handleEditDocPhotoRemove() {
    setEditPhotoUrl("");
    setEditPhotoS3Key("");
    setEditPhotoSource(undefined);
  }

  async function handleSaveDocs() {
    if (!enrollmentId || !detail || savingDocs) return;
    setDocsError(null);

    const trimmedAadhar = editAadhar.replace(/\s/g, "");
    const original = detail.documentation;
    const isCreate = !original;

    const body: Record<string, string> = {};

    if (isCreate) {
      // First-time upload on behalf of a learner — both fields required.
      if (!AADHAR_RE.test(trimmedAadhar)) {
        setDocsError("Aadhar must be 12 digits and start with 2-9.");
        return;
      }
      if (!editPhotoUrl || !editPhotoS3Key) {
        setDocsError("Please upload a photo before saving.");
        return;
      }
      body.aadharCardNumber = trimmedAadhar;
      body.learnerPhoto = editPhotoUrl;
      body.learnerPhotoS3Key = editPhotoS3Key;
    } else {
      // Patch — only send changed fields.
      const aadharChanged = trimmedAadhar !== original.aadharCardNumber;
      const photoChanged = editPhotoUrl !== original.learnerPhoto;
      if (!aadharChanged && !photoChanged) {
        setDocsError("Nothing changed.");
        return;
      }
      if (aadharChanged && !AADHAR_RE.test(trimmedAadhar)) {
        setDocsError("Aadhar must be 12 digits and start with 2-9.");
        return;
      }
      if (photoChanged && (!editPhotoUrl || !editPhotoS3Key)) {
        setDocsError("Please upload a photo before saving.");
        return;
      }
      if (aadharChanged) body.aadharCardNumber = trimmedAadhar;
      if (photoChanged) {
        body.learnerPhoto = editPhotoUrl;
        body.learnerPhotoS3Key = editPhotoS3Key;
      }
    }

    setSavingDocs(true);
    try {
      const res = await apiClient.patch(
        ENDPOINTS.internshipEnrollments.adminUpdateDocumentation(enrollmentId),
        body,
      );
      const row = res.data?.data as InternshipEnrollmentListRow | undefined;
      if (row) setDetail(row);
      toast.success("Documentation updated");
      setEditingDocs(false);
      onUpdated?.();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not update documentation";
      setDocsError(msg);
    } finally {
      setSavingDocs(false);
    }
  }

  async function handleVerifyDocs(action: "approve" | "reject") {
    if (!enrollmentId || verifyingDocs) return;
    setVerifyError(null);
    setVerifyingDocs(true);
    try {
      const res = await apiClient.post(
        ENDPOINTS.internshipEnrollments.adminVerifyDocumentation(enrollmentId),
        { action, rejectionNote: action === "reject" ? rejectionNote : undefined },
      );
      const row = res.data?.data as InternshipEnrollmentListRow | undefined;
      if (row) setDetail(row);
      toast.success(
        action === "approve"
          ? "Documentation approved — queued for offer letter"
          : "Documentation rejected — learner notified to resubmit",
      );
      setShowRejectForm(false);
      setRejectionNote("");
      onUpdated?.();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not verify documentation";
      setVerifyError(msg);
    } finally {
      setVerifyingDocs(false);
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

          {detail.documentation ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-emerald-900 uppercase">
                  Documentation
                </p>
                {!editingDocs ? (
                  <button
                    type="button"
                    onClick={startEditDocs}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-900 hover:text-emerald-950 underline-offset-2 hover:underline"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                ) : null}
              </div>

              {editingDocs ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-emerald-900/80 uppercase">
                      Aadhar number
                    </label>
                    <Input
                      value={editAadhar}
                      onChange={(e) =>
                        setEditAadhar(
                          e.target.value.replace(/\D/g, "").slice(0, 12),
                        )
                      }
                      placeholder="12-digit Aadhar number"
                      inputMode="numeric"
                      maxLength={12}
                    />
                    <p className="text-[10px] text-emerald-900/70">
                      12 digits, must start with 2-9. Saved encrypted.
                    </p>
                  </div>
                  <UploadMediaContainer
                    title="Learner photo"
                    description="Replace the photo if it's blurry or wrong."
                    type="image"
                    folderName={`internships/${
                      detail.internship?.slug ??
                      detail.internshipSnapshot?.slug ??
                      "documentation"
                    }/learner_photos`}
                    mediaUrl={editPhotoUrl}
                    mediaSource={editPhotoSource}
                    s3Key={editPhotoS3Key}
                    onFileUpload={handleEditDocPhotoUpload}
                    onFileRemove={handleEditDocPhotoRemove}
                    maxSize={2}
                    acceptedFormats={[".jpg", ".jpeg", ".png"]}
                    isUploading={docPhotoUploading}
                    error={docPhotoUploadError ?? undefined}
                    showConfirmation={false}
                  />
                  {docsError && (
                    <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
                      {docsError}
                    </p>
                  )}
                  <div className="flex justify-end gap-2 pt-1 border-t border-emerald-200">
                    <WhiteButton
                      type="button"
                      glow={false}
                      onClick={cancelEditDocs}
                      disabled={savingDocs}
                    >
                      Cancel
                    </WhiteButton>
                    <OrangeButton
                      type="button"
                      glow={false}
                      onClick={() => void handleSaveDocs()}
                      disabled={savingDocs || docPhotoUploading}
                    >
                      {savingDocs ? "Saving…" : "Save changes"}
                    </OrangeButton>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-semibold text-emerald-900/70 uppercase mb-0.5">
                        Aadhar number
                      </p>
                      <p className="text-sm font-mono text-emerald-950 tracking-wider">
                        {detail.documentation.aadharCardNumber ||
                          "(decryption failed)"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-emerald-900/70 uppercase mb-0.5">
                        Submitted
                      </p>
                      <p className="text-xs text-emerald-950">
                        {formatDate(detail.documentation.submittedAt)}
                      </p>
                    </div>
                  </div>
                  {detail.documentation.learnerPhoto ? (
                    <div>
                      <p className="text-[10px] font-semibold text-emerald-900/70 uppercase mb-1">
                        Learner photo
                      </p>
                      <a
                        href={detail.documentation.learnerPhoto}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={detail.documentation.learnerPhoto}
                          alt="Learner"
                          className="max-h-40 rounded border border-emerald-200 object-contain bg-white"
                        />
                      </a>
                    </div>
                  ) : null}

                  {detail.status === "re_pending_documentation" ? (
                    <div className="pt-2 border-t border-emerald-200">
                      <p className="text-[11px] font-semibold text-rose-700 uppercase mb-1">
                        Rejected — awaiting resubmission
                      </p>
                      {detail.documentationRejectionNote ? (
                        <p className="text-xs text-rose-900/85 bg-rose-50 border border-rose-200 rounded px-2 py-1.5">
                          {detail.documentationRejectionNote}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">No rejection note provided.</p>
                      )}
                    </div>
                  ) : null}

                  {detail.status === "offer_letter_pending" ? (
                    <div className="pt-2 border-t border-emerald-200">
                      <p className="text-[11px] font-semibold text-amber-700 uppercase mb-0.5">
                        Offer letter generating…
                      </p>
                      <p className="text-xs text-gray-500">
                        Docs approved. The cron will generate and upload the offer letter.
                      </p>
                    </div>
                  ) : null}

                  {detail.internId || detail.offerLetterUrl ? (
                    <div className="pt-2 border-t border-emerald-200 space-y-1">
                      {detail.internId ? (
                        <p className="text-xs text-emerald-950">
                          <span className="font-semibold">Intern ID:</span> {detail.internId}
                        </p>
                      ) : null}
                      {detail.offerLetterUrl ? (
                        <a
                          href={detail.offerLetterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-700 underline underline-offset-2"
                        >
                          Download offer letter
                        </a>
                      ) : null}
                    </div>
                  ) : null}

                  {detail.status === "docs_under_review" ? (
                    <div className="pt-2 border-t border-emerald-200 space-y-2">
                      <p className="text-[11px] font-semibold text-emerald-900/80 uppercase">
                        Review decision
                      </p>
                      {showRejectForm ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            className="w-full text-xs rounded border border-emerald-300 px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-400"
                            rows={3}
                            placeholder="Rejection reason (optional — shown to learner)"
                            value={rejectionNote}
                            onChange={(e) => setRejectionNote(e.target.value)}
                          />
                          {verifyError && (
                            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
                              {verifyError}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <WhiteButton
                              type="button"
                              glow={false}
                              onClick={() => { setShowRejectForm(false); setVerifyError(null); }}
                              disabled={verifyingDocs}
                            >
                              Cancel
                            </WhiteButton>
                            <OrangeButton
                              type="button"
                              glow={false}
                              onClick={() => void handleVerifyDocs("reject")}
                              disabled={verifyingDocs}
                            >
                              {verifyingDocs ? "Rejecting…" : "Confirm reject"}
                            </OrangeButton>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {verifyError && (
                            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
                              {verifyError}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <OrangeButton
                              type="button"
                              glow={false}
                              className="flex-1"
                              onClick={() => void handleVerifyDocs("approve")}
                              disabled={verifyingDocs}
                            >
                              {verifyingDocs ? "Approving…" : "Approve"}
                            </OrangeButton>
                            <WhiteButton
                              type="button"
                              glow={false}
                              className="flex-1"
                              onClick={() => { setShowRejectForm(true); setVerifyError(null); }}
                              disabled={verifyingDocs}
                            >
                              Reject
                            </WhiteButton>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : detail.status === "pending_documentation" ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-3 space-y-2">
              <p className="text-xs font-semibold text-rose-900 uppercase">
                Documentation
              </p>
              {editingDocs ? (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-rose-900/85 leading-snug">
                    Upload Aadhar &amp; photo on behalf of the learner. Saving
                    will move them to{" "}
                    <span className="font-semibold">docs_under_review</span> —
                    you&apos;ll still need to approve from the review panel
                    below to issue the offer letter.
                  </p>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-rose-900/80 uppercase">
                      Aadhar number
                    </label>
                    <Input
                      value={editAadhar}
                      onChange={(e) =>
                        setEditAadhar(
                          e.target.value.replace(/\D/g, "").slice(0, 12),
                        )
                      }
                      placeholder="12-digit Aadhar number"
                      inputMode="numeric"
                      maxLength={12}
                    />
                    <p className="text-[10px] text-rose-900/70">
                      12 digits, must start with 2-9. Saved encrypted.
                    </p>
                  </div>
                  <UploadMediaContainer
                    title="Learner photo"
                    description="Upload the learner's photo (passport-style)."
                    type="image"
                    folderName={`internships/${
                      detail.internship?.slug ??
                      detail.internshipSnapshot?.slug ??
                      "documentation"
                    }/learner_photos`}
                    mediaUrl={editPhotoUrl}
                    mediaSource={editPhotoSource}
                    s3Key={editPhotoS3Key}
                    onFileUpload={handleEditDocPhotoUpload}
                    onFileRemove={handleEditDocPhotoRemove}
                    maxSize={2}
                    acceptedFormats={[".jpg", ".jpeg", ".png"]}
                    isUploading={docPhotoUploading}
                    error={docPhotoUploadError ?? undefined}
                    showConfirmation={false}
                  />
                  {docsError && (
                    <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
                      {docsError}
                    </p>
                  )}
                  <div className="flex justify-end gap-2 pt-1 border-t border-rose-200">
                    <WhiteButton
                      type="button"
                      glow={false}
                      onClick={cancelEditDocs}
                      disabled={savingDocs}
                    >
                      Cancel
                    </WhiteButton>
                    <OrangeButton
                      type="button"
                      glow={false}
                      onClick={() => void handleSaveDocs()}
                      disabled={savingDocs || docPhotoUploading}
                    >
                      {savingDocs ? "Saving…" : "Upload & send to review"}
                    </OrangeButton>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-rose-900/85 leading-snug">
                    Awaiting Aadhar &amp; photo from the learner. Tasks and the
                    certification exam stay locked until they submit.
                  </p>
                  <WhiteButton
                    type="button"
                    glow={false}
                    onClick={startEditDocs}
                    className="w-full text-sm"
                  >
                    Upload on behalf of learner
                  </WhiteButton>
                </>
              )}
            </div>
          ) : null}

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

          {canRevoke ? (
            <div className="rounded-lg border border-red-200 bg-red-50/70 px-3 py-3 space-y-2">
              <p className="text-xs font-semibold text-red-900 uppercase">
                Revoke enrollment
              </p>
              <p className="text-xs text-red-900/90 leading-snug">
                Forcibly removes the learner from this internship. Tasks, exams
                and the certificate become inaccessible. This action cannot be
                undone from the UI.
              </p>
              {revokeError && (
                <p className="text-xs text-red-700 bg-red-100 border border-red-300 rounded px-2 py-1">
                  {revokeError}
                </p>
              )}
              {showRevokeConfirm ? (
                <div className="flex gap-2">
                  <WhiteButton
                    type="button"
                    glow={false}
                    className="flex-1"
                    onClick={() => { setShowRevokeConfirm(false); setRevokeError(null); }}
                    disabled={savingRevoke}
                  >
                    Cancel
                  </WhiteButton>
                  <OrangeButton
                    type="button"
                    glow={false}
                    className="flex-1 bg-red-700 hover:bg-red-800 border-red-800"
                    disabled={savingRevoke}
                    onClick={() => void handleRevoke()}
                  >
                    {savingRevoke ? "Revoking…" : "Confirm revoke"}
                  </OrangeButton>
                </div>
              ) : (
                <WhiteButton
                  type="button"
                  glow={false}
                  className="w-full text-red-800 border-red-300 hover:bg-red-100"
                  onClick={() => { setShowRevokeConfirm(true); setRevokeError(null); }}
                >
                  Revoke enrollment
                </WhiteButton>
              )}
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
