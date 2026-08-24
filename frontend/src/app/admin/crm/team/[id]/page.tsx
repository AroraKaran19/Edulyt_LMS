"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Mail, Phone } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import Pagination from "@/components/admin/Pagination";
import LeadDetailsModal from "../../../leads/LeadDetailsModal";
import {
  LEAD_STATUSES,
  STATUS_STYLES,
  type Lead,
} from "../../../leads/types";

type Scope = "generated" | "team" | "assigned" | "converted";

const SCOPES: { value: Scope; label: string; hint: string }[] = [
  { value: "generated", label: "Generated", hint: "From their own link" },
  { value: "team", label: "Team", hint: "From their ambassadors' links" },
  { value: "assigned", label: "Assigned", hint: "Currently theirs to work" },
  { value: "converted", label: "Converted", hint: "They closed these" },
];

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function CrmPersonPage() {
  const params = useParams();
  const id = String(params?.id ?? "");

  const [scope, setScope] = useState<Scope>("generated");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(`/crm/people/${id}/leads`, {
          params: { scope, page, limit: 20 },
        });
        if (cancelled) return;
        const data = res.data?.data;
        setLeads(data?.leads ?? []);
        setTotalPages(data?.totalPages ?? 1);
        setTotal(data?.total ?? 0);
      } catch {
        if (!cancelled) setLeads([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, scope, page]);

  // The person's name rides on their leads, so the first row names the page
  // without a second request. Falls back until something loads.
  const personName =
    leads.find((l) => l.creator?.name)?.creator?.name ??
    leads.find((l) => l.assignedTo?.name)?.assignedTo?.name ??
    "This person";

  return (
    <div className="w-full space-y-4 p-4 sm:p-6">
      <Link
        href="/admin/crm/team"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-orange-600"
      >
        <ArrowLeft className="size-3.5" />
        Back to team
      </Link>

      <div>
        <h1 className="text-xl font-bold text-gray-900">{personName}</h1>
        <p className="text-xs text-gray-600">
          {SCOPES.find((s) => s.value === scope)?.hint} · {total} lead
          {total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SCOPES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => {
              setScope(s.value);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              scope === s.value
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-gray-50 text-left text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
              <tr>
                <th className="px-3 py-2.5 sm:px-4">Lead</th>
                <th className="px-3 py-2.5 sm:px-4">College</th>
                <th className="px-3 py-2.5 sm:px-4">Creator</th>
                <th className="px-3 py-2.5 sm:px-4">Assignee</th>
                <th className="px-3 py-2.5 sm:px-4">Status</th>
                <th className="px-3 py-2.5 sm:px-4">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-gray-400" />
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    Nothing in this view.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead._id}
                    onClick={() => setOpenLeadId(lead._id)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-3 py-2.5 sm:px-4">
                      <div className="font-medium text-gray-900">
                        {lead.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <Mail className="size-3" />
                        {lead.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <Phone className="size-3" />
                        +91 {lead.phone}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 sm:px-4">
                      {lead.collegeName ?? "—"}
                      {lead.state ? (
                        <div className="text-[11px] text-gray-500">
                          {lead.state}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 sm:px-4">
                      {lead.creator ? (
                        <>
                          <div className="text-gray-900">
                            {lead.creator.name || "Unnamed"}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {lead.creator.role}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400">Direct</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 sm:px-4">
                      {lead.assignedTo?.userId ? (
                        <span className="text-gray-900">
                          {lead.assignedTo.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 sm:px-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STATUS_STYLES[lead.status]}`}
                      >
                        {
                          LEAD_STATUSES.find((s) => s.value === lead.status)
                            ?.label
                        }
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 sm:px-4">
                      {formatDate(lead.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 ? (
          <div className="border-t border-gray-200 px-4 py-3">
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
          onUpdated={(updated) =>
            setLeads((prev) =>
              prev.map((l) => (l._id === updated._id ? { ...l, ...updated } : l)),
            )
          }
          onDeleted={(deletedId) =>
            setLeads((prev) => prev.filter((l) => l._id !== deletedId))
          }
        />
      ) : null}
    </div>
  );
}
