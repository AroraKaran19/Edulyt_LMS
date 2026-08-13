"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  CircleSlash,
  Loader2,
  Mail,
  Phone,
  Trash2,
  X,
} from "lucide-react";
import apiClient from "@/configs/apiConfig";
import useAuth from "@/hooks/useAuth";
import { toast } from "react-toastify";
import Select from "@/components/ui/inputs/Select";
import {
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  STATUS_STYLES,
  type Lead,
  type LeadStatus,
} from "./types";

interface Props {
  leadId: string;
  onClose: () => void;
  onUpdated: (lead: Lead) => void;
  onDeleted: (leadId: string) => void;
}

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

export default function LeadDetailsModal({
  leadId,
  onClose,
  onUpdated,
  onDeleted,
}: Props) {
  const { user } = useAuth();
  const isSuperAdmin = user?.userType === "super-admin";
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .get(`/leads/admin/${leadId}`)
      .then((res) => {
        if (cancelled) return;
        const found: Lead = res.data?.data?.lead;
        setLead(found);
        setNote(found?.note ?? "");
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load this lead");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  const save = async (patch: { status?: LeadStatus; note?: string }) => {
    setSaving(true);
    try {
      const res = await apiClient.patch(`/leads/admin/${leadId}`, patch);
      const updated: Lead = res.data?.data?.lead;
      setLead(updated);
      onUpdated(updated);
      toast.success("Lead updated");
    } catch {
      toast.error("Could not update this lead");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!lead) return;
    if (!confirm(`Delete the lead from ${lead.name}? This cannot be undone.`)) {
      return;
    }
    setSaving(true);
    try {
      await apiClient.delete(`/leads/admin/${leadId}`);
      toast.success("Lead deleted");
      onDeleted(leadId);
      onClose();
    } catch {
      toast.error("Could not delete this lead");
      setSaving(false);
    }
  };

  const platformUser =
    lead?.platformUserId && typeof lead.platformUserId === "object"
      ? lead.platformUserId
      : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-gray-900">
              {loading ? "Loading lead" : lead?.name}
            </h2>
            <p className="text-xs text-gray-500">
              {lead ? LEAD_SOURCE_LABELS[lead.source] ?? lead.source : ""}
              {lead ? ` · ${formatDateTime(lead.createdAt)}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : !lead ? (
          <div className="px-5 py-16 text-center text-gray-500">
            This lead could not be loaded.
          </div>
        ) : (
          <div className="space-y-5 px-5 py-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3.5 py-3 hover:border-orange-300"
              >
                <Mail className="size-4 shrink-0 text-orange-500" />
                <span className="truncate text-sm font-medium text-gray-900">
                  {lead.email}
                </span>
              </a>
              <a
                href={`tel:+91${lead.phone}`}
                className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-3.5 py-3 hover:border-orange-300"
              >
                <Phone className="size-4 shrink-0 text-orange-500" />
                <span className="text-sm font-medium text-gray-900">
                  +91 {lead.phone}
                </span>
              </a>
            </div>

            <div
              className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 ${
                lead.emailOnPlatform === true
                  ? "bg-green-50 text-green-800"
                  : lead.emailOnPlatform === false
                    ? "bg-gray-50 text-gray-700"
                    : "bg-amber-50 text-amber-800"
              }`}
            >
              {lead.emailOnPlatform === true ? (
                <BadgeCheck className="mt-0.5 size-4 shrink-0" />
              ) : (
                <CircleSlash className="mt-0.5 size-4 shrink-0" />
              )}
              <div className="text-sm">
                <p className="font-semibold">
                  {lead.emailOnPlatform === true
                    ? "Already has an Airkrit account"
                    : lead.emailOnPlatform === false
                      ? "No Airkrit account with this email"
                      : "Account check pending"}
                </p>
                {platformUser ? (
                  <p className="mt-0.5 text-xs">
                    {[platformUser.firstName, platformUser.lastName]
                      .filter(Boolean)
                      .join(" ")}
                    {platformUser.userType ? ` · ${platformUser.userType}` : ""}
                    {platformUser.createdAt
                      ? ` · joined ${formatDateTime(platformUser.createdAt)}`
                      : ""}
                  </p>
                ) : null}
                <p className="mt-0.5 text-xs opacity-70">
                  Last checked {formatDateTime(lead.emailCheckedAt)}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
                What they answered
              </h3>
              <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                {lead.answers.length === 0 ? (
                  <div className="px-3.5 py-3 text-sm text-gray-500">
                    This form carried no extra answers.
                  </div>
                ) : (
                  lead.answers.map((answer) => (
                    <div
                      key={answer.key}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3.5 py-3"
                    >
                      <dt className="text-sm text-gray-500">{answer.label}</dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {answer.value}
                      </dd>
                    </div>
                  ))
                )}
              </dl>
            </div>

            {lead.pageQuery ? (
              <div>
                <h3 className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">
                  Landing page query
                </h3>
                <code className="block overflow-x-auto rounded-xl bg-gray-50 px-3.5 py-3 text-xs text-gray-700">
                  {lead.pageQuery}
                </code>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Status"
                options={LEAD_STATUSES}
                value={lead.status}
                disabled={saving}
                onChange={(value) => save({ status: value as LeadStatus })}
              />
              <div className="text-xs text-gray-500 sm:self-end sm:pb-2">
                Signed in when submitting:{" "}
                <b className="text-gray-700">
                  {lead.submittedByUserId ? "yes" : "no"}
                </b>
              </div>
            </div>

            <div>
              <label
                htmlFor="lead-note"
                className="mb-1.5 block text-xs font-bold tracking-wide text-gray-500 uppercase"
              >
                Note
              </label>
              <textarea
                id="lead-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What happened on the call?"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-400"
              />
              <button
                type="button"
                disabled={saving || note === (lead.note ?? "")}
                onClick={() => save({ note })}
                className="mt-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save note"}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[lead.status]}`}
              >
                {LEAD_STATUSES.find((s) => s.value === lead.status)?.label}
              </span>

              {isSuperAdmin ? (
                <button
                  type="button"
                  onClick={remove}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                  Delete lead
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
