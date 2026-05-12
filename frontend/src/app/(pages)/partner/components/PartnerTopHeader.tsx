"use client";

import { ChevronDown, LogOut, Menu, UserCircle } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import useAuth from "@/hooks/useAuth";
import { usePartnerSidebar } from "../state/PartnerSidebarProvider";

/** Returns the partner's initials for the round avatar. Falls back to "P" so
 *  the chip never collapses while the session is still hydrating. */
function initialsFor(firstName?: string, lastName?: string): string {
  const a = (firstName ?? "").trim()[0];
  const b = (lastName ?? "").trim()[0];
  const combined = `${a ?? ""}${b ?? ""}`.toUpperCase();
  return combined || "P";
}

/** Rectangular shimmer while session hydrates — avoids looking like the page’s circular loaders. */
function ProfileNameSkeleton() {
  return (
    <span
      className="relative block h-[18px] w-[112px] max-w-[30vw] overflow-hidden rounded-md bg-[#E4E7EC]"
      role="status"
      aria-live="polite"
      aria-label="Loading profile"
    >
      <span
        className="pointer-events-none absolute inset-y-0 -left-[40%] w-[55%] bg-linear-to-r from-transparent via-white/70 to-transparent motion-safe:animate-partner-top-header-name-shimmer motion-reduce:animate-none"
        aria-hidden
      />
    </span>
  );
}

export default function PartnerTopHeader() {
  const { toggleMobileSidebar } = usePartnerSidebar();
  const { user, isLoading: sessionLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickAway = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  const firstName = (user as { firstName?: string } | undefined)?.firstName;
  const lastName = (user as { lastName?: string } | undefined)?.lastName;
  const email = (user as { email?: string } | undefined)?.email;
  const resolvedName =
    [firstName, lastName].filter(Boolean).join(" ").trim() || email || "";

  const displayName = resolvedName.trim() ? resolvedName.trim() : "Partner";

  return (
    <div className="w-full bg-white border-b border-black/5">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4">
        <button
          type="button"
          onClick={toggleMobileSidebar}
          aria-label="Open menu"
          className="lg:hidden cursor-pointer p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
        >
          <Menu className="size-6" />
        </button>

        <div className="flex-1" />

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            disabled={sessionLoading}
            aria-busy={sessionLoading}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={cn(
              "flex items-center gap-2 rounded-2xl px-2 py-1 transition-colors",
              sessionLoading
                ? "cursor-wait hover:bg-transparent"
                : "cursor-pointer hover:bg-black/5",
            )}
          >
            <span className="size-9 rounded-xl bg-[#EEE7FF] text-[#6D28D9] font-semibold grid place-items-center">
              {initialsFor(firstName, lastName)}
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-[#1D2939]">
              {sessionLoading ? (
                <ProfileNameSkeleton />
              ) : (
                displayName
              )}
              {!sessionLoading ? (
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-[#98A2B3] transition-transform",
                    menuOpen && "rotate-180"
                  )}
                  strokeWidth={2}
                  aria-hidden
                />
              ) : null}
            </span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-[#EAECF0] bg-white shadow-lg"
            >
              <div className="border-b border-[#F2F4F7] px-4 py-3">
                <p className="truncate text-sm font-semibold text-[#1D2939]">
                  {displayName}
                </p>
                {email && (
                  <p className="truncate text-xs text-[#667085]">{email}</p>
                )}
              </div>
              <Link
                href="/profile"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#1D2939] hover:bg-[#FFF3EC]"
              >
                <UserCircle className="size-4 text-[#475467]" />
                My Profile
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  void signOut({ callbackUrl: "/partner/login" });
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#1D2939] hover:bg-[#FFF3EC]"
              >
                <LogOut className="size-4 text-[#475467]" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
