"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Clock,
  Loader2,
  Lock,
} from "lucide-react";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";

type ErrorReason =
  | "invalid"
  | "not-activated"
  | "expired"
  | "not-enrolled"
  | "unknown";

type Outcome =
  | {
      kind: "marked";
      slot: 1 | 2;
      alreadyMarked: boolean;
      meetingName: string;
      markedAt: Date;
    }
  | { kind: "error"; reason: ErrorReason };

const ERROR_COPY: Record<ErrorReason, { title: string; body: string }> = {
  invalid: {
    title: "Link not recognised",
    body: "Double-check the URL or ask the admin to resend it.",
  },
  "not-activated": {
    title: "Not opened yet",
    body: "The admin hasn't opened this attendance link yet. Try again in a moment.",
  },
  expired: {
    title: "Window closed",
    body: "The time window for this attendance link is over.",
  },
  "not-enrolled": {
    title: "Not in this batch",
    body: "Only learners in this internship's specific batch can mark attendance for this meeting.",
  },
  unknown: {
    title: "Couldn't mark attendance",
    body: "Something went wrong. Please try again.",
  },
};

function parseErrorReason(err: unknown): ErrorReason {
  const raw =
    (err as { response?: { data?: { error?: { message?: string } } } })
      ?.response?.data?.error?.message ?? "unknown";
  if (
    raw === "invalid" ||
    raw === "not-activated" ||
    raw === "expired" ||
    raw === "not-enrolled"
  ) {
    return raw;
  }
  return "unknown";
}

function formatTime(d: Date): string {
  return d
    .toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })
    .toLowerCase();
}

export default function LiveMeetingAttendPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  const token = typeof params?.token === "string" ? params.token : "";
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!token) return;

    if (sessionStatus === "unauthenticated") {
      const callbackUrl = `/live-meeting/attend/${encodeURIComponent(token)}`;
      router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.post(
          ENDPOINTS.internshipLiveMeetings.attend(token),
        );
        if (cancelled) return;
        const data = res.data?.data as {
          ok: true;
          slot: 1 | 2;
          alreadyMarked: boolean;
          meetingName: string;
        };
        setOutcome({
          kind: "marked",
          slot: data.slot,
          alreadyMarked: data.alreadyMarked,
          meetingName: data.meetingName,
          markedAt: new Date(),
        });
      } catch (err: unknown) {
        if (cancelled) return;
        setOutcome({ kind: "error", reason: parseErrorReason(err) });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionStatus, token, router]);

  const view = useMemo<"missing" | "auth" | "loading" | Outcome["kind"]>(() => {
    if (!token) return "missing";
    if (sessionStatus === "loading") return "loading";
    if (sessionStatus === "unauthenticated") return "auth";
    if (!outcome) return "loading";
    return outcome.kind;
  }, [token, sessionStatus, outcome]);

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <Link
        href="/dashboard/internships"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        My internships
      </Link>

      {view === "missing" ? (
        <ErrorBlock
          title="Missing attendance token"
          body="The URL is incomplete. Open the exact link the admin shared."
        />
      ) : view === "auth" ? (
        <StatusBlock
          eyebrow="Sign in"
          title="Redirecting you to log in"
          body="You'll come right back here once you're signed in."
        />
      ) : view === "loading" ? (
        <StatusBlock
          eyebrow="Checking…"
          title="Recording your attendance"
          body="Verifying your enrolment and the link window."
          spinning
        />
      ) : outcome?.kind === "marked" ? (
        <MarkedBlock outcome={outcome} />
      ) : outcome?.kind === "error" ? (
        <ErrorBlock
          title={ERROR_COPY[outcome.reason].title}
          body={ERROR_COPY[outcome.reason].body}
          showRetry={outcome.reason === "not-activated"}
        />
      ) : null}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────

