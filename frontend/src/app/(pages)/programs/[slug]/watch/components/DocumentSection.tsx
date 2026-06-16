"use client";

import React, { useCallback, useMemo, useState } from "react";
import SectionContainer from "./SectionContainer";
import { FileText, Lock, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";
import { DocumentContent } from "@/types/course";
import useEnrollment from "@/hooks/useEnrollment";
import { useEnrollmentContext } from "@/components/EnrollmentGuard";
import { toast } from "react-toastify";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { usePresignedUrl } from "@/hooks/usePresignedUrl";
import { isS3Key } from "@/lib/presignedUrl";
import { cn } from "@/lib/utils";

interface DocumentSectionProps {
  documentContent: DocumentContent;
  moduleId?: string;
  lessonId?: string;
  hasContentAccess: boolean;
  isAlreadyCompleted?: boolean;
  onDocumentComplete?: () => void;
}

function isLikelyPdf(keyOrUrl: string): boolean {
  return /\.pdf($|\?|#)/i.test(keyOrUrl);
}

export default function DocumentSection({
  documentContent,
  moduleId,
  lessonId,
  hasContentAccess,
  isAlreadyCompleted = false,
  onDocumentComplete,
}: DocumentSectionProps) {
  const { updateEnrollmentProgress } = useEnrollment();
  const { enrollment, refreshEnrollment } = useEnrollmentContext() || {};
  const [isMarking, setIsMarking] = useState(false);

  const rawUrl = documentContent.documentUrl?.trim() ?? "";
  const usePresign = rawUrl.length > 0 && isS3Key(rawUrl);

  const { url: presignedUrl, isLoading, error, refresh } = usePresignedUrl(
    usePresign ? rawUrl : null,
    {
      expiresIn: 3600,
      autoRefresh: true,
      refreshThreshold: 300,
    }
  );

  const displayUrl = useMemo(() => {
    if (!rawUrl) return null;
    return usePresign ? presignedUrl : rawUrl;
  }, [rawUrl, usePresign, presignedUrl]);

  const showPdfFrame = useMemo(() => {
    if (!displayUrl) return false;
    return isLikelyPdf(rawUrl) || isLikelyPdf(displayUrl);
  }, [displayUrl, rawUrl]);

  const handleMarkComplete = useCallback(async () => {
    if (
      !enrollment?._id ||
      !documentContent._id ||
      !moduleId ||
      !lessonId
    ) {
      toast.error("Missing enrollment or content information.");
      return;
    }
    setIsMarking(true);
    try {
      await updateEnrollmentProgress(enrollment._id, {
        moduleId,
        lessonId,
        contentId: documentContent._id,
        contentType: "document",
        completed: true,
        timeSpent: 1,
      });
      refreshEnrollment?.();
      toast.success("Document marked as read.");
      if (onDocumentComplete) {
        setTimeout(() => onDocumentComplete(), 1200);
      }
    } catch (e) {
      console.error(e);
      toast.error("Could not save progress. Please try again.");
    } finally {
      setIsMarking(false);
    }
  }, [
    enrollment?._id,
    documentContent._id,
    moduleId,
    lessonId,
    updateEnrollmentProgress,
    refreshEnrollment,
    onDocumentComplete,
  ]);

  if (!hasContentAccess) {
    return (
      <SectionContainer
        id="document-section"
        className="w-full min-h-[300px] bg-gray-100 flex items-center justify-center"
      >
        <div className="text-center max-w-md mx-auto p-8">
          <Lock className="size-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Content Locked
          </h3>
          <p className="text-gray-600 mb-4">
            You don&apos;t have access to this document. Please contact your
            administrator to request access.
          </p>
          <p className="text-sm text-gray-500">
            Content: {documentContent.title}
          </p>
        </div>
      </SectionContainer>
    );
  }

  if (!rawUrl) {
    return (
      <SectionContainer
        id="document-section"
        className="w-full min-h-[300px] bg-gray-50 flex items-center justify-center rounded-xl border border-dashed border-gray-200"
      >
        <div className="text-center max-w-md px-4">
          <FileText className="size-14 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">No document file</p>
          <p className="text-sm text-gray-500 mt-1">
            This lesson has no document URL configured yet.
          </p>
        </div>
      </SectionContainer>
    );
  }

  if (usePresign && isLoading && !displayUrl) {
    return (
      <SectionContainer
        id="document-section"
        className="w-full min-h-[320px] flex items-center justify-center rounded-xl bg-gray-50"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#F77124] mx-auto mb-4" />
          <p className="text-gray-600">Preparing secure document access…</p>
        </div>
      </SectionContainer>
    );
  }

  if (usePresign && error && !displayUrl) {
    return (
      <SectionContainer
        id="document-section"
        className="w-full min-h-[300px] flex flex-col items-center justify-center gap-4 rounded-xl bg-red-50/80 border border-red-100"
      >
        <p className="text-red-800 text-center px-4">{error}</p>
        <button
          type="button"
          onClick={() => refresh()}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#F77124] border border-[#F77124]/30 shadow-sm hover:bg-orange-50"
        >
          <RefreshCw className="size-4" />
          Try again
        </button>
      </SectionContainer>
    );
  }

  if (!displayUrl) {
    return null;
  }

  return (
    <SectionContainer
      id="document-section"
      className="w-full flex flex-col gap-4 p-4 sm:p-6 rounded-xl border border-gray-200 bg-white shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F77124]/10 text-[#F77124]">
            <FileText className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 leading-snug">
              {documentContent.title}
            </h2>
            {documentContent.description && (
              <p className="text-sm text-gray-600 mt-1">
                {documentContent.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href={displayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold",
              "text-[#F77124] bg-[#F77124]/10 hover:bg-[#F77124]/15 border border-[#F77124]/25"
            )}
          >
            <ExternalLink className="size-4" />
            Open in new tab
          </a>
        </div>
      </div>

      {isAlreadyCompleted ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-green-50 border border-green-100 px-4 py-3">
          <CheckCircle2 className="size-6 text-green-600 shrink-0" />
          <p className="text-sm text-green-900 flex-1">
            You&apos;ve already marked this document as read.
          </p>
          {onDocumentComplete && (
            <OrangeButton type="button" onClick={onDocumentComplete}>
              Continue to next
            </OrangeButton>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <OrangeButton
            type="button"
            onClick={handleMarkComplete}
            disabled={isMarking}
          >
            {isMarking ? "Saving…" : "Mark as read & continue"}
          </OrangeButton>
          <span className="text-xs text-gray-500">
            Mark when you&apos;re done reading so your progress is saved.
          </span>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden min-h-[50vh] lg:min-h-[60vh]">
        {showPdfFrame ? (
          <iframe
            title={documentContent.title}
            src={displayUrl}
            className="w-full min-h-[50vh] lg:min-h-[60vh] bg-white"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
            <FileText className="size-14 text-gray-400" />
            <p className="text-gray-700 max-w-md">
              Preview isn&apos;t available for this file type in the browser.
              Use <strong>Open in new tab</strong> to view or download the file.
            </p>
            <a
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#F77124] text-white px-5 py-2.5 text-sm font-bold shadow-[0_0_0_2px_rgba(247,113,36,0.35)] hover:opacity-95"
            >
              <ExternalLink className="size-4" />
              Open document
            </a>
          </div>
        )}
      </div>
    </SectionContainer>
  );
}
