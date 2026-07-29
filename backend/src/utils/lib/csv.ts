/**
 * Minimal RFC-4180 CSV writer used by the admin report exports.
 *
 * Excel on Windows needs the UTF-8 BOM to detect the encoding, and CRLF line
 * endings, otherwise rupee symbols and names with diacritics arrive mangled.
 */

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
