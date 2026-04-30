import {
  Copy,
  HelpCircle,
  RefreshCw,
  Loader2,
  ExternalLink,
} from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import type { CollaborationJobRow } from "./types";
import { JOB_STATUS_CONFIG } from "./jobStatusConfig";

interface CollaborationJobsTableProps {
  jobs: CollaborationJobRow[];
  onOpenDetail: (job: CollaborationJobRow) => void;
  onRetry: (jobId: string) => void;
  retryingJobId: string | null;
  onCopyJobId: (jobId: string) => void;
  onCopyDomainDocId: (id: string) => void;
}

export function CollaborationJobsTable({
  jobs,
  onOpenDetail,
  onRetry,
  retryingJobId,
  onCopyJobId,
  onCopyDomainDocId,
}: CollaborationJobsTableProps) {
  return (
    <div
      className="min-w-0 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm pb-0.5"
      style={{ scrollbarWidth: "thin" }}
    >
      <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="sticky top-0 z-10 bg-gray-50 text-left py-4 px-4 font-semibold text-gray-700 shadow-[0_1px_0_0_rgb(229,231,235)]">
              Job ID
            </th>
            <th className="sticky top-0 z-10 bg-gray-50 text-left py-4 px-4 font-semibold text-gray-700 shadow-[0_1px_0_0_rgb(229,231,235)]">
              User
            </th>
            <th className="sticky top-0 z-10 bg-gray-50 text-left py-4 px-4 font-semibold text-gray-700 min-w-[220px] shadow-[0_1px_0_0_rgb(229,231,235)]">
              <span className="group/tooltip relative inline-flex cursor-help items-center gap-1.5">
                Collaboration
                <HelpCircle className="size-3.5 text-gray-400" />
                <span className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 w-72 rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal text-white shadow-lg opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100">
                  Title and @domain from a snapshot when the job was created (or
                  from the live domain for older jobs).
                </span>
              </span>
            </th>
            <th className="sticky top-0 z-10 bg-gray-50 text-left py-4 px-4 font-semibold text-gray-700 shadow-[0_1px_0_0_rgb(229,231,235)]">
              Status
            </th>
            <th className="sticky top-0 z-10 bg-gray-50 relative overflow-visible text-left py-4 px-4 font-semibold text-gray-700 shadow-[0_1px_0_0_rgb(229,231,235)]">
              <span className="group/tooltip relative inline-flex cursor-help items-center gap-1.5">
                Retries
                <HelpCircle className="size-3.5 text-gray-400 cursor-help" />
                <span className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 w-56 rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal text-white shadow-lg opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100">
                  Worker attempts recorded for this job.
                </span>
              </span>
            </th>
            <th className="sticky top-0 z-10 bg-gray-50 text-left py-4 px-4 font-semibold text-gray-700 shadow-[0_1px_0_0_rgb(229,231,235)]">
              Created
            </th>
            <th className="sticky top-0 z-10 bg-gray-50 text-left py-4 px-4 font-semibold text-gray-700 shadow-[0_1px_0_0_rgb(229,231,235)]">
              Error
            </th>
            <th className="sticky top-0 z-10 bg-gray-50 text-right py-4 px-4 font-semibold text-gray-700 shadow-[0_1px_0_0_rgb(229,231,235)]">
              <span className="group/tooltip relative inline-flex cursor-help items-center gap-1 justify-end w-full">
                Actions
                <HelpCircle className="size-3.5 text-gray-400 shrink-0" />
                <span className="pointer-events-none absolute right-0 top-full z-50 mt-1.5 w-64 rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal text-white shadow-lg opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100 text-left">
                  Open details in a modal. Retry only for failed jobs.
                </span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {jobs.map((job) => {
            const config = JOB_STATUS_CONFIG[job.status];
            return (
              <tr
                key={job.jobId}
                role="button"
                tabIndex={0}
                onClick={() => onOpenDetail(job)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpenDetail(job);
                  }
                }}
                className="hover:bg-orange-50/30 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-orange-400/80"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs text-gray-700 truncate max-w-[100px]">
                      {job.jobId.slice(0, 8)}…
                    </code>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyJobId(job.jobId);
                      }}
                      className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 cursor-pointer"
                      title={`Copy ${job.jobId}`}
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4 font-medium text-gray-800 max-w-[180px] truncate">
                  {job.userName || job.userSnapshot?.name || (
                    <span className="text-gray-400 italic">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-700 align-top max-w-[280px]">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-gray-900 line-clamp-2">
                        {job.domainTitle ||
                          (job.domainRecordMissing
                            ? "Unknown collaboration"
                            : "—")}
                      </span>
                      {job.collaborationDomainSnapshot && (
                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-700 border border-slate-200">
                          Snapshot
                        </span>
                      )}
                    </div>
                    {job.domainEmail ? (
                      <span className="text-xs text-gray-500">
                        @{job.domainEmail}
                      </span>
                    ) : null}
                    {job.collaborationDomainId ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[11px] text-gray-400 font-mono truncate max-w-[200px]">
                          Domain ID: {String(job.collaborationDomainId)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopyDomainDocId(
                              String(job.collaborationDomainId),
                            );
                          }}
                          className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 shrink-0 cursor-pointer"
                          title="Copy collaboration domain document ID"
                        >
                          <Copy className="size-3" />
                        </button>
                      </div>
                    ) : null}
                    {job.domainRecordMissing ? (
                      <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-0.5">
                        Live domain missing and no snapshot on file—legacy or
                        removed data.
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}
                  >
                    {config.icon}
                    {config.label}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600 tabular-nums">
                  {job.retryCount ?? 0}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {job.createdAt
                    ? new Date(job.createdAt).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="py-3 px-4 max-w-[180px]">
                  {job.error ? (
                    <span
                      className="text-red-600 text-xs truncate block"
                      title={job.error}
                    >
                      {job.error}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td
                  className="py-3 px-4 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="inline-flex flex-nowrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(job)}
                      className="inline-flex items-center gap-1 h-8 px-1 text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline cursor-pointer shrink-0"
                    >
                      <ExternalLink className="size-3.5 shrink-0" />
                      Details
                    </button>
                    {job.status === "failed" ? (
                      <OrangeButton
                        onClick={() => onRetry(job.jobId)}
                        disabled={retryingJobId === job.jobId}
                        className="h-8 shrink-0 py-0 px-3 text-xs rounded-lg"
                      >
                        {retryingJobId === job.jobId ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />
                            Retrying…
                          </>
                        ) : (
                          <>
                            <RefreshCw className="size-3" />
                            Retry
                          </>
                        )}
                      </OrangeButton>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
