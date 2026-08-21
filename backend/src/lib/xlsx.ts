/**
 * Minimal SpreadsheetML (.xlsx) writer built on `jszip`, which is already in
 * the dependency tree. Deliberately hand-rolled instead of pulling in
 * exceljs/SheetJS: exports only ever need a flat grid, a bold frozen header
 * row, autofilter, and real date cells.
 *
 * Dates are written as Excel serial numbers so Excel sorts and filters them
 * natively. The serial is timezone-naive, so callers get IST wall-clock time:
 * every datetime in an export reads as the instant an Indian ops user saw it.
 */

import fs from "fs";
import JSZip from "jszip";

export type XlsxCell = string | number | boolean | Date | null | undefined;

export interface XlsxSheet {
  name: string;
  headers: string[];
  rows: XlsxCell[][];
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
/** Days between the Excel epoch (1899-12-30) and the Unix epoch. */
const EXCEL_EPOCH_OFFSET_DAYS = 25569;

const STYLE_DEFAULT = 0;
const STYLE_HEADER = 1;
const STYLE_DATE = 2;

/**
 * Drop the C0 control codepoints XML 1.0 forbids (tab/LF/CR are legal). A
 * single stray one anywhere makes Excel refuse to open the whole workbook,
 * and pasted-in form answers do carry them.
 */
function stripInvalidXmlChars(value: string): string {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) as number;
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) continue;
    out += ch;
  }
  return out;
}

function escapeXml(value: string): string {
  return stripInvalidXmlChars(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 0-based column index -> spreadsheet column name (0 -> A, 26 -> AA). */
export function columnName(index: number): string {
  let n = index;
  let name = "";
  while (n >= 0) {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
  }
  return name;
}

function toExcelSerial(date: Date): number {
  return (date.getTime() + IST_OFFSET_MS) / 86400000 + EXCEL_EPOCH_OFFSET_DAYS;
}

function cellXml(ref: string, value: XlsxCell, headerRow: boolean): string {
  if (value === null || value === undefined || value === "") return "";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return `<c r="${ref}" s="${STYLE_DATE}"><v>${toExcelSerial(value)}</v></c>`;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return `<c r="${ref}"><v>${value}</v></c>`;
  }
  if (typeof value === "boolean") {
    return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
  }

  const style = headerRow ? STYLE_HEADER : STYLE_DEFAULT;
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(
    value,
  )}</t></is></c>`;
}

function rowXml(cells: XlsxCell[], rowNumber: number, headerRow: boolean): string {
  const body = cells
    .map((cell, i) => cellXml(`${columnName(i)}${rowNumber}`, cell, headerRow))
    .join("");
  return `<row r="${rowNumber}">${body}</row>`;
}

/** Rough per-column width from the widest sample, so nothing opens as "####". */
function colsXml(sheet: XlsxSheet): string {
  const widths = sheet.headers.map((h) => String(h ?? "").length);
  // Sampling the head is enough to size columns; scanning 50k rows is not worth it.
  for (const row of sheet.rows.slice(0, 500)) {
    row.forEach((cell, i) => {
      const len = cell instanceof Date ? 16 : String(cell ?? "").length;
      if (len > (widths[i] ?? 0)) widths[i] = len;
    });
  }
  const cols = widths
    .map(
      (w, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${Math.min(
          Math.max(w + 2, 10),
          46,
        )}" customWidth="1"/>`,
    )
    .join("");
  return `<cols>${cols}</cols>`;
}

function sheetXml(sheet: XlsxSheet): string {
  const colCount = Math.max(
    sheet.headers.length,
    ...sheet.rows.map((r) => r.length),
    1,
  );
  const rowCount = sheet.rows.length + 1;
  const range = `A1:${columnName(colCount - 1)}${rowCount}`;

  const data = [
    rowXml(sheet.headers, 1, true),
    ...sheet.rows.map((row, i) => rowXml(row, i + 2, false)),
  ].join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="${range}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>${colsXml(
    sheet,
  )}<sheetData>${data}</sheetData><autoFilter ref="${range}"/></worksheet>`;
}

/** Excel caps sheet names at 31 chars and rejects a handful of punctuation. */
function safeSheetName(name: string, index: number): string {
  const cleaned = (name || `Sheet${index + 1}`)
    .replace(/[[\]:*?/\\]/g, " ")
    .trim();
  return (cleaned || `Sheet${index + 1}`).slice(0, 31);
}

export async function writeXlsx(
  outPath: string,
  sheets: XlsxSheet[],
): Promise<void> {
  if (!sheets.length) throw new Error("writeXlsx: at least one sheet is required");

  const zip = new JSZip();

  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join("")}</Types>`,
  );

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  );

  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets
      .map(
        (s, i) =>
          `<sheet name="${escapeXml(safeSheetName(s.name, i))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
      )
      .join("")}</sheets></workbook>`,
  );

  zip.file(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
  );

  zip.file(
    "xl/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd hh:mm"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
  );

  sheets.forEach((sheet, i) => {
    zip.file(`xl/worksheets/sheet${i + 1}.xml`, sheetXml(sheet));
  });

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  fs.writeFileSync(outPath, buffer);
}
