/**
 * The learner's program window and the certificate verdict derived from it.
 *
 * Anchor: the COHORT start date (`batchSnapshot.internshipStartDate`), never
 * `enrolledAt`. `enrolledAt` is set when an admin approves the learner or the
 * offer-letter worker runs — days or weeks after the cohort begins — so using
 * it would measure the achievable-points pool over a different window than the
 * task calendar the learner is actually shown (see getLearnerProgramBySlug).
 */
import { computeCertificationExamWindowUtc } from "./certificationExamSchedule";

/** Inclusive end of the learner's program window: IST end-of-day of the last day. */
export function computeProgramEndDate(
  cohortStart: Date,
  durationMonths: number,
): Date {
  return computeCertificationExamWindowUtc(cohortStart, durationMonths)
    .examEndAt;
}

/**
 * Resolve the learner's program-end instant: prefer the stored `endDate`, else
 * derive it from the cohort start + duration. Returns null when neither is
 * available (e.g. a pre-enrollment row with no window yet).
 */
export function resolveProgramEndDate(opts: {
  endDate?: Date | string | null;
  cohortStart?: Date | string | null;
  durationMonths?: number | null;
}): Date | null {
  if (opts.endDate) {
    const d = new Date(opts.endDate);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (
    opts.cohortStart &&
    typeof opts.durationMonths === "number" &&
    opts.durationMonths >= 1
  ) {
    try {
      return computeProgramEndDate(new Date(opts.cohortStart), opts.durationMonths);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * True once the learner's program window has closed. A missing/invalid endDate
 * means "no window to enforce" and returns false, so pre-enrollment activity
 * (e.g. the entrance exam) is never blocked by this.
 */
export function isProgramWindowOver(
  endDate: Date | string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!endDate) return false;
  const d = endDate instanceof Date ? endDate : new Date(endDate);
  if (Number.isNaN(d.getTime())) return false;
  return nowMs > d.getTime();
}

export type CertificateVerdictReason = "passed" | "points_shortfall";

export type CertificateVerdict = {
  verdict: "pass" | "fail";
  reason: CertificateVerdictReason;
};

/**
 * `certificateEligible` already folds in the points threshold, the exam gate
 * (when one is configured) and any admin override — see
 * computeInternshipEligibility. The evaluation worker only ever judges
 * exam-less enrollments, so a failure here is always a points shortfall.
 */
export function deriveCertificateVerdict(e: {
  certificateEligible: boolean;
}): CertificateVerdict {
  return e.certificateEligible
    ? { verdict: "pass", reason: "passed" }
    : { verdict: "fail", reason: "points_shortfall" };
}

export type AchievableTask = {
  successPoints?: number;
  dueDays?: number;
  isActive?: boolean;
};

/**
 * Success points a learner could have earned from tasks: every active template
 * whose due date (cohort start + dueDays) falls at or before the window end.
 */
export function computeAchievableTaskPoints(
  tasks: AchievableTask[],
  cohortStart: Date,
  endDate: Date,
): number {
  let total = 0;
  for (const t of tasks) {
    if (t.isActive === false) continue;
    const dueAt = new Date(cohortStart);
    dueAt.setDate(dueAt.getDate() + Number(t.dueDays ?? 0));
    if (dueAt <= endDate) {
      total += Math.max(0, Number(t.successPoints ?? 0));
    }
  }
  return total;
}
