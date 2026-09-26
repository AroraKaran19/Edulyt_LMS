"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Modal from "@/components/ui/Modal";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import SubmissionDetailModal from "../../components/SubmissionDetailModal";
import BulkReviewDialog, {
  type BulkReviewInput,
  type BulkReviewOutcome,
} from "@/components/admin/BulkReviewDialog";

/** Mirrors MAX_BULK_REVIEW on the server. */
const MAX_BULK = 50;

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "submitted", label: "Awaiting review" },
  { value: "partially_reviewed", label: "Partially reviewed" },
  { value: "fully_reviewed", label: "Fully reviewed" },
];

type Props = {
  isOpen: boolean;
  taskId: string | null;
  taskTitle?: string;
  onClose: () => void;
};

type PopulatedUser = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  name?: string;
};

type SubmissionListRow = {
  _id: string;
  status?: string;
  totalAwardedScore?: number;
  batchId?: string;
  internshipId?: string;
  userId: string | PopulatedUser;
  updatedAt?: string;
  submittedAt?: string;
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
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

function userLabel(u: string | PopulatedUser): string {
  if (typeof u === "string") return u.length > 10 ? `${u.slice(0, 8)}…` : u;
  if (u.name?.trim()) return u.name.trim();
  const parts = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  if (u.email) return u.email;
  return u._id ? String(u._id).slice(0, 8) + "…" : "—";
}

export default function TaskSubmissionsModal({
  isOpen,
  taskId,
  taskTitle,
  onClose,
}: Props) {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<SubmissionListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  // Kept across pages so a reviewer can gather a batch; id to learner label.
  const [selected, setSelected] = useState<Map<string, string>>(new Map());
  const [bulkOpen, setBulkOpen] = useState(false);

  const selectable = rows.filter((r) => r.status !== "draft");
  const allOnPageSelected =
    selectable.length > 0 && selectable.every((r) => selected.has(r._id));

  const toggleRow = (row: SubmissionListRow) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(row._id)) next.delete(row._id);
      else if (next.size < MAX_BULK) next.set(row._id, userLabel(row.userId));
      else toast.info(`You can review up to ${MAX_BULK} at a time`);
      return next;
    });

  const togglePage = () =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (allOnPageSelected) {
        selectable.forEach((r) => next.delete(r._id));
      } else {
        for (const r of selectable) {
          if (next.size >= MAX_BULK) break;
          next.set(r._id, userLabel(r.userId));
        }
      }
      return next;
    });

  const runBulkReview = async ({
    verdict,
    percent,
    note,
  }: BulkReviewInput): Promise<BulkReviewOutcome> => {
    const res = await apiClient.post(
      ENDPOINTS.internshipSubmissions.adminBulkReview,
      {
        submissionIds: [...selected.keys()],
        verdict: verdict === "approve" ? "reviewed" : "re_upload_requested",
        percent,
        reviewNote: note,
      },
    );
    const results = (res.data?.data?.results ?? []) as {
      submissionId: string;
      ok: boolean;
      error?: string;
    }[];
    return {
      reviewed: results.filter((r) => r.ok).length,
      failed: results
        .filter((r) => !r.ok)
        .map((r) => ({
          label: selected.get(r.submissionId) ?? r.submissionId,
          error: r.error ?? "Could not review",
        })),
    };
  };

  const fetchPage = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(
        ENDPOINTS.internshipSubmissions.adminList,
        {
          params: {
            page,
            limit: 10,
            submissionFor: "task",
            taskId,
            ...(statusFilter ? { status: statusFilter } : {}),
          },
        },
      );
      const d = res.data?.data as
        | {
            submissions?: SubmissionListRow[];
            totalPages?: number;
            total?: number;
          }
        | undefined;
      setRows(Array.isArray(d?.submissions) ? d!.submissions! : []);
      setTotalPages(
        typeof d?.totalPages === "number" && d.totalPages >= 1
          ? d.totalPages
          : 1,
      );
      setTotal(typeof d?.total === "number" ? d.total : 0);
    } catch {
      toast.error("Could not load submissions");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [taskId, page, statusFilter]);

  useEffect(() => {
    if (!isOpen || !taskId) {
      setRows([]);
      return;
    }
    void fetchPage();
  }, [isOpen, taskId, page, fetchPage]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          taskTitle
            ? `Submissions — ${taskTitle}`
            : "Submissions for this template"
        }
        className="max-w-5xl w-full mx-4 max-h-[90vh]"
      >
        <div className="flex flex-col gap-3 max-h-[calc(90vh-5rem)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              All learner submissions for this task template (any batch).
            </p>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              Status
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="overflow-auto border border-gray-200 rounded-lg">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label="Select all on this page"
                      checked={allOnPageSelected}
                      disabled={selectable.length === 0}
                      onChange={togglePage}
                      className="size-4 accent-orange-500"
                    />
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">
                    Learner
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">
                    Score
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">
                    Batch
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-10 text-center text-gray-500"
                    >
                      <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-orange-500" />
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-10 text-center text-gray-500"
                    >
                      No submissions yet for this template.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setDetailId(r._id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setDetailId(r._id);
                        }
                      }}
                      className="hover:bg-orange-50/60 cursor-pointer transition-colors"
                    >
                      <td
                        className="px-3 py-2"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Select ${userLabel(r.userId)}`}
                          checked={selected.has(r._id)}
                          disabled={r.status === "draft"}
                          onChange={() => toggleRow(r)}
                          className="size-4 accent-orange-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-900">
                        {userLabel(r.userId)}
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                          {r.status ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 tabular-nums text-gray-800">
                        {typeof r.totalAwardedScore === "number"
                          ? r.totalAwardedScore
                          : "—"}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-600">
                        {r.batchId
                          ? r.batchId.length > 12
                            ? `${r.batchId.slice(0, 10)}…`
                            : r.batchId
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {formatDate(r.updatedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
              <p className="text-xs text-gray-600">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <WhiteButton
                  type="button"
                  glow={false}
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </WhiteButton>
                <OrangeButton
                  type="button"
                  glow={false}
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </OrangeButton>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            {selected.size > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">
                  {selected.size} selected
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(new Map())}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                >
                  Clear
                </button>
                <OrangeButton
                  type="button"
                  glow={false}
                  onClick={() => setBulkOpen(true)}
                >
                  Review selected
                </OrangeButton>
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                Click a row to view full details, or tick rows to review them
                together
              </p>
            )}
            <WhiteButton type="button" glow={false} onClick={onClose}>
              Close
            </WhiteButton>
          </div>
        </div>
      </Modal>

      <BulkReviewDialog
        isOpen={bulkOpen}
        count={selected.size}
        noun="submission"
        rejectLabel="Request resubmission"
        approveHint="Every file answer still waiting for review gets this share of its own marks. Answers already reviewed stay as they are, and success points follow exactly as with a manual review."
        rejectHint="Every file answer still waiting for review is sent back to the learner with your note and scores 0 until they re-upload."
        onSubmit={runBulkReview}
        onClose={(changed) => {
          setBulkOpen(false);
          if (changed) {
            setSelected(new Map());
            void fetchPage();
          }
        }}
      />

      <SubmissionDetailModal
        isOpen={!!detailId}
        submissionId={detailId}
        onClose={() => setDetailId(null)}
      />
    </>
  );
}
