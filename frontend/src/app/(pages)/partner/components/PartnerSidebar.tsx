"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Briefcase,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  X,
} from "lucide-react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { usePartnerAccess } from "../state/PartnerAccessProvider";

type Item = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  /** Gate key; `undefined` means always visible. */
  gate?: "course" | "internship";
};

const PARTNER_ITEMS: Item[] = [
  {
    label: "Dashboard",
    href: "/partner/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Courses",
    href: "/partner/courses",
    icon: BookOpen,
    gate: "course",
  },
  {
    label: "Internships",
    href: "/partner/internships",
    icon: Briefcase,
    gate: "internship",
  },
];

export default function PartnerSidebar({
  isCollapsed,
  setIsCollapsed,
  onNavigate,
  isMobileOverlay = false,
  onCloseMobile,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  onNavigate?: () => void;
  isMobileOverlay?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const { access } = usePartnerAccess();
  const items = PARTNER_ITEMS.filter((it) => {
    if (it.gate === "course") return access.courseAnalytics;
    if (it.gate === "internship") return access.internshipAnalytics;
    return true;
  });

  const showExpandedChrome = !isCollapsed || isMobileOverlay;
  const compactHeader = isCollapsed && !isMobileOverlay;
  const homeHref = "/";

  const brandMenuBlock = (
    <Link
      href={homeHref}
      className="flex min-w-0 flex-col gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[#F77124]/40 focus-visible:ring-offset-2"
      onClick={onNavigate}
    >
      <Image
        src="/logo.svg"
        alt="Edulyt"
        width={168}
        height={48}
        className="h-11 w-auto max-h-11 max-w-[156px] object-contain object-left"
        priority
      />
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#98A2B3]">
        Menu
      </span>
    </Link>
  );

  const brandWrapClassName = cn(
    "min-w-0 overflow-hidden",
    "duration-300 ease-in-out motion-safe:transition-[max-width,opacity]",
    showExpandedChrome ? "max-w-[168px] opacity-100" : "max-w-0 opacity-0",
  );

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden",
        "bg-[#FFF8F4] border-r border-black/5",
      )}
    >
      {compactHeader ? (
        <div className="flex w-full shrink-0 justify-end px-1.5 py-3">
          <button
            type="button"
            className={cn(
              "inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg",
              "hover:bg-black/5 transition-colors",
            )}
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Expand sidebar"
          >
            <Menu className="size-5 text-[#475467]" strokeWidth={2} />
          </button>
        </div>
      ) : (
        <div className="shrink-0 border-b border-black/6 px-4 pb-4 pt-5">
          <div className="flex w-full min-w-0 items-start justify-between gap-3">
            {showExpandedChrome ? (
              <div className={brandWrapClassName}>{brandMenuBlock}</div>
            ) : (
              <div className={brandWrapClassName} aria-hidden>
                {brandMenuBlock}
              </div>
            )}
            <button
              type="button"
              className={cn(
                "mt-0.5 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg",
                "hover:bg-black/5 transition-colors",
              )}
              onClick={() => {
                if (isMobileOverlay && onCloseMobile) {
                  onCloseMobile();
                  return;
                }
                setIsCollapsed(!isCollapsed);
              }}
              aria-label={isMobileOverlay ? "Close menu" : "Collapse sidebar"}
            >
              {isMobileOverlay ? (
                <X className="size-6 text-[#475467]" strokeWidth={2} />
              ) : (
                <PanelLeftClose
                  className="size-6 text-[#475467]"
                  strokeWidth={2}
                />
              )}
            </button>
          </div>
        </div>
      )}

      <nav
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3",
          isCollapsed && !isMobileOverlay && "px-2",
        )}
      >
        <div className="flex flex-col gap-1">
          {items.map((it) => {
            const active =
              pathname === it.href || pathname.startsWith(it.href + "/");
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={onNavigate}
                className={cn(
                  "flex min-w-0 cursor-pointer items-center gap-2 rounded-xl py-2.5 transition-colors",
                  isCollapsed && !isMobileOverlay
                    ? "justify-center px-2"
                    : "justify-between px-3",
                  active
                    ? "bg-[#F77124] text-white shadow-sm"
                    : "text-[#1D2939] hover:bg-black/5",
                )}
                title={it.label}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon
                    className={cn(
                      "size-5 shrink-0",
                      active ? "text-white" : "text-[#475467]",
                    )}
                  />
                  {!isCollapsed && (
                    <span className="truncate text-sm font-medium">
                      {it.label}
                    </span>
                  )}
                </span>
                {/* {!isCollapsed && (
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0",
                      active ? "text-white/90" : "text-[#98A2B3]"
                    )}
                    strokeWidth={2}
                    aria-hidden
                  />
                )} */}
              </Link>
            );
          })}
        </div>
      </nav>

      <div
        className={cn(
          "shrink-0 border-t border-black/5 py-3",
          isCollapsed && !isMobileOverlay ? "px-2" : "px-3",
        )}
      >
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            // Use a callbackUrl so NextAuth lands the user back on the partner
            // login page after clearing the session, instead of the public /
            // homepage.
            void signOut({ callbackUrl: "/partner/login" });
          }}
          className={cn(
            "mt-1 flex w-full min-w-0 cursor-pointer items-center gap-3 overflow-hidden rounded-xl py-2.5 text-left text-[#1D2939] transition-colors hover:bg-black/5",
            isCollapsed && !isMobileOverlay ? "justify-center px-2" : "px-3",
          )}
          title="Sign out"
        >
          <LogOut className="size-5 shrink-0 text-[#475467]" />
          {!isCollapsed && (
            <span className="min-w-0 truncate text-sm font-medium">
              Sign Out
            </span>
          )}
        </button>
        {/* <Link
          href="#"
          className={cn(
            "mt-1 flex min-w-0 cursor-pointer items-center gap-3 overflow-hidden rounded-xl py-2.5 text-[#667085] transition-colors hover:bg-black/5",
            isCollapsed && !isMobileOverlay ? "justify-center px-2" : "px-3",
          )}
          title="Help & support"
        >
          <CircleHelp className="size-5 shrink-0 text-[#667085]" />
          {!isCollapsed && (
            <span className="min-w-0 truncate text-sm font-medium">
              Help & Support
            </span>
          )}
        </Link> */}
      </div>
    </aside>
  );
}
