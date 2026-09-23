"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { toast } from "react-toastify";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import Pagination from "@/components/admin/Pagination";
import { cn } from "@/lib/utils";
import useAuth from "@/hooks/useAuth";
import useCaApplications from "@/hooks/useCaApplications";
import type { CaApplicationRow, CaAttachOutcome, CaOwner } from "@/types/ca-application";
import CaLeadsTable from "./components/CaLeadsTable";
import CaLeadDrawer from "./components/CaLeadDrawer";
import ApproveCaModal from "./components/ApproveCaModal";
import DeclineCaModal from "./components/DeclineCaModal";
import CaLinkCard from "./components/CaLinkCard";

type Tab = "pending" | "approved";

const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved, not signed up" },
];

const OUTCOME_MESSAGE: Record<CaAttachOutcome, string> = {
  attached: "Approved. They're on the team.",
  "no-account": "Approved. They join the team when they sign up.",
  "not-student": "Approved, but that email belongs to a non-student account.",
  "other-owner": "Approved, but they're already on another team.",
  "retry-later": "Approved. Adding them to the team will be retried shortly.",
};

export default function CaLeadsPage() {
  const { user } = useAuth();
  const isOwner = user?.userType === "marketer" || user?.userType === "sales";
  const { list, owners: fetchOwners } = useCaApplications();

  const [status, setStatus] = useState<Tab>("pending");
  const [referrer, setReferrer] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<CaApplicationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [owners, setOwners] = useState<CaOwner[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<CaApplicationRow | null>(null);
  const [declineTarget, setDeclineTarget] = useState<CaApplicationRow | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await list({
        status,
        referrer: !isOwner && referrer ? referrer : undefined,
        q: debouncedSearch || undefined,
        page,
      });
      if (cancelled) return;
      setRows(data?.applications ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 1);
      // The last row on a page just got approved/declined away: step back
      // instead of leaving an empty page with no way back to the queue.
      if (data && page > 1 && page > data.totalPages) {
        setPage(data.totalPages);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [list, status, referrer, debouncedSearch, page, isOwner, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await list({ status: "pending", page: 1, limit: 1 });
      if (cancelled) return;
      setPendingTotal(data?.total ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [list, reloadKey]);

  useEffect(() => {
    if (isOwner) return;
    let cancelled = false;
    fetchOwners().then((result) => {
      if (!cancelled) setOwners(result ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [isOwner, fetchOwners]);

  const refresh = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  const closeAfterDecision = () => {
    setOpenId(null);
    setApproveTarget(null);
    setDeclineTarget(null);
    refresh();
  };

  return (
    <div className="w-full space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CA leads</h1>
          <p className="text-sm text-gray-600">
            {isOwner
              ? "People who applied through your CA link. Accept one and they join your team."
              : "Campus ambassador applications. Approving one emails their offer letter and adds them to a team."}
          </p>
        </div>
        <span className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-700">
          {pendingTotal} pending
        </span>
      </div>

      {isOwner ? <CaLinkCard /> : null}

      <div role="tablist" aria-label="Application status" className="flex gap-1 border-b border-gray-200">
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
              "-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition-colors",
              status === tab.key
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-600 hover:text-gray-900",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {!isOwner ? (
          <Select
            options={[
              { value: "", label: "All referrers" },
              { value: "direct", label: "Direct applications" },
              ...owners.map((o) => ({ value: o.userId, label: o.name })),
            ]}
            value={referrer}
            onChange={(v) => {
              setLoading(true);
              setReferrer(v);
              setPage(1);
            }}
            className="w-56"
          />
        ) : null}
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                setLoading(true);
                setDebouncedSearch(search);
                setPage(1);
              }
            }}
            placeholder="Search by email or phone"
            className="pl-9"
          />
        </div>
      </div>

      <CaLeadsTable
        rows={rows}
        loading={loading}
        status={status}
        isOwner={isOwner}
        onOpen={setOpenId}
        onApprove={setApproveTarget}
        onDecline={setDeclineTarget}
      />

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

      {openId ? (
        <CaLeadDrawer
          id={openId}
          isOwner={isOwner}
          owners={owners}
          suspended={Boolean(approveTarget || declineTarget)}
          onClose={() => setOpenId(null)}
          onApprove={setApproveTarget}
          onDecline={setDeclineTarget}
          onChanged={refresh}
        />
      ) : null}

      <ApproveCaModal
        key={approveTarget?.id ?? "none"}
        application={approveTarget}
        isOwner={isOwner}
        owners={owners}
        onClose={() => setApproveTarget(null)}
        onSuccess={(_application, outcome) => {
          toast.success(OUTCOME_MESSAGE[outcome]);
          closeAfterDecision();
        }}
        onFailed={refresh}
      />

      <DeclineCaModal
        application={declineTarget}
        onClose={() => setDeclineTarget(null)}
        onSuccess={closeAfterDecision}
        onFailed={refresh}
      />
    </div>
  );
}
