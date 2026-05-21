"use client";

import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { AlertCircle, CalendarClock, ExternalLink, MailWarning } from "lucide-react";
import Modal from "@/components/ui/Modal";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Input from "@/components/ui/inputs/Input";
import UploadMediaContainer from "@/components/ui/container/UploadMediaContainer";
import { useUpload } from "@/hooks/useUpload";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { cn } from "@/lib/utils";

const AADHAR_RE = /^[2-9]\d{11}$/;
const TERMS_PDF_URL =
  "/internship/Airkrit%20India%20Annexure%20-%201%20-%20Terms%20%26%20Conditions.pdf";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  enrollmentId: string;
  /** Internship slug — used for S3 folder pathing. */
  internshipSlug: string;
  /** ISO UTC. Drives "opens / closes / late" copy and disables form before open. */
  documentationStartAt?: string;
  documentationEndAt?: string;
  onSubmitted?: () => void;
}

function formatIstWindow(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
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

export default function DocumentationSubmissionModal({
  isOpen,
  onClose,
  enrollmentId,
  internshipSlug,
  documentationStartAt,
  documentationEndAt,
  onSubmitted,
}: Props) {
  const [aadhar, setAadhar] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoS3Key, setPhotoS3Key] = useState("");
  const [photoSource, setPhotoSource] = useState<"upload" | "url" | undefined>(
    undefined,
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  /** The accept checkbox unlocks only after the learner opens the T&C link. */
  const [termsLinkOpened, setTermsLinkOpened] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { uploadFile, isUploading, error: uploadError } = useUpload();

  const folderName = `internships/${internshipSlug || "documentation"}/learner_photos`;

  const now = Date.now();
  const startMs = documentationStartAt
    ? new Date(documentationStartAt).getTime()
    : null;
  const endMs = documentationEndAt
    ? new Date(documentationEndAt).getTime()
    : null;
  const beforeWindow = startMs !== null && now < startMs;
  const afterWindow = endMs !== null && now > endMs;

  const handlePhotoUpload = useCallback(
    async (file: File, fldr: string) => {
      const result = await uploadFile(file, fldr);
      if (result.success && result.data) {
        setPhotoUrl(result.data.url);
        setPhotoS3Key(result.data.s3Key);
        setPhotoSource("upload");
        return result.data.url;
      }
      throw new Error(result.error || "Upload failed");
    },
    [uploadFile],
  );

  const handlePhotoRemove = useCallback(() => {
    setPhotoUrl("");
    setPhotoS3Key("");
    setPhotoSource(undefined);
  }, []);

  const reset = () => {
    setAadhar("");
    setPhotoUrl("");
    setPhotoS3Key("");
    setPhotoSource(undefined);
    setAcceptedTerms(false);
    setTermsLinkOpened(false);
    setError(null);
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    setError(null);

    const trimmedAadhar = aadhar.replace(/\s/g, "");
    if (!AADHAR_RE.test(trimmedAadhar)) {
      setError("Aadhar must be 12 digits and start with 2-9.");
      return;
    }
    if (!photoUrl || !photoS3Key) {
      setError("Please upload your photo.");
      return;
    }
    if (!acceptedTerms) {
      setError("Please review and accept the Terms & Conditions to continue.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(
        ENDPOINTS.internshipEnrollments.meSubmitDocumentation(enrollmentId),
        {
          aadharCardNumber: trimmedAadhar,
          learnerPhoto: photoUrl,
          learnerPhotoS3Key: photoS3Key,
          acceptedTerms: true,
        },
      );
      toast.success(
        "Documents submitted — they're under admin review. You'll receive your offer letter once approved.",
      );
      reset();
      onSubmitted?.();
      onClose();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not submit documents";
      setError(msg);
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  if (afterWindow) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Submission window closed"
        className="max-w-md w-full mx-4 border border-rose-100/80 shadow-2xl"
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 items-start rounded-lg border border-rose-200 bg-rose-50 px-3 py-3">
            <MailWarning className="h-5 w-5 shrink-0 text-rose-700 mt-0.5" />
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-rose-900">
                The documentation submission window has closed.
              </p>
              <p className="text-xs text-rose-900/85 leading-relaxed">
                The window ran from{" "}
                <span className="font-semibold">
                  {formatIstWindow(documentationStartAt)}
                </span>{" "}
                to{" "}
                <span className="font-semibold">
                  {formatIstWindow(documentationEndAt)}
                </span>{" "}
                (IST). Self-service submission is no longer accepted. Please{" "}
                <span className="font-semibold">
                  contact your program administrator
                </span>{" "}
                to complete documentation and unlock tasks &amp; the
                certification exam.
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-1 border-t border-gray-100">
            <WhiteButton type="button" glow={false} onClick={handleClose}>
              Close
            </WhiteButton>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Submit your documents to unlock tasks"
      className="max-w-xl w-full mx-4 max-h-[92vh] overflow-y-auto border border-amber-100/80 shadow-2xl"
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-900 leading-relaxed flex gap-2">
          <CalendarClock className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p>
              Submission window (IST):{" "}
              <span className="font-semibold">
                {formatIstWindow(documentationStartAt)}
              </span>{" "}
              →{" "}
              <span className="font-semibold">
                {formatIstWindow(documentationEndAt)}
              </span>
            </p>
            {beforeWindow && (
              <p className="text-amber-900">
                The submission window hasn&apos;t opened yet! Please wait until it opens.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-black">
            Aadhar card number <span className="text-red-500">*</span>
          </label>
          <Input
            value={aadhar}
            onChange={(e) =>
              setAadhar(e.target.value.replace(/\D/g, "").slice(0, 12))
            }
            placeholder="12-digit Aadhar number"
            inputMode="numeric"
            maxLength={12}
          />
        </div>

        <UploadMediaContainer
          title="Learner photo"
          description="Upload a clear, recent photo (passport-style)."
          type="image"
          folderName={folderName}
          mediaUrl={photoUrl}
          mediaSource={photoSource}
          s3Key={photoS3Key}
          onFileUpload={handlePhotoUpload}
          onFileRemove={handlePhotoRemove}
          maxSize={2}
          acceptedFormats={[".jpg", ".jpeg", ".png"]}
          isUploading={isUploading}
          error={uploadError ?? undefined}
          required
          showConfirmation={false}
        />

        <label
          className={cn(
            "flex items-start gap-2.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 transition",
            termsLinkOpened
              ? "cursor-pointer hover:bg-stone-100/70"
              : "cursor-not-allowed",
          )}
        >
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            disabled={submitting || !termsLinkOpened}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-orange-600 disabled:cursor-not-allowed"
          />
          <span className="text-xs text-stone-800 leading-relaxed">
            I have read and accept the{" "}
            <a
              href={TERMS_PDF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-orange-700 hover:text-orange-800 underline underline-offset-2"
              onClick={(e) => {
                e.stopPropagation();
                setTermsLinkOpened(true);
              }}
            >
              Terms &amp; Conditions (Annexure 1)
              <ExternalLink className="h-3 w-3" />
            </a>
            . <span className="text-red-500">*</span>
            {!termsLinkOpened && (
              <span className="mt-1 block text-[11px] font-medium text-stone-500">
                Open the Terms &amp; Conditions link above to enable this
                checkbox.
              </span>
            )}
          </span>
        </label>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-100">
          <WhiteButton
            type="button"
            glow={false}
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </WhiteButton>
          <OrangeButton
            type="button"
            glow={false}
            onClick={() => void handleSubmit()}
            disabled={submitting || isUploading || !acceptedTerms}
          >
            {submitting ? "Submitting…" : "Submit documents"}
          </OrangeButton>
        </div>
      </div>
    </Modal>
  );
}
