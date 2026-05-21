"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "react-toastify";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  IndianRupee,
  Loader2,
  Pencil,
  Receipt,
  Send,
  Sparkles,
  Wallet,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import useReferral from "@/hooks/useReferral";
import type {
  PaginatedReferral,
  ReferralOverview,
  ReferralRecentSaleRow,
  ReferralWithdrawalRow,
  ReferralWithdrawalStatus,
} from "@/types/referral";
import { cn } from "@/lib/utils";

type Tab = "overview" | "withdrawals" | "transactions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 10;
const MIN_WITHDRAWAL = 500;

function formatRupees(n: number): string {
  return `₹${(n ?? 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

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

function statusPillClass(status: ReferralWithdrawalStatus): string {
  switch (status) {
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

export default function ReferAndEarnModal({ isOpen, onClose }: Props) {
  const {
    getOverview,
    setUpi,
    listSales,
    listWithdrawals,
    requestWithdrawal,
  } = useReferral();

  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<ReferralOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  const refreshOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const data = await getOverview();
      setOverview(data);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ??
          "Could not load your referral details.",
      );
    } finally {
      setLoadingOverview(false);
    }
  }, [getOverview]);

  useEffect(() => {
    if (!isOpen) return;
    setTab("overview");
    void refreshOverview();
  }, [isOpen, refreshOverview]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Refer & Earn"
      className="max-w-2xl w-full mx-4 max-h-[90vh]"
    >
      {/* Tab strip */}
      <div className="mb-4 inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-100/80 p-1">
        {(["overview", "withdrawals", "transactions"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition",
              tab === t
                ? "bg-stone-900 text-amber-200 shadow-sm"
                : "text-stone-600 hover:text-stone-900",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewTab
          overview={overview}
          loading={loadingOverview}
          onRefresh={refreshOverview}
          setUpi={setUpi}
          requestWithdrawal={requestWithdrawal}
          onViewRequests={() => setTab("withdrawals")}
        />
      )}
      {tab === "withdrawals" && <WithdrawalsTab loadPage={listWithdrawals} />}
      {tab === "transactions" && <TransactionsTab loadPage={listSales} />}
    </Modal>
  );
}

// ─── Overview tab ───────────────────────────────────────────────────────────

function OverviewTab({
  overview,
  loading,
  onRefresh,
  setUpi,
  requestWithdrawal,
  onViewRequests,
}: {
  overview: ReferralOverview | null;
  loading: boolean;
  onRefresh: () => Promise<void>;
  setUpi: (upi: string) => Promise<void>;
  requestWithdrawal: (amount: number) => Promise<ReferralWithdrawalRow>;
  onViewRequests: () => void;
}) {
  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-stone-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }
  if (!overview) {
    return (
      <div className="py-12 text-center text-sm text-stone-500">
        Could not load referral details.
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <CodeAndBalanceBlock overview={overview} />
      <UpiInlineEdit
        currentUpi={overview.upiId}
        onSaved={onRefresh}
        setUpi={setUpi}
      />
      <RequestWithdrawalBlock
        overview={overview}
        requestWithdrawal={requestWithdrawal}
        onSuccess={async () => {
          await onRefresh();
          onViewRequests();
        }}
      />
      <TiersBlock overview={overview} />
    </div>
  );
}

function CodeAndBalanceBlock({ overview }: { overview: ReferralOverview }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(overview.code);
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="rounded-2xl border border-orange-200 bg-linear-to-br from-orange-50 to-amber-50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-900/70">
            Your referral code
          </p>
          <p className="mt-1 text-xl font-mono font-bold text-stone-900 tracking-widest">
            {overview.code}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-stone-800 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Available balance
          </p>
          <p className="mt-1 text-lg font-bold text-stone-900 flex items-center gap-1">
            <Wallet className="w-4 h-4 text-emerald-700" />
            {formatRupees(overview.availableBalance)}
          </p>
          {overview.heldOrPaid > 0 ? (
            <p className="text-[10px] text-stone-500 mt-0.5">
              {formatRupees(overview.heldOrPaid)} pending / paid
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Current tier
          </p>
          <p className="mt-1 text-lg font-bold text-stone-900 flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-violet-700" />
            {overview.currentTierPct}%
          </p>
          <p className="text-[10px] text-stone-500 mt-0.5">
            {overview.activeCount} sale
            {overview.activeCount === 1 ? "" : "s"} so far
          </p>
        </div>
      </div>
    </div>
  );
}

function UpiInlineEdit({
  currentUpi,
  setUpi,
  onSaved,
}: {
  currentUpi: string;
  setUpi: (upi: string) => Promise<void>;
  onSaved: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(!currentUpi);
  const [value, setValue] = useState(currentUpi);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(currentUpi);
    setEditing(!currentUpi);
  }, [currentUpi]);

  const handleSave = async () => {
    const upi = value.trim();
    if (!upi) {
      toast.error("UPI ID is required");
      return;
    }
    setSaving(true);
    try {
      await setUpi(upi);
      toast.success("UPI ID saved");
      setEditing(false);
      await onSaved();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ?? "Could not save UPI ID",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-semibold text-stone-900">Payout UPI</p>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 hover:underline"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        ) : null}
      </div>
      {!editing ? (
        currentUpi ? (
          <p className="mt-1 font-mono text-sm text-stone-700">{currentUpi}</p>
        ) : (
          <p className="mt-1 text-xs text-amber-800">
            Set your UPI ID — it&apos;s required to request a withdrawal.
          </p>
        )
      ) : (
        <div className="mt-2 flex gap-2 flex-wrap">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="name@bank"
            className="flex-1 min-w-[180px] rounded-lg border border-stone-300 px-3 py-2 text-sm font-mono"
            disabled={saving}
          />
          <OrangeButton
            onClick={() => void handleSave()}
            disabled={saving || !value.trim()}
            className="px-4"
          >
            {saving ? "Saving…" : "Save"}
          </OrangeButton>
          {currentUpi ? (
            <WhiteButton
              onClick={() => {
                setValue(currentUpi);
                setEditing(false);
              }}
              disabled={saving}
            >
              Cancel
            </WhiteButton>
          ) : null}
        </div>
      )}
    </div>
  );
}

function RequestWithdrawalBlock({
  overview,
  requestWithdrawal,
  onSuccess,
}: {
  overview: ReferralOverview;
  requestWithdrawal: (amount: number) => Promise<ReferralWithdrawalRow>;
  onSuccess: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canRequest =
    overview.availableBalance >= MIN_WITHDRAWAL && !!overview.upiId;
  const max = Math.floor(overview.availableBalance);

  const handleSubmit = async () => {
    const n = Math.floor(Number(amount));
    if (!Number.isFinite(n) || n < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ${formatRupees(MIN_WITHDRAWAL)}`);
      return;
    }
    if (n > max) {
      toast.error("Amount exceeds your available balance");
      return;
    }
    setSubmitting(true);
    try {
      await requestWithdrawal(n);
      toast.success("Withdrawal request submitted");
      setAmount("");
      setOpen(false);
      await onSuccess();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ?? "Could not submit request",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-stone-900">
            Request withdrawal
          </p>
          <p className="text-xs text-stone-500">
            Minimum {formatRupees(MIN_WITHDRAWAL)} · paid to your saved UPI.
          </p>
        </div>
        {!open ? (
          <OrangeButton
            onClick={() => setOpen(true)}
            disabled={!canRequest}
            className="px-4"
          >
            <Send className="w-3.5 h-3.5" /> Request
          </OrangeButton>
        ) : null}
      </div>
      {!canRequest && !open ? (
        <p className="mt-2 text-[11px] text-amber-800">
          {!overview.upiId
            ? "Set your UPI ID above before requesting a withdrawal."
            : `You need at least ${formatRupees(MIN_WITHDRAWAL)} available to withdraw.`}
        </p>
      ) : null}
      {open ? (
        <div className="mt-3 space-y-2">
          <label className="block text-xs font-semibold text-stone-700">
            Amount (₹)
          </label>
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[150px]">
              <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                type="number"
                min={MIN_WITHDRAWAL}
                max={max}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`${MIN_WITHDRAWAL}`}
                className="w-full rounded-lg border border-stone-300 pl-7 pr-3 py-2 text-sm"
                disabled={submitting}
              />
            </div>
            <OrangeButton
              onClick={() => void handleSubmit()}
              disabled={submitting}
              className="px-4"
            >
              {submitting ? "Submitting…" : "Submit"}
            </OrangeButton>
            <WhiteButton
              onClick={() => {
                setOpen(false);
                setAmount("");
              }}
              disabled={submitting}
            >
              Cancel
            </WhiteButton>
          </div>
          <p className="text-[11px] text-stone-500">
            Up to {formatRupees(max)} available · paid to{" "}
            <span className="font-mono">{overview.upiId}</span>.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function TiersBlock({ overview }: { overview: ReferralOverview }) {
  if (overview.tiers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-4 text-center">
        <p className="text-xs text-stone-500">
          No commission tiers are configured yet. Check back after the admin
          sets them up.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <p className="text-sm font-semibold text-stone-900 mb-2">
        Commission tiers
      </p>
      <div className="max-h-40 overflow-y-auto pr-1 divide-y divide-stone-100">
        {overview.tiers.map((t) => {
          const active = overview.activeCount >= t.thresholdSales;
          return (
            <div
              key={t.thresholdSales}
              className={cn(
                "flex items-center justify-between py-2 text-sm",
                active && "text-stone-900",
              )}
            >
              <span>
                {t.thresholdSales}+ sale
                {t.thresholdSales === 1 ? "" : "s"}
              </span>
              <span
                className={cn(
                  "font-mono font-semibold",
                  active ? "text-emerald-700" : "text-stone-500",
                )}
              >
                {t.commissionPercent}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Withdrawals tab ────────────────────────────────────────────────────────

function WithdrawalsTab({
  loadPage,
}: {
  loadPage: (
    page: number,
    limit: number,
  ) => Promise<PaginatedReferral<ReferralWithdrawalRow>>;
}) {
  return (
    <PaginatedListPanel<ReferralWithdrawalRow>
      loadPage={loadPage}
      emptyTitle="No withdrawal requests yet"
      emptyDescription="Submit a request from the Overview tab once your balance reaches ₹500."
      renderRow={(r) => (
        <div className="flex items-center justify-between gap-3 py-3 text-sm">
          <div className="min-w-0">
            <p className="font-semibold text-stone-900">
              {formatRupees(r.amount)}
            </p>
            <p className="text-xs text-stone-500 truncate">
              {r.upiIdSnapshot} · requested {formatDateTime(r.createdAt)}
            </p>
            {r.decidedAt ? (
              <p className="text-[11px] text-stone-400">
                Decided {formatDateTime(r.decidedAt)}
              </p>
            ) : null}
            {r.notes ? (
              <p className="text-[11px] text-stone-500 italic mt-0.5">
                “{r.notes}”
              </p>
            ) : null}
          </div>
          <span
            className={cn(
              "shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
              statusPillClass(r.status),
            )}
          >
            {r.status}
          </span>
        </div>
      )}
    />
  );
}

// ─── Transactions tab ───────────────────────────────────────────────────────

function TransactionsTab({
  loadPage,
}: {
  loadPage: (
    page: number,
    limit: number,
  ) => Promise<PaginatedReferral<ReferralRecentSaleRow>>;
}) {
  return (
    <PaginatedListPanel<ReferralRecentSaleRow>
      loadPage={loadPage}
      emptyTitle="No commission earned yet"
      emptyDescription="Your share starts as soon as someone buys a course with your code."
      renderRow={(s) => (
        <div className="flex items-center gap-3 py-3 text-sm">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-stone-900 truncate">
              {s.courseName || "Course"}
            </p>
            <p className="text-xs text-stone-500 truncate">
              {s.buyerName || "Buyer"} · {formatDateTime(s.createdAt)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p
              className={cn(
                "font-semibold",
                s.status === "active"
                  ? "text-emerald-700"
                  : "text-stone-400 line-through",
              )}
            >
              +{formatRupees(s.commission)}
            </p>
            <p className="text-[11px] text-stone-400">on {formatRupees(s.amount)}</p>
          </div>
        </div>
      )}
    />
  );
}

// ─── Shared paginated list panel ────────────────────────────────────────────

function PaginatedListPanel<T extends { _id: string }>({
  loadPage,
  renderRow,
  emptyTitle,
  emptyDescription,
}: {
  loadPage: (page: number, limit: number) => Promise<PaginatedReferral<T>>;
  renderRow: (row: T) => React.ReactNode;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedReferral<T> | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await loadPage(page, PAGE_SIZE);
      setData(res);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ?? "Could not load the list.",
      );
    } finally {
      setLoading(false);
    }
  }, [loadPage, page]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const pageCount = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, data.totalPages);
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-stone-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 py-12 px-4 text-center">
        <Receipt className="mx-auto mb-2 w-7 h-7 text-stone-300" />
        <p className="font-medium text-stone-700">{emptyTitle}</p>
        <p className="mt-1 text-xs text-stone-500">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="max-h-[60vh] overflow-y-auto divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white px-3">
        {data.items.map((row) => (
          <li key={row._id}>{renderRow(row)}</li>
        ))}
      </ul>
      <div className="flex items-center justify-between text-xs text-stone-500">
        <span>
          Showing {(data.page - 1) * PAGE_SIZE + 1}–
          {Math.min(data.total, data.page * PAGE_SIZE)} of {data.total}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2 py-1 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </button>
          <span className="px-2 font-medium text-stone-700">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page >= pageCount || loading}
            className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2 py-1 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
