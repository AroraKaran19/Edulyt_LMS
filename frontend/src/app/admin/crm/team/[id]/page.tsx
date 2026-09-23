"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Mail, Phone, Users } from "lucide-react";
import apiClient from "@/configs/apiConfig";
import { formatStoredPhone } from "@/lib/phone";
import Pagination from "@/components/admin/Pagination";
import LeadDetailsModal from "../../../leads/LeadDetailsModal";
import { type Lead } from "../../../leads/types";
import useLeadPipeline from "@/hooks/useLeadPipeline";
import { stageLabel, stageStyle, subStatusLabel } from "@/lib/leadPipeline";
import useAuth from "@/hooks/useAuth";
import { canAccessPageAsRole } from "@/config/adminPermissions";
import useCaApplications from "@/hooks/useCaApplications";
import type { CaApplicationRow } from "@/types/ca-application";
import { formatIstDate } from "@/lib/ist";

const DOCUMENT_LINKS: { key: keyof CaApplicationRow["documents"]; label: string }[] = [
  { key: "offerLetter", label: "Offer letter" },
  { key: "lor", label: "LOR" },
  { key: "internshipCertificate", label: "Internship" },
  { key: "trainingCertificate", label: "Training" },
];

type Scope = "generated" | "team" | "assigned" | "converted";
type Tab = "leads" | "ambassadors";

interface Person {
  userId: string;
  name: string;
  email: string;
  userType: "marketer" | "sales";
  code: string | null;
  active: boolean;
  ambassadors: number;
  generated: number;
  teamGenerated: number;
  converted: number;
}

interface Ambassador {
  userId: string;
  name: string;
  email: string;
  code: string | null;
  kind: "marketing" | "social-media" | null;
  active: boolean;
  addedAt: string | null;
  generated: number;
  converted: number;
}

const SCOPES: { value: Scope; label: string; hint: string }[] = [
  { value: "generated", label: "Generated", hint: "From their own link" },
  { value: "team", label: "Team", hint: "From their ambassador links" },
  { value: "assigned", label: "Assigned", hint: "Currently theirs to work" },
  { value: "converted", label: "Converted", hint: "They closed these" },
];

const KIND_LABELS: Record<string, string> = {
  marketing: "Marketing intern",
  "social-media": "Social media marketing intern",
};

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const formatDay = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" })
    : "-";

/** Tenure end dates are IST calendar dates; formatting them in the browser's
 *  own timezone can show a day early west of UTC. */
const formatTenureEnd = (value: string) => formatIstDate(value);

