"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import scholarshipClient, { schAuth } from "@/configs/scholarshipApiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import type { AttemptView, ScholarshipResult } from "@/types/scholarship";

const errorMessage = (error: unknown, fallback: string): string => {
  const e = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
  };
  return (
    e?.response?.data?.error?.message || e?.response?.data?.message || fallback
  );
};

const mmss = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

const EYEBROW =
  "font-sch-mono text-[0.6875rem] uppercase tracking-[0.22em] text-sch-gold";
const PRIMARY =
  "rounded-2xl bg-linear-to-br from-sch-foil to-[#f0763c] px-6 py-4 text-[0.9375rem] font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45";
const GHOST =
  "rounded-2xl border-[1.5px] border-sch-ink-line px-6 py-4 text-[0.9375rem] font-semibold transition-colors hover:border-sch-on-ink-dim disabled:cursor-not-allowed disabled:opacity-40";

type Props = {
  slug: string;
  token: string;
  attempt: AttemptView;
  onFinished: (result: ScholarshipResult) => void;
  onDead: (message: string) => void;
};

/**
 * One question per screen, with a review grid before submit.
 *
 * Skipping is always allowed and Next is never disabled: a disabled Next with
 * no explanation is the most common dead end in test UIs, and nothing here
 * needs protecting from an unanswered question.
 */
