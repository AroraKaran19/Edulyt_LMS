"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  ExternalLink,
  Copy,
  AlertCircle,
  HelpCircle,
  Search,
  Wrench,
} from "lucide-react";
import Container from "@/app/admin/components/ui/Container";
import Modal from "@/components/ui/Modal";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Pagination from "@/components/admin/Pagination";
import apiClient from "@/configs/apiConfig";
import { toast } from "react-toastify";

type JobStatus = "pending" | "processing" | "completed" | "failed";

interface InvoiceJob {
  _id?: string;
  jobId: string;
  orderId: string;
  status: JobStatus;
  invoiceNumber?: string;
  invoiceUrl?: string;
  error?: string;
  retryCount?: number;
  progress?: number;
  createdAt?: string;
  completedAt?: string;
  // Enriched from the order snapshot server-side.
  userName?: string;
  itemName?: string;
  amount?: number;
}

interface JobsResponse {
  jobs: InvoiceJob[];
  total: number;
  page: number;
  limit: number;
}

interface ReclaimResult {
  reclaimed: number;
  failed: number;
  reclaimedJobIds: string[];
  failedJobIds: string[];
  /** Server-side config, echoed back. Not settable from here. */
  timeoutMinutes: number;
  maxReclaims: number;
}

const statusConfig: Record<
  JobStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    icon: <Clock className="size-3.5" />,
  },
  processing: {
    label: "Processing",
    className: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <Loader2 className="size-3.5 animate-spin" />,
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: <CheckCircle2 className="size-3.5" />,
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: <XCircle className="size-3.5" />,
  },
};

