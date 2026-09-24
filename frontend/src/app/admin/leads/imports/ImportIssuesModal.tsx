"use client";

import { useEffect, useState } from "react";
import writeXlsxFile from "write-excel-file/browser";
import type { Column } from "write-excel-file/browser";
import { Download, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import Modal from "@/components/ui/Modal";
import {
  LEAD_IMPORT_COLUMNS,
  type LeadImportJobDetail,
  type LeadImportJobIssue,
  type LeadImportJobSummary,
} from "@/types";

const KIND_STYLE: Record<LeadImportJobIssue["kind"], { label: string; className: string }> = {
  error: { label: "Not imported", className: "bg-red-50 text-red-700 ring-red-600/20" },
  "creator-not-found": {
    label: "Imported, no creator",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
};

interface Props {
  job: LeadImportJobSummary;
  onClose: () => void;
}

export default function ImportIssuesModal({ job, onClose }: Props) {
  const [issues, setIssues] = useState<LeadImportJobIssue[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ data: LeadImportJobDetail }>(ENDPOINTS.admin.leadsImportJob(job._id))
      .then((res) => {
        if (!cancelled) setIssues(res.data?.data?.issues ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Could not load these rows");
          setIssues([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [job._id]);

  const download = () => {
    if (!issues?.length) return;
    const columns: Column<LeadImportJobIssue>[] = [
      ...LEAD_IMPORT_COLUMNS.map((key) => ({
        header: key,
        cell: (i: LeadImportJobIssue) => String(i.data?.[key] ?? ""),
      })),
      { header: "issue", cell: (i: LeadImportJobIssue) => i.message },
    ];
    const base = job.fileName.replace(/\.xlsx$/i, "") || "lead-import";
    void writeXlsxFile(issues, { sheet: "Rows", columns }).toFile(`${base}-issues.xlsx`);
  };

  return (
    <Modal isOpen onClose={onClose} title="Rows to check" className="mx-4 w-full max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-800">{job.fileName || "Untitled file"}</span>
          {" · "}
          {job.errorCount} not imported · {job.creatorNotFound} imported without a creator
        </p>
        {issues?.length ? (
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:underline"
          >
            <Download className="size-3.5" />
            Download these rows
          </button>
        ) : null}
      </div>

      <div className="mt-3 max-h-96 overflow-y-auto rounded-xl border border-gray-200">
        {issues === null ? (
          <div className="flex justify-center p-8">
            <Loader2 className="size-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead className="sticky top-0 bg-gray-50 text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Result</th>
                <th className="px-3 py-2">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {issues.map((issue) => (
                <tr key={`${issue.row}-${issue.kind}`}>
                  <td className="px-3 py-2 text-gray-500">{issue.row}</td>
                  <td className="px-3 py-2 text-gray-900">{issue.data?.name ?? ""}</td>
                  <td className="px-3 py-2 text-gray-600">{issue.data?.email ?? ""}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${KIND_STYLE[issue.kind].className}`}
                    >
                      {KIND_STYLE[issue.kind].label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {issue.kind === "creator-not-found"
                      ? `No marketer, sales person or CA with ${issue.data?.creatorEmail ?? "that email"}`
                      : issue.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  );
}
