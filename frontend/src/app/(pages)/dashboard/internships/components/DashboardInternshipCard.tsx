"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  GraduationCap,
  Hourglass,
  LockOpen,
  Ticket,
} from "lucide-react";
import type { InternshipEnrollmentListRow } from "@/types";
import { cn } from "@/lib/utils";
import ExamCountdownButton from "./ExamCountdownButton";
import {
  formatCertExamUtcRange,
  getCertificationExamListReminder,
} from "@/lib/internshipCertificationReminder";
import { useEffect, useState } from "react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";

function statusBadgeClass(status: string) {
  if (status === "enrolled")
    return "bg-emerald-100 text-emerald-900 border-emerald-200";
  if (status === "completed")
    return "bg-slate-200 text-slate-900 border-slate-300";
  if (status === "in_merit_pool" || status === "exam_attempted")
    return "bg-amber-200/90 text-amber-950 border-amber-300";
  if (status === "exam_registered")
    return "bg-sky-100 text-sky-900 border-sky-200";
  if (status === "payment_pending")
    return "bg-orange-200 text-orange-950 border-orange-300";
  if (
    status === "dropped" ||
    status === "revoked" ||
    status === "admin_rejected"
  )
    return "bg-stone-200 text-stone-800 border-stone-300";
  if (status === "paused")
    return "bg-violet-100 text-violet-900 border-violet-200";
  return "bg-stone-100 text-stone-800 border-stone-200";
}

function formatStatusLabel(status: string) {
  if (status === "admin_rejected") return "Not Pass";
  return status.replace(/_/g, " ");
}

function formatCohortDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

type Props = { row: InternshipEnrollmentListRow };

/** Only when exam is registered but NOT yet submitted — show countdown + button. */
const EXAM_ACTION_STATUSES = new Set(["exam_registered"]);
/** Submitted / awaiting outcome — show passive waiting chip, no button. */
const EXAM_WAITING_STATUSES = new Set(["exam_attempted", "in_merit_pool"]);

