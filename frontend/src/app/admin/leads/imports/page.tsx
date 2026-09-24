"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import Container from "@/app/admin/components/ui/Container";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Pagination from "@/components/admin/Pagination";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { LeadImportJobList, LeadImportJobStatus, LeadImportJobSummary } from "@/types";
import ImportLeadsModal from "../ImportLeadsModal";
import ImportIssuesModal from "./ImportIssuesModal";

const LIMIT = 20;
const POLL_MS = 5_000;

const STATUS: Record<LeadImportJobStatus, { label: string; className: string; icon: React.ReactNode }> = {
  queued: {
    label: "Queued",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    icon: <Clock className="size-3.5" />,
  },
  running: {
    label: "Importing",
    className: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <Loader2 className="size-3.5 animate-spin" />,
  },
  done: {
    label: "Done",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: <CheckCircle2 className="size-3.5" />,
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: <XCircle className="size-3.5" />,
  },
};

const formatWhen = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function LeadImportsPage() {
  const [jobs, setJobs] = useState<LeadImportJobSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [issuesJob, setIssuesJob] = useState<LeadImportJobSummary | null>(null);
  const requestId = useRef(0);

  const load = useCallback(
    async (silent = false) => {
      const id = ++requestId.current;
      if (!silent) setLoading(true);
      try {
        const res = await apiClient.get<{ data: LeadImportJobList }>(ENDPOINTS.admin.leadsImportJobs, {
          params: { page, limit: LIMIT },
        });
        if (id !== requestId.current) return;
        setJobs(res.data?.data?.items ?? []);
        setTotal(res.data?.data?.total ?? 0);
      } catch {
        if (!silent) toast.error("Could not load imports");
      } finally {
        if (!silent && id === requestId.current) setLoading(false);
      }
    },
    [page],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const active = jobs.some((j) => j.status === "queued" || j.status === "running");
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => void load(true), POLL_MS);
    return () => clearInterval(timer);
  }, [active, load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <Container
      title="Lead imports"
      description="Upload leads from Excel. Each upload runs in the background, one after another, in the order it was uploaded."
      className="h-full"
      classNameBody="flex flex-col gap-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-800">{total}</span> import{total === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <WhiteButton
            type="button"
            glow={false}
            onClick={() => void load()}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </WhiteButton>
          <OrangeButton type="button" glow={false} onClick={() => setImportOpen(true)} className="gap-2">
            <Upload className="size-4" />
            Import leads
          </OrangeButton>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-12">
          <Loader2 className="size-8 animate-spin text-orange-500" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <div className="mb-4 inline-flex rounded-full bg-gray-100 p-4">
            <FileSpreadsheet className="size-10 text-gray-400" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-gray-800">No imports yet</h3>
          <p className="text-sm text-gray-500">Uploaded files and their progress show up here.</p>
        </div>
      ) : (
        <div className="scrollbar-thin overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left font-semibold text-gray-700">
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3 text-right">Added</th>
                <th className="px-4 py-3 text-right">Errors</th>
                <th className="px-4 py-3 text-right">Creator not found</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map((job) => {
                const status = STATUS[job.status];
                const pct = job.totalRows ? Math.round((job.processedRows / job.totalRows) * 100) : 0;
                const issueCount = job.errorCount + job.creatorNotFound;
                return (
                  <tr key={job._id} className="transition-colors hover:bg-orange-50/30">
                    <td className="max-w-[220px] px-4 py-3">
                      <p className="truncate font-medium text-gray-800" title={job.fileName}>
                        {job.fileName || "Untitled file"}
                      </p>
                      <p className="text-xs text-gray-500">{job.totalRows.toLocaleString()} rows</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{formatWhen(job.createdAt)}</p>
                      {job.createdBy?.name ? (
                        <p className="text-xs text-gray-500">by {job.createdBy.name}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
                        title={job.failureMessage || undefined}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-orange-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-xs text-gray-600">
                          {job.processedRows.toLocaleString()} / {job.totalRows.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-800">
                      {job.created.toLocaleString()}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums ${job.errorCount ? "font-semibold text-red-600" : "text-gray-400"}`}
                    >
                      {job.errorCount.toLocaleString()}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums ${job.creatorNotFound ? "font-semibold text-amber-600" : "text-gray-400"}`}
                    >
                      {job.creatorNotFound.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {issueCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => setIssuesJob(job)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-orange-600 hover:bg-orange-50"
                        >
                          <AlertCircle className="size-3.5" />
                          View rows
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalPages > 1 ? (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="pt-2" />
      ) : null}

      {importOpen ? (
        <ImportLeadsModal
          onClose={(queued) => {
            setImportOpen(false);
            if (queued) {
              setPage(1);
              void load(true);
            }
          }}
        />
      ) : null}

      {issuesJob ? <ImportIssuesModal job={issuesJob} onClose={() => setIssuesJob(null)} /> : null}
    </Container>
  );
}
