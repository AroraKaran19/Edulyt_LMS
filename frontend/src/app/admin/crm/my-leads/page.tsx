"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, Phone } from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { formatStoredPhone } from "@/lib/phone";
import Select from "@/components/ui/inputs/Select";
import Pagination from "@/components/admin/Pagination";
import useCrm from "@/hooks/useCrm";
import LeadDetailsModal from "../../leads/LeadDetailsModal";
import { type Lead } from "../../leads/types";
import {
  LEAD_STAGES,
  leadPipelineLabel,
  subStatusesFor,
  type LeadStage,
} from "@/constants/leadPipeline";
import BrandMark from "@/components/admin/BrandMark";

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function MyLeadsPage() {
  const { listMyAssignedLeads } = useCrm();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [status, setStatus] = useState("");
  const [subStatus, setSubStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  // Rows whose stage has been picked but whose sub-status has not. Nothing is
  // written until both halves are chosen.
  const [pendingStage, setPendingStage] = useState<Record<string, LeadStage>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const data = await listMyAssignedLeads(page, 20, status, subStatus);
    setLeads(data.leads ?? []);
    setTotalPages(data.totalPages ?? 1);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [listMyAssignedLeads, page, status, subStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = async (
    lead: Lead,
    nextStage: LeadStage,
    nextSubStatus: string,
  ) => {
    setSavingId(lead._id);
    try {
      // Not the admin route: sales sits outside `adminGuard`, so posting there
      // was a guaranteed 403.
      const res = await apiClient.patch(`/leads/mine/${lead._id}`, {
        status: nextStage,
        subStatus: nextSubStatus,
      });
      const updated: Lead = res.data?.data?.lead;
      setLeads((prev) =>
        prev.map((l) => (l._id === lead._id ? { ...l, ...updated } : l)),
      );
      toast.success(`Marked ${leadPipelineLabel(nextStage, nextSubStatus)}`);
    } catch (e) {
      const err = e as {
        response?: { data?: { message?: string; error?: { message?: string } } };
      };
      toast.error(
        err?.response?.data?.error?.message ??
          err?.response?.data?.message ??
          "Could not update this lead",
      );
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

      <div className="flex flex-wrap items-center gap-2.5">
        <Select
          options={[{ value: "", label: "All stages" }, ...LEAD_STAGES]}
          value={status}
          onChange={(v) => {
            setStatus(v);
            // Two stages share sub-status values, so the old one would filter
            // for something that now means something else.
            setSubStatus("");
            setPage(1);
          }}
          className="w-44"
        />
        {status && (
          <Select
            options={[
              { value: "", label: "All sub-statuses" },
              ...subStatusesFor(status),
            ]}
            value={subStatus}
            onChange={(v) => {
              setSubStatus(v);
              setPage(1);
            }}
            className="w-52"
          />
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3">Lead</th>
                <th className="px-5 py-3">Brand</th>
                <th className="px-5 py-3">College</th>
                <th className="px-5 py-3">Received</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-gray-400" />
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                    Nothing assigned to you yet.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead._id}>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setOpenLeadId(lead._id)}
                        className="text-left font-medium text-gray-900 hover:text-orange-600 hover:underline"
                      >
                        {lead.name}
                      </button>
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
                        {formatStoredPhone(lead.phone)}
                      </a>
                    </td>
                    <td className="px-5 py-3">
                      <BrandMark brand={lead.source?.brand ?? "airkrit"} />
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {lead.collegeName ?? "-"}
                      {lead.state ? (
                        <div className="text-xs text-gray-500">{lead.state}</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-gray-500">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Select
                          dropdownPortal
                          options={LEAD_STAGES}
                          value={pendingStage[lead._id] ?? lead.status}
                          disabled={savingId === lead._id}
                          onChange={(v) => {
                            const next = v as LeadStage;
                            const only = subStatusesFor(next);
                            // A stage with one sub-status has nothing to ask.
                            if (only.length === 1) {
                              setPendingStage((prev) => {
                                const rest = { ...prev };
                                delete rest[lead._id];
                                return rest;
                              });
                              void changeStatus(lead, next, only[0].value);
                              return;
                            }
                            setPendingStage((prev) => ({
                              ...prev,
                              [lead._id]: next,
                            }));
                          }}
                          className="w-40"
                        />
                        <Select
                          dropdownPortal
                          options={subStatusesFor(
                            pendingStage[lead._id] ?? lead.status,
                          )}
                          // Blank while a new stage is pending: the stored
                          // sub-status belongs to the stage it was set under.
                          value={
                            pendingStage[lead._id] ? "" : (lead.subStatus ?? "")
                          }
                          placeholder="Choose..."
                          disabled={savingId === lead._id}
                          onChange={(v) => {
                            const stage = pendingStage[lead._id] ?? lead.status;
                            setPendingStage((prev) => {
                              const rest = { ...prev };
                              delete rest[lead._id];
                              return rest;
                            });
                            void changeStatus(lead, stage, v);
                          }}
                          className="w-48"
                        />
                      </div>
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

      {openLeadId ? (
        <LeadDetailsModal
          leadId={openLeadId}
          scope="mine"
          onClose={() => setOpenLeadId(null)}
          onUpdated={(updated) =>
            setLeads((prev) =>
              prev.map((l) => (l._id === updated._id ? { ...l, ...updated } : l)),
            )
          }
        />
      ) : null}
    </div>
  );
}
