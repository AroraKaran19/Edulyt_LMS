import { ymdIst, todayIst } from "./ist";

/**
 * Inclusive "apply by" on that day in Asia/Kolkata (same rule as the API).
 * Empty / invalid → not open.
 */
export function isApplicationWindowOpenIst(
  applicationLastDate: string | null | undefined,
): boolean {
  const deadline = ymdIst(applicationLastDate);
  if (!deadline) return false;
  return todayIst() <= deadline;
}
