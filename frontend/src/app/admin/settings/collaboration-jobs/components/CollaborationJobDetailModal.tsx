"use client";

import { RefreshCw, Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import type { CollaborationJobRow } from "./types";
import { JOB_STATUS_CONFIG } from "./jobStatusConfig";
import { formatJobDateTime } from "./jobUtils";
import { CopyIdRow } from "./CopyIdRow";

interface CollaborationJobDetailModalProps {
  job: CollaborationJobRow | null;
  isOpen: boolean;
  onClose: () => void;
  onRetry: (jobId: string) => void;
  retryingJobId: string | null;
  onCopyLabel: (label: string, value: string) => void;
}

export function CollaborationJobDetailModal({
  job,
  isOpen,
  onClose,
  onRetry,
  retryingJobId,
  onCopyLabel,
}: CollaborationJobDetailModalProps) {
  if (!isOpen || !job) return null;

  const status = JOB_STATUS_CONFIG[job.status];
  const errorText = (job.error ?? "").trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Collaboration job details"
      className="max-w-2xl"
    >
      <div className="space-y-4 text-sm text-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.className}`}
          >
            {status.icon}
            {status.label}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <CopyIdRow
            label="Worker job ID (UUID)"
            value={job.jobId}
            copyLabel="Job ID"
            onCopy={onCopyLabel}
          />
          <CopyIdRow
            label="User ID"
            value={job.userId ? String(job.userId) : null}
            copyLabel="User ID"
            onCopy={onCopyLabel}
          />
          <div className="md:col-span-2">
            <CopyIdRow
              label="Collaboration Domain document ID"
              value={
                job.collaborationDomainId
                  ? String(job.collaborationDomainId)
                  : null
              }
              copyLabel="Domain ID"
              onCopy={onCopyLabel}
            />
          </div>
          <div className="md:col-span-2 space-y-3">
            <span className="text-xs font-medium text-gray-500">
              Snapshot
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {job.collaborationDomainSnapshot ? (
                <>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500">
                      Snapshot title
                    </span>
                    <p className="text-sm text-gray-900">
                      {job.collaborationDomainSnapshot.title}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500">
                      Snapshot email domain
                    </span>
                    <p className="font-mono text-xs text-gray-900 break-all">
                      @{job.collaborationDomainSnapshot.domain}
                    </p>
                  </div>
                </>
              ) : (
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-600">
                    No snapshot on this job (older job created before snapshots
                    were added). The table row may still show the live domain
                    when available.
                  </p>
                </div>
              )}
              <CopyIdRow
                label="User name"
                value={job.userName?.trim() || null}
                copyLabel="User name"
                onCopy={onCopyLabel}
              />
              <CopyIdRow
                label="User email"
                value={job.userEmail?.trim() || null}
                copyLabel="User email"
                onCopy={onCopyLabel}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-gray-500">Created</span>
            <p className="text-gray-900 mt-0.5">
              {formatJobDateTime(job.createdAt)}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Last updated</span>
            <p className="text-gray-900 mt-0.5">
              {formatJobDateTime(job.updatedAt)}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Started</span>
            <p className="text-gray-900 mt-0.5">
              {formatJobDateTime(job.startedAt)}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Completed</span>
            <p className="text-gray-900 mt-0.5">
              {formatJobDateTime(job.completedAt)}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Retry count</span>
            <p className="text-gray-900 mt-0.5 tabular-nums">
              {job.retryCount ?? 0}
            </p>
          </div>
        </div>

        {errorText ? (
          <div className="space-y-1">
            <span className="text-xs text-gray-500">Error</span>
            <pre className="text-xs text-red-800 bg-red-50 border border-red-100 rounded-lg p-3 whitespace-pre-wrap wrap-break-word">
              {errorText}
            </pre>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-4 sm:gap-6 items-center pt-4 mt-6 border-t border-gray-200 bg-gray-50/80 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl">
        {job.status === "failed" ? (
          <div className="flex flex-row items-start gap-3 min-w-0">
            <OrangeButton
              onClick={() => onRetry(job.jobId)}
              disabled={retryingJobId === job.jobId}
              className="shrink-0 py-2 px-4 text-sm rounded-xl"
            >
              {retryingJobId === job.jobId ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Queuing retry…
                </>
              ) : (
                <>
                  <RefreshCw className="size-4" />
                  Retry job
                </>
              )}
            </OrangeButton>
            <p className="text-xs text-gray-500 leading-snug flex-1 min-w-0 pt-0.5">
              Resets this job to <strong>pending</strong> so the collaboration
              worker can process it again.
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-500 min-w-0">
            Retry is only available when the job status is{" "}
            <strong>Failed</strong>.
          </p>
        )}
        <WhiteButton
          onClick={onClose}
          className="inline-flex items-center justify-center justify-self-stretch sm:justify-self-end w-full sm:w-auto shrink-0 py-2 px-5 rounded-xl"
        >
          Close
        </WhiteButton>
      </div>
    </Modal>
  );
}
