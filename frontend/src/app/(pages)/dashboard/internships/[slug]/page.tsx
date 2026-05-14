"use client";

import { useEffect, useState } from "react";
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
  Video,
  ExternalLink,
  Check,
} from "lucide-react";
import { ENDPOINTS } from "@/constants/endpoints";
import type { LearnerProgramDetail, LearnerTaskRow } from "@/types";
import type { StudentLiveMeetingItem } from "@/types/internship-live-meeting";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string) {
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
          {task.totalScore > 0 && (
            <span>
              <span className="font-medium text-stone-700">
                {task.totalScore}
              </span>{" "}
              pts total
            </span>
          )}
          {task.submission && (
            <span className="text-emerald-700 font-medium">
              +{task.submission.totalAwardedScore} pts earned
            </span>
          )}
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
  const both = m.link1Clicked && m.link2Clicked;
  const partial = (m.link1Clicked || m.link2Clicked) && !both;

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
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
          {both ? (
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
      <div className="shrink-0 self-center">
        <a
          href={m.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-stone-700 transition"
        >
          Join
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

function LiveMeetingsSection({
  meetings,
}: {
  meetings: StudentLiveMeetingItem[];
}) {
  if (!meetings || meetings.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-stone-900">Live meetings</h2>
        <span className="text-sm text-stone-500">
          {meetings.length} {meetings.length === 1 ? "scheduled" : "scheduled"}
        </span>
      </div>
      <div className="space-y-3">
        {meetings.map((m) => (
          <LiveMeetingCard key={m._id} m={m} />
        ))}
      </div>
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

  /**
   * Show "buy points" / certificate shortfall banners only when:
   *   - learner has submitted the cohort's certification exam (cohort has one), OR
   *   - internship has reached `completed` — they can still purchase points to
   *     upgrade to a certificate even after the program ends.
   * Otherwise (e.g. enrolled but exam not yet taken, or cohort has no cert
   * exam and program is still running), keep these hidden so users aren't
   * pushed to buy before it's relevant.
   */
  const certificationExamConfigured =
    enrollment.certificationExamConfigured === true;
  const certificationExamSubmitted =
    enrollment.certificationExamSubmitted === true;
  const isCompleted = String(enrollment.status) === "completed";
  const pointsPurchaseUnlocked =
    (certificationExamConfigured && certificationExamSubmitted) || isCompleted;
  const awaitingCertificateBelowPoints =
    typeof certShortfall === "number" &&
    certShortfall > 0 &&
    enrollment.certificationThreshold > 0 &&
    pointsPurchaseUnlocked;

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

      {/* Program title + optional purchase */}
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
        {pointsPurchase && awaitingCertificateBelowPoints ? (
          <div
            id="buy-success-points"
            className="w-full lg:w-auto lg:max-w-md shrink-0"
          >
            <BuyInternshipSuccessPointsPanel
              enrollmentId={enrollment._id}
              inrPerPoint={pointsPurchase.inrPerPoint}
              currentPoints={enrollment.internshipSuccessPoints}
              certificationThreshold={enrollment.certificationThreshold}
            />
          </div>
        ) : null}
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

      {awaitingCertificateBelowPoints ? (
        <div className="rounded-2xl border border-amber-300/80 bg-amber-100/40 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Certificate — success points</p>
          <p className="mt-1 text-amber-950/90 text-xs sm:text-sm leading-relaxed">
            You need{" "}
            <span className="font-mono font-semibold">
              {enrollment.certificationThreshold}
            </span>{" "}
            internship success points total to qualify for your certificate.
            You have{" "}
            <span className="font-mono font-semibold">
              {enrollment.internshipSuccessPoints}
            </span>{" "}
            ({certShortfall} more needed
            {typeof approxInr === "number" && pointsPurchase
              ? ` — about ₹${approxInr.toLocaleString("en-IN")} to buy the gap at ₹${pointsPurchase.inrPerPoint.toLocaleString("en-IN")} per point`
              : ""}
            ).
          </p>
          {pointsPurchase ? (
            <Link
              href="#buy-success-points"
              className="mt-2 inline-block text-xs font-bold text-amber-900 underline underline-offset-2"
            >
              Buy points →
            </Link>
          ) : (
            <p className="mt-2 text-xs text-amber-900/80">
              Complete tasks for points, or ask your admin to enable purchases (Settings →
              Points and certification threshold on the internship).
            </p>
          )}
        </div>
      ) : null}

      {/* Live meetings */}
      <LiveMeetingsSection meetings={data.liveMeetings ?? []} />

      {/* Tasks */}
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
    </div>
  );
}