export default function AttemptRunner({
  slug,
  token,
  attempt,
  onFinished,
  onDead,
}: Props) {
  const auth = useMemo(() => schAuth(token), [token]);

  const [index, setIndex] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      attempt.answers.map((a) => [a.questionId, a.selectedOptionIds]),
    ),
  );
  const [remaining, setRemaining] = useState(
    () => new Date(attempt.expiresAt).getTime() - Date.now(),
  );
  const submittedRef = useRef(false);

  const total = attempt.questions.length;
  const question = attempt.questions[index];
  const answeredCount = attempt.questions.filter(
    (q) => (answers[q.questionId] ?? []).length > 0,
  ).length;

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const res = await scholarshipClient.post(
        ENDPOINTS.scholarshipPublic.submit(slug),
        {},
        auth,
      );
      onFinished(res.data?.data as ScholarshipResult);
    } catch (error) {
      // Must-finish: a lapsed attempt earns nothing, and the server is the
      // authority on that. Surface its wording rather than inventing one.
      onDead(errorMessage(error, "Could not submit your answers"));
    } finally {
      setSubmitting(false);
    }
  }, [slug, auth, onFinished, onDead]);

  useEffect(() => {
    const id = setInterval(() => {
      const left = new Date(attempt.expiresAt).getTime() - Date.now();
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        // Running out is not a submit: the server refuses a lapsed attempt, so
        // this call exists to get that verdict, not to sneak one past it.
        void submit();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [attempt.expiresAt, submit]);

  const toggle = async (optionId: string) => {
    const current = answers[question.questionId] ?? [];
    const next = current.includes(optionId)
      ? current.filter((o) => o !== optionId)
      : [...current, optionId];
    setAnswers((prev) => ({ ...prev, [question.questionId]: next }));

    try {
      await scholarshipClient.patch(
        ENDPOINTS.scholarshipPublic.answer(slug),
        { questionId: question.questionId, selectedOptionIds: next },
        auth,
      );
    } catch (error) {
      // Autosave is what makes a closed tab recoverable, so a failure here is
      // worth saying out loud rather than losing quietly.
      toast.error(errorMessage(error, "Could not save that answer"));
    }
  };

  const timerTone =
    remaining <= 60_000
      ? "text-sch-foil"
      : remaining <= 180_000
        ? "text-sch-gold"
        : "text-sch-on-ink-dim";

  if (reviewing) {
    const skipped = total - answeredCount;
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-7">
        <div>
          <span className={EYEBROW}>Last look</span>
          <h2 className="mt-2 font-sch-display text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
            Review answers
          </h2>
          <p className="mt-2 font-sch-mono text-xs tracking-wider text-sch-on-ink-dim">
            {answeredCount} of {total} answered
            {skipped > 0 ? ` · ${skipped} skipped` : ""}
          </p>
        </div>

        <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-10">
          {attempt.questions.map((q, i) => {
            const done = (answers[q.questionId] ?? []).length > 0;
            return (
              <button
                key={q.questionId}
                type="button"
                onClick={() => {
                  setIndex(i);
                  setReviewing(false);
                }}
                aria-label={`Question ${i + 1}, ${done ? "answered" : "skipped"}`}
                className={`h-11 rounded-lg border-[1.5px] font-sch-mono text-sm font-semibold transition-colors ${
                  done
                    ? "border-transparent bg-linear-to-br from-sch-gold to-sch-gold-deep text-[#2a1a08]"
                    : "border-sch-ink-line bg-sch-ink-raised text-sch-on-ink-dim hover:border-sch-gold-deep"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {skipped > 0 ? (
          <p className="text-sm leading-relaxed text-sch-on-ink-dim">
            Unanswered questions will not cost you anything. Submit and the
            reward is yours.
          </p>
        ) : null}

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => setReviewing(false)}
            className={GHOST}
          >
            Keep answering
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className={`${PRIMARY} flex-1`}
          >
            {submitting ? "Claiming…" : "Claim my reward"}
          </button>
        </div>
      </div>
    );
  }

  const selected = answers[question.questionId] ?? [];

  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_1fr] lg:items-start lg:gap-16">
      {/* Instruments live in their own rail so the question owns the width. On
          desktop it sticks, so the clock never scrolls out of sight. */}
      <aside className="flex flex-col gap-6 lg:sticky lg:top-16">
        <div>
          <span className={EYEBROW}>Question</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-sch-display text-[clamp(3rem,10vw,4.5rem)] font-semibold leading-none tracking-tight">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="font-sch-mono text-sm text-sch-on-ink-dim">
              / {String(total).padStart(2, "0")}
            </span>
          </div>
        </div>

        <div>
          {/* Progress is the seal coming apart, not a neutral bar: every answer
              visibly takes a piece off the thing they are playing for. */}
          <div className="flex h-1.5 gap-[3px]" aria-hidden="true">
            {attempt.questions.map((q, i) => (
              <span
                key={q.questionId}
                className={`flex-1 rounded-sm transition-colors ${
                  (answers[q.questionId] ?? []).length > 0
                    ? "bg-linear-to-br from-sch-gold to-sch-gold-deep"
                    : i === index
                      ? "bg-sch-on-ink-dim"
                      : "bg-sch-ink-line"
                }`}
              />
            ))}
          </div>
          <p className="mt-3 font-sch-mono text-[0.6875rem] uppercase tracking-[0.16em] text-sch-on-ink-dim">
            {answeredCount} of {total} answered
          </p>
        </div>

        <div>
          <span className="block font-sch-mono text-[0.6875rem] uppercase tracking-[0.16em] text-sch-on-ink-dim">
            Time left
          </span>
          <span
            className={`font-sch-mono text-3xl font-semibold tabular-nums ${timerTone}`}
            aria-label="Time remaining"
          >
            {mmss(remaining)}
          </span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col gap-8">
        {/* Discourages lifting the paper out of a bank shared with live exams. */}
        <div
          className="select-none"
          onCopy={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <h2 className="max-w-[24ch] font-sch-display text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-[1.15] tracking-[-0.02em]">
            {question.questionText}
          </h2>

          <div className="mt-8 flex max-w-2xl flex-col gap-3">
            {question.options.map((o, oi) => {
              const on = selected.includes(o.optionId);
              return (
                <button
                  key={o.optionId}
                  type="button"
                  aria-pressed={on}
                  onClick={() => void toggle(o.optionId)}
                  className={`flex w-full items-start gap-3.5 rounded-2xl border-[1.5px] p-4 text-left transition hover:-translate-y-px ${
                    on
                      ? "border-sch-gold bg-sch-gold/15"
                      : "border-sch-ink-line bg-sch-ink-raised hover:border-sch-gold-deep"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border-[1.5px] font-sch-mono text-xs transition ${
                      on
                        ? "border-sch-gold bg-sch-gold font-bold text-[#2a1a08]"
                        : "border-sch-ink-line text-sch-on-ink-dim"
                    }`}
                  >
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <span className="pt-0.5 text-base leading-relaxed">
                    {o.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex max-w-2xl gap-3">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
            className={GHOST}
          >
            Back
          </button>
          <button
            type="button"
            onClick={() =>
              index === total - 1 ? setReviewing(true) : setIndex((i) => i + 1)
            }
            className={`${PRIMARY} flex-1`}
          >
            {index === total - 1 ? "Review answers" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
