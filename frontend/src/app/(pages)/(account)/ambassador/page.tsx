"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Info, Loader2, Users } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { toast } from "react-toastify";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import useCrm, { AMBASSADOR_KIND_TAB_LABELS } from "@/hooks/useCrm";
import ExtraQuestionsEditor, {
  MAX_EXTRA_QUESTIONS,
  toDrafts,
  type QuestionDraft,
} from "@/components/admin/crm/ExtraQuestionsEditor";

/** Split token for the options textarea; kept out of JSX for clarity. */
const NEWLINE = String.fromCharCode(10);

const shareUrl = (code: string) =>
  typeof window === "undefined"
    ? `/enquiry?ref=${code}`
    : `${window.location.origin}/enquiry?ref=${code}`;

export default function AmbassadorPage() {
  const { getProfile, saveQuestion, isLoading } = useCrm();
  const { user } = useAuth();

  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(true);
  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  /** Granted by their marketer; false means the form asks the marketer's. */
  const [canSetQuestions, setCanSetQuestions] = useState(false);

  const title = user?.crmAmbassadorKind
    ? AMBASSADOR_KIND_TAB_LABELS[user.crmAmbassadorKind]
    : "Campus ambassador";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const profile = await getProfile();
      if (cancelled) return;
      if (!profile) {
        setAllowed(false);
      } else {
        setCode(profile.code);
        setDrafts(toDrafts(profile.questions ?? []));
        setCanSetQuestions(Boolean(profile.canSetQuestions));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [getProfile]);

  const onSaveQuestions = async () => {
    const result = await saveQuestion(
      drafts.map((d) => ({
        label: d.label,
        type: d.type,
        options: d.options
          .split(NEWLINE)
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

  const copyLink = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(shareUrl(code));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <Users className="mx-auto size-10 text-gray-300" />
        <h1 className="mt-3 text-xl font-bold text-gray-900">
          Not a campus ambassador yet
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Ask the person running your campus programme to add you with the email
          on this account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-600">
          Share your link. Every enquiry that comes through it is credited to
          you.
        </p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <code className="flex-1 overflow-x-auto rounded-xl bg-gray-50 px-3.5 py-3 text-sm text-gray-800">
            {code ? shareUrl(code) : "—"}
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
          Your code is <span className="font-semibold">{code}</span>.
        </p>
      </section>

      {canSetQuestions ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="mb-1 text-sm font-bold tracking-wide text-gray-500 uppercase">
            Extra questions on my form
          </h2>
          <p className="mb-4 text-xs text-gray-500">
            Your team leader has let you ask your own. Leave this empty and your
            form asks theirs instead.
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
        </section>
      ) : null}

      <section className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold">Looking for your numbers?</p>
          <p className="mt-0.5 text-blue-800">
            Your team leader and the Airkrit team hold the real figures, including
            which enquiries turned into admissions. Ask them for your up to date
            performance.
          </p>
        </div>
      </section>
    </div>
  );
}
