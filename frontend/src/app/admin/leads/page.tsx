"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  CircleSlash,
  Loader2,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { formatStoredPhone } from "@/lib/phone";
import useAuth from "@/hooks/useAuth";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import Pagination from "@/components/admin/Pagination";
import { STATE_SELECT_OPTIONS } from "@/constants/indianStates";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { InfiniteScrollSelect } from "@/components/ui/dropdown/InfiniteScrollSelect";
import useCrm from "@/hooks/useCrm";
import LeadDetailsModal from "./LeadDetailsModal";
import AssignLeadsModal from "./AssignLeadsModal";
import LeadContextCell from "./LeadContextCell";
import BrandMark from "@/components/admin/BrandMark";
import { BRANDS, BRAND_LABEL } from "@/constants/brands";
import {
  LEAD_SOURCE_LABELS,
  LEAD_SOURCE_OPTIONS,
  type Lead,
  type LeadCampaignOption,
} from "./types";
import useLeadPipeline from "@/hooks/useLeadPipeline";
import {
  stageLabel,
  stageOptions,
  stageStyle,
  subStatusLabel,
  subStatusOptions,
} from "@/lib/leadPipeline";

const PAGE_SIZE = 20;

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function LeadsPage() {
  const { user } = useAuth();
  const { fetchAssignees } = useCrm();
  const isSuperAdmin = user?.userType === "super-admin";
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { pipeline } = useLeadPipeline();
  const [status, setStatus] = useState("");
  const [subStatus, setSubStatus] = useState("");
  const [brand, setBrand] = useState("");
  const [source, setSource] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [campaigns, setCampaigns] = useState<LeadCampaignOption[]>([]);
  const [state, setState] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigneeLabel, setAssigneeLabel] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/leads/admin", {
        params: {
          page,
          limit: PAGE_SIZE,
          search: debouncedSearch || undefined,
          status: status || undefined,
          subStatus: subStatus || undefined,
          brand: brand || undefined,
          source: source || undefined,
          campaignId: campaignId || undefined,
          state: state || undefined,
          assignedTo: assignedTo || undefined,
        },
      });
      const data = res.data?.data;
      setLeads(data?.leads ?? []);
      setTotalPages(data?.totalPages ?? 1);
      setTotal(data?.total ?? 0);
    } catch {
      toast.error("Could not load leads");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    debouncedSearch,
    status,
    subStatus,
    brand,
    source,
    campaignId,
    state,
    assignedTo,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  // Only the campaigns that actually produced leads, so the filter never offers
  // a dead end. Loaded once: the list changes when a campaign launches, not
  // while someone is working the pool.
  useEffect(() => {
    apiClient
      .get("/leads/admin/campaigns")
      .then((res) => setCampaigns(res.data?.data?.campaigns ?? []))
      .catch(() => setCampaigns([]));
  }, []);

  /** "Any" and "Unassigned" head page 1; a search returns only real people. */
  const fetchAssigneesWithAll = async (page: number, search: string) => {
    const result = await fetchAssignees(page, search);
    if (page === 1 && !search.trim()) {
      return {
        ...result,
        items: [
          { value: "", label: "Any assignee" },
          { value: "unassigned", label: "Unassigned" },
          ...result.items,
        ],
      };
    }
    return result;
  };

  const assignSelected = async (
    assigneeId: string | null,
    resetStatus: boolean,
  ) => {
    setAssigning(true);
    try {
      await apiClient.post("/leads/admin/assign", {
        leadIds: selected,
        assigneeId,
        resetStatus,
      });
      const n = selected.length;
      toast.success(
        assigneeId
          ? `Assigned ${n} lead${n === 1 ? "" : "s"}`
          : `Unassigned ${n} lead${n === 1 ? "" : "s"}`
      );
      setSelected([]);
      setAssignOpen(false);
      await load();
    } catch {
      toast.error("Could not assign these leads");
    } finally {
      setAssigning(false);
    }
  };

  const removeSelected = async () => {
    const n = selected.length;
    if (!confirm(`Delete ${n} lead${n === 1 ? "" : "s"}? This cannot be undone.`)) {
      return;
    }
    setBulkDeleting(true);
    try {
      const res = await apiClient.post("/leads/admin/delete", { leadIds: selected });
      const deleted: number = res.data?.data?.deleted ?? n;
      toast.success(`Deleted ${deleted} lead${deleted === 1 ? "" : "s"}`);
      setSelected([]);
      await load();
    } catch {
      toast.error("Could not delete these leads");
    } finally {
      setBulkDeleting(false);
    }
  };

  const removeLead = async (lead: Lead) => {
    if (!confirm(`Delete the lead from ${lead.name}? This cannot be undone.`)) {
      return;
    }
    setDeletingId(lead._id);
    try {
      await apiClient.delete(`/leads/admin/${lead._id}`);
      setLeads((prev) => prev.filter((l) => l._id !== lead._id));
      setTotal((prev) => Math.max(0, prev - 1));
      toast.success("Lead deleted");
    } catch {
      toast.error("Could not delete this lead");
    } finally {
      setDeletingId(null);
    }
  };

  const applyUpdate = (updated: Lead) => {
    setLeads((prev) =>
      prev.map((l) => (l._id === updated._id ? { ...l, ...updated } : l))
    );
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500">
            Enquiry forms and scholarship campaigns, newest first.
          </p>
        </div>
        <span className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-700">
          {total} total
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or phone"
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: "", label: "All stages" },
            // Retired stages are included: leads still sit on them.
            ...stageOptions(pipeline, true),
          ]}
          value={status}
          onChange={(value) => {
            setStatus(value);
            // The old sub-status belongs to the old stage, and two stages share
            // some values, so keeping it would silently filter for the wrong one.
            setSubStatus("");
            setPage(1);
          }}
          className="w-44"
        />
        {status && (
          <Select
            options={[
              { value: "", label: "All sub-statuses" },
              ...subStatusOptions(pipeline, status, true),
            ]}
            value={subStatus}
            onChange={(value) => {
              setSubStatus(value);
              setPage(1);
            }}
            className="w-52"
          />
        )}
        <Select
          options={[
            { value: "", label: "All brands" },
            ...BRANDS.map((b) => ({ value: b, label: BRAND_LABEL[b] })),
          ]}
          value={brand}
          onChange={(value) => {
            setBrand(value);
            setPage(1);
          }}
          className="w-36"
        />
        <Select
          options={LEAD_SOURCE_OPTIONS}
          value={source}
          onChange={(value) => {
            setSource(value);
            // A campaign filter is meaningless once the pool is enquiry-only.
            if (value === "enquiry") setCampaignId("");
            setPage(1);
          }}
          className="w-44"
        />
        {source !== "enquiry" && campaigns.length > 0 ? (
          <Select
            searchable
            options={[
              { value: "", label: "All campaigns" },
              ...campaigns.map((c) => ({
                value: c.testId,
                label: `${c.title} (${c.leads})`,
              })),
            ]}
            value={campaignId}
            onChange={(value) => {
              setCampaignId(value);
              setPage(1);
            }}
            searchPlaceholder="Search campaigns..."
            className="w-52"
          />
        ) : null}
        <Select
          searchable
          options={[{ value: "", label: "All states" }, ...STATE_SELECT_OPTIONS]}
          value={state}
          onChange={(value) => {
            setState(value);
            setPage(1);
          }}
          searchPlaceholder="Search states..."
          className="w-44"
        />
        <InfiniteScrollSelect
          value={assignedTo}
          onChange={(v) => {
            const next = String(v);
            setAssignedTo(next);
            setAssigneeLabel(
              next === "" ? "" : next === "unassigned" ? "Unassigned" : "",
            );
            setPage(1);
          }}
          fetchOptions={fetchAssigneesWithAll}
          selectedLabel={assigneeLabel || undefined}
          placeholder="Any assignee"
          searchPlaceholder="Search sales..."
          emptyMessage="No sales users found"
          dropdownPortal
          className="w-44"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-600">
          {selected.length > 0
            ? `${selected.length} selected`
            : "Tick leads to assign them"}
        </span>
        <OrangeButton
          glow={false}
          disabled={selected.length === 0}
          onClick={() => setAssignOpen(true)}
        >
          <UserCheck className="mr-2 size-4" />
          Assign
        </OrangeButton>
        {isSuperAdmin && selected.length > 0 ? (
          <WhiteButton
            type="button"
            glow={false}
            disabled={bulkDeleting}
            onClick={() => void removeSelected()}
            className="text-red-600 hover:text-red-700"
          >
            {bulkDeleting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 size-4" />
            )}
            Delete
          </WhiteButton>
        ) : null}
        {selected.length > 0 ? (
          <button
            type="button"
            onClick={() => setSelected([])}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-gray-50">
              <tr className="text-left text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                <th className="w-10 px-3 py-2.5 sm:px-4">
                  <input
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={
                      leads.length > 0 && selected.length === leads.length
                    }
                    onChange={(e) =>
                      setSelected(e.target.checked ? leads.map((l) => l._id) : [])
                    }
                    className="size-4 rounded border-gray-300 text-orange-600"
                  />
                </th>
                <th className="px-3 py-2.5 sm:px-4">Lead</th>
                <th className="px-3 py-2.5 sm:px-4">Plan or campaign</th>
                <th className="px-3 py-2.5 sm:px-4">Creator</th>
                <th className="px-3 py-2.5 sm:px-4">Assignee</th>
                <th className="px-3 py-2.5 sm:px-4">On platform</th>
                <th className="px-3 py-2.5 sm:px-4">Status</th>
                <th className="px-3 py-2.5 sm:px-4">Received</th>
                {isSuperAdmin ? <th className="px-3 py-2.5 sm:px-4" /> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 9 : 8} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-gray-400" />
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 9 : 8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <UserPlus className="size-10 text-gray-300" />
                      <p className="font-medium text-gray-500">No leads yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead._id}
                    onClick={() => setOpenLeadId(lead._id)}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td
                      className="px-3 py-2.5 sm:px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select lead from ${lead.name}`}
                        checked={selected.includes(lead._id)}
                        onChange={(e) =>
                          setSelected((prev) =>
                            e.target.checked
                              ? [...prev, lead._id]
                              : prev.filter((id) => id !== lead._id)
                          )
                        }
                        className="size-4 rounded border-gray-300 text-orange-600"
                      />
                    </td>
                    <td className="min-w-[220px] px-3 py-2.5 sm:px-4">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-medium text-gray-900">
                          {lead.name}
                        </span>
                        <BrandMark brand={lead.source?.brand ?? "airkrit"} />
                      </div>
                      <div className="text-[11px] text-gray-500">{lead.email}</div>
                      <div className="text-[11px] text-gray-500">
                        {formatStoredPhone(lead.phone)}
                      </div>
                      {(lead.duplicateEmailCount ?? 1) > 1 ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearch(lead.email);
                          }}
                          className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 hover:bg-amber-200"
                        >
                          {(lead.duplicateEmailCount ?? 1) - 1} other
                          {(lead.duplicateEmailCount ?? 1) - 1 === 1 ? "" : "s"}
                        </button>
                      ) : null}
                    </td>
                    <td className="min-w-[190px] px-3 py-2.5 sm:px-4">
                      <LeadContextCell lead={lead} />
                    </td>
                    <td className="min-w-[150px] px-3 py-2.5 sm:px-4">
                      {lead.creator ? (
                        <>
                          <div className="text-gray-900">
                            {lead.creator.name || "Unnamed"}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {lead.creator.code} · {lead.creator.role}
                          </div>
                        </>
                      ) : lead.source?.campaignOwnerName ? (
                        // No `?ref=` code, but a campaign lead is never really
                        // direct: whoever ran the campaign brought them in.
                        <>
                          <div className="text-gray-900">
                            {lead.source.campaignOwnerName}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            ran the campaign
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400">Direct</span>
                      )}
                    </td>
                    <td className="min-w-[150px] px-3 py-2.5 sm:px-4">
                      {lead.assignedTo?.userId ? (
                        <span className="text-gray-900">
                          {lead.assignedTo.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 sm:px-4">
                      {lead.emailOnPlatform === true ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-green-700">
                          <BadgeCheck className="size-4" />
                          Yes
                        </span>
                      ) : lead.emailOnPlatform === false ? (
                        <span className="inline-flex items-center gap-1.5 text-gray-500">
                          <CircleSlash className="size-4" />
                          No
                        </span>
                      ) : (
                        <span className="text-amber-600">Checking</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 sm:px-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${stageStyle(pipeline, lead.status)}`}
                      >
                        {stageLabel(pipeline, lead.status)}
                      </span>
                      <div className="mt-0.5 text-[11px] text-gray-600">
                        {subStatusLabel(pipeline, lead.status, lead.subStatus)}
                      </div>
                      <div className="mt-0.5 text-[11px] text-gray-400">
                        {LEAD_SOURCE_LABELS[lead.source?.kind] ?? lead.source?.kind}
                      </div>
                    </td>
                    <td className="min-w-[150px] px-3 py-2.5 whitespace-nowrap text-gray-500 sm:px-4">
                      {formatDate(lead.createdAt)}
                    </td>
                    {isSuperAdmin ? (
                      <td className="px-3 py-2.5 sm:px-4">
                        <button
                          type="button"
                          aria-label={`Delete lead from ${lead.name}`}
                          disabled={deletingId === lead._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLead(lead);
                          }}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          {deletingId === lead._id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="border-t border-gray-200 px-4 py-3 sm:px-6">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={loading}
            />
          </div>
        ) : null}
      </div>

      {assignOpen ? (
        <AssignLeadsModal
          count={selected.length}
          fetchAssignees={fetchAssignees}
          saving={assigning}
          onClose={() => setAssignOpen(false)}
          onConfirm={assignSelected}
        />
      ) : null}

      {openLeadId ? (
        <LeadDetailsModal
          leadId={openLeadId}
          onClose={() => setOpenLeadId(null)}
          onUpdated={applyUpdate}
          onDeleted={(id) => {
            setLeads((prev) => prev.filter((l) => l._id !== id));
            setTotal((prev) => Math.max(0, prev - 1));
          }}
        />
      ) : null}

    </div>
  );
}
