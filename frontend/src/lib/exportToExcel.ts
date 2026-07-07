import * as XLSX from "xlsx";

/** A flat row: object keys become column headers, in insertion order. */
export type ExcelRow = Record<string, string | number | boolean>;

/** Strip characters that are awkward in file names; collapse whitespace. */
function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "export";
}

/**
 * Build an .xlsx workbook from flat row objects and trigger a browser
 * download. Client-side only (relies on the DOM download mechanism).
 *
 * Column headers are taken from the keys of the first row, so pass rows with
 * a consistent, ordered shape.
 */
export function exportRowsToExcel(
  rows: ExcelRow[],
  opts: { fileName: string; sheetName?: string },
): void {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  // Excel caps sheet names at 31 chars and forbids a few characters.
  const sheetName = (opts.sheetName ?? "Sheet1")
    .replace(/[\\/?*[\]:]/g, " ")
    .slice(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || "Sheet1");

  const base = sanitizeFileName(opts.fileName);
  const fileName = base.toLowerCase().endsWith(".xlsx")
    ? base
    : `${base}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
