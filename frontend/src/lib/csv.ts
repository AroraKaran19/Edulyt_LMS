/**
 * Client-side CSV builder, used for the "current page" report export so the
 * visible rows download instantly without a second server round-trip.
 *
 * Mirrors `backend/src/utils/lib/csv.ts`: BOM + CRLF so Excel on Windows reads
 * the encoding correctly.
 */

export interface CsvColumn<T> {
  header: string;
  pick: (row: T) => unknown;
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  const needsQuote = /[",\r\n]/.test(s);
  return needsQuote ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv<T>(
  rows: readonly T[],
  columns: readonly CsvColumn<T>[],
): string {
  const header = columns.map((c) => csvCell(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => csvCell(c.pick(r))).join(","));
  return "﻿" + [header, ...body].join("\r\n") + "\r\n";
}

/** Builds the CSV and hands it to the browser as a download. */
export function downloadCsv<T>(
  rows: readonly T[],
  columns: readonly CsvColumn<T>[],
  filename: string,
): void {
  const blob = new Blob([buildCsv(rows, columns)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
