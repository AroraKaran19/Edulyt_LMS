"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { Search } from "lucide-react";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import Pagination from "@/components/admin/Pagination";
import { cn } from "@/lib/utils";
import useAuth from "@/hooks/useAuth";
import useCaApplications from "@/hooks/useCaApplications";
import type { CaDirectoryRow, CaDirectoryState, CaOwner } from "@/types/ca-application";
import { AMBASSADOR_KIND_LABELS, type AmbassadorKind } from "@/hooks/useCrm";
import CasTable from "./components/CasTable";
import CaLeadDrawer from "../ca-leads/components/CaLeadDrawer";

const KIND_OPTIONS: { value: AmbassadorKind | ""; label: string }[] = [
  { value: "", label: "All kinds" },
  { value: "marketing", label: AMBASSADOR_KIND_LABELS.marketing },
  { value: "social-media", label: AMBASSADOR_KIND_LABELS["social-media"] },
];

export default function AllCasPage() {
  const { user } = useAuth();
  const isOwner = user?.userType === "marketer" || user?.userType === "sales";
  const { listDirectory, owners: fetchOwners } = useCaApplications();

  const [state, setState] = useState<CaDirectoryState>("active");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [kind, setKind] = useState<AmbassadorKind | "">("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<CaDirectoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ active: 0, ended: 0 });
  const [loading, setLoading] = useState(true);
  const [owners, setOwners] = useState<CaOwner[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
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
      const data = await listDirectory({
        state,
        search: debouncedSearch || undefined,
        ownerUserId: !isOwner && ownerUserId ? ownerUserId : undefined,
        kind: kind || undefined,
        page,
      });
      if (cancelled) return;
      setRows(data?.rows ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 1);
      if (data?.counts) setCounts(data.counts);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [listDirectory, state, ownerUserId, kind, debouncedSearch, page, isOwner, reloadKey]);

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

  const TABS: { key: CaDirectoryState; label: string }[] = [
    { key: "active", label: `Active (${counts.active})` },
    { key: "ended", label: `Ended (${counts.ended})` },
    { key: "all", label: "All" },
  ];

  return (
    <div className="w-full space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All CAs</h1>
          <p className="text-sm text-gray-600">Every campus ambassador, past and present.</p>
        </div>
      </div>

      <div role="tablist" aria-label="Tenure state" className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={state === tab.key}
            onClick={() => {
              setLoading(true);
              setState(tab.key);
              setPage(1);
            }}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition-colors",
              state === tab.key
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
            options={[{ value: "", label: "All teams" }, ...owners.map((o) => ({ value: o.userId, label: o.name }))]}
            value={ownerUserId}
            onChange={(v) => {
              setLoading(true);
              setOwnerUserId(v);
              setPage(1);
            }}
            className="w-56"
          />
        ) : null}
        <Select
          options={KIND_OPTIONS}
          value={kind}
          onChange={(v) => {
            setLoading(true);
            setKind(v as AmbassadorKind | "");
            setPage(1);
          }}
          className="w-56"
        />
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
            placeholder="Search by name, email or intern ID"
            className="pl-9"
          />
        </div>
      </div>

      <CasTable rows={rows} loading={loading} isOwner={isOwner} onOpen={setOpenId} />

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
          onClose={() => setOpenId(null)}
          onApprove={() => {}}
          onDecline={() => {}}
          onChanged={() => {
            setLoading(true);
            setReloadKey((k) => k + 1);
          }}
        />
      ) : null}
    </div>
  );
}
