"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { Filter, Loader2, Search, X } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Pagination from "@/components/admin/Pagination";
import Modal from "@/components/ui/Modal";
import useReferral from "@/hooks/useReferral";
import type {
  AdminReferralWithdrawalRow,
  PaginatedReferral,
  ReferralWithdrawalStatus,
} from "@/types/referral";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const STATUS_OPTIONS: { value: "" | ReferralWithdrawalStatus; label: string }[] =
  [
    { value: "", label: "All statuses" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "success", label: "Success" },
    { value: "rejected", label: "Rejected" },
  ];

function statusPillClass(s: ReferralWithdrawalStatus): string {
  switch (s) {
    case "pending":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "processing":
      return "bg-sky-100 text-sky-900 border-sky-200";
    case "success":
      return "bg-emerald-100 text-emerald-900 border-emerald-200";
    case "rejected":
      return "bg-red-100 text-red-900 border-red-200";
  }
}

function formatDateTime(iso: string | null): string {
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
    return iso;
  }
}

function formatRupees(n: number): string {
  return `₹${(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

const ALLOWED_TRANSITIONS: Record<
  ReferralWithdrawalStatus,
  ReferralWithdrawalStatus[]
> = {
  pending: ["processing", "rejected"],
  processing: ["success", "rejected"],
  success: [],
  rejected: [],
};

/** Only accept a `status` query param the filter actually offers. */
function statusFromUrl(raw: string | null): "" | ReferralWithdrawalStatus {
  return STATUS_OPTIONS.some((o) => o.value === raw)
    ? (raw as ReferralWithdrawalStatus)
    : "";
}

export default function AdminReferralWithdrawalsPage() {
  const { adminListWithdrawals, adminTransitionWithdrawal } = useReferral();

  // Deep-linkable: the referral report links here with ?search=<email> so an
  // admin can jump straight from a referrer's balance to their redeem requests.
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams.get("search") ?? "";

  const [status, setStatus] = useState<"" | ReferralWithdrawalStatus>(() =>
    statusFromUrl(searchParams.get("status")),
  );
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const [search, setSearch] = useState(searchFromUrl);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [data, setData] = useState<
    PaginatedReferral<AdminReferralWithdrawalRow> | null
  >(null);
  const [loading, setLoading] = useState(false);

  // Debounce search.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminListWithdrawals({
        page,
        limit: pageSize,
        status: status || undefined,
        q: search,
      });
      setData(res);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ?? "Could not load withdrawals.",
      );
    } finally {
      setLoading(false);
    }
  }, [adminListWithdrawals, page, pageSize, status, search]);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  const pageCount = useMemo(
    () => Math.max(1, data?.totalPages ?? 1),
    [data],
  );

  // Modal state for transition + reject-with-notes.
  const [modal, setModal] = useState<{
    row: AdminReferralWithdrawalRow;
    next: ReferralWithdrawalStatus;
  } | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openTransitionModal = (
    row: AdminReferralWithdrawalRow,
    next: ReferralWithdrawalStatus,
  ) => {
    setNotes("");
    setModal({ row, next });
  };

  const confirmTransition = async () => {
    if (!modal) return;
    setSubmitting(true);
    try {
      await adminTransitionWithdrawal(modal.row._id, modal.next, notes);
      toast.success(`Withdrawal moved to "${modal.next}".`);
      setModal(null);
      await fetchPage();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ?? "Could not update withdrawal.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(total, page * pageSize);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-black">
            Referral Withdrawals
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Every redeem request learners have applied for. Filter to
            &ldquo;Pending&rdquo; for the ones still awaiting a decision.
          </p>
        </div>
        <span className="text-sm text-gray-500">
          {loading
            ? "Loading…"
            : total === 0
              ? "No requests"
              : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-[#344054]">
          Status
          <select
            value={status}
            onChange={(e) => {
              setStatus(
                e.target.value as "" | ReferralWithdrawalStatus,
              );
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-[#344054] flex-1 min-w-[220px]">
          Search
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search by user name or email"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
            />
          </div>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setStatus("");
              setSearchInput("");
              setSearch("");
              setPage(1);
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-orange-700 px-2 py-2"
          >
            <Filter className="size-3.5" /> Clear filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold text-black">User</th>
              <th className="px-4 py-3 font-semibold text-black">UPI</th>
              <th className="px-4 py-3 font-semibold text-black">Amount</th>
              <th className="px-4 py-3 font-semibold text-black">Requested</th>
              <th className="px-4 py-3 font-semibold text-black">Status</th>
              <th className="px-4 py-3 font-semibold text-black">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Loader2 className="inline-block w-5 h-5 animate-spin text-gray-400" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  No withdrawal requests match these filters.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr
                  key={r._id}
                  className="border-b border-gray-100 last:border-0 align-top"
                >
                  <td className="px-4 py-3 text-[#1D2939]">
                    <p className="font-medium">{r.user.name}</p>
                    <p className="text-xs text-gray-500">{r.user.email}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#344054]">
                    {r.upiIdSnapshot}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#1D2939]">
                    {formatRupees(r.amount)}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#475467]">
                    {formatDateTime(r.createdAt)}
                    {r.decidedAt ? (
                      <p className="text-gray-400">
                        Decided {formatDateTime(r.decidedAt)}
                      </p>
                    ) : null}
                    {r.notes ? (
                      <p className="italic text-gray-500 mt-0.5 line-clamp-2">
                        “{r.notes}”
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
                        statusPillClass(r.status),
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {ALLOWED_TRANSITIONS[r.status].length === 0 ? (
                        <span className="text-xs text-gray-400">
                          Terminal
                        </span>
                      ) : (
                        ALLOWED_TRANSITIONS[r.status].map((next) => (
                          <button
                            key={next}
                            type="button"
                            onClick={() => openTransitionModal(r, next)}
                            className={cn(
                              "rounded-md border px-2.5 py-1 text-xs font-semibold capitalize transition",
                              next === "rejected"
                                ? "border-red-200 text-red-700 hover:bg-red-50"
                                : next === "success"
                                  ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  : "border-sky-200 text-sky-700 hover:bg-sky-50",
                            )}
                          >
                            {next === "processing"
                              ? "Mark processing"
                              : next === "success"
                                ? "Mark success"
                                : "Reject"}
                          </button>
                        ))
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-xs text-[#475467]">
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs outline-none focus:border-[#F77124] focus:ring-2 focus:ring-[#F77124]/20"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <Pagination
          page={page}
          totalPages={pageCount}
          onPageChange={setPage}
          disabled={loading}
        />
      </div>

      {/* Transition modal */}
      <Modal
        isOpen={modal !== null}
        onClose={() => {
          if (!submitting) setModal(null);
        }}
        title={
          modal
            ? `Move to "${modal.next}"`
            : "Update withdrawal"
        }
        className="max-w-md w-full mx-4"
      >
        {modal ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{modal.row.user.name}</span> —{" "}
              {formatRupees(modal.row.amount)} → UPI{" "}
              <span className="font-mono">{modal.row.upiIdSnapshot}</span>
            </p>
            <label className="flex flex-col gap-1 text-xs font-medium text-[#344054]">
              {modal.next === "rejected"
                ? "Reason (shown to the learner)"
                : "Notes (optional)"}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder={
                  modal.next === "rejected"
                    ? "Why is this being rejected?"
                    : "Add a note (optional)"
                }
              />
            </label>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <WhiteButton
                type="button"
                glow={false}
                onClick={() => setModal(null)}
                disabled={submitting}
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </WhiteButton>
              <OrangeButton
                type="button"
                glow={false}
                onClick={() => void confirmTransition()}
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Confirm"}
              </OrangeButton>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
