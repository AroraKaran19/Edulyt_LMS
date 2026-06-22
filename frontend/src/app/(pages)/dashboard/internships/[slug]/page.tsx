"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import apiClient from "@/configs/apiConfig";
import {
  Loader2,
  ChevronLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FilePen,
  Eye,
  AlertTriangle,
  ClipboardList,
  Sparkles,
  BadgeCheck,
  Download,
  Info,
  Video,
  ExternalLink,
  Check,
  X,
  PlayCircle,
} from "lucide-react";
import { ENDPOINTS } from "@/constants/endpoints";
import type { LearnerProgramDetail, LearnerTaskRow } from "@/types";
import type { StudentLiveMeetingItem } from "@/types/internship-live-meeting";
import useStudentInternshipLiveMeetings from "@/hooks/useStudentInternshipLiveMeetings";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string) {
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

function taskStatusConfig(row: LearnerTaskRow): {
  label: string;
  badgeClass: string;
  icon: React.ReactNode;
  actionLabel: string;
  canOpen: boolean;
} {
  const sub = row.submission;
  if (!sub) {
    if (row.isDue) {
      return {
        label: "Missed",
        badgeClass: "bg-red-100 text-red-900 border-red-200",
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        actionLabel: "Submission closed",
        canOpen: false,
      };
    }
    return {
      label: "Not started",
      badgeClass: "bg-sky-50 text-sky-900 border-sky-200",
      icon: <FilePen className="w-3.5 h-3.5" />,
      actionLabel: "Start task",
      canOpen: true,
    };
  }
  if (sub.needsResubmission) {
    return {
      label: "Resubmit requested",
      badgeClass: "bg-orange-100 text-orange-900 border-orange-200",
      icon: <FilePen className="w-3.5 h-3.5" />,
      actionLabel: "Re-upload",
      canOpen: true,
    };
  }
  if (sub.status === "draft") {
    return {
      label: "In progress",
      badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
      icon: <Clock className="w-3.5 h-3.5" />,
      actionLabel: "Continue",
      canOpen: true,
    };
  }
  if (sub.status === "submitted" || sub.status === "partially_reviewed") {
    return {
      label: "Submitted",
      badgeClass: "bg-violet-100 text-violet-900 border-violet-200",
      icon: <Eye className="w-3.5 h-3.5" />,
      actionLabel: "View submission",
      canOpen: true,
    };
  }
  if (sub.status === "fully_reviewed") {
    return {
      label: "Reviewed",
      badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-200",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      actionLabel: "View result",
      canOpen: true,
    };
  }
  return {
    label: sub.status,
    badgeClass: "bg-stone-100 text-stone-800 border-stone-200",
    icon: null,
    actionLabel: "Open",
    canOpen: true,
  };
}

const MAX_SUCCESS_POINTS_PURCHASE = 500;

function BuyInternshipSuccessPointsPanel({
  enrollmentId,
  inrPerPoint,
  currentPoints,
  certificationThreshold,
}: {
  enrollmentId: string;
  inrPerPoint: number;
  currentPoints: number;
  certificationThreshold: number;
}) {
  const suggested = Math.min(
    MAX_SUCCESS_POINTS_PURCHASE,
    Math.max(
      1,
      certificationThreshold > currentPoints
        ? certificationThreshold - currentPoints
        : 1,
    ),
  );
  const [qty, setQty] = useState(suggested);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeQty = Math.min(
    MAX_SUCCESS_POINTS_PURCHASE,
    Math.max(1, Math.floor(Number(qty)) || 1),
  );
  const total = Math.round(safeQty * inrPerPoint * 100) / 100;

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const orderRes = await apiClient.post(ENDPOINTS.orders.createInternshipSuccessPoints, {
        internshipEnrollmentId: enrollmentId,
        quantity: safeQty,
      });
      const order = orderRes.data?.data as
        | { _id: string; freeOrder?: boolean; token?: string }
        | undefined;
      if (!order?._id) throw new Error("Order creation failed");

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

  const needed = Math.max(0, certificationThreshold - currentPoints);

  return (
    <div className="rounded-2xl border border-amber-200/90 bg-linear-to-br from-amber-50/90 to-white p-4 shadow-sm space-y-3">
      <div className="flex items-start gap-2">
        <Sparkles className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-stone-900">Buy success points</p>
          <p className="text-xs text-stone-600 leading-snug">
            Points count toward your certification goal
            {certificationThreshold > 0 ? (
              <span className="font-mono text-stone-700">
                {" "}
                ({currentPoints}/{certificationThreshold}
                {needed > 0 ? ` · ${needed} more needed` : ""})
              </span>
            ) : null}
            . ₹{inrPerPoint.toLocaleString("en-IN")} per point.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-stone-500">Points</span>
          <input
            type="number"
            min={1}
            max={MAX_SUCCESS_POINTS_PURCHASE}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-24 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-sm font-mono text-stone-900"
          />
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-stone-500">Total</span>
          <span className="text-sm font-bold text-stone-900 font-mono">
            ₹{total.toLocaleString("en-IN")}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void handlePay()}
          disabled={loading}
          className={cn(
            "ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition",
            "bg-stone-900 text-amber-100 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {loading ? "Please wait…" : "Pay with Paytm"}
        </button>
      </div>
      {error ? (
        <p className="text-[11px] text-red-600 font-medium">{error}</p>
      ) : null}
    </div>
  );
}

// ─── Task card ─────────────────────────────────────────────────────────────────

function TaskCard({ task, slug }: { task: LearnerTaskRow; slug: string }) {
  const { label, badgeClass, icon, actionLabel, canOpen } =
    taskStatusConfig(task);
  const href = `/dashboard/internships/${encodeURIComponent(slug)}/${encodeURIComponent(task._id)}`;

  // Marks (grade) shown as x/y; success points are awarded all-or-nothing once
  // the learner is reviewed AND their marks clear the task's threshold.
  const marks = task.submission ? task.submission.totalAwardedScore : 0;
  const passed =
    !!task.submission &&
    task.submission.status === "fully_reviewed" &&
    marks >= task.scoreThreshold;

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Index indicator */}
      <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-100 border border-amber-200/80 flex items-center justify-center">
        <ClipboardList className="w-5 h-5 text-amber-800" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
              badgeClass,
            )}
          >
            {icon}
            {label}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-stone-900 line-clamp-2">
          {task.title}
        </h3>
        {task.description && (
          <p className="text-xs text-stone-500 line-clamp-2">
            {task.description}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
          <span>
            <span className="font-medium text-stone-700">
              {task.questionCount}
            </span>{" "}
            question{task.questionCount !== 1 ? "s" : ""}
          </span>

          {/* Marks (grade) as x/y */}
          {task.totalScore > 0 && (
            <span>
              <span className="font-medium text-stone-700 tabular-nums">
                {marks}
              </span>
              <span className="text-stone-400 tabular-nums">
                /{task.totalScore}
              </span>{" "}
              marks
            </span>
          )}

          {/* Success points this task awards on pass */}
          {task.successPoints > 0 &&
            (passed ? (
              <span className="font-medium text-emerald-700">
                +{task.successPoints} success pts
              </span>
            ) : (
              <span className="text-amber-700">
                <span className="font-medium tabular-nums">
                  {task.successPoints}
                </span>{" "}
                success pts on pass
              </span>
            ))}

          <span className="text-stone-400">Due {formatDate(task.dueAt)}</span>
        </div>
      </div>
      <div className="shrink-0 self-center">
        {canOpen ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-stone-700 transition"
          >
            {actionLabel}
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 px-3 py-2 text-xs font-medium text-stone-400 cursor-not-allowed select-none">
            {actionLabel}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Live meetings ────────────────────────────────────────────────────────────

function formatMeetingDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return "—";
  }
}

function meetingTiming(m: StudentLiveMeetingItem): {
  label: string;
  cls: string;
} {
  const now = Date.now();
  const start = new Date(m.startDateTime).getTime();
  const end = m.endDateTime ? new Date(m.endDateTime).getTime() : null;

  if (!Number.isNaN(start) && now < start) {
    return { label: "Upcoming", cls: "bg-sky-100 text-sky-900 border-sky-200" };
  }
  if (end && now < end) {
    return { label: "Live now", cls: "bg-emerald-100 text-emerald-900 border-emerald-200 animate-pulse" };
  }
  if (!end && now < start + 4 * 60 * 60 * 1000) {
    return { label: "Live now", cls: "bg-emerald-100 text-emerald-900 border-emerald-200 animate-pulse" };
  }
  return { label: "Past", cls: "bg-stone-100 text-stone-700 border-stone-200" };
}

function LiveMeetingCard({ m }: { m: StudentLiveMeetingItem }) {
  const t = meetingTiming(m);
  const isPast = t.label === "Past";
  const both = m.link1Clicked && m.link2Clicked;
  const partial = (m.link1Clicked || m.link2Clicked) && !both;
  const hasRecording = !!m.recordingLink?.trim();

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm hover:shadow-md transition-shadow sm:flex-row sm:items-start sm:gap-4">
      <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-100 border border-amber-200/80 flex items-center justify-center">
        <Video className="w-5 h-5 text-amber-800" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
              t.cls,
            )}
          >
            {t.label}
          </span>
          {isPast ? (
            both ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-900">
                <Check className="w-3 h-3" /> Present
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-900">
                <X className="w-3 h-3" /> Absent
              </span>
            )
          ) : both ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-900">
              <Check className="w-3 h-3" /> Present
            </span>
          ) : partial ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900">
              1 of 2 attendances done
            </span>
          ) : null}
        </div>
        <h3 className="text-sm font-semibold text-stone-900 line-clamp-2">
          {m.name}
        </h3>
        {m.description ? (
          <p className="text-xs text-stone-500 line-clamp-2">{m.description}</p>
        ) : null}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
          <span className="font-mono">{formatMeetingDateTime(m.startDateTime)}</span>
          {m.endDateTime ? (
            <span className="font-mono text-stone-400">
              → {formatMeetingDateTime(m.endDateTime)}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-row flex-wrap gap-2 sm:flex-col sm:items-end sm:self-center">
        <a
          href={m.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-stone-700 transition"
        >
          Join
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        {hasRecording ? (
          <a
            href={m.recordingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-violet-300 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-800 hover:bg-violet-100 transition"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Watch recording
          </a>
        ) : null}
      </div>
    </div>
  );
}

function LiveClassesTab({ slug }: { slug: string }) {
  const { items, isLoading, isAppending, hasMore, total, error, loadMore } =
    useStudentInternshipLiveMeetings(slug);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Infinite scroll: trigger loadMore when the sentinel scrolls into view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && hasMore && !isLoading && !isAppending) {
            void loadMore();
          }
        }
      },
      { rootMargin: "120px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, isLoading, isAppending, loadMore]);

  if (isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-stone-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading live classes…
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 py-12 px-4 text-center">
        <Video className="mx-auto mb-3 h-8 w-8 text-stone-300" />
        <p className="font-medium text-stone-700">No live classes yet</p>
        <p className="mt-1 text-xs text-stone-500">
          Scheduled sessions for your batch will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-stone-900">Live classes</h2>
        <span className="text-sm text-stone-500">
          {total} {total === 1 ? "class" : "classes"}
        </span>
      </div>
      <div className="space-y-3">
        {items.map((m) => (
          <LiveMeetingCard key={m._id} m={m} />
        ))}
      </div>
      {/* Infinite-scroll sentinel + loading footer */}
      <div ref={sentinelRef} />
      {isAppending ? (
        <div className="flex items-center justify-center gap-2 py-3 text-xs text-stone-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading more…
        </div>
      ) : !hasMore ? (
        <div className="py-3 text-center text-xs text-stone-400">
          You&apos;ve reached the end.
        </div>
      ) : null}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InternshipProgramPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = decodeURIComponent(params.slug ?? "");

  const [data, setData] = useState<LearnerProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tasks" | "live-classes">("tasks");

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<{ data: LearnerProgramDetail }>(
          ENDPOINTS.internshipEnrollments.meProgramBySlug(slug),
        );
        if (!cancelled) setData(res.data.data);
      } catch (err) {
        if (cancelled) return;
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 403 || status === 404) {
            router.replace("/dashboard/internships");
            return;
          }
          setError(err.response?.data?.message || "Failed to load program");
        } else {
          setError("Failed to load program");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-stone-500">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading program…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-500 mb-4">{error ?? "Program not found"}</p>
        <Link
          href="/dashboard/internships"
          className="text-sm font-semibold text-amber-900 underline"
        >
          Back to My Internships
        </Link>
      </div>
    );
  }

  const { enrollment, tasks } = data;
  const title = enrollment.internshipSnapshot?.title || "Program";
  const batchName = enrollment.batchSnapshot?.name || "Cohort";
  const startDate = formatDate(enrollment.batchSnapshot?.internshipStartDate);
  const pointsPurchase = data.internshipSuccessPointPurchase;
  const certShortfall = enrollment.certificationPointsShortfall;
  const approxInr = enrollment.approxInrToReachCertificationThreshold;

  // Show Buy-points UI only when:
  // 1. There is a shortfall and purchases are enabled
  // 2. Certification exam is configured AND result has been released (exam submitted)
  const canBuyNow =
    typeof certShortfall === "number" &&
    certShortfall > 0 &&
    enrollment.certificationThreshold > 0 &&
    !!pointsPurchase &&
    enrollment.certificationExamConfigured === true &&
    enrollment.certificationExamSubmitted === true;

  // ── Certification eligibility (progress bar + two gates) ──
  const certThreshold = enrollment.certificationThreshold;
  const showEligibility = certThreshold > 0;
  const requiredPts = enrollment.certificationRequiredPoints ?? 0;
  const achievablePts = enrollment.certificationTotalAchievable ?? 0;
  const earnedPts = enrollment.internshipSuccessPoints;
  const pointsMet = enrollment.certificationMeetsThreshold === true;
  const eligible = enrollment.certificateEligible === true;
  const certBreakdown = enrollment.certificationBreakdown;
  const pctToTarget =
    requiredPts > 0
      ? Math.min(100, Math.round((earnedPts / requiredPts) * 100))
      : pointsMet
        ? 100
        : 0;

  return (
    <div className="max-w-4xl lg:max-w-7xl mx-auto py-6 space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/internships"
        className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        My Internships
      </Link>

      {/* Program title */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
            {title}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-stone-500">
            <span className="font-mono">{batchName}</span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span className="font-mono">Starts {startDate}</span>
            </span>
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900 capitalize">
              {enrollment.status}
            </span>
            {(enrollment.certificationThreshold > 0 ||
              enrollment.internshipSuccessPoints > 0) && (
              <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
                {enrollment.internshipSuccessPoints} success pts
              </span>
            )}
          </div>
        </div>
      </div>

      {enrollment.offerLetterUrl ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-full bg-emerald-100 p-2 shrink-0">
              <BadgeCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-950">
                Your offer letter is ready
              </p>
              {enrollment.internId ? (
                <p className="text-xs text-emerald-900/80">
                  Intern ID{" "}
                  <span className="font-mono font-semibold">
                    {enrollment.internId}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
          <a
            href={enrollment.offerLetterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 text-sm font-semibold transition shrink-0"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        </div>
      ) : null}

      {showEligibility && (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BadgeCheck className="size-5 text-amber-600" />
              <h2 className="text-base font-bold text-stone-900">
                Certification progress
              </h2>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                eligible
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-800",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  eligible ? "bg-emerald-500" : "bg-amber-500",
                )}
              />
              {eligible ? "Eligible" : "In progress"}
            </span>
          </div>

          {/* Progress bar — earned vs required */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-stone-600">Success points earned</span>
              <span className="text-sm font-bold tabular-nums text-stone-900">
                {earnedPts}{" "}
                <span className="font-medium text-stone-400">
                  / {requiredPts} needed
                </span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  pointsMet ? "bg-emerald-500" : "bg-amber-500",
                )}
                style={{ width: `${pctToTarget}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-400">
              Need {certThreshold}% of {achievablePts} achievable points (tasks +
              attendance).
              {certBreakdown
                ? ` Tasks ${certBreakdown.tasksTotal} · Attendance ${certBreakdown.attendanceTotal}.`
                : ""}
            </p>
            <p className="flex items-start gap-1.5 text-[11px] font-medium text-amber-700">
              <Info className="mt-px size-3 shrink-0" />
              <span>
                Only success points earned via attendance and tasks count
                toward your certificate.
              </span>
            </p>
          </div>

          {/* Buy points — shown when short + purchase enabled + certification exam configured and submitted. */}
          {canBuyNow && pointsPurchase && (
            <div id="buy-success-points" className="mt-3">
              <BuyInternshipSuccessPointsPanel
                enrollmentId={enrollment._id}
                inrPerPoint={pointsPurchase.inrPerPoint}
                currentPoints={enrollment.internshipSuccessPoints}
                certificationThreshold={enrollment.certificationThreshold}
              />
            </div>
          )}
        </div>
      )}

      {/* Tab switch: Tasks (default) | Live Classes */}
      <div className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-100/80 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("tasks")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition",
            activeTab === "tasks"
              ? "bg-stone-900 text-amber-200 shadow-sm"
              : "text-stone-600 hover:text-stone-900",
          )}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Tasks
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("live-classes")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition",
            activeTab === "live-classes"
              ? "bg-stone-900 text-amber-200 shadow-sm"
              : "text-stone-600 hover:text-stone-900",
          )}
        >
          <Video className="w-3.5 h-3.5" />
          Live Classes
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "tasks" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">Your Tasks</h2>
            {tasks.length > 0 ? (
              <span className="text-sm text-stone-500">
                {tasks.length} available
              </span>
            ) : null}
          </div>

          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 py-12 px-4 text-center">
              <ClipboardList className="mx-auto mb-3 h-8 w-8 text-stone-300" />
              <p className="font-medium text-stone-700">No tasks assigned yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard key={task._id} task={task} slug={slug} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <LiveClassesTab slug={slug} />
      )}
    </div>
  );
}
