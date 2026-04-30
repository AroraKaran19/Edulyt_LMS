"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  HomeIcon,
  Loader2,
  SaveIcon,
} from "lucide-react";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import { cn } from "@/lib/utils";
import { useHomePageSettings } from "../HomePageSettingsContext";
import { HOME_PAGE_SECTIONS, findSectionIndex } from "../sections";

const ROOT = "/admin/settings/home-page";

export default function HomePageSettingsShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, isSaving, saveActiveSection, isActiveDirty } =
    useHomePageSettings();

  const activeSlug = useMemo(() => {
    if (!pathname) return null;
    if (pathname === ROOT) return null;
    const after = pathname.slice(ROOT.length + 1).split("/")[0];
    return after || null;
  }, [pathname]);

  const activeIndex = activeSlug ? findSectionIndex(activeSlug) : -1;
  const isOnIndex = activeIndex === -1;
  const prev = activeIndex > 0 ? HOME_PAGE_SECTIONS[activeIndex - 1] : null;
  const next =
    activeIndex >= 0 && activeIndex < HOME_PAGE_SECTIONS.length - 1
      ? HOME_PAGE_SECTIONS[activeIndex + 1]
      : null;

  const handleSave = async () => {
    await saveActiveSection();
  };

  const navigateGuarded = async (href: string) => {
    if (isActiveDirty) {
      const ok = window.confirm(
        "You have unsaved changes. Save before leaving?",
      );
      if (ok) {
        const saved = await saveActiveSection();
        if (!saved) return;
      }
    }
    router.push(href);
  };

  return (
    <div
      className={cn(
        "w-full flex min-h-0 overflow-hidden bg-stone-50/90",
        /* Caps height so the admin `overflow-auto` wrapper does not scroll; scroll stays in main pane. */
        "h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)]",
      )}
    >
      {/* Side rail — full shell height; nav scrolls only if the list exceeds the rail */}
      <aside
        className={cn(
          "hidden lg:flex h-full min-h-0 w-72 shrink-0 flex-col border-r border-stone-200 bg-white",
        )}
      >
        <div className="px-5 py-5 border-b border-stone-200 shrink-0">
          <Link
            href={ROOT}
            className="flex items-center gap-2 text-sm font-semibold text-stone-800 hover:text-orange-600"
            onClick={(e) => {
              e.preventDefault();
              void navigateGuarded(ROOT);
            }}
          >
            <HomeIcon className="size-4" />
            Home Page Settings
          </Link>
          <p className="text-xs text-stone-500 mt-1">
            Edit each homepage section.
          </p>
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-3 space-y-0.5">
          {HOME_PAGE_SECTIONS.map((section, idx) => {
            const href = `${ROOT}/${section.slug}`;
            const isActive = section.slug === activeSlug;
            return (
              <button
                key={section.slug}
                type="button"
                onClick={() => void navigateGuarded(href)}
                className={cn(
                  "w-full text-left flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-orange-100 text-orange-800 font-semibold"
                    : "text-stone-700 hover:bg-stone-100",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    isActive
                      ? "bg-orange-500 text-white"
                      : "bg-stone-200 text-stone-600",
                  )}
                >
                  {idx + 1}
                </span>
                <span className="flex-1 leading-tight">{section.title}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main pane — only this column’s inner area scrolls */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="w-full min-h-[40vh] flex items-center justify-center gap-2 text-stone-500">
              <Loader2 className="size-5 animate-spin shrink-0" />
              <span>Loading home page settings…</span>
            </div>
          ) : (
            children
          )}
        </div>

        {!isOnIndex && (
          <div className="shrink-0 border-t border-stone-200 bg-white/95 backdrop-blur px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                {isActiveDirty ? (
                  <>
                    <CircleDotIcon className="size-3.5 text-orange-500" />
                    <span>Unsaved changes</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2Icon className="size-3.5 text-green-600" />
                    <span>All changes saved</span>
                  </>
                )}
                <span className="hidden sm:inline text-stone-300">·</span>
                <span className="hidden sm:inline">
                  Section {activeIndex + 1} of {HOME_PAGE_SECTIONS.length}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <WhiteButton
                  type="button"
                  glow={false}
                  disabled={!prev || isSaving}
                  onClick={() =>
                    prev && void navigateGuarded(`${ROOT}/${prev.slug}`)
                  }
                  className="inline-flex items-center justify-center gap-2 min-w-[110px]"
                >
                  <ArrowLeftIcon className="size-4 shrink-0" />
                  Previous
                </WhiteButton>
                <OrangeButton
                  type="button"
                  glow={false}
                  onClick={() => void handleSave()}
                  disabled={isSaving || !isActiveDirty}
                  className="inline-flex items-center justify-center gap-2 min-w-[110px]"
                >
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin shrink-0" />
                  ) : (
                    <SaveIcon className="size-4 shrink-0" />
                  )}
                  Save
                </OrangeButton>
                <WhiteButton
                  type="button"
                  glow={false}
                  disabled={!next || isSaving}
                  onClick={() =>
                    next && void navigateGuarded(`${ROOT}/${next.slug}`)
                  }
                  className="inline-flex items-center justify-center gap-2 min-w-[110px]"
                >
                  Next
                  <ArrowRightIcon className="size-4 shrink-0" />
                </WhiteButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
