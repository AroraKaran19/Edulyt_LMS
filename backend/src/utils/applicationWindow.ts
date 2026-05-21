/**
 * "Apply by" is inclusive on that calendar day in Asia/Kolkata.
 * Missing or invalid deadline → not open for public enrollment.
 */
export function isApplicationWindowOpenIst(
  applicationLastDate: Date | string | null | undefined,
): boolean {
  if (applicationLastDate == null) return false;
  const d =
    applicationLastDate instanceof Date
      ? applicationLastDate
      : new Date(String(applicationLastDate));
  if (Number.isNaN(d.getTime())) return false;
  const ymdIst = (t: Date) =>
    t.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return ymdIst(new Date()) <= ymdIst(d);
}

/** Days after entrance exam result announcement during which a paid seat upgrade is allowed. */
export const POST_RESULT_PAID_GRACE_DAYS = 15;

/**
 * Paid-seat upgrade window for merit-track learners. Stays open from the
 * moment of registration through POST_RESULT_PAID_GRACE_DAYS after results
 * are announced — covering both early purchase ("unsure about result, lock
 * a seat now") and post-result grace ("didn't make the cut, still join").
 *
 * Three "open" branches, in order:
 *   1. The exam window hasn't closed yet (or no `examEndAt` provided) —
 *      the upgrade window cannot close before the exam itself ends. Guards
 *      against malformed configs where `examResultAt` predates `examEndAt`.
 *   2. `examResultAt` not scheduled — no upper bound, treat as open
 *      (matches the JSDoc intent: "stays open from registration").
 *   3. Within POST_RESULT_PAID_GRACE_DAYS of the announced result.
 *
 * Invalid (malformed) date strings still close the window for that branch
 * — they indicate broken config rather than absent config.
 */
export function isPaidUpgradeWindowOpen(
  examResultAt: Date | string | null | undefined,
  examEndAt?: Date | string | null,
): boolean {
  const now = Date.now();

  // Branch 1: exam still ongoing or upcoming → always open.
  if (examEndAt != null) {
    const end =
      examEndAt instanceof Date ? examEndAt : new Date(String(examEndAt));
    if (!Number.isNaN(end.getTime()) && now <= end.getTime()) return true;
  }

  // Branch 2: no result date scheduled → no upper bound.
  if (examResultAt == null) return true;

  // Branch 3: within grace window after results.
  const d =
    examResultAt instanceof Date
      ? examResultAt
      : new Date(String(examResultAt));
  if (Number.isNaN(d.getTime())) return false;
  const graceEnd =
    d.getTime() + POST_RESULT_PAID_GRACE_DAYS * 24 * 60 * 60 * 1000;
  return now < graceEnd;
}
