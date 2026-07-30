"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight, Clock, Loader2, Star } from "lucide-react";
import Modal from "@/components/ui/Modal";
import SuccessPointsHistoryRow from "@/components/shared/SuccessPoints/SuccessPointsHistoryRow";
import useSuccessPoints, {
  type SuccessPointTransaction,
} from "@/hooks/useSuccessPoints";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  userEmail?: string;
}

const PAGE_SIZE = 8;

const points = (n: number) => n.toLocaleString("en-IN");

/**
 * Admin read-only view of a student's platform (wallet) success-points ledger.
 * Balance / earned / spent are all-time and don't change with the page shown.
 */
export default function SuccessPointsHistoryModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
}: Props) {
  const { adminListUserHistory } = useSuccessPoints();

  const [items, setItems] = useState<SuccessPointTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ balance: 0, earned: 0, spent: 0 });
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (p: number) => {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await adminListUserHistory(userId, p, PAGE_SIZE);
        setItems(res.items);
        setPage(res.page);
        setTotalPages(res.totalPages);
        setTotal(res.total);
        setSummary({
          balance: res.balance,
          earned: res.earned,
          spent: res.spent,
        });
      } catch {
        toast.error("Couldn't load this student's points history.");
      } finally {
        setLoading(false);
      }
    },
    [adminListUserHistory, userId],
  );

  useEffect(() => {
    if (!isOpen) return;
    void load(1);
  }, [isOpen, load]);

  const stats = [
    {
      label: "Balance",
      value: points(summary.balance),
      className: "text-gray-900",
    },
    {
      label: "Total earned",
      value: `+${points(summary.earned)}`,
      className: "text-emerald-600",
    },
    {
      label: "Total spent",
      value: summary.spent ? `-${points(summary.spent)}` : "0",
      className: "text-red-500",
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Success Points History"
      className="max-w-2xl w-full mx-4 max-h-[90vh]"
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Star className="w-4 h-4 text-[#F77124] fill-[#F77124] shrink-0" />
          <span className="min-w-0 truncate">
            Platform wallet activity for{" "}
            <span className="font-medium text-gray-900">
              {userName || userEmail || "this student"}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2.5"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {s.label}
              </p>
              <p className={`mt-0.5 text-lg font-bold ${s.className}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
            <Clock className="mx-auto mb-2 w-7 h-7 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">No activity yet</p>
            <p className="mt-0.5 text-xs text-gray-400">
              Earned, redeemed and transferred points will show up here.
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 px-3">
              {items.map((tx) => (
                <li key={tx.transactionId}>
                  <SuccessPointsHistoryRow tx={tx} showActor />
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {total} {total === 1 ? "entry" : "entries"} · page {page} of{" "}
                {totalPages}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => load(page - 1)}
                    disabled={page <= 1 || loading}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => load(page + 1)}
                    disabled={page >= totalPages || loading}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
