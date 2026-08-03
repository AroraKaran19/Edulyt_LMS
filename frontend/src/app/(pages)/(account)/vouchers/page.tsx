"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Gift, Ticket, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import FreeInternshipClaimModal from "@/app/(pages)/dashboard/components/FreeInternshipClaimModal";
import {
  useInternshipVouchers,
  type InternshipVoucher,
} from "@/hooks/useInternshipVouchers";

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

const STATUS: Record<
  InternshipVoucher["status"],
  { label: string; chip: string; icon: typeof Gift }
> = {
  available: {
    label: "Available",
    chip: "bg-emerald-100 text-emerald-900 border-emerald-200",
    icon: CheckCircle2,
  },
  redeemed: {
    label: "Used",
    chip: "bg-stone-200 text-stone-800 border-stone-300",
    icon: Ticket,
  },
  expired: {
    label: "Expired",
    chip: "bg-rose-100 text-rose-900 border-rose-200",
    icon: XCircle,
  },
};

/** One-line explanation of what this specific voucher buys the learner. */
const describeVoucher = (v: InternshipVoucher) => {
  if (v.status === "redeemed") {
    return v.redeemedInternshipTitle
      ? `Used for a free seat in ${v.redeemedInternshipTitle}`
      : "Used for a free internship seat";
  }
  if (v.status === "expired") {
    return "Expired before it was used";
  }
  return "Good for one free internship seat on any open batch";
};

const VouchersPage = () => {
  const { available, vouchers, isLoading, refetch } = useInternshipVouchers();
  const [claiming, setClaiming] = useState<InternshipVoucher | null>(null);

  /**
   * `?claim=CODE` opens the picker straight away. The award email links here so a
   * learner who is already signed in goes from inbox to choosing an internship in
   * one click, and a signed-out one lands here after logging in.
   *
   * Fires once per page load: without the ref, closing the modal would immediately
   * reopen it, because the query string is still there.
   */
  const requestedCode = useSearchParams().get("claim")?.trim().toUpperCase();
  const autoOpened = useRef(false);

  useEffect(() => {
    if (autoOpened.current || !requestedCode || isLoading) return;

    // Only an unredeemed voucher can be claimed. An unknown or already-spent code
    // silently leaves the list on screen, which is the right outcome for a link
    // that was forwarded, bookmarked, or clicked twice.
    const match = vouchers.find(
      (v) => v.code?.toUpperCase() === requestedCode && v.status === "available",
    );
    if (!match) return;

    autoOpened.current = true;
    setClaiming(match);
  }, [requestedCode, isLoading, vouchers]);

  return (
    <div className="w-full mx-auto p-6 flex flex-col gap-6">
      <div className="lg:max-w-[90%] w-full mx-auto flex flex-col gap-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">My Vouchers</h1>
          <p className="text-sm text-gray-600">
            Free internship seats earned by purchasing a course. Each voucher is
            single use.
          </p>
        </header>

        {available > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/50 px-4 py-3">
            <Gift className="size-5 shrink-0 text-amber-700" aria-hidden />
            <p className="text-sm font-semibold text-amber-900">
              You have {available} voucher{available === 1 ? "" : "s"} ready to
              use.
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 py-16 justify-center text-gray-500">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            <span className="text-sm">Loading your vouchers…</span>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
            <Ticket className="mx-auto mb-3 size-8 text-gray-300" aria-hidden />
            <h2 className="text-base font-semibold text-gray-900">
              No vouchers yet
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
              Buy any course and you&apos;ll earn a free internship seat
              automatically.
            </p>
            <Link
              href="/programs"
              className="mt-5 inline-block text-sm font-semibold text-orange-600 underline-offset-2 hover:underline"
            >
              Browse programs
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {vouchers.map((v) => {
              const meta = STATUS[v.status];
              const StatusIcon = meta.icon;
              const issued = formatDate(v.issuedAt);
              const redeemed = formatDate(v.redeemedAt);
              const expires = formatDate(v.expiresAt);

              return (
                <li
                  key={v._id}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                    <StatusIcon className="size-5 text-amber-700" aria-hidden />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold tracking-wide text-gray-900">
                        {v.code}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                          meta.chip,
                        )}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">
                      {describeVoucher(v)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {issued && <>Earned {issued}</>}
                      {v.sourceCourseName && (
                        <> from your {v.sourceCourseName} purchase</>
                      )}
                      {v.status === "redeemed" && redeemed && (
                        <> · Used {redeemed}</>
                      )}
                      {v.status === "available" && expires && (
                        <> · Expires {expires}</>
                      )}
                    </p>
                  </div>

                  {v.status === "available" && (
                    <OrangeButton
                      glow={false}
                      type="button"
                      onClick={() => setClaiming(v)}
                      className="shrink-0 px-4 py-2 text-xs font-semibold"
                    >
                      Avail now
                    </OrangeButton>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <FreeInternshipClaimModal
        isOpen={claiming !== null}
        voucher={claiming}
        onClose={() => setClaiming(null)}
        onRedeemed={() => {
          setClaiming(null);
          void refetch();
        }}
      />
    </div>
  );
};

export default VouchersPage;
