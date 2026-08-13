"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  CircleSlash,
  Loader2,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import useAuth from "@/hooks/useAuth";
import Input from "@/components/ui/inputs/Input";
import Select from "@/components/ui/inputs/Select";
import Pagination from "@/components/admin/Pagination";
import LeadDetailsModal from "./LeadDetailsModal";
import {
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  STATUS_STYLES,
  type Lead,
} from "./types";

const PAGE_SIZE = 20;

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const answerFor = (lead: Lead, key: string) =>
  lead.answers.find((a) => a.key === key)?.value ?? "—";

export default function LeadsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.userType === "super-admin";
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
  }, [page, debouncedSearch, status]);

  useEffect(() => {
    load();
  }, [load]);

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
            Everyone who filled an enquiry form, newest first.
          </p>
        </div>
        <span className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-700">
          {total} total
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or phone"
            className="pl-9"
          />
        </div>
        <Select
          options={[{ value: "", label: "All statuses" }, ...LEAD_STATUSES]}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          className="min-w-[160px]"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                <th className="px-4 py-3 sm:px-6">Lead</th>
                <th className="px-4 py-3 sm:px-6">Plan</th>
                <th className="px-4 py-3 sm:px-6">Career stage</th>
                <th className="px-4 py-3 sm:px-6">On platform</th>
                <th className="px-4 py-3 sm:px-6">Status</th>
                <th className="px-4 py-3 sm:px-6">Received</th>
                {isSuperAdmin ? <th className="px-4 py-3 sm:px-6" /> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : 6} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-gray-400" />
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : 6} className="px-6 py-12 text-center">
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
                    <td className="min-w-[220px] px-4 py-4 sm:px-6">
                      <div className="text-sm font-medium text-gray-900">
                        {lead.name}
                      </div>
                      <div className="text-xs text-gray-500">{lead.email}</div>
                      <div className="text-xs text-gray-500">
                        +91 {lead.phone}
                      </div>
                    </td>
                    <td className="min-w-[150px] px-4 py-4 text-sm text-gray-900 sm:px-6">
                      {answerFor(lead, "plan")}
                    </td>
                    <td className="min-w-[150px] px-4 py-4 text-sm text-gray-700 sm:px-6">
                      {answerFor(lead, "careerStage")}
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      {lead.emailOnPlatform === true ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
                          <BadgeCheck className="size-4" />
                          Yes
                        </span>
                      ) : lead.emailOnPlatform === false ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                          <CircleSlash className="size-4" />
                          No
                        </span>
                      ) : (
                        <span className="text-sm text-amber-600">Checking</span>
                      )}
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[lead.status]}`}
                      >
                        {
                          LEAD_STATUSES.find((s) => s.value === lead.status)
                            ?.label
                        }
                      </span>
                      <div className="mt-1 text-xs text-gray-400">
                        {LEAD_SOURCE_LABELS[lead.source] ?? lead.source}
                      </div>
                    </td>
                    <td className="min-w-[150px] px-4 py-4 text-sm whitespace-nowrap text-gray-500 sm:px-6">
                      {formatDate(lead.createdAt)}
                    </td>
                    {isSuperAdmin ? (
                      <td className="px-4 py-4 sm:px-6">
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
