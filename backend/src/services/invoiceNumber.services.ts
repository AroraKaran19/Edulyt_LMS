import { AppCounterModel } from "../models/appCounter.schema";
import { ymdIst } from "../utils/ist";

/**
 * Tax-invoice number allocation.
 *
 * GST requires the number to be unique, consecutive, and at most 16 characters
 * including any prefix. The template already prints a literal "INV-", so what
 * this returns is the remainder: `2627-00001` renders as `INV-2627-00001`,
 * 14 characters.
 *
 * The sequence restarts each Indian financial year (1 Apr to 31 Mar), which is
 * the normal convention and keeps the counter well inside 5 digits.
 */

/** Counter key per series and financial year, so each year restarts at 1. */
const counterId = (series: string, fy: string) => `${series}:${fy}`;

/**
 * Indian financial year for an instant, as ["2026-27", "2627"].
 * April starts a new year, so Jan to Mar belong to the previous one.
 */
export function financialYearIst(when: Date | string = new Date()): {
  label: string;
  short: string;
} {
  const ymd = ymdIst(when) ?? ymdIst(new Date())!;
  const [y, m] = ymd.split("-").map(Number);
  const startYear = m >= 4 ? y : y - 1;
  const endYear = startYear + 1;
  return {
    label: `${startYear}-${String(endYear).slice(-2)}`,
    short: `${String(startYear).slice(-2)}${String(endYear).slice(-2)}`,
  };
}

/**
 * Atomically allocate the next invoice number for the current financial year.
 *
 * `$inc` is atomic per document, so concurrent payments always receive distinct
 * numbers no matter how many workers or gateway callbacks race.
 *
 * Consecutive, but not strictly gap-free: a job that allocates and then fails
 * permanently leaves its number unused. Retrying that job reuses the number
 * already stored on the order rather than drawing a new one, so ordinary
 * failures do not burn the sequence. Persist the result on the order in the
 * same step you allocate it.
 */
export async function allocateNextInvoiceNumber(
  series: string,
  when: Date | string = new Date(),
): Promise<string> {
  const fy = financialYearIst(when);
  const result = await AppCounterModel.findOneAndUpdate(
    { _id: counterId(series, fy.label) },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  const seq = (result as { seq: number }).seq;
  return `${fy.short}-${seq.toString().padStart(5, "0")}`;
}

/**
 * Seed a financial year's counter, for backfills that assigned numbers by hand.
 * Sets the counter to the last number used so the next allocation continues on.
 */
export async function seedInvoiceNumberCounter(
  series: string,
  financialYearLabel: string,
  value: number,
): Promise<void> {
  await AppCounterModel.findOneAndUpdate(
    { _id: counterId(series, financialYearLabel) },
    { $set: { seq: value } },
    { upsert: true },
  );
}
