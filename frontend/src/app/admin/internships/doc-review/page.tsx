"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Modal from "@/components/ui/Modal";
import {
  InfiniteScrollSelect,
  type InfiniteScrollSelectOption,
} from "@/components/ui/dropdown/InfiniteScrollSelect";
import InternshipAdminListShell from "../components/InternshipAdminListShell";
import type { InternshipEnrollmentListRow } from "@/types";

type PendingInternship = {
  internshipId: string;
  title: string;
  slug: string;
  pendingCount: number;
};

type BulkResult = {
  results: { enrollmentId: string; ok: boolean; error?: string }[];
  ok: number;
  failed: number;
};

const ROWS_PER_PAGE = 20;

function maskAadhar(value?: string): string {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return value;
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
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

function userDisplayName(u: InternshipEnrollmentListRow["user"]): string {
  if (!u) return "—";
  if (u.name?.trim()) return u.name.trim();
  const n = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return n || u.email || "—";
}

function userInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function DocReviewQueuePage() {
  const [selectedInternshipId, setSelectedInternshipId] = useState<string>("");

  const [rows, setRows] = useState<InternshipEnrollmentListRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search → resets page + selection
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
      setSelectedIds(new Set());
    }, 400);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]);

  // Reset page + selection when internship filter changes
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [selectedInternshipId]);

  const fetchInternshipsPage = useCallback(
    async (
      pageNum: number,
      searchTerm: string,
    ): Promise<{
      items: InfiniteScrollSelectOption<PendingInternship>[];
      totalPages: number;
      total?: number;
    }> => {
      const params = new URLSearchParams();
      params.set("page", String(pageNum));
      params.set("limit", "20");
      if (searchTerm.trim()) params.set("search", searchTerm.trim());

      const res = await apiClient.get(
        `${ENDPOINTS.internshipEnrollments.adminPendingDocInternships}?${params.toString()}`,
      );
      const data = res.data?.data ?? {};
      const items: PendingInternship[] = (data.items ?? []) as PendingInternship[];

      return {
        items: items.map((i) => ({
          value: i.internshipId,
          label: `${i.title || "Untitled internship"} — ${i.pendingCount} pending`,
          raw: i,
        })),
        totalPages: Number(data.totalPages ?? 1),
        total: Number(data.total ?? items.length),
      };
    },
    [],
  );

  const fetchRows = useCallback(async () => {
    setLoadingRows(true);
    try {
      const params = new URLSearchParams();
      params.set("status", "docs_under_review");
      params.set("lifecycle", "program");
      params.set("page", String(page));
      params.set("limit", String(ROWS_PER_PAGE));
      if (selectedInternshipId) {
        params.set("internshipId", selectedInternshipId);
      }
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      const res = await apiClient.get(
        `${ENDPOINTS.internshipEnrollments.adminList}?${params.toString()}`,
      );
      const data = res.data?.data ?? {};
      setRows((data.enrollments ?? []) as InternshipEnrollmentListRow[]);
      setTotalPages(Number(data.totalPages ?? 1));
      setTotal(Number(data.total ?? 0));
    } catch (e) {
      console.error("[doc-review] fetchRows error:", e);
      toast.error("Could not load pending documents");
      setRows([]);
      setTotal(0);
    } finally {
      setLoadingRows(false);
    }
  }, [selectedInternshipId, debouncedSearch, page]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const selectableIdsOnPage = useMemo(
    () => rows.filter((r) => r.documentation).map((r) => r._id),
    [rows],
  );

  const toggleAllOnPage = () => {
    const next = new Set(selectedIds);
    const allCurrentlySelected = selectableIdsOnPage.every((id) =>
      next.has(id),
    );
    if (allCurrentlySelected) {
      selectableIdsOnPage.forEach((id) => next.delete(id));
    } else {
      selectableIdsOnPage.forEach((id) => next.add(id));
    }
    setSelectedIds(next);
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkSubmitting(true);
    try {
      const res = await apiClient.post(
        ENDPOINTS.internshipEnrollments.adminBulkApproveDocumentation,
        { enrollmentIds: ids },
      );
      const data = res.data?.data as BulkResult | undefined;
      if (data) {
        toast.success(
          `Approved ${data.ok}/${ids.length}${
            data.failed > 0 ? ` — ${data.failed} failed` : ""
          }`,
        );
        if (data.failed > 0) {
          data.results
            .filter((r) => !r.ok)
            .slice(0, 3)
            .forEach((r) => toast.error(`${r.enrollmentId}: ${r.error}`));
        }
      } else {
        toast.success("Bulk approval submitted");
      }
      setSelectedIds(new Set());
      setConfirmOpen(false);
      void fetchRows();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })?.response
          ?.data?.error?.message ?? "Bulk approve failed";
      toast.error(msg);
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <>
      <InternshipAdminListShell
        title="Doc Review"
        subtitle="Bulk-approve learner Aadhar + photo uploads. Approved rows transition to offer_letter_pending and the worker generates their offer letter on its next tick."
        searchPlaceholder="Search learner email, name, internship title, or batch…"
        searchValue={search}
        onSearchChange={setSearch}
        filterExtras={
          <div className="sm:w-80">
            <InfiniteScrollSelect<PendingInternship>
              placeholder="All internships with pending docs"
              value={selectedInternshipId}
              onChange={(v) => {
                const id = Array.isArray(v) ? (v[0] ?? "") : v;
                setSelectedInternshipId(id);
              }}
              fetchOptions={fetchInternshipsPage}
              searchPlaceholder="Search internship…"
              emptyMessage="No internships with pending documents"
              dropdownPortal
            />
          </div>
        }
      >
        {/* Summary bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-gray-100 bg-linear-to-r from-orange-50/40 via-amber-50/30 to-transparent">
          <div className="flex items-center gap-2 text-sm">
            <FileCheck2 className="h-4 w-4 text-orange-600" />
            <span className="font-semibold text-gray-900">
              {total.toLocaleString()} pending review
            </span>
            <span className="text-gray-500">
              {selectedInternshipId
                ? "(filtered by internship)"
                : "across all internships"}
            </span>
          </div>
        </div>

        {loadingRows ? (
          <div className="px-6 py-16 text-center text-sm text-gray-500">
            <div className="animate-pulse">Loading queue…</div>
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center flex flex-col items-center gap-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <div>
              <p className="font-semibold text-gray-800">
                No documents pending review
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedInternshipId
                  ? "This internship has no pending documents — try clearing the filter."
                  : debouncedSearch
                    ? "Nothing matches your search."
                    : "All caught up. New submissions will appear here."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 w-12 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectableIdsOnPage.length > 0 &&
                          selectableIdsOnPage.every((id) => selectedIds.has(id))
                        }
                        onChange={toggleAllOnPage}
                        disabled={selectableIdsOnPage.length === 0}
                        className="h-4 w-4 cursor-pointer accent-orange-600 disabled:opacity-40"
                        aria-label="Select all on this page"
                      />
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700">
                      Learner
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700">
                      Internship
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700 whitespace-nowrap">
                      Submitted
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700 whitespace-nowrap">
                      Aadhar
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase text-gray-700">
                      Photo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => {
                    const doc = row.documentation;
                    const isSelected = selectedIds.has(row._id);
                    const hasDocs = Boolean(doc?.learnerPhoto);
                    const displayName = userDisplayName(row.user);
                    const initials = userInitials(displayName);

                    return (
                      <tr
                        key={row._id}
                        className={
                          isSelected
                            ? "bg-orange-50/70 ring-1 ring-inset ring-orange-200"
                            : "hover:bg-gray-50/80 transition"
                        }
                      >
                        <td className="px-4 sm:px-6 py-4 align-middle">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(row._id)}
                            disabled={!hasDocs}
                            className="h-4 w-4 cursor-pointer accent-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label={`Select ${displayName}`}
                          />
                        </td>
                        <td className="px-4 sm:px-6 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            {row.user?.profilePicture ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={row.user.profilePicture}
                                alt={displayName}
                                className="h-10 w-10 rounded-full object-cover shrink-0 border border-gray-200"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-linear-to-br from-orange-100 to-amber-200 text-orange-800 font-semibold text-sm flex items-center justify-center shrink-0">
                                {initials || "—"}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {displayName}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {row.user?.email ?? "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 align-middle">
                          <div className="text-gray-800 line-clamp-2">
                            {row.internship?.title ??
                              row.internshipSnapshot?.title ??
                              "—"}
                          </div>
                          {row.batchSnapshot?.name ? (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {row.batchSnapshot.name}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 sm:px-6 py-4 align-middle text-xs text-gray-600 whitespace-nowrap">
                          {formatDateTime(doc?.submittedAt)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 align-middle">
                          <span className="font-mono text-xs text-gray-800 bg-gray-100 border border-gray-200 rounded px-2 py-1">
                            {maskAadhar(doc?.aadharCardNumber)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 align-middle">
                          {doc?.learnerPhoto ? (
                            <Zoom>
                              <Image
                                src={doc.learnerPhoto}
                                alt={`${displayName} photo`}
                                width={64}
                                height={64}
                                unoptimized
                                className="h-16 w-16 rounded-md object-cover border border-gray-200 shadow-sm cursor-zoom-in"
                              />
                            </Zoom>
                          ) : (
                            <div className="h-16 w-16 rounded-md bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                              no photo
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-gray-100 text-xs text-gray-600">
              <div>
                Page <span className="font-semibold">{page}</span> of{" "}
                <span className="font-semibold">{totalPages}</span> ·{" "}
                <span className="font-semibold">{total}</span> total
              </div>
              <div className="flex gap-2">
                <WhiteButton
                  type="button"
                  glow={false}
                  disabled={page <= 1 || loadingRows}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </WhiteButton>
                <WhiteButton
                  type="button"
                  glow={false}
                  disabled={page >= totalPages || loadingRows}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </WhiteButton>
              </div>
            </div>
          </>
        )}
      </InternshipAdminListShell>

      {/* Sticky bulk-action pill */}
      {selectedIds.size > 0 ? (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full bg-white shadow-2xl border border-orange-200 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 pr-2 border-r border-gray-200">
            <ShieldCheck className="h-4 w-4 text-orange-600" />
            {selectedIds.size} selected
          </div>
          <WhiteButton
            type="button"
            glow={false}
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </WhiteButton>
          <OrangeButton
            type="button"
            glow={false}
            onClick={() => setConfirmOpen(true)}
          >
            Approve selected
          </OrangeButton>
        </div>
      ) : null}

      <Modal
        isOpen={confirmOpen}
        onClose={() => {
          if (!bulkSubmitting) setConfirmOpen(false);
        }}
        title="Bulk approve documents?"
        className="max-w-md w-full mx-4"
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900 flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              You&apos;re about to approve{" "}
              <span className="font-semibold">{selectedIds.size}</span>{" "}
              enrollment{selectedIds.size === 1 ? "" : "s"}. Each row will
              transition to{" "}
              <span className="font-mono">offer_letter_pending</span> and the
              worker will generate their offer letter on its next tick. This
              cannot be undone from the UI.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <WhiteButton
              type="button"
              glow={false}
              onClick={() => setConfirmOpen(false)}
              disabled={bulkSubmitting}
            >
              Cancel
            </WhiteButton>
            <OrangeButton
              type="button"
              glow={false}
              onClick={() => void handleBulkApprove()}
              disabled={bulkSubmitting}
            >
              {bulkSubmitting ? "Approving…" : `Approve ${selectedIds.size}`}
            </OrangeButton>
          </div>
        </div>
      </Modal>
    </>
  );
}
