import { todayIst, ymdIst } from "@/lib/ist";

/** Minimal batch shape for upcoming-cohort display (listing + full internship). */
export type InternshipCohortBatchLike = {
  isActive?: boolean;
  internshipStartDate?: string | Date;
};

/**
 * The cohort's own IST calendar day, or null when missing/invalid.
 *
 * Cohort starts are IST instants (a batch beginning at 00:00 IST is stored as
 * 18:30Z the day before), so snapping to the viewer's local midnight would drop
 * a batch that starts today for anyone browsing west of IST.
 */
function cohortDayIst(b: InternshipCohortBatchLike): string | null {
  const raw = b.internshipStartDate;
  if (raw == null || String(raw).length === 0) return null;
  return ymdIst(raw);
}

/**
 * Earliest batch start on/after today (IST calendar day). No past dates.
 * Missing/invalid dates skipped.
 */
export function getUpcomingBatchStartDate(
  batches: InternshipCohortBatchLike[] | undefined | null,
): Date | null {
  const raw = getUpcomingBatch(batches)?.internshipStartDate;
  if (raw == null) return null;
  const d = new Date(raw as string | Date);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Earliest active batch whose start is on/after today (IST). Same selection
 * rules as {@link getUpcomingBatchStartDate}, but returns the batch object.
 */
export function getUpcomingBatch<T extends InternshipCohortBatchLike>(
  batches: T[] | null | undefined,
): T | null {
  const today = todayIst();
  const upcoming = (batches ?? [])
    .filter((b) => b.isActive !== false)
    .map((b) => ({
      batch: b,
      day: cohortDayIst(b),
      // Membership is decided on the IST day; ordering keeps the exact instant
      // so two cohorts starting the same day stay in start-time order.
      at: new Date(b.internshipStartDate as string | Date).getTime(),
    }))
    .filter((x): x is { batch: T; day: string; at: number } => x.day !== null)
    .filter((x) => x.day >= today)
    .sort((a, b) => a.at - b.at);

  return upcoming[0]?.batch ?? null;
}

/** Active batches whose IST start day is today or later. Missing/invalid dates excluded. */
export function countUpcomingCohorts(
  batches: InternshipCohortBatchLike[] | undefined | null,
): number {
  const today = todayIst();
  let n = 0;
  for (const b of batches ?? []) {
    if (b.isActive === false) continue;
    const day = cohortDayIst(b);
    if (day && day >= today) n += 1;
  }
  return n;
}
