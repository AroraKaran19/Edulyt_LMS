/** Minimal batch shape for upcoming-cohort display (listing + full internship). */
export type InternshipCohortBatchLike = {
  isActive?: boolean;
  internshipStartDate?: string | Date;
};

function startOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

/**
 * Earliest batch start on/after today (local calendar). No past dates.
 * Missing/invalid dates skipped.
 */
export function getUpcomingBatchStartDate(
  batches: InternshipCohortBatchLike[] | undefined | null,
): Date | null {
  const active = (batches ?? []).filter((b) => b.isActive !== false);
  const dates = active
    .map((b) =>
      b.internshipStartDate != null &&
      String(b.internshipStartDate).length > 0
        ? new Date(b.internshipStartDate as string | Date)
        : null,
    )
    .filter((d): d is Date => d != null && !Number.isNaN(d.getTime()));
  if (dates.length === 0) return null;

  const today = startOfLocalDay(new Date());
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const upcoming = sorted.find((d) => startOfLocalDay(d) >= today);

  return upcoming ?? null;
}

/**
 * Earliest batch (active) whose start is on/after today (local). Same selection
 * rules as {@link getUpcomingBatchStartDate}, but returns the batch object.
 */
export function getUpcomingBatch<T extends InternshipCohortBatchLike>(
  batches: T[] | null | undefined,
): T | null {
  const active = (batches ?? []).filter((b) => b.isActive !== false);
  const withDates = active
    .map((b) => {
      if (
        b.internshipStartDate == null ||
        String(b.internshipStartDate).length === 0
      )
        return null;
      const d = new Date(b.internshipStartDate as string | Date);
      if (Number.isNaN(d.getTime())) return null;
      return { batch: b, date: d };
    })
    .filter((x): x is { batch: T; date: Date } => x != null);

  if (withDates.length === 0) return null;

  const today = startOfLocalDay(new Date());
  const sorted = [...withDates].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  const picked = sorted.find((x) => startOfLocalDay(x.date) >= today);
  return picked?.batch ?? null;
}

/** Active batches whose start day is today or later (local calendar). Missing/invalid dates excluded. */
export function countUpcomingCohorts(
  batches: InternshipCohortBatchLike[] | undefined | null,
): number {
  const today = startOfLocalDay(new Date());
  let n = 0;
  for (const b of batches ?? []) {
    if (b.isActive === false) continue;
    if (
      b.internshipStartDate == null ||
      String(b.internshipStartDate).length === 0
    ) {
      continue;
    }
    const d = new Date(b.internshipStartDate as string | Date);
    if (Number.isNaN(d.getTime())) continue;
    if (startOfLocalDay(d) >= today) n += 1;
  }
  return n;
}
