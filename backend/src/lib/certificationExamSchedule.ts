/**
 * Per-learner certification exam window: cohort start + chosen duration (months).
 * The window is the learner's last IST calendar day of the program; we return
 * the UTC instants for IST midnight → IST end-of-day, so server-side
 * `new Date()` instant comparison stays correct.
 */
import { ymdIst, istWallClockToUtc } from "../utils/ist";

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
 * Last calendar day of the program (inclusive), in IST.
 * Example: start May 1 (IST), duration 1 month → window is all of May 31 IST,
 * returned as the UTC instants for IST 00:00:00.000 → 23:59:59.999.
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
  // Read the cohort start as an IST calendar day, then do the month arithmetic
  // on those IST date parts (a UTC Date is used purely as a calendar calculator).
  const startYmd = ymdIst(internshipStartDate);
  if (!startYmd) throw new Error("Invalid internshipStartDate");
  const [y, m, d] = startYmd.split("-").map(Number); // m is 1-based
  const periodEndExclusive = new Date(Date.UTC(y, m - 1 + durationMonths, d));
  const lastDay = new Date(periodEndExclusive.getTime() - 24 * 60 * 60 * 1000);
  const ldY = lastDay.getUTCFullYear();
  const ldM = lastDay.getUTCMonth() + 1; // 1-based
  const ldD = lastDay.getUTCDate();
  const examStartAt = istWallClockToUtc(ldY, ldM, ldD, 0, 0, 0, 0);
  const examEndAt = istWallClockToUtc(ldY, ldM, ldD, 23, 59, 59, 999);
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
