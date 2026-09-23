"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "react-toastify";
import Input from "@/components/ui/inputs/Input";
import Pagination from "@/components/admin/Pagination";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { formatIstDate, formatIstDateTime } from "@/lib/ist";
import useCaVouchers from "@/hooks/useCaVouchers";
import type { CaVoucherEnrollmentRow } from "@/types/ca-voucher";
import { CaCell, Chip, PlanChip } from "../components/VoucherCells";
import ConfirmVoucherModal from "../components/ConfirmVoucherModal";

const COLUMNS = 8;

export default function VoucherEnrollmentsPage() {
  const { listEnrollments, revoke } = useCaVouchers();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<CaVoucherEnrollmentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [revokeTarget, setRevokeTarget] = useState<CaVoucherEnrollmentRow | null>(null);
  const [revoking, setRevoking] = useState(false);

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
      const data = await listEnrollments({ search: debouncedSearch || undefined, page });
      if (cancelled) return;
      setRows(data?.rows ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 1);
      if (data && page > 1 && page > data.totalPages) setPage(Math.max(1, data.totalPages));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [listEnrollments, debouncedSearch, page, reloadKey]);

  const onRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    const ok = await revoke(revokeTarget.id);
    setRevoking(false);
    if (ok) toast.success("Access revoked. Their voucher is available again.");
    setRevokeTarget(null);
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="w-full space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Voucher enrollments</h1>
        <p className="text-sm text-gray-600">Courses unlocked through an approved campus ambassador voucher.</p>
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
                <th className="px-5 py-3">Granted</th>
                <th className="px-5 py-3">Access until</th>
                <th className="px-5 py-3">Approved by</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
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
                    {debouncedSearch ? "No enrollments match your search." : "No voucher enrollments yet."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-5 py-3">
                      <CaCell name={row.caName} email={row.caEmail} internId={row.internId} />
                    </td>
                    <td className="min-w-[180px] px-5 py-3 text-gray-700">{row.courseTitle}</td>
                    <td className="px-5 py-3">
                      <PlanChip plan={row.plan} />
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-gray-500">{formatIstDateTime(row.grantedAt)}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-gray-700">
                      {row.validUntil ? formatIstDate(row.validUntil) : "-"}
                    </td>
                    <td className="px-5 py-3 text-gray-700">{row.decidedByName ?? "-"}</td>
                    <td className="px-5 py-3">
                      {row.status === "approved" ? (
                        <Chip tone="green">Active</Chip>
                      ) : (
                        <>
                          <Chip tone="gray">Revoked</Chip>
                          {row.revokedAt ? (
                            <div className="mt-1 text-xs whitespace-nowrap text-gray-500">
                              {formatIstDateTime(row.revokedAt)}
                            </div>
                          ) : null}
                        </>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {row.status === "approved" ? (
                        <WhiteButton
                          type="button"
                          glow={false}
                          className="border-red-300 px-3! py-1.5! text-red-600 hover:border-red-400"
                          onClick={() => setRevokeTarget(row)}
                        >
                          Revoke
                        </WhiteButton>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
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

      <ConfirmVoucherModal
        open={Boolean(revokeTarget)}
        title={revokeTarget ? `Revoke ${revokeTarget.caName}'s access?` : "Revoke access?"}
        confirmLabel="Revoke access"
        busyLabel="Revoking…"
        busy={revoking}
        onConfirm={() => void onRevoke()}
        onClose={() => setRevokeTarget(null)}
      >
        {revokeTarget ? (
          <p className="mb-2">
            Course: <span className="font-semibold">{revokeTarget.courseTitle}</span>
          </p>
        ) : null}
        Removes their course access immediately. Their voucher becomes available again.
      </ConfirmVoucherModal>
    </div>
  );
}
