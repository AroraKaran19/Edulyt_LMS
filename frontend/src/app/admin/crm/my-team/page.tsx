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
import ScholarshipAttachSelect, {
  useOwnCampaigns,
} from "@/components/admin/ScholarshipAttachSelect";
import ExtraQuestionsEditor, {
  MAX_EXTRA_QUESTIONS,
  toDrafts,
  type QuestionDraft,
} from "@/components/admin/crm/ExtraQuestionsEditor";

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
    saveLinkSettings,
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
  const [hidePrices, setHidePrices] = useState(false);
  const [hideCaPrices, setHideCaPrices] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [caCampaignId, setCaCampaignId] = useState<string | null>(null);

  // Literal, like every other CRM call in this tree: useCrm addresses these
  // routes by path rather than through ENDPOINTS.
  const {
    options: campaigns,
    isLoading: campaignsLoading,
    failed: campaignsFailed,
  } = useOwnCampaigns("/crm/me/scholarship-options");

  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [allowCaQuestions, setAllowCaQuestions] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [p, list] = await Promise.all([
        getProfile(),
        listAmbassadors(page),
      ]);
      if (cancelled) return;
      setProfile(p);
      setHidePrices(Boolean(p?.hidePlanPrices));
      setHideCaPrices(Boolean(p?.hideAmbassadorPlanPrices));
      setCampaignId(p?.scholarshipTestId ?? null);
      setCaCampaignId(p?.ambassadorScholarshipTestId ?? null);
      setAllowCaQuestions(Boolean(p?.allowAmbassadorQuestions));
      setDrafts(toDrafts(p?.questions ?? []));
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

  /**
   * Optimistic, then reconciled with what the server actually stored: the
   * checkbox is the only feedback, so leaving it on a failed save would tell
   * the marketer their links are unpriced when they are not.
   */
  const saveSettings = async (patch: {
    hidePlanPrices?: boolean;
    hideAmbassadorPlanPrices?: boolean;
    allowAmbassadorQuestions?: boolean;
    scholarshipTestId?: string | null;
    ambassadorScholarshipTestId?: string | null;
  }) => {
    const previous = {
      hidePlanPrices: hidePrices,
      hideAmbassadorPlanPrices: hideCaPrices,
      allowAmbassadorQuestions: allowCaQuestions,
      scholarshipTestId: campaignId,
      ambassadorScholarshipTestId: caCampaignId,
    };
    // The endpoint replaces every field, so an unchanged one has to be sent as
    // it stands or changing any would silently reset the rest.
    const next = { ...previous, ...patch };

    const apply = (v: typeof previous) => {
      setHidePrices(v.hidePlanPrices);
      setHideCaPrices(v.hideAmbassadorPlanPrices);
      setAllowCaQuestions(v.allowAmbassadorQuestions);
      setCampaignId(v.scholarshipTestId);
      setCaCampaignId(v.ambassadorScholarshipTestId);
    };

    apply(next);

    const res = await saveLinkSettings(next);
    if (!res.ok) {
      apply(previous);
      toast.error(res.message);
      return;
    }
    apply(res);
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

  const onSaveQuestions = async () => {
    const result = await saveQuestion(
      drafts.map((d) => ({
        label: d.label,
        type: d.type,
        options: d.options
          .split("\n")
          .map((o) => o.trim())
          .filter(Boolean),
        required: d.required,
      })),
    );
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(
      result.questions.length === 0 ? "Questions removed" : "Questions saved",
    );
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

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 border-t border-gray-100 pt-4">
          <input
            type="checkbox"
            checked={hidePrices}
            onChange={(e) =>
              void saveSettings({ hidePlanPrices: e.target.checked })
            }
            className="mt-0.5 size-4 cursor-pointer accent-orange-500"
          />
          <span className="text-sm text-gray-700">
            Hide plan prices on my link
            <span className="mt-0.5 block text-xs text-gray-500">
              For the link above only. It hides the prices on the page; anyone
              reading the page source can still find them.
            </span>
          </span>
        </label>

        <label className="mt-3 flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={hideCaPrices}
            onChange={(e) =>
              void saveSettings({
                hideAmbassadorPlanPrices: e.target.checked,
              })
            }
            className="mt-0.5 size-4 cursor-pointer accent-orange-500"
          />
          <span className="text-sm text-gray-700">
            Hide plan prices on my ambassadors&apos; links
            <span className="mt-0.5 block text-xs text-gray-500">
              Separate from your own, so you can work priced leads while your
              campus ambassadors send an unpriced page. Applies to whoever is on
              your roster at the time, including anyone you add later.
            </span>
          </span>
        </label>

        <div className="mt-4 flex flex-col gap-4 border-t border-gray-100 pt-4">
          <ScholarshipAttachSelect
            label="Scholarship on my link"
            helperText="Adds one line to the lead form, under the plan tiles, linking to the test. Only campaigns you created."
            options={campaigns}
            isLoading={campaignsLoading}
            failed={campaignsFailed}
            disabled={isLoading}
            value={campaignId}
            onChange={(scholarshipTestId) =>
              void saveSettings({ scholarshipTestId })
            }
          />

          <ScholarshipAttachSelect
            label="Scholarship on my ambassadors' links"
            helperText="Separate from your own, so your roster can run a different campaign. Your ambassadors cannot create one, so they show this or nothing."
            options={campaigns}
            isLoading={campaignsLoading}
            failed={campaignsFailed}
            disabled={isLoading}
            value={caCampaignId}
            onChange={(ambassadorScholarshipTestId) =>
              void saveSettings({ ambassadorScholarshipTestId })
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-bold tracking-wide text-gray-500 uppercase">
          Extra questions on my form
        </h2>
        <p className="mb-4 text-xs text-gray-500">
          Asked on your enquiry form, and on your ambassadors&apos; forms unless
          you let them set their own below.
        </p>

        <ExtraQuestionsEditor
          questions={drafts}
          onChange={setDrafts}
          max={MAX_EXTRA_QUESTIONS}
          disabled={isLoading}
        />

        <div className="mt-4">
          <OrangeButton
            glow={false}
            onClick={onSaveQuestions}
            disabled={isLoading}
          >
            Save
          </OrangeButton>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-2.5 border-t border-gray-100 pt-4">
          <input
            type="checkbox"
            checked={allowCaQuestions}
            onChange={(e) =>
              void saveSettings({
                allowAmbassadorQuestions: e.target.checked,
              })
            }
            className="mt-0.5 size-4 cursor-pointer accent-orange-500"
          />
          <span className="text-sm text-gray-700">
            Let my ambassadors set their own questions
            <span className="mt-0.5 block text-xs text-gray-500">
              While this is off, their forms ask yours instead. Turning it off
              again does not delete what they wrote; their links simply go back
              to asking your questions.
            </span>
          </span>
        </label>
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
