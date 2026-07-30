/**
 * Minimal RFC-4180 CSV writer used by the admin report exports.
 *
 * Excel on Windows needs the UTF-8 BOM to detect the encoding, and CRLF line
 * endings, otherwise rupee symbols and names with diacritics arrive mangled.
 */

import type { Response } from "express";

/** Quotes/escapes a single cell. Dates are emitted as ISO-8601. */
export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s: string;
  if (v instanceof Date) {
    s = v.toISOString();
  } else if (typeof v === "object") {
    s = JSON.stringify(v);
  } else {
    s = String(v);
  }
  const needsQuote = /[",\r\n]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

export interface CsvColumn<T> {
  header: string;
  pick: (row: T) => unknown;
}

/** Full CSV document (BOM + header + rows) for the given columns. */
export function buildCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const header = columns.map((c) => csvCell(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => csvCell(c.pick(r))).join(","));
  return "﻿" + [header, ...body].join("\r\n") + "\r\n";
}

/** Hard ceiling on an unpaginated CSV export, so one click can't pin the box. */
export const CSV_EXPORT_MAX_ROWS = 50_000;

/**
 * Filename that records which window an export covers, e.g.
 * `orders_2026-01-01_to_2026-03-31.csv` or `orders_all-time.csv`.
 */
export function csvRangeFilename(
  base: string,
  range: { from: string | null; to: string | null },
): string {
  const day = (iso: string | null) => (iso ? iso.slice(0, 10) : null);
  const from = day(range.from);
  const to = day(range.to);
  const suffix =
    from || to ? `_${from ?? "start"}_to_${to ?? "today"}` : "_all-time";
  return `${base}${suffix}.csv`;
}

/** Sends the rows as a CSV attachment. */
export function sendCsvResponse<T>(
  res: Response,
  rows: readonly T[],
  columns: readonly CsvColumn<T>[],
  filename: string,
): void {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  // Lets the browser read the filename back when the request is an XHR.
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.status(200).send(buildCsv(rows, columns));
}

/**
 * True when the caller asked for a CSV of the whole window rather than one
 * page. `scope=page` keeps paging in force, which the clients don't use (they
 * build the current-page CSV locally) but which keeps the API honest.
 */
export function wantsCsv(query: Record<string, unknown>): boolean {
  return String(query.format ?? "").toLowerCase() === "csv";
}

export function isFullExport(query: Record<string, unknown>): boolean {
  return (
    wantsCsv(query) &&
    String(query.scope ?? "range").toLowerCase() !== "page"
  );
}
