"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gift,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import useSuccessPoints, {
  type SuccessPointTransaction,
} from "@/hooks/useSuccessPoints";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Initial balance to render instantly; refreshed from the server on open. */
  initialBalance?: number;
}

type Page = "transfer" | "history";

const HISTORY_PAGE_SIZE = 6;

const NAV: { id: Page; label: string; icon: typeof Send; hint: string }[] = [
  { id: "transfer", label: "Transfer", icon: Send, hint: "Send points" },
  { id: "history", label: "History", icon: Clock, hint: "Past activity" },
];

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
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

function HistoryRow({ tx }: { tx: SuccessPointTransaction }) {
  if (tx.type === "transferred_in") {
    return (
      <div className="flex items-center gap-3 py-3">
        <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
          <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            Received from {tx.fromUserDisplayName || "a user"}
          </p>
          <p className="text-[11px] text-gray-400">
            {formatDateTime(tx.earnedAt)}
          </p>
        </div>
        <span className="text-sm font-bold text-emerald-600 shrink-0">
          +{tx.points}
        </span>
      </div>
    );
  }
  if (tx.type === "transferred_out") {
    return (
      <div className="flex items-center gap-3 py-3">
        <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <ArrowUpRight className="w-4 h-4 text-red-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            Sent to {tx.toUserDisplayName || "a user"}
          </p>
          <p className="text-[11px] text-gray-400">
            {formatDateTime(tx.earnedAt)}
          </p>
        </div>
        <span className="text-sm font-bold text-red-500 shrink-0">
          -{tx.points}
        </span>
      </div>
    );
  }
  if (tx.type === "redeemed") {
    return (
      <div className="flex items-center gap-3 py-3">
        <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
          <ShoppingCart className="w-4 h-4 text-rose-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            Redeemed at checkout
            {tx.courseSnapshot?.title ? ` · ${tx.courseSnapshot.title}` : ""}
          </p>
          <p className="text-[11px] text-gray-400">
            {formatDateTime(tx.earnedAt)}
          </p>
        </div>
        <span className="text-sm font-bold text-rose-500 shrink-0">
          -{tx.points}
        </span>
      </div>
    );
  }
  if (tx.type === "admin_adjustment") {
    const credited = tx.points >= 0;
    return (
      <div className="flex items-center gap-3 py-3">
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
            credited ? "bg-emerald-50" : "bg-red-50",
          )}
        >
          <ShieldCheck
            className={cn(
              "w-4 h-4",
              credited ? "text-emerald-600" : "text-red-500",
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            Admin adjustment
          </p>
          <p className="text-[11px] text-gray-400">
            {formatDateTime(tx.earnedAt)}
          </p>
        </div>
        <span
          className={cn(
            "text-sm font-bold shrink-0",
            credited ? "text-emerald-600" : "text-red-500",
          )}
        >
          {credited ? `+${tx.points}` : tx.points}
        </span>
      </div>
    );
  }
  if (tx.type === "reward") {
    const REWARD_LABELS: Record<string, string> = {
      login: "Welcome bonus",
      community_review: "Community review reward",
      internship_registration: "Internship registration reward",
    };
    const label = REWARD_LABELS[tx.rewardSource ?? ""] ?? "Reward";
    return (
      <div className="flex items-center gap-3 py-3">
        <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
          <Gift className="w-4 h-4 text-amber-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {label}
          </p>
          <p className="text-[11px] text-gray-400">
            {formatDateTime(tx.earnedAt)}
          </p>
        </div>
        <span className="text-sm font-bold text-emerald-600 shrink-0">
          +{tx.points}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 text-[#F77124]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 truncate">
          Earned{tx.courseSnapshot?.title ? ` · ${tx.courseSnapshot.title}` : ""}
        </p>
        <p className="text-[11px] text-gray-400">
          {formatDateTime(tx.earnedAt)}
        </p>
      </div>
      <span className="text-sm font-bold text-emerald-600 shrink-0">
        +{tx.points}
      </span>
    </div>
  );
}

export default function TransferPointsModal({
  isOpen,
  onClose,
  initialBalance = 0,
}: Props) {
  const { getBalance, listHistory, transfer } = useSuccessPoints();
  const { update: updateSession } = useSession();

  const [page, setPage] = useState<Page>("transfer");
  const [balance, setBalance] = useState(initialBalance);

  const [email, setEmail] = useState("");
  const [points, setPoints] = useState("");
  const [errors, setErrors] = useState<{ email?: string; points?: string }>(
    {},
  );
  const [isTransferring, setIsTransferring] = useState(false);

  const [history, setHistory] = useState<SuccessPointTransaction[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const refreshBalance = useCallback(async () => {
    try {
      const { balance: b } = await getBalance();
      setBalance(b);
    } catch {
      // keep last known balance
    }
  }, [getBalance]);

  const loadHistory = useCallback(
    async (p: number) => {
      setIsLoadingHistory(true);
      try {
        const res = await listHistory(p, HISTORY_PAGE_SIZE);
        setHistory(res.items);
        setHistoryPage(res.page);
        setHistoryTotalPages(res.totalPages);
      } catch {
        toast.error("Couldn't load your points history.");
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [listHistory],
  );

  useEffect(() => {
    if (!isOpen) return;
    setPage("transfer");
    setEmail("");
    setPoints("");
    setErrors({});
    void refreshBalance();
    void loadHistory(1);
  }, [isOpen, refreshBalance, loadHistory]);

  const handleTransfer = async () => {
    const trimmedEmail = email.trim();
    const amount = Math.floor(Number(points));

    // Inline validation — surfaced under the fields, not as toasts.
    const nextErrors: { email?: string; points?: string } = {};
    if (!trimmedEmail) {
      nextErrors.email = "Enter the recipient's email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!points.trim() || !Number.isFinite(amount) || amount <= 0) {
      nextErrors.points = "Enter a whole number of points greater than 0.";
    } else if (amount > balance) {
      nextErrors.points = "You don't have enough points for this transfer.";
    }
    if (nextErrors.email || nextErrors.points) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    setIsTransferring(true);
    try {
      const result = await transfer({
        recipientEmail: trimmedEmail,
        points: amount,
      });
      setBalance(result.balance);
      setEmail("");
      setPoints("");
      toast.success(
        `Transferred ${result.points} points to ${result.recipient.name}.`,
      );
      await loadHistory(1);
      if (updateSession) {
        await updateSession({ successPoints: result.balance });
      }
    } catch (err: unknown) {
      const e = err as {
        response?: {
          data?: { error?: { message?: string }; message?: string };
        };
        serverMessage?: string;
      };
      toast.error(
        e?.response?.data?.error?.message ||
          e?.response?.data?.message ||
          e?.serverMessage ||
          "Couldn't complete the transfer.",
      );
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Success Points"
      className="max-w-[760px] w-full mx-4 max-h-[90vh]"
    >
      <div className="-m-6 flex flex-col sm:flex-row min-h-[440px]">
        {/* ── Sidebar ─────────────────────────────────── */}
        <aside className="sm:w-60 shrink-0 bg-linear-to-b from-orange-50/80 to-white border-b sm:border-b-0 sm:border-r border-gray-100 p-5 flex flex-col gap-5">
          {/* Balance card */}
          <div className="rounded-2xl bg-linear-to-br from-[#F77124] to-[#f79a3d] p-4 text-white shadow-[0_6px_18px_rgba(247,113,36,0.35)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
              Available balance
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-3xl font-extrabold leading-none">
              <Star className="w-6 h-6 fill-white" />
              {balance}
            </p>
            <p className="mt-1 text-[11px] font-medium text-white/80">
              success points
            </p>
          </div>

          {/* Nav */}
          <nav className="flex sm:flex-col gap-1.5">
            {NAV.map((item) => {
              const active = page === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPage(item.id)}
                  className={cn(
                    "flex flex-1 sm:flex-none items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    active
                      ? "bg-white text-[#F77124] shadow-[0_2px_10px_rgba(247,113,36,0.12)] ring-1 ring-orange-100"
                      : "text-gray-500 hover:bg-white/70 hover:text-gray-900",
                  )}
                >
                  <span
                    className={cn(
                      "flex w-8 h-8 items-center justify-center rounded-lg shrink-0",
                      active
                        ? "bg-orange-100 text-[#F77124]"
                        : "bg-gray-100 text-gray-500",
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-tight">
                      {item.label}
                    </span>
                    <span className="block text-[11px] font-medium text-gray-400">
                      {item.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Content ─────────────────────────────────── */}
        <div className="flex-1 min-w-0 p-5 sm:p-6">
          {page === "transfer" ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">
                  Transfer points
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Send your success points to another student using their
                  email.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Recipient email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email)
                          setErrors((p) => ({ ...p, email: undefined }));
                      }}
                      placeholder="name@gmail.com"
                      disabled={isTransferring}
                      className={cn(
                        "w-full rounded-xl border pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 disabled:opacity-60",
                        errors.email
                          ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                          : "border-gray-300 focus:ring-orange-500/30 focus:border-orange-500",
                      )}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs font-medium text-red-500">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700">
                      Points to transfer
                    </label>
                    <button
                      type="button"
                      onClick={() => setPoints(String(balance))}
                      disabled={isTransferring || balance <= 0}
                      className="text-[11px] font-bold text-[#F77124] hover:underline disabled:text-gray-300 disabled:no-underline"
                    >
                      Use max ({balance})
                    </button>
                  </div>
                  <div className="relative">
                    <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F77124] fill-[#F77124]" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={points}
                      onChange={(e) => {
                        // Digits only — avoids the `type=number` ghost-text
                        // bug where React can't clear browser "bad input".
                        setPoints(e.target.value.replace(/[^0-9]/g, ""));
                        if (errors.points)
                          setErrors((p) => ({ ...p, points: undefined }));
                      }}
                      placeholder="0"
                      disabled={isTransferring}
                      className={cn(
                        "w-full rounded-xl border pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 disabled:opacity-60",
                        errors.points
                          ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                          : "border-gray-300 focus:ring-orange-500/30 focus:border-orange-500",
                      )}
                    />
                  </div>
                  {errors.points && (
                    <p className="mt-1 text-xs font-medium text-red-500">
                      {errors.points}
                    </p>
                  )}
                </div>

                <OrangeButton
                  onClick={handleTransfer}
                  disabled={isTransferring}
                  className="w-full text-sm font-bold py-2.5"
                >
                  {isTransferring ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isTransferring ? "Transferring…" : "Transfer Points"}
                </OrangeButton>

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Transfers are instant and can&apos;t be reversed. A failed
                  transfer never deducts your points.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">
                  History
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Points you&apos;ve earned, sent, and received.
                </p>
              </div>

              {isLoadingHistory ? (
                <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
                  <Clock className="mx-auto mb-2 w-7 h-7 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">
                    No activity yet
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Earned and transferred points will show up here.
                  </p>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 px-3">
                    {history.map((tx) => (
                      <li key={tx.transactionId}>
                        <HistoryRow tx={tx} />
                      </li>
                    ))}
                  </ul>
                  {historyTotalPages > 1 && (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Page {historyPage} of {historyTotalPages}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => loadHistory(historyPage - 1)}
                          disabled={historyPage <= 1 || isLoadingHistory}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" /> Prev
                        </button>
                        <button
                          type="button"
                          onClick={() => loadHistory(historyPage + 1)}
                          disabled={
                            historyPage >= historyTotalPages ||
                            isLoadingHistory
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
