"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Loader2, SaveIcon } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { cn } from "@/lib/utils";
import { useEnquirySettings } from "../EnquirySettingsContext";
import { ENQUIRY_SECTIONS, findSectionIndex } from "../sections";

const ROOT = "/admin/enquiry-page";

type ControlKey = "pricesOff" | "linkQuestionsOff";

const CONTROLS: Record<
  ControlKey,
  {
    title: string;
    onHint: string;
    offHint: string;
    confirm: (next: boolean) => string;
  }
> = {
  pricesOff: {
    title: "Turn off all pricing",
    onHint: "No prices shown to anyone, referral links included.",
    offHint: "Prices follow the Plans setting and each link's own.",
    confirm: (next) =>
      next
        ? "Hide all prices on the live enquiry page for every visitor?"
        : "Show prices again on the live enquiry page?",
  },
  linkQuestionsOff: {
    title: "Turn off link questions",
    onHint:
      "Marketers' and sales links ask none of their own; every visit gets this page's Extra questions.",
    offHint:
      "Links ask their owner's questions; the plain page asks this page's Extra questions.",
    confirm: (next) =>
      next
        ? "Hide every referral link's own extra questions and lock them in their owners' dashboards?"
        : "Let referral links ask their owners' extra questions again?",
  },
};

export default function EnquirySettingsShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    settings,
    isLoading,
    isSaving,
    saveActiveSection,
    saveSection,
    isActiveDirty,
  } = useEnquirySettings();
  const controls = {
    pricesOff: settings?.controls?.pricesOff === true,
    linkQuestionsOff: settings?.controls?.linkQuestionsOff === true,
  };

  // Saves on the spot: it changes the live page, so it never waits on a section's Save.
  const toggleControl = async (key: ControlKey) => {
    const next = !controls[key];
    if (!window.confirm(CONTROLS[key].confirm(next))) return;
    await saveSection("controls", { ...controls, [key]: next });
  };

  const activeSlug = useMemo(() => {
    if (!pathname || pathname === ROOT) return null;
    return pathname.slice(ROOT.length + 1).split("/")[0] || null;
  }, [pathname]);

  const active = activeSlug ? findSectionIndex(activeSlug) : -1;

  /** Warns before losing edits, since each section saves on its own. */
  const go = async (href: string) => {
    if (isActiveDirty) {
      const save = window.confirm(
        "You have unsaved changes. Save before leaving?",
      );
      if (save && !(await saveActiveSection())) return;
    }
    router.push(href);
  };

  return (
    <div className="flex h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] w-full min-h-0 overflow-hidden bg-stone-50/90">
      <aside className="hidden w-72 flex-none flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="border-b border-gray-200 px-4 py-4">
          <button
            type="button"
            onClick={() => void go("/admin/leads")}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="size-3.5" />
            Back to leads
          </button>
          <h2 className="text-base font-bold text-gray-900">
            Configure Enquiry Page
          </h2>
          <a
            href="/enquiry"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline"
          >
            View live page
            <ExternalLink className="size-3" />
          </a>

          <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-200">
            {(Object.keys(CONTROLS) as ControlKey[]).map((key) => {
              const on = controls[key];
              return (
                <div
                  key={key}
                  className="flex items-start justify-between gap-3 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p
                      id={`enquiry-control-${key}`}
                      className="text-sm font-semibold text-gray-900"
                    >
                      {CONTROLS[key].title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
                      {on ? CONTROLS[key].onHint : CONTROLS[key].offHint}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-labelledby={`enquiry-control-${key}`}
                    disabled={isLoading || isSaving}
                    onClick={() => void toggleControl(key)}
                    className={cn(
                      "relative mt-0.5 h-5 w-9 flex-none rounded-full transition-colors disabled:opacity-50",
                      on ? "bg-orange-500" : "bg-gray-300",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform",
                        on && "translate-x-4",
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {ENQUIRY_SECTIONS.map((section, i) => (
            <button
              key={section.slug}
              type="button"
              onClick={() => void go(`${ROOT}/${section.slug}`)}
              className={cn(
                "mb-1 block w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                i === active
                  ? "bg-orange-50 text-orange-800"
                  : "text-gray-700 hover:bg-gray-50",
              )}
            >
              <span className="block text-sm font-semibold">
                {section.title}
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">
                {section.description}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-none items-center justify-between gap-3 border-b border-gray-200 bg-white px-5 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">
              {active >= 0 ? ENQUIRY_SECTIONS[active].title : "Select a section"}
            </p>
            {isActiveDirty && (
              <p className="text-[11px] font-semibold text-orange-600">
                Unsaved changes
              </p>
            )}
          </div>

          {active >= 0 && (
            <OrangeButton
              onClick={() => void saveActiveSection()}
              disabled={isSaving || isLoading || !isActiveDirty}
              className="flex-none"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <SaveIcon className="size-4" />
              )}
              {isSaving ? "Saving" : "Save section"}
            </OrangeButton>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="size-4 animate-spin" />
              Loading settings
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