/** Buy-confirmed-seat CTA — handles fetching price + payment initiation. */
function BuyConfirmedSeatCta({
  row,
  variant,
}: {
  row: InternshipEnrollmentListRow;
  variant: "awaiting" | "post_fail";
}) {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug =
    row.internshipSnapshot?.slug?.trim() || row.internship?.slug?.trim() || "";

  // Fetch batch price from the public internship endpoint
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    apiClient
      .get(`/internships/slug/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (cancelled) return;
        const internship = res.data?.data as {
          batches?: { _id?: string; plan?: { price?: number; isActive?: boolean } }[];
        } | undefined;
        const batchId = row.batchSnapshot?.batchId;
        const batch = internship?.batches?.find((b) => b._id === batchId);
        const p = batch?.plan?.price;
        if (typeof p === "number") setPrice(p);
      })
      .catch(() => {/* price stays null — button still works */});
    return () => { cancelled = true; };
  }, [slug, row.batchSnapshot?.batchId]);

  const handlePurchase = async () => {
    const internshipId = row.internship?._id;
    const batchId = row.batchSnapshot?.batchId;
    if (!internshipId || !batchId) {
      setError("Missing enrollment data — please refresh.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Register for paid seat (creates new enrollment or upgrades existing)
      const enrollRes = await apiClient.post(ENDPOINTS.internshipEnrollments.create, {
        internshipId,
        batchId,
        path: "paid",
      });
      const enrollmentId = enrollRes.data?.data?.enrollmentId as string | undefined;
      if (!enrollmentId) throw new Error("Enrollment creation failed");

      // Create Paytm order
      const orderRes = await apiClient.post(ENDPOINTS.orders.createInternshipSeat, {
        internshipEnrollmentId: enrollmentId,
      });
      const order = orderRes.data?.data as
        | { _id: string; freeOrder?: boolean; token?: string }
        | undefined;
      if (!order) throw new Error("Order creation failed");

      if (order.freeOrder && order.token) {
        window.location.href = `/payment/status/${order._id}?token=${order.token}`;
        return;
      }
      window.location.href = `/paytm-redirect?orderId=${order._id}`;
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ??
        (e instanceof Error ? e.message : "Something went wrong");
      setError(msg);
      setLoading(false);
    }
  };

  const priceLabel = price !== null ? `₹${price.toLocaleString("en-IN")}` : null;

  return (
    <div className="mt-3 rounded-xl border border-dashed border-orange-300/70 bg-orange-50/60 px-3 py-2.5 flex flex-col gap-2">
      <p className="text-[11px] text-orange-900/80 font-medium leading-snug">
        {variant === "awaiting"
          ? "Results are still pending — secure your seat now and skip the wait."
          : "Didn't make the merit cut? You can still join the program."}
      </p>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] text-orange-700/70">
          {variant === "awaiting"
            ? "Confirmed seat · pay once, join guaranteed"
            : "Paid entry stays open for 15 days after your cohort starts ·"}
          {priceLabel ? (
            <span className="ml-1 font-semibold text-orange-900">{priceLabel}</span>
          ) : null}
        </span>
        <button
          type="button"
          onClick={handlePurchase}
          disabled={loading}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition shrink-0",
            "bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          {loading ? (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <LockOpen className="h-3 w-3" />
          )}
          {loading
            ? "Please wait…"
            : row.enrollmentType === "paid"
              ? "Complete Payment"
              : "Purchase Confirmed Seat"}
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}

export default function DashboardInternshipCard({ row }: Props) {
  const title =
    row.internshipSnapshot?.title ||
    row.internship?.title ||
    "Internship program";
  const slug =
    row.internship?.slug?.trim() || row.internshipSnapshot?.slug?.trim() || "";
  const batchName = row.batchSnapshot?.name?.trim() || "Cohort";
  const start = formatCohortDate(row.batchSnapshot?.internshipStartDate);

  const showExamAction = EXAM_ACTION_STATUSES.has(row.status);
  const showExamWaiting = EXAM_WAITING_STATUSES.has(row.status);
  const ENROLLED_STATUSES = new Set(["enrolled", "completed", "paused"]);
  const certReminder = ENROLLED_STATUSES.has(row.status)
    ? getCertificationExamListReminder(
        row.certificationExamStartAt,
        row.certificationExamEndAt,
      )
    : { show: false as const };
  const programHref = slug
    ? ENROLLED_STATUSES.has(row.status)
      ? `/dashboard/internships/${encodeURIComponent(slug)}`
      : `/internships/${encodeURIComponent(slug)}`
    : null;

  // ── Buy-confirmed-seat logic ─────────────────────────────────────────────
  const now = Date.now();
  const examResultTime = row.examResultAt
    ? new Date(row.examResultAt).getTime()
    : null;
  const batchStartTime = row.batchSnapshot?.internshipStartDate
    ? new Date(row.batchSnapshot.internshipStartDate).getTime()
    : null;

  const resultAnnounced = examResultTime !== null && now > examResultTime;

  // 15-day grace window from batch start (if no batch start date, assume within window)
  const withinGracePeriod =
    batchStartTime !== null
      ? now - batchStartTime < 15 * 24 * 60 * 60 * 1000
      : true;

  // Case 1: results not yet announced for exam_attempted / in_merit_pool
  const isAwaitingResult =
    (row.status === "exam_attempted" || row.status === "in_merit_pool") &&
    !resultAnnounced;

  // Case 2: result out + failed (exam_attempted after result date) OR admin rejected —
  //         offer a paid seat within 15 days of batch start
  const isPostFailGrace =
    ((row.status === "exam_attempted" && resultAnnounced) ||
      row.status === "admin_rejected") &&
    withinGracePeriod;

  const showBuyConfirmedSeat = isAwaitingResult || isPostFailGrace;

  /** Enrolled but cohort `internshipStartDate` is still in the future — hide tasks link. */
  const cohortNotStartedYet =
    batchStartTime !== null && now < batchStartTime;
  const hideDashboardProgramLink =
    ENROLLED_STATUSES.has(row.status) && cohortNotStartedYet;

  return (
    <div
      className={cn(
        "group relative flex min-h-[168px] overflow-hidden rounded-2xl border-2 border-dashed border-amber-400/50",
        "bg-linear-to-br from-amber-50 via-orange-50/80 to-amber-100/40",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.9)_inset,0_8px_24px_-12px_rgba(120,60,20,0.18)]",
      )}
    >
      {/* Vertical ticket rail */}
      <div
        className="flex w-12 shrink-0 flex-col items-center justify-between border-r-2 border-dashed border-amber-400/40 bg-stone-900 py-4 text-center"
        aria-hidden
      >
        <Ticket className="h-4 w-4 text-amber-200" strokeWidth={2} />
        <span
          className="text-[0.6rem] font-bold uppercase leading-tight text-amber-100/90 [writing-mode:vertical-rl] rotate-180 tracking-[0.2em]"
          style={{ textOrientation: "mixed" }}
        >
          Intake
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
        {/* Top info */}
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-900/55">
              Internship
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                statusBadgeClass(row.status),
              )}
            >
              {formatStatusLabel(row.status)}
            </span>
          </div>
          <h2 className="line-clamp-2 text-base font-bold leading-snug text-stone-900 sm:text-lg">
            {title}
          </h2>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-sm text-stone-800">{batchName}</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-stone-600">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-stone-500" />
              <span className="font-mono">Starts {start}</span>
            </span>
          </div>
          {certReminder.show && (
            <div
              className="mt-3 rounded-xl border border-violet-300/80 bg-linear-to-r from-violet-50 to-indigo-50/90 px-3 py-2.5"
              role="status"
            >
              <div className="flex gap-2 min-w-0">
                <div className="shrink-0 rounded-lg bg-violet-100 border border-violet-200/80 p-1.5">
                  <GraduationCap className="h-4 w-4 text-violet-800" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-bold text-violet-950">
                    {certReminder.phase === "upcoming"
                      ? "Certification exam coming up"
                      : "Certification exam open"}
                  </p>
                  <p className="text-[11px] leading-snug text-violet-950/85">
                    {certReminder.phase === "upcoming" ? (
                      <>
                        Your certification window starts in two days or less
                        (UTC). Schedule:{" "}
                        <span className="font-mono text-violet-900">
                          {formatCertExamUtcRange(
                            certReminder.examStartAt,
                            certReminder.examEndAt,
                          )}
                        </span>
                        . Open your program page when the window opens.
                      </>
                    ) : (
                      <>
                        Complete your certification today before the window
                        closes:{" "}
                        <span className="font-mono text-violet-900">
                          {formatCertExamUtcRange(
                            certReminder.examStartAt,
                            certReminder.examEndAt,
                          )}
                        </span>
                        .
                      </>
                    )}
                  </p>
                  {programHref && !hideDashboardProgramLink && (
                    <Link
                      href={programHref}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-900 underline-offset-2 hover:underline"
                    >
                      Go to program
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom action */}
        <div className="mt-4 border-t border-dashed border-amber-800/15 pt-3">
          {showExamAction ? (
            /* Exam registered but not yet submitted — countdown + take exam */
            <div className="flex items-end justify-between gap-3">
              <p className="text-[11px] text-stone-500">
                {(() => {
                  const now = Date.now();
                  const start = row.examStartAt ? new Date(row.examStartAt).getTime() : null;
                  const end = row.examEndAt ? new Date(row.examEndAt).getTime() : null;
                  if (end && now > end) return "The exam window has closed";
                  if (start && now < start) return "Exam window hasn't opened yet";
                  return "Complete the entrance exam to confirm your seat";
                })()}
              </p>
              <ExamCountdownButton
                enrollmentId={row._id}
                examStartAt={row.examStartAt}
                examEndAt={row.examEndAt}
                examResultAt={row.examResultAt}
                size="card"
              />
            </div>
          ) : showExamWaiting ? (
            /* Exam already submitted / in merit pool — waiting chip + optional buy seat */
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-stone-500">
                  {row.status === "exam_attempted"
                    ? resultAnnounced
                      ? "Result announced — you didn't reach the merit threshold"
                      : "Exam submitted — results pending"
                    : "You're in the merit pool — selection pending"}
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-900 shrink-0">
                  <Hourglass className="h-3 w-3" />
                  Awaiting outcome
                </span>
              </div>
              {showBuyConfirmedSeat && (
                <BuyConfirmedSeatCta row={row} variant={isAwaitingResult ? "awaiting" : "post_fail"} />
              )}
            </div>
          ) : row.status === "admin_rejected" ? (
            /* Admin rejected — show buy seat within grace window, else terminal message */
            <div className="flex flex-col gap-1">
              <p className="text-[11px] text-stone-500">
                {isPostFailGrace
                  ? "You weren't selected from the merit pool this time."
                  : "You weren't selected from the merit pool. The 15-day offer has expired."}
              </p>
              {showBuyConfirmedSeat && (
                <BuyConfirmedSeatCta row={row} variant="post_fail" />
              )}
            </div>
          ) : (
            /* Enrolled / other: standard open-program link */
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-stone-500">
                {hideDashboardProgramLink ? (
                  <>
                    Your cohort begins{" "}
                    {start !== "—" ? (
                      <span className="font-mono text-stone-700">{start}</span>
                    ) : (
                      "soon"
                    )}
                    . Tasks will be available once the internship starts.
                  </>
                ) : row.internshipSuccessPoints > 0 ? (
                  <>
                    <span className="font-mono text-stone-700">
                      {row.internshipSuccessPoints}
                    </span>{" "}
                    success points
                  </>
                ) : (
                  "Track your cohort on the program page"
                )}
              </p>
              {programHref && !hideDashboardProgramLink ? (
                <Link
                  href={programHref}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-950 underline-offset-2 transition hover:text-orange-700 hover:underline shrink-0"
                >
                  {ENROLLED_STATUSES.has(row.status) ? "View tasks" : "Open program"}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : hideDashboardProgramLink ? (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-900 shrink-0">
                  <Hourglass className="h-3 w-3" />
                  Not started yet
                </span>
              ) : (
                <span className="text-xs text-stone-400">
                  Program link unavailable
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