export default function CrmPersonPage() {
  const { pipeline } = useLeadPipeline();
  const { user } = useAuth();
  const canSeeCa = canAccessPageAsRole(user?.userType, user?.permissions ?? [], "crm.ca-leads");
  const params = useParams();
  const id = String(params?.id ?? "");

  const [person, setPerson] = useState<Person | null>(null);
  const [tab, setTab] = useState<Tab>("leads");

  const [scope, setScope] = useState<Scope>("generated");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  const [roster, setRoster] = useState<Ambassador[]>([]);
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterTotalPages, setRosterTotalPages] = useState(1);
  const [rosterLoading, setRosterLoading] = useState(true);

  const { team, setHold, isLoading: caLoading } = useCaApplications();
  const [caTeam, setCaTeam] = useState<CaApplicationRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(`/crm/people/${id}`);
        if (!cancelled) setPerson(res.data?.data ?? null);
      } catch {
        if (!cancelled) setPerson(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

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

  useEffect(() => {
    if (tab !== "ambassadors") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(`/crm/people/${id}/ambassadors`, {
          params: { page: rosterPage, limit: 20 },
        });
        if (cancelled) return;
        const data = res.data?.data;
        setRoster(data?.ambassadors ?? []);
        setRosterTotalPages(data?.totalPages ?? 1);
      } catch {
        if (!cancelled) setRoster([]);
      } finally {
        if (!cancelled) setRosterLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, tab, rosterPage]);

  // Not paginated on the backend, so one load covers every roster page.
  // `GET /ca-applications/team` sits behind `crm.ca-leads`, which this page
  // does not require, so an admin with only `crm.team` must not call it.
  useEffect(() => {
    if (tab !== "ambassadors" || !canSeeCa) return;
    let cancelled = false;
    (async () => {
      const rows = await team(id);
      if (!cancelled) setCaTeam(rows ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, tab, team, canSeeCa]);

  const caByEmail = useMemo(() => {
    const map = new Map<string, CaApplicationRow>();
    // `caTeam` is sorted newest-first, so keep only the first row per email:
    // the one that re-applied after being removed from the roster.
    for (const row of caTeam) {
      const key = row.email.trim().toLowerCase();
      if (!map.has(key)) map.set(key, row);
    }
    return map;
  }, [caTeam]);

  const onToggleHold = async (row: CaApplicationRow) => {
    const updated = await setHold(row.id, !row.completion.hold);
    if (!updated) return;
    setCaTeam((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const stats = [
    { label: "Ambassadors", value: person?.ambassadors ?? 0 },
    { label: "Generated", value: person?.generated ?? 0 },
    { label: "Team generated", value: person?.teamGenerated ?? 0 },
    { label: "Converted", value: person?.converted ?? 0 },
  ];

  const tabs: { value: Tab; label: string }[] = [
    { value: "leads", label: "Leads" },
    {
      value: "ambassadors",
      label: person ? `Ambassadors (${person.ambassadors})` : "Ambassadors",
    },
  ];

  return (
    <div className="w-full space-y-4 p-4 sm:p-6">
      <Link
        href="/admin/crm/team"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-orange-600"
      >
        <ArrowLeft className="size-3.5" />
        Back to team
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {person?.name ?? "Loading…"}
              </h1>
              {person ? (
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-200 ring-inset">
                  {person.userType === "sales" ? "Sales" : "Marketer"}
                </span>
              ) : null}
              {person && !person.active ? (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-200 ring-inset">
                  Link off
                </span>
              ) : null}
            </div>
            <p className="text-xs text-gray-600">{person?.email ?? ""}</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
              Code
            </div>
            <div className="font-mono text-sm font-semibold text-gray-900">
              {person?.code ?? "-"}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2"
            >
              <div className="text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                {s.label}
              </div>
              <div className="text-lg font-bold text-gray-900">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
              tab === t.value
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "leads" ? (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
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
            <span className="ml-1 text-xs text-gray-500">
              {SCOPES.find((s) => s.value === scope)?.hint} · {total} lead
              {total === 1 ? "" : "s"}
            </span>
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
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-gray-500"
                      >
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
                            {formatStoredPhone(lead.phone)}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-gray-700 sm:px-4">
                          {lead.collegeName ?? "-"}
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
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${stageStyle(pipeline, lead.status)}`}
                          >
                            {stageLabel(pipeline, lead.status)}
                          </span>
                          <div className="mt-0.5 text-[11px] text-gray-600">
                            {subStatusLabel(pipeline, lead.status, lead.subStatus)}
                          </div>
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
        </>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-gray-50 text-left text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2.5 sm:px-4">Ambassador</th>
                  <th className="px-3 py-2.5 sm:px-4">Kind</th>
                  <th className="px-3 py-2.5 sm:px-4">Code</th>
                  <th className="px-3 py-2.5 text-right sm:px-4">Generated</th>
                  <th className="px-3 py-2.5 text-right sm:px-4">Converted</th>
                  <th className="px-3 py-2.5 sm:px-4">Added</th>
                  {canSeeCa ? (
                    <>
                      <th className="px-3 py-2.5 sm:px-4">Tenure ends</th>
                      <th className="px-3 py-2.5 sm:px-4">Points</th>
                      <th className="px-3 py-2.5 sm:px-4">Outcome</th>
                      <th className="px-3 py-2.5 sm:px-4">Documents</th>
                      <th className="px-3 py-2.5 sm:px-4">Completion</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rosterLoading ? (
                  <tr>
                    <td colSpan={canSeeCa ? 11 : 6} className="px-4 py-12 text-center">
                      <Loader2 className="mx-auto size-6 animate-spin text-gray-400" />
                    </td>
                  </tr>
                ) : roster.length === 0 ? (
                  <tr>
                    <td colSpan={canSeeCa ? 11 : 6} className="px-4 py-12 text-center">
                      <Users className="mx-auto size-6 text-gray-300" />
                      <p className="mt-2 text-gray-500">
                        They have not added anyone to their team yet.
                      </p>
                    </td>
                  </tr>
                ) : (
                  roster.map((a) => {
                    const caRow = caByEmail.get(a.email.trim().toLowerCase());
                    const documentLinks = caRow
                      ? DOCUMENT_LINKS.filter((d) => caRow.documents[d.key])
                      : [];
                    return (
                      <tr key={a.userId} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 sm:px-4">
                          <div className="font-medium text-gray-900">
                            {a.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                            <Mail className="size-3" />
                            {a.email}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 sm:px-4">
                          <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200 ring-inset">
                            {KIND_LABELS[a.kind ?? ""] ?? "Ambassador"}
                          </span>
                          {!a.active ? (
                            <span className="ml-1 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-200 ring-inset">
                              Link off
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-gray-700 sm:px-4">
                          {a.code ?? "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900 sm:px-4">
                          {a.generated}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900 sm:px-4">
                          {a.converted}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 sm:px-4">
                          {formatDay(a.addedAt)}
                        </td>
                        {canSeeCa ? (
                          <>
                            <td className="px-3 py-2.5 whitespace-nowrap text-gray-700 sm:px-4">
                              {caRow?.endDate ? formatTenureEnd(caRow.endDate) : "-"}
                            </td>
                            <td className="px-3 py-2.5 text-gray-700 tabular-nums sm:px-4">
                              {caRow ? caRow.caPoints : "-"}
                            </td>
                            <td className="px-3 py-2.5 text-gray-700 sm:px-4">
                              {caRow
                                ? caRow.completion.outcome === "eligible"
                                  ? "Eligible"
                                  : caRow.completion.outcome === "not-eligible"
                                    ? "Not eligible"
                                    : "Pending"
                                : "-"}
                            </td>
                            <td className="px-3 py-2.5 sm:px-4">
                              {documentLinks.length > 0 ? (
                                <div className="flex flex-col gap-0.5">
                                  {documentLinks.map((d) => (
                                    <a
                                      key={d.key}
                                      href={caRow?.documents[d.key] ?? undefined}
                                      target="_blank"
                                      rel="noreferrer noopener"
                                      className="text-[11px] text-orange-600 hover:underline"
                                    >
                                      {d.label}
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[11px] text-gray-400">
                                  {caRow ? "Not issued yet" : "-"}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 sm:px-4">
                              {caRow ? (
                                <button
                                  type="button"
                                  onClick={() => onToggleHold(caRow)}
                                  disabled={
                                    caLoading || Boolean(caRow.completion.issuedAt)
                                  }
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                    caRow.completion.issuedAt
                                      ? "bg-gray-100 text-gray-500"
                                      : caRow.completion.hold
                                        ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                        : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  {caRow.completion.issuedAt
                                    ? "Issued"
                                    : caRow.completion.hold
                                      ? "On hold"
                                      : "Hold"}
                                </button>
                              ) : (
                                <span className="text-[11px] text-gray-400">-</span>
                              )}
                            </td>
                          </>
                        ) : null}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {rosterTotalPages > 1 ? (
            <div className="border-t border-gray-200 px-4 py-3">
              <Pagination
                page={rosterPage}
                totalPages={rosterTotalPages}
                onPageChange={setRosterPage}
                disabled={rosterLoading}
              />
            </div>
          ) : null}
          <p className="border-t border-gray-100 px-4 py-2.5 text-[11px] text-gray-500">
            Converted counts the leads this ambassador generated that were later
            closed, whoever closed them.
          </p>
        </div>
      )}

      {openLeadId ? (
        <LeadDetailsModal
          leadId={openLeadId}
          onClose={() => setOpenLeadId(null)}
          onUpdated={(updated) =>
            setLeads((prev) =>
              prev.map((l) =>
                l._id === updated._id ? { ...l, ...updated } : l,
              ),
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
