"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Hourglass,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { InternshipEnrollmentListRow } from "@/types";
import { cn } from "@/lib/utils";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import Modal from "@/components/ui/Modal";
import DocumentationSubmissionModal from "./DocumentationSubmissionModal";
import SwitchBatchModal from "./SwitchBatchModal";
import ExamCountdownButton from "./ExamCountdownButton";
import InternshipFlowProgress from "./InternshipFlowProgress";
import {
  formatCertExamIstRange,
  getCertificationExamListReminder,
} from "@/lib/internshipCertificationReminder";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { withdrawPaymentPendingEnrollment } from "@/hooks/useMyInternshipEnrollments";

function statusBadgeClass(status: string) {
  if (status === "enrolled")
    return "bg-emerald-100 text-emerald-900 border-emerald-200";
  if (status === "completed")
    return "bg-slate-200 text-slate-900 border-slate-300";
  if (status === "exam_attempted")
    return "bg-amber-200/90 text-amber-950 border-amber-300";
  if (status === "exam_registered")
    return "bg-orange-100 text-orange-900 border-orange-200";
  if (status === "payment_pending")
    return "bg-orange-200 text-orange-950 border-orange-300";
  if (status === "pending_documentation")
    return "bg-rose-100 text-rose-900 border-rose-200";
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

/** Thin left accent that encodes the enrollment's stage at a glance — replaces
 *  the old ticket rail with the same status language as the exam banner. */
function statusAccentBar(status: string, failedOrMissed: boolean): string {
  if (failedOrMissed) return "bg-linear-to-b from-rose-400 to-red-400";
  if (status === "enrolled" || status === "completed")
    return "bg-linear-to-b from-emerald-400 to-green-500";
  if (status === "exam_registered")
    return "bg-linear-to-b from-amber-400 to-orange-500";
  if (status === "exam_attempted")
    return "bg-linear-to-b from-amber-400 to-orange-400";
  if (status === "payment_pending")
    return "bg-linear-to-b from-orange-400 to-amber-500";
  if (status === "pending_documentation")
    return "bg-linear-to-b from-rose-400 to-pink-500";
  if (status === "paused")
    return "bg-linear-to-b from-violet-400 to-purple-500";
  return "bg-linear-to-b from-stone-300 to-stone-400";
}

function formatStatusLabel(status: string) {
  if (status === "admin_rejected") return "Not Pass";
  if (status === "pending_documentation") return "Documents needed";
  return status.replace(/_/g, " ");
}

function formatCohortDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return "—";
  }
}

type Props = {
  row: InternshipEnrollmentListRow;
  /** Called after learner removes a `payment_pending` registration (refetch list). */
  onWithdrawn?: () => void;
};

/** Only when exam is registered but NOT yet submitted — show countdown + button. */
const EXAM_ACTION_STATUSES = new Set(["exam_registered"]);
/** Submitted / awaiting outcome — show passive waiting chip, no button.
 *  `in_merit_pool` is masked to `exam_attempted` server-side to avoid leaking
 *  pool membership; we only see `exam_attempted` here. */
const EXAM_WAITING_STATUSES = new Set(["exam_attempted"]);

