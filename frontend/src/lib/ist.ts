/**
 * Canonical IST (Asia/Kolkata) date/time helpers for the frontend.
 *
 * Everything the user sees or types is IST. API dates stay UTC ISO strings;
 * we format them to IST for display and interpret date/datetime inputs as IST
 * before sending. IST is a FIXED +05:30 offset (no DST), so conversions are
 * exact integer-offset math.
 */

export const IST_TZ = "Asia/Kolkata";
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

type DateInput = Date | string | number | null | undefined;

/** Coerce to a valid Date, or null. */
export function toDate(value: DateInput): Date | null {
  if (value == null || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** IST calendar day "YYYY-MM-DD" for an instant (null when invalid). */
export function ymdIst(value: DateInput): string | null {
  const d = toDate(value);
  return d ? d.toLocaleDateString("en-CA", { timeZone: IST_TZ }) : null;
}

/** "YYYY-MM-DD" for the current instant in IST. */
export function todayIst(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: IST_TZ });
}

/**
 * The UTC instant corresponding to an IST wall-clock time.
 * e.g. istWallClockToUtc(2025, 6, 20, 11, 0) → Date(2025-06-20T05:30:00.000Z)
 */
export function istWallClockToUtc(
  y: number,
  m: number,
  d: number,
  hh = 0,
  mm = 0,
  ss = 0,
  ms = 0,
): Date {
  return new Date(Date.UTC(y, m - 1, d, hh, mm, ss, ms) - IST_OFFSET_MS);
}

/** Parse a `datetime-local` value ("YYYY-MM-DDTHH:mm[:ss]") as IST → UTC ISO string. */
export function istDatetimeLocalToUtcIso(localStr: string | null | undefined): string | null {
  if (!localStr) return null;
  const m = String(localStr)
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  return istWallClockToUtc(+m[1], +m[2], +m[3], +m[4], +m[5], m[6] ? +m[6] : 0).toISOString();
}

/**
 * Combine a `type="date"` value with a `type="time"` value (both IST wall-clock)
 * into a UTC ISO string. A blank/missing time means IST midnight, so a form that
 * only collects a date still stores the start of that IST day.
 */
export function istDateAndTimeToUtcIso(
  dateStr: string | null | undefined,
  timeStr?: string | null,
): string | null {
  const date = String(dateStr ?? "").trim();
  if (!date) return null;
  const time = String(timeStr ?? "").trim() || "00:00";
  return istDatetimeLocalToUtcIso(`${date}T${time}`);
}

/** Parse a date-only value ("YYYY-MM-DD") as IST midnight → UTC ISO string. */
export function istDateOnlyToUtcIso(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const m = String(dateStr).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return istWallClockToUtc(+m[1], +m[2], +m[3], 0, 0, 0, 0).toISOString();
}

/** Parse a date-only value ("YYYY-MM-DD") as IST 23:59:59.999 → UTC ISO string. */
export function istEndOfDayToUtcIso(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const m = String(dateStr).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return istWallClockToUtc(+m[1], +m[2], +m[3], 23, 59, 59, 999).toISOString();
}

/** Format an instant in IST for display (default: "20 Jun 2025, 11:00 am"). */
export function formatIst(
  value: DateInput,
  opts: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" },
): string {
  const d = toDate(value);
  if (!d) return "";
  return d.toLocaleString("en-IN", { timeZone: IST_TZ, ...opts });
}

/** IST date only, e.g. "20 Jun 2025". */
export function formatIstDate(value: DateInput): string {
  return formatIst(value, { dateStyle: "medium" });
}

/** IST date + time, e.g. "20 Jun 2025, 11:00 am". */
export function formatIstDateTime(value: DateInput): string {
  return formatIst(value, { dateStyle: "medium", timeStyle: "short" });
}

/** Pre-fill a `datetime-local` input from a stored instant, in IST ("YYYY-MM-DDTHH:mm"). */
export function utcToIstDatetimeLocalValue(value: DateInput): string {
  const d = toDate(value);
  if (!d) return "";
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${ist.getUTCFullYear()}-${p(ist.getUTCMonth() + 1)}-${p(ist.getUTCDate())}` +
    `T${p(ist.getUTCHours())}:${p(ist.getUTCMinutes())}`
  );
}

/** Pre-fill a `type="date"` input from a stored instant, in IST ("YYYY-MM-DD"). */
export function utcToIstDateValue(value: DateInput): string {
  return ymdIst(value) ?? "";
}

/** Pre-fill a `type="time"` input from a stored instant, in IST ("HH:mm"). */
export function utcToIstTimeValue(value: DateInput): string {
  return utcToIstDatetimeLocalValue(value).slice(11, 16);
}

/**
 * Current wall-clock parts in IST — for countdown / "is it active now" logic
 * that must not depend on the browser's timezone.
 */
export function istNowParts(): {
  y: number;
  m: number;
  d: number;
  hh: number;
  mm: number;
  ss: number;
} {
  const ist = new Date(Date.now() + IST_OFFSET_MS);
  return {
    y: ist.getUTCFullYear(),
    m: ist.getUTCMonth() + 1,
    d: ist.getUTCDate(),
    hh: ist.getUTCHours(),
    mm: ist.getUTCMinutes(),
    ss: ist.getUTCSeconds(),
  };
}
