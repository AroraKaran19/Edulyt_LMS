/**
 * Per-learner certification exam window: cohort start + chosen duration (months).
 * All instants are UTC; compare with `new Date()` on the server only.
 */

export function parseProgramDurationMonthsFromAnswers(
  answers: Record<string, unknown> | undefined | null,
): number | undefined {
  if (!answers || typeof answers !== "object") return undefined;
  const raw = answers.internshipDuration;
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? parseInt(raw, 10)
        : NaN;
  if (!Number.isFinite(n) || n < 1 || n > 120) return undefined;
  return Math.floor(n);
}

/**
 * Last calendar day of the program (inclusive), in UTC.
 * Example: start May 1, duration 1 month → window is all of May 31 UTC.
 */
export function computeCertificationExamWindowUtc(
  internshipStartDate: Date,
  durationMonths: number,
): { examStartAt: Date; examEndAt: Date } {
  if (durationMonths < 1 || durationMonths > 120) {
    throw new RangeError("durationMonths must be between 1 and 120");
  }
  if (
    !(internshipStartDate instanceof Date) ||
    Number.isNaN(internshipStartDate.getTime())
  ) {
    throw new Error("Invalid internshipStartDate");
  }
  const y = internshipStartDate.getUTCFullYear();
  const m = internshipStartDate.getUTCMonth();
  const d = internshipStartDate.getUTCDate();
  const periodEndExclusiveUtc = Date.UTC(y, m + durationMonths, d);
  const lastDayStartUtcMs = periodEndExclusiveUtc - 24 * 60 * 60 * 1000;
  const last = new Date(lastDayStartUtcMs);
  const ldY = last.getUTCFullYear();
  const ldM = last.getUTCMonth();
  const ldD = last.getUTCDate();
  const examStartAt = new Date(Date.UTC(ldY, ldM, ldD, 0, 0, 0, 0));
  const examEndAt = new Date(Date.UTC(ldY, ldM, ldD, 23, 59, 59, 999));
  return { examStartAt, examEndAt };
}

export function isInstantWithinWindowUtc(
  nowMs: number,
  examStartAt?: Date,
  examEndAt?: Date,
): boolean {
  if (!examStartAt && !examEndAt) return true;
  if (examStartAt && nowMs < examStartAt.getTime()) return false;
  if (examEndAt && nowMs > examEndAt.getTime()) return false;
  return true;
}
