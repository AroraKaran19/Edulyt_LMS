/**
 * Inclusive date-range parsing for admin list/export endpoints.
 *
 * Admin date pickers send bare `YYYY-MM-DD`. Snapping the lower bound to
 * 00:00:00.000 and the upper to 23:59:59.999 is what makes a same-day range
 * (from === to) cover that whole day instead of a zero-width instant.
 */

import { AppError } from "../../middlewares/error.middleware";

const BARE_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Parses one bound. A full ISO timestamp is taken as given, not snapped. */
export function parseInclusiveDate(
  raw: unknown,
  edge: "start" | "end",
  label = "date",
): Date | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const value = raw.trim();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new AppError(`Invalid ${label}: ${raw}`, 400);
  }
  if (BARE_DATE.test(value)) {
    if (edge === "start") d.setUTCHours(0, 0, 0, 0);
    else d.setUTCHours(23, 59, 59, 999);
  }
  return d;
}

export interface ParsedDateRange {
  from?: Date;
  to?: Date;
}

/** Parses `from` / `to` together and rejects an inverted window. */
export function parseDateRange(
  fromRaw: unknown,
  toRaw: unknown,
): ParsedDateRange {
  const from = parseInclusiveDate(fromRaw, "start", "`from` date");
  const to = parseInclusiveDate(toRaw, "end", "`to` date");
  if (from && to && from > to) {
    throw new AppError("`from` must not be after `to`", 400);
  }
  return { from, to };
}

/**
 * A Mongo range clause for the parsed bounds, or `null` when neither was given
 * so callers can skip the `$match` entirely.
 */
export function dateRangeClause(
  range: ParsedDateRange,
): Record<string, Date> | null {
  const clause: Record<string, Date> = {};
  if (range.from) clause.$gte = range.from;
  if (range.to) clause.$lte = range.to;
  return Object.keys(clause).length > 0 ? clause : null;
}

/** ISO strings for echoing the applied window back to the client. */
export function rangeEcho(range: ParsedDateRange): {
  from: string | null;
  to: string | null;
} {
  return {
    from: range.from ? range.from.toISOString() : null,
    to: range.to ? range.to.toISOString() : null,
  };
}
