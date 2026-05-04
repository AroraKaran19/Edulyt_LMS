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
 * Closes at examResultAt + POST_RESULT_PAID_GRACE_DAYS.
 */
export function isPaidUpgradeWindowOpen(
  examResultAt: Date | string | null | undefined,
): boolean {
  if (examResultAt == null) return false;
  const d =
    examResultAt instanceof Date
      ? examResultAt
      : new Date(String(examResultAt));
  if (Number.isNaN(d.getTime())) return false;
  const end = d.getTime() + POST_RESULT_PAID_GRACE_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() < end;
}