/** Buy-confirmed-seat CTA — handles fetching price + payment initiation. */
function BuyConfirmedSeatCta({
  row,
  variant,
}: {
  row: InternshipEnrollmentListRow;
  variant: "pre_exam" | "awaiting" | "post_fail" | "missed_exam";
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
        const internship = res.data?.data as
          | {
              batches?: {
                _id?: string;
                plan?: { price?: number; isActive?: boolean };
              }[];
            }
          | undefined;
        const batchId = row.batchSnapshot?.batchId;
        const batch = internship?.batches?.find((b) => b._id === batchId);
        const p = batch?.plan?.price;
        if (typeof p === "number") setPrice(p);
      })
      .catch(() => {
        /* price stays null — button still works */
      });
    return () => {
      cancelled = true;
    };
  }, [slug, row.batchSnapshot?.batchId]);

  const handlePurchase = async () => {
    const internshipId = row.internship?._id;
    const batchId = row.batchSnapshot?.batchId;
    if (!internshipId || !batchId) {
      setError("Missing enrollment data, please refresh the page.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Register for paid seat (creates new enrollment or upgrades existing)
      const enrollRes = await apiClient.post(
        ENDPOINTS.internshipEnrollments.create,
        {
          internshipId,
          batchId,
          path: "paid",
        },
      );
      const enrollmentId = enrollRes.data?.data?.enrollmentId as
        | string
        | undefined;
      if (!enrollmentId) throw new Error("Enrollment creation failed");

      // Create Paytm order
      const orderRes = await apiClient.post(
        ENDPOINTS.orders.createInternshipSeat,
        {
          internshipEnrollmentId: enrollmentId,
        },
      );
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

  const priceLabel =
    price !== null ? `₹${price.toLocaleString("en-IN")}` : null;

  // Pre-exam variant leads with the course-purchase path (recommended) and
  // demotes the seat-only fee to a subtle secondary option. Other variants
  // (awaiting / post-fail / missed-exam) keep the original single-CTA layout
  // since the course path is most useful before the exam takes place.
  if (variant === "pre_exam") {
    return (
      <div className="mt-3 space-y-2">
        {/* Primary path: buy a course to confirm seat */}
        <div
          className={cn(
            "rounded-xl border-2 border-orange-300 bg-linear-to-br from-orange-50 to-amber-50/60",
            "px-3.5 py-3 space-y-2.5 shadow-[0_1px_0_0_rgba(255,255,255,0.7)_inset]",
          )}
        >
          <p className="text-xs text-stone-700 leading-relaxed">
            Buy any course from our catalogue and your cohort seat is confirmed
            automatically skip the entrance exam and keep the full course on
            top.
          </p>
          <div className="flex justify-end pt-0.5">
            <Link
              href="/programs"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition shrink-0",
                "bg-orange-500 text-white hover:bg-orange-600 shadow-sm",
              )}
            >
              <BookOpen className="size-3.5" aria-hidden />
              Browse courses
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Secondary, subtle path: pay seat fee directly */}
        <div className="flex items-center justify-between gap-2 flex-wrap rounded-lg border border-stone-200 bg-white/60 px-3 py-2">
          <p className="text-[11px] text-stone-600 leading-snug">
            Or pay a one-time seat fee
            {priceLabel ? (
              <>
                {" "}
                of{" "}
                <span className="font-semibold tabular-nums text-stone-800">
                  {priceLabel}
                </span>
              </>
            ) : null}{" "}
            for seat-only confirmation.
          </p>
          <button
            type="button"
            onClick={handlePurchase}
            disabled={loading}
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-semibold underline-offset-2 hover:underline shrink-0",
              "text-stone-600 hover:text-orange-700 disabled:opacity-60 disabled:cursor-not-allowed",
            )}
          >
            {loading && (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700" />
            )}
            {loading
              ? "Please wait…"
              : row.enrollmentType === "paid"
                ? "Complete payment"
                : "Confirm seat"}
          </button>
        </div>

        {error && (
          <p className="text-[11px] text-red-600 font-medium">{error}</p>
        )}
      </div>
    );
  }

  const heading =
    variant === "awaiting"
      ? "Skip the wait for results?"
      : variant === "missed_exam"
        ? "Missed the entrance exam?"
        : "Didn't make the merit cut?";

  const body =
    variant === "awaiting"
      ? "Lock in your seat now with a one-time fee no need to wait on results."
      : variant === "missed_exam"
        ? "You can still join this cohort with a one-time paid seat."
        : "Only a few seats left in this cohort secure yours now before they're gone.";

  return (
    <div
      className={cn(
        "mt-3 rounded-xl border border-amber-200/80 bg-amber-50/40",
        "px-3.5 py-3 space-y-2.5",
      )}
    >
      <p className="text-[11px] font-bold uppercase tracking-wide text-amber-900/90 flex items-center gap-1.5">
        <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
        {heading}
      </p>
      <p className="text-xs text-stone-700 leading-relaxed">{body}</p>
      <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
        {priceLabel ? (
          <span className="text-base font-bold tabular-nums text-stone-900">
            {priceLabel}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handlePurchase}
          disabled={loading}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0",
            "bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          {loading && (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {loading
            ? "Please wait…"
            : row.enrollmentType === "paid"
              ? "Complete Payment"
              : "Confirm Seat"}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-600 font-medium">{error}</p>}
    </div>
  );
}

