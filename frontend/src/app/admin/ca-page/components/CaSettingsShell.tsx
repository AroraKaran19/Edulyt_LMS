"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Loader2, SaveIcon } from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import { cn } from "@/lib/utils";
import { useCaSettings } from "../CaSettingsContext";
import { CA_SECTIONS, findSectionIndex } from "../sections";

const ROOT = "/admin/ca-page";

export default function CaSettingsShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, isSaving, saveActiveSection, isActiveDirty } =
    useCaSettings();

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
            onClick={() => void go("/admin/crm/ca-leads")}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="size-3.5" />
            Back to CA leads
          </button>
          <h2 className="text-base font-bold text-gray-900">
            Configure CA Page
          </h2>
          <a
            href="/digital-marketing-internship"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline"
          >
            View live page
            <ExternalLink className="size-3" />
          </a>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {CA_SECTIONS.map((section, i) => (
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
              {active >= 0 ? CA_SECTIONS[active].title : "Select a section"}
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