const formatInr = (value?: number) =>
  typeof value === "number"
    ? `₹${value.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : null;

const errorMessage = (err: unknown, fallback: string) => {
  const msg =
    err && typeof err === "object" && "response" in err
      ? (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message
      : undefined;
  return msg || fallback;
};

const InvoiceJobsPage = () => {
  const [jobs, setJobs] = useState<InvoiceJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<JobStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);

  // Reclaim sweep is manual: the invoice worker never unwedges jobs itself.
  // Thresholds are server-side env config, deliberately not exposed here.
  const [isReclaimOpen, setIsReclaimOpen] = useState(false);
  const [isReclaiming, setIsReclaiming] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await apiClient.get<{ data: JobsResponse }>(
        `/admin/invoice-jobs?${params.toString()}`,
      );
      const data = response.data?.data;
      if (data) {
        setJobs(data.jobs);
        setTotal(data.total);
      } else {
        setJobs([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("Failed to fetch invoice jobs:", err);
      toast.error("Failed to load invoice jobs");
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter, searchQuery]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleRetry = async (jobId: string) => {
    setRetryingJobId(jobId);
    try {
      await apiClient.post(`/admin/invoice-jobs/${jobId}/retry`);
      toast.success("Job queued for retry successfully");
      loadJobs();
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Failed to retry job"));
    } finally {
      setRetryingJobId(null);
    }
  };

  const handleReclaim = async () => {
    setIsReclaiming(true);
    try {
      const response = await apiClient.post<{ data: ReclaimResult }>(
        `/admin/invoice-jobs/reclaim-stuck`,
      );
      const result = response.data?.data;
      if (result && result.reclaimed + result.failed > 0) {
        toast.success(
          `${result.reclaimed} requeued, ${result.failed} marked failed`,
        );
      } else {
        toast.info("No stuck jobs found");
      }
      setIsReclaimOpen(false);
      loadJobs();
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Failed to reclaim stuck jobs"));
    } finally {
      setIsReclaiming(false);
    }
  };

  const copyText = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
  };

  const totalPages = Math.ceil(total / limit);
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <Container
      title="Invoice Jobs"
      description="View and manage tax invoice generation jobs"
      className="h-full"
      classNameBody="flex flex-col gap-6"
    >
      {/* Filters & Summary */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center gap-2">
            <Search className="absolute left-3 size-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search job ID, order, invoice no, user…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-[38px] min-w-[240px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as JobStatus | "");
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 h-[38px]"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <WhiteButton
            onClick={loadJobs}
            disabled={isLoading}
            className="gap-2 font-medium py-2 px-4 h-[38px] flex items-center"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {isLoading ? "Refreshing…" : "Refresh"}
          </WhiteButton>
          <WhiteButton
            onClick={() => setIsReclaimOpen(true)}
            className="gap-2 font-medium py-2 px-4 h-[38px] flex items-center"
            title="Clear invoices stuck on Processing"
          >
            <Wrench className="size-4" />
            Reclaim stuck
          </WhiteButton>
        </div>
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-800">{total}</span> job
          {total !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-white p-8 flex flex-col items-center justify-center gap-4">
            <Loader2 className="size-10 text-orange-500 animate-spin" />
            <p className="text-gray-600 font-medium">Loading jobs...</p>
            <div className="w-full max-w-md h-2 bg-gray-200 rounded-full overflow-hidden" />
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <div className="inline-flex p-4 rounded-full bg-gray-100 mb-4">
            <AlertCircle className="size-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            No invoice jobs found
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            {searchQuery
              ? `No jobs match "${searchQuery}". Try a different search.`
              : statusFilter
                ? `No jobs with status "${statusFilter}". Try a different filter.`
                : "Invoice jobs appear here after a checkout order is paid. Free grants and allotments are not invoiced."}
          </p>
          {(statusFilter || searchQuery) && (
            <WhiteButton
              onClick={() => {
                setStatusFilter("");
                setSearchInput("");
                setSearchQuery("");
                setPage(1);
              }}
            >
              Clear filters
            </WhiteButton>
          )}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
          <div className="flex-1 overflow-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">
                    Job ID
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">
                    Invoice No.
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">
                    Customer
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">
                    Item
                  </th>
                  <th className="text-right py-4 px-4 font-semibold text-gray-700">
                    Amount
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="relative overflow-visible text-left py-4 px-4 font-semibold text-gray-700">
                    <span className="group/tooltip relative inline-flex cursor-help items-center gap-1.5">
                      Progress
                      <HelpCircle className="size-3.5 text-gray-400 cursor-help" />
                      <span className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 w-64 rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal text-white shadow-lg opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100">
                        Invoice stages: 20% order loaded → 40% number allocated →
                        60% DOCX filled → 80% PDF converted → 100% uploaded to S3
                      </span>
                    </span>
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">
                    Created
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">
                    Error
                  </th>
                  <th className="text-right py-4 px-4 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => {
                  const config = statusConfig[job.status];
                  const amount = formatInr(job.amount);
                  return (
                    <tr
                      key={job.jobId}
                      className="hover:bg-orange-50/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs text-gray-700 truncate max-w-[100px]">
                            {job.jobId.slice(0, 8)}…
                          </code>
                          <WhiteButton
                            glow={false}
                            onClick={() => copyText(job.jobId, "Job ID")}
                            title={`Copy ${job.jobId}`}
                          >
                            <Copy className="size-3.5" />
                          </WhiteButton>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {job.invoiceNumber ? (
                          <code className="font-mono text-xs font-semibold text-gray-800">
                            INV-{job.invoiceNumber}
                          </code>
                        ) : (
                          <span className="text-gray-400 italic">
                            not allocated
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800 max-w-[150px] truncate">
                        {job.userName || (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td
                        className="py-3 px-4 text-gray-700 max-w-[220px] truncate"
                        title={job.itemName}
                      >
                        {job.itemName || (
                          <span className="text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-gray-800">
                        {amount ?? <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}
                        >
                          {config.icon}
                          {config.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full transition-all"
                              style={{ width: `${job.progress ?? 0}%` }}
                            />
                          </div>
                          <span className="text-gray-600 tabular-nums min-w-10">
                            {job.progress != null ? `${job.progress}%` : "-"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {job.createdAt
                          ? new Date(job.createdAt).toLocaleDateString(
                              undefined,
                              {
                                timeZone: "Asia/Kolkata",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "-"}
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
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {job.status === "completed" && job.invoiceUrl && (
                            <a
                              href={job.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-orange-600 hover:bg-orange-50"
                              title="View invoice PDF"
                            >
                              <ExternalLink className="size-3.5" />
                              View
                            </a>
                          )}
                          {job.status === "failed" && (
                            <OrangeButton
                              onClick={() => handleRetry(job.jobId)}
                              disabled={retryingJobId === job.jobId}
                              className="py-1.5 px-3 text-xs gap-1"
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
                          )}
                          {job.status !== "failed" &&
                            (!job.invoiceUrl || job.status !== "completed") && (
                              <span className="text-gray-300">-</span>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="shrink-0 pt-2"
          summary={
            <>
              Showing <span className="font-semibold">{startItem}</span>–
              <span className="font-semibold">{endItem}</span> of{" "}
              <span className="font-semibold">{total}</span>
            </>
          }
        />
      )}

      {/* Reclaim stuck jobs */}
      <Modal
        isOpen={isReclaimOpen}
        onClose={() => !isReclaiming && setIsReclaimOpen(false)}
        title="Reclaim stuck jobs"
        className="max-w-lg"
      >
        <div className="flex flex-col gap-5">
          <p className="text-sm leading-relaxed text-gray-600">
            An invoice can get stuck on{" "}
            <span className="font-semibold text-gray-800">Processing</span> if
            the server restarts while it is being generated. The customer never
            receives that invoice, and the order cannot be invoiced again until
            the job is cleared. This does not resolve on its own.
          </p>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              What this does
            </p>
            <ul className="mt-3 flex flex-col gap-2.5">
              <li className="flex gap-2.5 text-sm text-gray-600">
                <RefreshCw className="mt-0.5 size-4 shrink-0 text-orange-500" />
                <span>
                  Puts stuck invoices back in the queue so they generate again.
                </span>
              </li>
              <li className="flex gap-2.5 text-sm text-gray-600">
                <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
                <span>
                  An invoice that keeps getting stuck is marked{" "}
                  <span className="font-semibold text-gray-800">Failed</span>{" "}
                  instead, so you can read the error and retry it yourself.
                </span>
              </li>
              <li className="flex gap-2.5 text-sm text-gray-600">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
                <span>
                  Invoice numbers stay with their order. Nothing is duplicated
                  or renumbered.
                </span>
              </li>
            </ul>
          </div>

          <p className="text-xs leading-relaxed text-gray-500">
            Safe to run at any time. Only invoices that have been stuck for a
            while are affected, anything still generating normally is left
            alone, and if nothing is stuck then nothing changes.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <WhiteButton
              onClick={() => setIsReclaimOpen(false)}
              disabled={isReclaiming}
            >
              Cancel
            </WhiteButton>
            <OrangeButton
              onClick={handleReclaim}
              disabled={isReclaiming}
              className="gap-2"
            >
              {isReclaiming ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Reclaiming…
                </>
              ) : (
                <>
                  <Wrench className="size-4" />
                  Reclaim jobs
                </>
              )}
            </OrangeButton>
          </div>
        </div>
      </Modal>
    </Container>
  );
};

export default InvoiceJobsPage;
