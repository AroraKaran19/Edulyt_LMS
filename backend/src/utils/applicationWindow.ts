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
