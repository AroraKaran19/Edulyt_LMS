"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, Phone } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import Select from "@/components/ui/inputs/Select";
import Pagination from "@/components/admin/Pagination";
import useCrm from "@/hooks/useCrm";
import {
  LEAD_STATUSES,
  type Lead,
  type LeadStatus,
} from "../../leads/types";

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function MyLeadsPage() {
  const { listMyAssignedLeads } = useCrm();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await listMyAssignedLeads(page, 20, status);
    setLeads(data.leads ?? []);
    setTotalPages(data.totalPages ?? 1);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [listMyAssignedLeads, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = async (lead: Lead, next: LeadStatus) => {
    setSavingId(lead._id);
    try {
      const res = await apiClient.patch(`/leads/admin/${lead._id}`, {
        status: next,
      });
      const updated: Lead = res.data?.data?.lead;
      setLeads((prev) =>
        prev.map((l) => (l._id === lead._id ? { ...l, ...updated } : l)),
      );
      toast.success(`Marked ${next}`);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Could not update this lead");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="w-full space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My leads</h1>
          <p className="text-sm text-gray-600">
            Leads assigned to you. Only an admin can reassign them.
          </p>
        </div>
        <span className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-700">
          {total} assigned
        </span>
      </div>

      <Select
        options={[{ value: "", label: "All statuses" }, ...LEAD_STATUSES]}
        value={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        className="w-44"
      />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3">Lead</th>
                <th className="px-5 py-3">College</th>
                <th className="px-5 py-3">Received</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-gray-400" />
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-gray-500">
                    Nothing assigned to you yet.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead._id}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">
                        {lead.name}
                      </div>
                      <a
                        href={`mailto:${lead.email}`}
                        className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-600"
                      >
                        <Mail className="size-3" />
                        {lead.email}
                      </a>
                      <a
                        href={`tel:+91${lead.phone}`}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-600"
                      >
                        <Phone className="size-3" />
                        +91 {lead.phone}
                      </a>
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {lead.collegeName ?? "—"}
                      {lead.state ? (
                        <div className="text-xs text-gray-500">{lead.state}</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-gray-500">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <Select
                        dropdownPortal
                        options={LEAD_STATUSES}
                        value={lead.status}
                        disabled={savingId === lead._id}
                        onChange={(v) => changeStatus(lead, v as LeadStatus)}
                        className="w-40"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 ? (
          <div className="border-t border-gray-200 px-5 py-3">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={loading}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
