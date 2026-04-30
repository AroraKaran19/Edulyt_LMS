/**
 * Inclusive "apply by" on that day in Asia/Kolkata (same rule as the API).
 * Empty / invalid → not open.
 */
export function isApplicationWindowOpenIst(
  applicationLastDate: string | null | undefined,
): boolean {
  if (applicationLastDate == null || applicationLastDate === "") return false;
  const d = new Date(applicationLastDate);
  if (Number.isNaN(d.getTime())) return false;
  const ymdIst = (t: Date) =>
    t.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return ymdIst(new Date()) <= ymdIst(d);
}