export default function DashboardInternshipCard({ row, onWithdrawn }: Props) {
  const [withdrawing, setWithdrawing] = useState(false);
  const [resumingPayment, setResumingPayment] = useState(false);
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const title =
    row.internshipSnapshot?.title ||
    row.internship?.title ||
    "Internship program";
  const slug =
    row.internship?.slug?.trim() || row.internshipSnapshot?.slug?.trim() || "";
  const batchName = row.batchSnapshot?.name?.trim() || "Cohort";
  const start = formatCohortDate(row.batchSnapshot?.internshipStartDate);

  const showExamWaiting = EXAM_WAITING_STATUSES.has(row.status);

  // Explain a missed certificate — but NEVER to a learner an admin has rescued.
  // `certificateOverride: "pass"` issues the certificate while the evaluation
  // snapshot still reads "fail", so without this guard a certified learner
  // would be told they didn't qualify.
  const showCertificateShortfall =
    row.certificateEvaluation?.verdict === "fail" &&
    row.certificateOverride !== "pass";

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
  const examEndTime = row.examEndAt ? new Date(row.examEndAt).getTime() : null;
  const batchStartTime = row.batchSnapshot?.internshipStartDate
    ? new Date(row.batchSnapshot.internshipStartDate).getTime()
    : null;

  const resultAnnounced = examResultTime !== null && now > examResultTime;

  // Paid-entry window stays open from registration through 15 days after
  // results — covers early purchase ("unsure about result, lock seat now")
  // and post-result grace. Mirrors backend `isPaidUpgradeWindowOpen`.
  //
  // Three "open" branches, in order:
  //   1. Exam window hasn't ended yet (or no `examEndAt`) — the window
  //      cannot close before the exam itself concludes. Guards against
  //      malformed configs where `examResultAt` predates the exam.
  //   2. `examResultAt` not scheduled — no upper bound, treat as open.
  //   3. Within 15 days of the announced result.
  const examEnded = examEndTime !== null && now > examEndTime;
  const withinGracePeriod =
    !examEnded ||
    examResultTime === null ||
    now < examResultTime + 15 * 24 * 60 * 60 * 1000;

  // No-show: registered for the merit-track exam but the exam window closed
  // without an attempt. Status stays `exam_registered` forever (no cron flips it).
  const isExamNoShow =
    row.status === "exam_registered" &&
    examEndTime !== null &&
    now > examEndTime;

  // Case 1: outcome still uncertain — `exam_attempted` covers both genuine
  // pre-result waits and (server-masked) merit-pool members. We treat both
  // identically so the UI never reveals which one this learner actually is,
  // either pre- or post-result. Post-result is bounded by the grace window.
  const isAwaitingResult =
    row.status === "exam_attempted" && (!resultAnnounced || withinGracePeriod);

  // Case 2: admin explicitly rejected — terminal, the learner is told they
  // weren't picked. Paid seat offer stays open for 15 days post-result.
  const isPostFailGrace = row.status === "admin_rejected" && withinGracePeriod;

  // Case 3: no-show during paid-entry grace window
  const isMissedExamGrace = isExamNoShow && withinGracePeriod;

  // Case 4: still pre-exam (registered, exam window not yet closed). Lets
  // the learner skip the exam entirely by paying upfront. Backend already
  // permits this (isPaidUpgradeWindowOpen opens from registration), it was
  // just absent from the UI.
  const isPreExamPurchaseable =
    row.status === "exam_registered" && !isExamNoShow && withinGracePeriod;

  const showBuyConfirmedSeat =
    isAwaitingResult ||
    isPostFailGrace ||
    isMissedExamGrace ||
    isPreExamPurchaseable;

  // No-show takes precedence over the exam-registered countdown branch.
  const showExamAction = EXAM_ACTION_STATUSES.has(row.status) && !isExamNoShow;

  // Learner may move a pre-exam registration to another cohort within 15 days
  // of the current batch's start. The server re-validates the target batch.
  const switchWindowOpen =
    showExamAction &&
    batchStartTime !== null &&
    now <= batchStartTime + 15 * 24 * 60 * 60 * 1000;

  // Failed (admin rejected) or missed (merit no-show) — wash the card red.
  const isFailedOrMissed = row.status === "admin_rejected" || isExamNoShow;

  /** Enrolled but cohort `internshipStartDate` is still in the future — hide tasks link. */
  const cohortNotStartedYet = batchStartTime !== null && now < batchStartTime;
  /** Program window has closed — tasks/live classes are no longer accessible. */
  const programEndTime = row.endDate ? new Date(row.endDate).getTime() : null;
  const programEnded =
    programEndTime !== null && !Number.isNaN(programEndTime) && now > programEndTime;
  const hideDashboardProgramLink =
    ENROLLED_STATUSES.has(row.status) && (cohortNotStartedYet || programEnded);

  const pendingCtx = row.paymentPendingContext;
  const paymentPendingBlocked = Boolean(
    pendingCtx &&
    (!pendingCtx.internshipExists ||
      !pendingCtx.batchExistsOnProgram ||
      !pendingCtx.applicationWindowOpen),
  );
  const paymentPendingBlockMessage =
    pendingCtx && paymentPendingBlocked
      ? !pendingCtx.internshipExists
        ? "This program is no longer available, so checkout cannot continue. You can remove this pending signup below or contact support."
        : !pendingCtx.batchExistsOnProgram
          ? "This cohort is no longer on the program, so checkout cannot continue. You can remove this pending signup below or contact support."
          : `The enrollment deadline${
              row.batchSnapshot?.applicationLastDate
                ? ` (${formatCohortDate(row.batchSnapshot.applicationLastDate)})`
                : ""
            } has passed. Checkout is closed remove this registration or contact support.`
      : null;

  const handleResumePayment = async () => {
    setResumingPayment(true);
    try {
      const orderRes = await apiClient.post(
        ENDPOINTS.orders.createInternshipSeat,
        { internshipEnrollmentId: row._id },
      );
      const order = orderRes.data?.data as
        | { _id: string; freeOrder?: boolean; token?: string }
        | undefined;
      if (!order) throw new Error("Could not start payment");
      if (order.freeOrder && order.token) {
        window.location.href = `/payment/status/${order._id}?token=${order.token}`;
        return;
      }
      window.location.href = `/paytm-redirect?orderId=${order._id}`;
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ??
        (e instanceof Error ? e.message : "Could not start payment");
      toast.error(msg);
      setResumingPayment(false);
    }
  };

  const executeWithdrawPending = async () => {
    setWithdrawing(true);
    try {
      await withdrawPaymentPendingEnrollment(row._id);
      toast.success("Registration removed");
      setWithdrawConfirmOpen(false);
      onWithdrawn?.();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Could not remove registration";
      toast.error(msg);
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "group relative min-h-[168px] overflow-hidden rounded-2xl border",
          isFailedOrMissed
            ? "border-rose-200 bg-linear-to-br from-rose-50 via-white to-red-100/70"
            : "border-stone-200 bg-white",
          "shadow-[0_1px_0_0_rgba(255,255,255,0.9)_inset,0_6px_20px_-12px_rgba(120,60,20,0.15)]",
        )}
      >
        {/* Status accent — the stage, read at a glance. */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 w-1.5",
            statusAccentBar(row.status, isFailedOrMissed),
          )}
        />

        {/* Offer letter — corner button on the card, shown in ANY stage once generated. */}
        {row.offerLetterUrl && (
          <a
            href={row.offerLetterUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Download offer letter"
            className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-100"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden whitespace-nowrap sm:inline">
              Download offer letter
            </span>
            <span className="sm:hidden">Offer</span>
          </a>
        )}

        <div className="flex min-w-0 flex-col justify-between p-4 pl-5 sm:p-5 sm:pl-6">
          {/* Top info */}
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
                  statusBadgeClass(row.status),
                )}
              >
                {formatStatusLabel(row.status)}
              </span>
            </div>
            <h2 className="line-clamp-2 text-base font-bold leading-snug text-stone-900 sm:text-lg">
              {title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
              <span className="font-semibold text-stone-700">{batchName}</span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                Starts {start}
              </span>
            </div>
            <InternshipFlowProgress
              status={row.status}
              failedOrMissed={isFailedOrMissed}
            />
            {showCertificateShortfall && (
              <div
                className="mt-3 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2.5"
                role="status"
              >
                <p className="text-xs font-bold text-rose-800">
                  Certificate not awarded
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-rose-950/80">
                  You earned{" "}
                  <span className="font-semibold">
                    {row.certificateEvaluation!.earned}
                  </span>{" "}
                  of the{" "}
                  <span className="font-semibold">
                    {row.certificateEvaluation!.requiredPoints}
                  </span>{" "}
                  success points needed (
                  {row.certificateEvaluation!.thresholdPct}% of{" "}
                  {row.certificateEvaluation!.totalAchievable} achievable) before
                  your program ended.
                </p>
                <p className="mt-2 text-[10px] leading-snug text-rose-950/65">
                  If you think this is a mistake, reach out to our support team
                  at{" "}
                  <a
                    href="tel:+918929252575"
                    className="font-semibold text-rose-800 underline underline-offset-2 hover:text-rose-900"
                  >
                    +91-8929252575
                  </a>{" "}
                  and we&apos;ll review it with you.
                </p>
              </div>
            )}
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
                          (IST). Schedule:{" "}
                          <span className="font-mono text-violet-900">
                            {formatCertExamIstRange(
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
                            {formatCertExamIstRange(
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

          {/* Bottom action — edge-to-edge panel with a distinct background
             so it reads as a separate "what to do next" zone. */}
          <div
            className={cn(
              "mt-4 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 border-t px-4 pt-3 pb-4 sm:px-5 sm:pb-5",
              isFailedOrMissed
                ? "border-rose-200 bg-rose-50/80"
                : "border-stone-200 bg-stone-50",
            )}
          >
            {showExamAction ? (
              /* Exam registered but not yet submitted. The exam is the main
                 event (hero countdown); the paid paths are demoted under an
                 "or skip the wait" divider, and switching cohort is tertiary. */
              <div className="flex flex-col gap-3">
                {/* Hero: the entrance exam is the main event — warm, branded
                   panel that frames the live countdown + action. */}
                <div className="rounded-xl border border-orange-200/70 bg-linear-to-br from-orange-50 to-amber-50/40 px-3.5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-orange-700">
                        <Clock className="size-3.5 shrink-0" />
                        Entrance exam
                      </p>
                      <p className="mt-1 text-xs text-stone-600">
                        {(() => {
                          const now = Date.now();
                          const start = row.examStartAt
                            ? new Date(row.examStartAt).getTime()
                            : null;
                          const end = row.examEndAt
                            ? new Date(row.examEndAt).getTime()
                            : null;
                          if (end && now > end)
                            return "The exam window has closed";
                          if (start && now < start)
                            return "Sit tight, we'll open it on schedule";
                          return "It's open, complete it to confirm your seat";
                        })()}
                      </p>
                    </div>
                    <ExamCountdownButton
                      enrollmentId={row._id}
                      examStartAt={row.examStartAt}
                      examEndAt={row.examEndAt}
                      examResultAt={row.examResultAt}
                      size="card"
                    />
                  </div>
                </div>

                {/* Alternative path: skip the exam by securing a seat now */}
                {isPreExamPurchaseable && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="h-px flex-1 bg-stone-200" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                        or skip the wait
                      </span>
                      <span className="h-px flex-1 bg-stone-200" />
                    </div>
                    <BuyConfirmedSeatCta row={row} variant="pre_exam" />
                  </>
                )}

                {/* Tertiary: move to a different cohort */}
                {switchWindowOpen && slug && (
                  <button
                    type="button"
                    onClick={() => setSwitchModalOpen(true)}
                    className="inline-flex items-center gap-1.5 self-start pt-1 text-xs font-medium text-stone-500 underline-offset-2 transition hover:text-orange-700 hover:underline"
                  >
                    <ArrowLeftRight className="size-3.5" />
                    Register for another cohort
                  </button>
                )}
              </div>
            ) : isExamNoShow ? (
              /* Merit-track learner who didn't attempt the entrance exam — terminal */
              <div className="flex flex-col gap-1">
                <p className="text-[11px] text-stone-500">
                  {isMissedExamGrace
                    ? "You missed the entrance exam."
                    : "You missed the entrance exam. The paid entry window has closed."}
                </p>
                {isMissedExamGrace && (
                  <BuyConfirmedSeatCta row={row} variant="missed_exam" />
                )}
              </div>
            ) : showExamWaiting ? (
              /* Exam submitted — waiting chip + optional buy seat. Copy is
                 deliberately neutral: this branch covers both genuine
                 pre-result waits and (server-masked) merit-pool members,
                 and we must not reveal which one. */
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-stone-500">
                    {resultAnnounced
                      ? "Final seat allocations are still being made"
                      : "Exam submitted — results pending"}
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-900 shrink-0">
                    <Hourglass className="h-3 w-3" />
                    Awaiting outcome
                  </span>
                </div>
                {showBuyConfirmedSeat && (
                  <BuyConfirmedSeatCta row={row} variant="awaiting" />
                )}
              </div>
            ) : row.status === "admin_rejected" ? (
              /* Admin rejected — show buy seat within grace window, else terminal message */
              <div className="flex flex-col gap-1">
                <p className="text-[11px] text-stone-500">
                  {isPostFailGrace
                    ? "You weren't selected from the merit pool this time."
                    : "You weren't selected from the merit pool, and seats for this cohort are no longer available."}
                </p>
                {showBuyConfirmedSeat && (
                  <BuyConfirmedSeatCta row={row} variant="post_fail" />
                )}
              </div>
            ) : row.status === "pending_documentation" ? (
              (() => {
                const docsEnd = row.documentationEndAt
                  ? new Date(row.documentationEndAt).getTime()
                  : null;
                const windowClosed = docsEnd !== null && now > docsEnd;
                return (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] text-rose-900/85 leading-snug">
                      {windowClosed
                        ? "The documentation window has closed. Contact your program administrator to complete documentation and unlock tasks."
                        : "Submit your Aadhar and a recent photo to unlock tasks and the certification exam."}
                    </p>
                    <div className="flex justify-end">
                      <OrangeButton
                        glow={false}
                        type="button"
                        onClick={() => setDocsModalOpen(true)}
                        className="inline-flex items-center justify-center gap-1.5 min-h-9 px-4 text-xs sm:text-sm font-semibold"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {windowClosed ? "View status" : "Submit documents"}
                      </OrangeButton>
                    </div>
                  </div>
                );
              })()
            ) : row.status === "payment_pending" ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                <p className="text-[11px] text-stone-600 max-w-xl leading-snug">
                  {paymentPendingBlockMessage ? (
                    <span className="text-amber-950 font-medium">
                      {paymentPendingBlockMessage}
                    </span>
                  ) : (
                    <>
                      You began signing up for this program, but payment has not
                      finished yet. Continue below to open secure checkout.
                    </>
                  )}
                </p>
                <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                  <OrangeButton
                    glow={false}
                    type="button"
                    onClick={() => void handleResumePayment()}
                    disabled={
                      resumingPayment || withdrawing || paymentPendingBlocked
                    }
                    className="inline-flex items-center justify-center gap-1.5 min-h-9 px-4 text-xs sm:text-sm font-semibold"
                  >
                    {resumingPayment ? "Redirecting…" : "Complete payment"}
                  </OrangeButton>
                  <button
                    type="button"
                    onClick={() => setWithdrawConfirmOpen(true)}
                    disabled={withdrawing || resumingPayment}
                    className={cn(
                      "text-xs sm:text-sm font-semibold text-stone-600 underline underline-offset-2",
                      "hover:text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed p-0 bg-transparent border-0 cursor-pointer",
                    )}
                  >
                    No longer interested
                  </button>
                </div>
              </div>
            ) : (
              /* Enrolled / other: standard open-program link */
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  {row.internshipSuccessPoints > 0 && !hideDashboardProgramLink ? (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2">
                      <Sparkles className="h-4 w-4 text-amber-700 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-amber-900/80 leading-tight">
                          Success Points
                        </span>
                        <span className="font-mono text-base font-bold text-amber-950 leading-none tabular-nums">
                          {row.internshipSuccessPoints}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-stone-500">
                      {programEnded ? (
                        "Your internship program has ended. Tasks and live classes are now closed."
                      ) : hideDashboardProgramLink ? (
                        <>
                          Your cohort begins{" "}
                          {start !== "—" ? (
                            <span className="font-mono text-stone-700">
                              {start}
                            </span>
                          ) : (
                            "soon"
                          )}
                          . Tasks will be available once the internship starts.
                        </>
                      ) : (
                        "Track your cohort on the program page"
                      )}
                    </p>
                  )}
                  {programHref && !hideDashboardProgramLink ? (
                    <Link
                      href={programHref}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-950 underline-offset-2 transition hover:text-orange-700 hover:underline shrink-0"
                    >
                      {ENROLLED_STATUSES.has(row.status)
                        ? "View tasks"
                        : "Open program"}
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  ) : hideDashboardProgramLink ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300/60 bg-stone-50 px-3 py-1.5 text-[11px] font-semibold text-stone-600 shrink-0">
                      <Hourglass className="h-3 w-3" />
                      {programEnded ? "Program ended" : "Not started yet"}
                    </span>
                  ) : (
                    <span className="text-xs text-stone-400">
                      Program link unavailable
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={withdrawConfirmOpen}
        onClose={() => {
          if (!withdrawing) setWithdrawConfirmOpen(false);
        }}
        title="Remove this registration?"
        className="max-w-md w-full border border-amber-100/80 shadow-2xl"
      >
        <p className="text-sm text-stone-600 leading-relaxed">
          {paymentPendingBlocked && pendingCtx ? (
            <>
              This removes your unpaid signup so it stops showing here.{" "}
              {!pendingCtx.internshipExists
                ? "The program may have been removed — you may not be able to re-enroll the same way."
                : !pendingCtx.batchExistsOnProgram
                  ? "This cohort may have been removed — check the program page for current cohorts."
                  : "If the apply-by date has passed, you may need another cohort or intake."}{" "}
              You can still open the program page later if enrollment is open
              again.
            </>
          ) : (
            <>
              This will clear your unpaid signup for this cohort. You can enroll
              again later from the program page if you change your mind.
            </>
          )}
        </p>
        <div className="flex flex-wrap justify-end gap-2 mt-6">
          <WhiteButton
            type="button"
            glow={false}
            disabled={withdrawing}
            onClick={() => setWithdrawConfirmOpen(false)}
          >
            Cancel
          </WhiteButton>
          <OrangeButton
            type="button"
            glow={false}
            disabled={withdrawing}
            onClick={() => void executeWithdrawPending()}
          >
            {withdrawing ? "Removing…" : "Remove"}
          </OrangeButton>
        </div>
      </Modal>

      <DocumentationSubmissionModal
        isOpen={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
        enrollmentId={row._id}
        internshipSlug={
          row.internship?.slug ?? row.internshipSnapshot?.slug ?? ""
        }
        documentationStartAt={row.documentationStartAt}
        documentationEndAt={row.documentationEndAt}
        onSubmitted={() => onWithdrawn?.()}
      />

      <SwitchBatchModal
        isOpen={switchModalOpen}
        onClose={() => setSwitchModalOpen(false)}
        enrollmentId={row._id}
        internshipSlug={slug}
        currentBatchId={row.batchSnapshot?.batchId}
        onSwitched={() => onWithdrawn?.()}
      />
    </>
  );
}
