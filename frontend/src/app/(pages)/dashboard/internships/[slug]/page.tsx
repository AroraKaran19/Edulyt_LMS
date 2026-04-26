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
} from "lucide-react";
import { ENDPOINTS } from "@/constants/endpoints";
import type { LearnerProgramDetail, LearnerTaskRow } from "@/types";
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
          <span className="text-[11px] text-stone-500 font-mono capitalize">
            {task.taskType}
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
      <div>
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
          {enrollment.internshipSuccessPoints > 0 && (
            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
              {enrollment.internshipSuccessPoints} success pts
            </span>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">Your Tasks</h2>
          <span className="text-sm text-stone-500">
            {tasks.length} unlocked
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 py-12 px-4 text-center">
            <ClipboardList className="mx-auto mb-3 h-8 w-8 text-stone-300" />
            <p className="font-medium text-stone-700">No tasks unlocked yet</p>
            <p className="mt-1.5 text-sm text-stone-500">
              Tasks unlock progressively after your enrollment date. Check back
              later.
            </p>
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
