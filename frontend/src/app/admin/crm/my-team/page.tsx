"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import Input from "@/components/ui/inputs/Input";
import Pagination from "@/components/admin/Pagination";
import Select from "@/components/ui/inputs/Select";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import useCrm, {
  AMBASSADOR_KIND_LABELS,
  type Ambassador,
  type AmbassadorKind,
  type CrmProfile,
} from "@/hooks/useCrm";

const shareUrl = (code: string) =>
  typeof window === "undefined"
    ? `/enquiry?ref=${code}`
    : `${window.location.origin}/enquiry?ref=${code}`;

export default function MyTeamPage() {
  const {
    getProfile,
    listAmbassadors,
    addAmbassador,
    removeAmbassador,
    saveQuestion,
    isLoading,
  } = useCrm();

  const [profile, setProfile] = useState<CrmProfile | null>(null);
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState<AmbassadorKind>("marketing");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const [qEnabled, setQEnabled] = useState(false);
  const [qLabel, setQLabel] = useState("");
  const [qType, setQType] = useState<"text" | "select">("text");
  const [qOptions, setQOptions] = useState("");
  const [qRequired, setQRequired] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [p, list] = await Promise.all([
        getProfile(),
        listAmbassadors(page),
      ]);
      if (cancelled) return;
      setProfile(p);
      setAmbassadors(list.ambassadors);
      setTotalPages(list.totalPages);
      setTotal(list.total);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [getProfile, listAmbassadors, page]);

  const reloadRoster = async (target = page) => {
    const list = await listAmbassadors(target);
    setAmbassadors(list.ambassadors);
    setTotalPages(list.totalPages);
    setTotal(list.total);
  };

  const copyLink = async () => {
    if (!profile) return;
    await navigator.clipboard.writeText(shareUrl(profile.code));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onAdd = async () => {
    const result = await addAmbassador(email.trim(), kind);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(`${AMBASSADOR_KIND_LABELS[kind]} added`);
    setEmail("");
    // A new ambassador sorts to the top, so show the first page.
    setPage(1);
    await reloadRoster(1);
  };

  const onRemove = async (a: Ambassador) => {
    if (!confirm(`Remove ${a.name || a.email} from your team?`)) return;
    if (await removeAmbassador(a.userId)) {
      toast.success("Ambassador removed");
      await reloadRoster();
    } else {
      toast.error("Could not remove them");
    }
  };

  const onSaveQuestion = async () => {
    const result = await saveQuestion({
      enabled: qEnabled,
      label: qLabel,
      type: qType,
      options: qOptions
        .split("\n")
        .map((o) => o.trim())
        .filter(Boolean),
      required: qRequired,
    });
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(qEnabled ? "Question saved" : "Question removed");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My team</h1>
        <p className="text-sm text-gray-600">
          Your link, the extra question on your form, and the ambassadors under
          you.
        </p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-bold tracking-wide text-gray-500 uppercase">
          My link
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <code className="flex-1 overflow-x-auto rounded-xl bg-gray-50 px-3.5 py-3 text-sm text-gray-800">
            {profile ? shareUrl(profile.code) : "—"}
          </code>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-3 text-sm font-medium hover:bg-gray-50"
          >
            {copied ? (
              <Check className="size-4 text-green-600" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Every lead from this link is credited to you. Your code is{" "}
          <span className="font-semibold">{profile?.code}</span>.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-bold tracking-wide text-gray-500 uppercase">
          Extra question on my form
        </h2>
        <label className="mb-3 flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={qEnabled}
            onChange={(e) => setQEnabled(e.target.checked)}
            className="size-4 rounded border-gray-300 text-orange-600"
          />
          <span className="text-sm text-gray-800">
            Ask one extra question on my form
          </span>
        </label>

        {qEnabled ? (
          <div className="space-y-3">
            <Input
              label="Question"
              value={qLabel}
              onChange={(e) => setQLabel(e.target.value)}
              placeholder="e.g. Which city are you in?"
            />
            <Select
              label="Answer type"
              options={[
                { value: "text", label: "Free text" },
                { value: "select", label: "Dropdown" },
              ]}
              value={qType}
              onChange={(v) => setQType(v as "text" | "select")}
            />
            {qType === "select" ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Options, one per line
                </label>
                <textarea
                  value={qOptions}
                  onChange={(e) => setQOptions(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm"
                  placeholder={"Delhi\nMumbai\nBengaluru"}
                />
              </div>
            ) : null}
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={qRequired}
                onChange={(e) => setQRequired(e.target.checked)}
                className="size-4 rounded border-gray-300 text-orange-600"
              />
              <span className="text-sm text-gray-800">Make it required</span>
            </label>
          </div>
        ) : null}

        <div className="mt-4">
          <OrangeButton glow={false} onClick={onSaveQuestion} disabled={isLoading}>
            Save
          </OrangeButton>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 pt-4">
          <h2 className="text-sm font-bold tracking-wide text-gray-500 uppercase">
            My ambassadors
          </h2>
          <span className="pb-3 text-xs font-semibold text-gray-500">
            {total} total
          </span>
        </div>
        <div className="flex flex-wrap items-end gap-3 border-b border-gray-200 p-5">
          <div className="min-w-[220px] flex-1">
            <Input
              label="Add a campus ambassador"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Their registered email"
            />
          </div>
          <div className="w-52">
            <Select
              label="Their role"
              options={[
                { value: "marketing", label: "Marketing intern" },
                { value: "sales", label: "Sales intern" },
              ]}
              value={kind}
              onChange={(v) => setKind(v as AmbassadorKind)}
            />
          </div>
          <OrangeButton
            glow={false}
            onClick={onAdd}
            disabled={isLoading || !email.trim()}
          >
            <UserPlus className="mr-2 size-4" />
            Add
          </OrangeButton>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3">Ambassador</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ambassadors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-500">
                    No ambassadors yet. They need an account first.
                  </td>
                </tr>
              ) : (
                ambassadors.map((a) => (
                  <tr key={a.userId}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">
                        {a.name || "Unnamed"}
                      </div>
                      <div className="text-xs text-gray-500">{a.email}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {a.kind ? (
                        AMBASSADOR_KIND_LABELS[a.kind]
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-gray-700">
                      {a.code ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          a.active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {a.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onRemove(a)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${a.name || a.email}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
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
              disabled={isLoading}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