function StatusBlock({
  eyebrow,
  title,
  body,
  spinning,
}: {
  eyebrow: string;
  title: string;
  body: string;
  spinning?: boolean;
}) {
  return (
    <div className="border-t-2 border-stone-900 pt-6">
      <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-stone-500 flex items-center gap-2">
        {spinning ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        {eyebrow}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-stone-900 tracking-tight">
        {title}
      </h1>
      <p className="mt-2 text-sm text-stone-600">{body}</p>
    </div>
  );
}

function MarkedBlock({
  outcome,
}: {
  outcome: Extract<Outcome, { kind: "marked" }>;
}) {
  const isFirst = outcome.slot === 1;

  return (
    <div className="border-t-2 border-amber-700 pt-6">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-amber-800">
          Attendance {outcome.slot} of 2 ·{" "}
          {outcome.alreadyMarked ? "already recorded" : "recorded"}
        </p>
        <span className="text-[11px] font-mono text-stone-500">
          {formatTime(outcome.markedAt)}
        </span>
      </div>

      <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
        {outcome.meetingName}
      </h1>

      {/* Progress strip */}
      <div className="mt-6">
        <div className="flex items-center gap-3">
          <Slot index={1} done={outcome.slot === 1} />
          <div className="flex-1 h-px bg-stone-200" />
          <Slot index={2} done={outcome.slot === 2} />
        </div>
      </div>

      <p className="mt-5 text-sm text-stone-600 leading-relaxed">
        {isFirst ? (
          <>
            Stay in the meeting. The admin will share the{" "}
            <span className="font-semibold text-stone-900">second</span>{" "}
            attendance link later — you need to open both to be marked{" "}
            <span className="font-semibold text-stone-900">present</span>.
          </>
        ) : (
          <>
            If you also opened the first attendance link, you&apos;re done. If
            you didn&apos;t, you&apos;ll be marked{" "}
            <span className="font-semibold text-stone-900">absent</span> once
            both windows close.
          </>
        )}
      </p>

      <Link
        href="/dashboard/internships"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-stone-900 text-amber-100 hover:bg-stone-700 transition px-5 py-2.5 text-sm font-semibold"
      >
        Back to my internships
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function Slot({ index, done }: { index: 1 | 2; done: boolean }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        className={
          done
            ? "size-7 rounded-full bg-amber-700 text-amber-50 flex items-center justify-center"
            : "size-7 rounded-full border border-stone-300 text-stone-400 flex items-center justify-center"
        }
      >
        {done ? (
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        ) : (
          <span className="text-xs font-mono">{index}</span>
        )}
      </div>
      <span
        className={
          done
            ? "text-xs font-mono uppercase tracking-wider text-stone-900"
            : "text-xs font-mono uppercase tracking-wider text-stone-400"
        }
      >
        {done ? "done" : index === 1 ? "attendance 1" : "attendance 2"}
      </span>
    </div>
  );
}

function ErrorBlock({
  title,
  body,
  showRetry,
}: {
  title: string;
  body: string;
  showRetry?: boolean;
}) {
  return (
    <div className="border-t-2 border-stone-900 pt-6">
      <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-stone-500 flex items-center gap-2">
        {showRetry ? (
          <Clock className="w-3 h-3" />
        ) : (
          <Lock className="w-3 h-3" />
        )}
        Attendance not recorded
      </p>
      <h1 className="mt-2 text-2xl font-bold text-stone-900 tracking-tight">
        {title}
      </h1>
      <p className="mt-2 text-sm text-stone-600 leading-relaxed">{body}</p>

      <div className="mt-8 flex items-center gap-3">
        {showRetry ? (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 text-amber-100 hover:bg-stone-700 transition px-5 py-2.5 text-sm font-semibold"
          >
            Try again
          </button>
        ) : null}
        <Link
          href="/dashboard/internships"
          className={
            showRetry
              ? "inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 transition"
              : "inline-flex items-center gap-2 rounded-xl bg-stone-900 text-amber-100 hover:bg-stone-700 transition px-5 py-2.5 text-sm font-semibold"
          }
        >
          {showRetry ? (
            "Back to my internships"
          ) : (
            <>
              Back to my internships <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Link>
      </div>
    </div>
  );
}
