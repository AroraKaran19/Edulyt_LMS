"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "react-toastify";
import Input from "@/components/ui/inputs/Input";
import Pagination from "@/components/admin/Pagination";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { cn } from "@/lib/utils";
import { formatIstDateTime } from "@/lib/ist";
import useCaVouchers from "@/hooks/useCaVouchers";
import type { CaVoucherRequestRow, CaVoucherRequestTab, CaVoucherStatus } from "@/types/ca-voucher";
import { CaCell, Chip, PlanChip } from "../components/VoucherCells";
import type { ChipTone } from "../components/VoucherCells";
import ConfirmVoucherModal from "../components/ConfirmVoucherModal";
import DeclineVoucherModal from "../components/DeclineVoucherModal";

const TABS: { key: CaVoucherRequestTab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "declined", label: "Declined" },
  { key: "approved", label: "Approved" },
  { key: "all", label: "All" },
];

const STATUS: Record<CaVoucherStatus, { label: string; tone: ChipTone }> = {
  pending: { label: "Pending", tone: "amber" },
  approved: { label: "Approved", tone: "green" },
  declined: { label: "Declined", tone: "red" },
  revoked: { label: "Revoked", tone: "gray" },
};

const COLUMNS = 6;

export default function VoucherRequestsPage() {
  const { listRequests, approve, decline, remove } = useCaVouchers();

  const [status, setStatus] = useState<CaVoucherRequestTab>("pending");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<CaVoucherRequestRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [declineTarget, setDeclineTarget] = useState<CaVoucherRequestRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CaVoucherRequestRow | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await listRequests({ status, search: debouncedSearch || undefined, page });
      if (cancelled) return;
      setRows(data?.rows ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 1);
      if (data?.counts) setPendingCount(data.counts.pending);
      // The last row on a page was just decided away: step back rather than strand an empty page.
      if (data && page > 1 && page > data.totalPages) setPage(Math.max(1, data.totalPages));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [listRequests, status, debouncedSearch, page, reloadKey]);

  const refresh = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  const onApprove = async (row: CaVoucherRequestRow) => {
    setBusyId(row.id);
    const ok = await approve(row.id);
    setBusyId(null);
    if (ok) toast.success(`Approved. ${row.caName} can start ${row.courseTitle}.`);
    refresh();
  };

  const onDecline = async (reason: string) => {
    if (!declineTarget) return;
    setBusyId(declineTarget.id);
    const ok = await decline(declineTarget.id, reason || undefined);
    setBusyId(null);
    if (ok) toast.success("Request declined");
    setDeclineTarget(null);
    refresh();
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    const ok = await remove(deleteTarget.id);
    setBusyId(null);
    if (ok) {
      toast.success(deleteTarget.status === "approved" ? "Request deleted and access revoked" : "Request deleted");
    }
    setDeleteTarget(null);
    refresh();
  };

  return (
    <div className="w-full space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voucher requests</h1>
          <p className="text-sm text-gray-600">
            Campus ambassadors asking to use their free course voucher. Approving one unlocks the course for them.
          </p>
        </div>
        <span className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-700">
          {pendingCount} pending
        </span>
      </div>

      <div role="tablist" aria-label="Request status" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={status === tab.key}
            onClick={() => {
              setLoading(true);
              setStatus(tab.key);
              setPage(1);
            }}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
              status === tab.key
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-600 hover:text-gray-900",
            )}
          >
            {tab.label}
            {tab.key === "pending" ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      <div className="relative w-full sm:max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              setLoading(true);
              setDebouncedSearch(search.trim());
              setPage(1);
            }
          }}
          placeholder="Search by name, email, intern ID or course"
          className="pl-9 max-sm:text-base"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3">CA</th>
                <th className="px-5 py-3">Course</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Requested</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={COLUMNS} className="px-5 py-12 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-gray-400" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS} className="px-5 py-12 text-center text-gray-500">
                    {debouncedSearch ? "No requests match your search." : "No requests here yet."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const busy = busyId === row.id;
                  return (
                    <tr key={row.id}>
                      <td className="px-5 py-3">
                        <CaCell name={row.caName} email={row.caEmail} internId={row.internId} />
                      </td>
                      <td className="min-w-[180px] px-5 py-3 text-gray-700">{row.courseTitle}</td>
                      <td className="px-5 py-3">
                        <PlanChip plan={row.plan} />
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-gray-500">{formatIstDateTime(row.requestedAt)}</td>
                      <td className="px-5 py-3">
                        <Chip tone={STATUS[row.status].tone}>{STATUS[row.status].label}</Chip>
                        {row.decidedAt ? (
                          <div className="mt-1 text-xs whitespace-nowrap text-gray-500">
                            {formatIstDateTime(row.decidedAt)}
                            {row.decidedByName ? ` by ${row.decidedByName}` : ""}
                          </div>
                        ) : null}
                        {row.status === "declined" && row.declineReason ? (
                          <div className="mt-1 max-w-[240px] text-xs break-words text-gray-600">
                            &ldquo;{row.declineReason}&rdquo;
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {row.status === "pending" ? (
                            <>
                              <WhiteButton
                                type="button"
                                glow={false}
                                className="border-red-300 px-3! py-1.5! text-red-600 hover:border-red-400"
                                disabled={busy}
                                onClick={() => setDeclineTarget(row)}
                              >
                                Decline
                              </WhiteButton>
                              <OrangeButton
                                type="button"
                                glow={false}
                                className="px-3! py-1.5! whitespace-nowrap"
                                disabled={busy}
                                onClick={() => void onApprove(row)}
                              >
                                {busy ? "Approving…" : "Approve"}
                              </OrangeButton>
                            </>
                          ) : row.status === "declined" ? (
                            <OrangeButton
                              type="button"
                              glow={false}
                              className="px-3! py-1.5! whitespace-nowrap"
                              disabled={busy}
                              onClick={() => void onApprove(row)}
                            >
                              {busy ? "Approving…" : "Change to approved"}
                            </OrangeButton>
                          ) : null}
                          <WhiteButton
                            type="button"
                            glow={false}
                            className="px-3! py-1.5! text-gray-700"
                            disabled={busy}
                            onClick={() => setDeleteTarget(row)}
                          >
                            Delete
                          </WhiteButton>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => {
          setLoading(true);
          setPage(p);
        }}
        disabled={loading}
        summary={`${total} total`}
      />

      <DeclineVoucherModal
        key={declineTarget?.id ?? "none"}
        request={declineTarget}
        busy={Boolean(declineTarget && busyId === declineTarget.id)}
        onConfirm={(reason) => void onDecline(reason)}
        onClose={() => setDeclineTarget(null)}
      />

      <ConfirmVoucherModal
        open={Boolean(deleteTarget)}
        title="Delete this request?"
        warning={
          deleteTarget?.status === "approved"
            ? "This request is approved. Deleting it also revokes their enrollment, so they lose access to the course immediately."
            : undefined
        }
        confirmLabel="Delete request"
        busyLabel="Deleting…"
        busy={Boolean(deleteTarget && busyId === deleteTarget.id)}
        onConfirm={() => void onDelete()}
        onClose={() => setDeleteTarget(null)}
      >
        {deleteTarget ? (
          <>
            <span className="font-semibold">{deleteTarget.caName}</span>&apos;s request for{" "}
            <span className="font-semibold">{deleteTarget.courseTitle}</span> is removed. This can&apos;t be undone.
          </>
        ) : null}
      </ConfirmVoucherModal>
    </div>
  );
}
