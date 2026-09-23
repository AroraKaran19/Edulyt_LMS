"use client";

import { useMemo, useRef, useState } from "react";
import { readSheet } from "read-excel-file/browser";
import writeXlsxFile from "write-excel-file/browser";
import type { Column } from "write-excel-file/browser";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "@/configs/apiConfig";
import { ENDPOINTS } from "@/constants/endpoints";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import OrangeButton from "@/components/ui/buttons/OrangeButton";
import WhiteButton from "@/components/ui/buttons/WhiteButton";
import {
  LEAD_IMPORT_COLUMNS,
  LEAD_IMPORT_MAX_ROWS,
  type LeadImportOutcome,
  type LeadImportResponse,
  type LeadImportRow,
  type LeadImportRowResult,
} from "@/types";

type Step = "upload" | "preview" | "done";
type FilterTab = "all" | "error" | "duplicate";
type ResultRow = LeadImportRowResult & { name: string; email: string };

const PREVIEW_PAGE_SIZE = 200;
const LEADS_SHEET_NAME = "Leads";

const OUTCOME_STYLE: Record<LeadImportOutcome, string> = {
  ok: "bg-green-50 text-green-700 ring-green-600/20",
  duplicate: "bg-amber-50 text-amber-700 ring-amber-600/20",
  error: "bg-red-50 text-red-700 ring-red-600/20",
};

const OUTCOME_LABEL: Record<LeadImportOutcome, string> = {
  ok: "Ready",
  duplicate: "Duplicate",
  error: "Error",
};

const TAB_LABEL: Record<FilterTab, string> = {
  all: "All",
  error: "Errors",
  duplicate: "Duplicates",
};

/** Reads the server-supplied filename, falling back to a sensible default. */
function filenameFromDisposition(header: unknown, fallback: string): string {
  if (typeof header !== "string") return fallback;
  const match = header.match(/filename="?([^";]+)"?/i);
  return match?.[1]?.trim() || fallback;
}

/** Hands a Blob to the browser as a download, then releases the object URL. */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Every cell as a trimmed string; a numeric phone cell comes back as plain digits, never "1234567890.0" or scientific notation. */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return Number.isFinite(value) ? value.toString() : "";
  if (typeof value === "boolean") return String(value);
  return String(value).trim();
}

/** Reads the "Leads" sheet, maps its header row to the Row fields by name, and drops blank rows. */
async function parseExcelFile(file: File): Promise<LeadImportRow[]> {
  let sheetRows: unknown[][];
  try {
    sheetRows = (await readSheet(file, LEADS_SHEET_NAME)) as unknown[][];
  } catch {
    throw new Error(`Could not find a "${LEADS_SHEET_NAME}" sheet in this file.`);
  }
  if (sheetRows.length === 0) return [];

  const headerRow = sheetRows[0].map((c) => cellToString(c).toLowerCase());
  const colIndexByField = new Map<string, number>();
  for (const field of LEAD_IMPORT_COLUMNS) {
    const idx = headerRow.indexOf(field.toLowerCase());
    if (idx !== -1) colIndexByField.set(field, idx);
  }
  if (colIndexByField.size === 0) {
    throw new Error("This file's headers don't match the lead import template.");
  }

  const rows: LeadImportRow[] = [];
  for (let i = 1; i < sheetRows.length; i += 1) {
    const raw = sheetRows[i] ?? [];
    const values = LEAD_IMPORT_COLUMNS.map((field) => {
      const idx = colIndexByField.get(field);
      return idx === undefined ? "" : cellToString(raw[idx]);
    });
    if (values.every((v) => v === "")) continue;
    rows.push(
      Object.fromEntries(
        LEAD_IMPORT_COLUMNS.map((field, i2) => [field, values[i2]]),
      ) as unknown as LeadImportRow,
    );
  }
  return rows;
}

const apiErrorMessage = (err: unknown): string | undefined =>
  (err as { response?: { data?: { error?: { message?: string } } } })
    ?.response?.data?.error?.message;

interface Props {
  /** `imported` is true only once the final (non-dry-run) call has created leads. */
  onClose: (imported: boolean) => void;
}

export default function ImportLeadsModal({ onClose }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<LeadImportRow[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [templateBusy, setTemplateBusy] = useState(false);
  const [preview, setPreview] = useState<LeadImportResponse | null>(null);
  const [tab, setTab] = useState<FilterTab>("all");
  const [visibleCount, setVisibleCount] = useState(PREVIEW_PAGE_SIZE);
  const [importing, setImporting] = useState(false);
  const [created, setCreated] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dismiss = () => onClose(step === "done");

  const downloadTemplate = async () => {
    setTemplateBusy(true);
    try {
      const res = await apiClient.get<Blob>(ENDPOINTS.admin.leadsImportTemplate, {
        responseType: "blob",
      });
      triggerDownload(
        res.data,
        filenameFromDisposition(res.headers?.["content-disposition"], "lead-import-template.xlsx"),
      );
    } catch {
      toast.error("Could not download the template");
    } finally {
      setTemplateBusy(false);
    }
  };

  const handleFile = async (file: File) => {
    setUploadError("");
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setUploadError("Only .xlsx files are accepted.");
      return;
    }
    setBusy(true);
    try {
      const parsedRows = await parseExcelFile(file);
      if (parsedRows.length === 0) {
        setUploadError("This file has no rows.");
        return;
      }
      if (parsedRows.length > LEAD_IMPORT_MAX_ROWS) {
        setUploadError(
          `This file has ${parsedRows.length.toLocaleString()} rows; the limit is ${LEAD_IMPORT_MAX_ROWS.toLocaleString()}.`,
        );
        return;
      }

      const res = await apiClient.post(ENDPOINTS.admin.leadsImport, {
        fileName: file.name,
        dryRun: true,
        rows: parsedRows,
      });
      const data: LeadImportResponse = res.data?.data;
      setFileName(file.name);
      setRows(parsedRows);
      setPreview(data);
      setTab("all");
      setVisibleCount(PREVIEW_PAGE_SIZE);
      setStep("preview");
    } catch (err: unknown) {
      setUploadError(
        apiErrorMessage(err) ||
          (err instanceof Error ? err.message : "Could not read or validate this file."),
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (busy) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleFile(file);
  };

  const startOver = () => {
    setStep("upload");
    setFileName("");
    setRows([]);
    setPreview(null);
    setUploadError("");
  };

  const combinedResults = useMemo<ResultRow[]>(() => {
    if (!preview) return [];
    return preview.results.map((r) => ({
      ...r,
      name: rows[r.row - 1]?.name ?? "",
      email: rows[r.row - 1]?.email ?? "",
    }));
  }, [preview, rows]);

  const filteredResults = useMemo(
    () =>
      tab === "all"
        ? combinedResults
        : combinedResults.filter((r) => r.outcome === tab),
    [combinedResults, tab],
  );
  const visibleResults = filteredResults.slice(0, visibleCount);

  const changeTab = (next: FilterTab) => {
    setTab(next);
    setVisibleCount(PREVIEW_PAGE_SIZE);
  };

  const downloadErrorRows = () => {
    const errorRows = combinedResults.filter((r) => r.outcome === "error");
    if (errorRows.length === 0) return;
    const columns: Column<ResultRow>[] = [
      ...LEAD_IMPORT_COLUMNS.map((key) => ({
        header: key,
        cell: (r: ResultRow) => rows[r.row - 1]?.[key] ?? "",
      })),
      { header: "error", cell: (r: ResultRow) => r.error ?? "" },
    ];
    const base = fileName.replace(/\.xlsx$/i, "") || "leads-import";
    void writeXlsxFile(errorRows, { sheet: "Errors", columns }).toFile(`${base}-errors.xlsx`);
  };

  const handleImport = async () => {
    if (!preview || preview.summary.ok === 0) return;
    setImporting(true);
    try {
      const res = await apiClient.post(ENDPOINTS.admin.leadsImport, {
        fileName,
        dryRun: false,
        rows,
      });
      const data: LeadImportResponse = res.data?.data;
      setCreated(data.created);
      setStep("done");
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err) || "Could not import these leads");
    } finally {
      setImporting(false);
    }
  };

  const title =
    step === "upload"
      ? "Import leads from Excel"
      : step === "preview"
        ? "Review before import"
        : "Import complete";

  return (
    <Modal
      isOpen
      onClose={dismiss}
      title={title}
      className={cn("mx-4 w-full", step === "preview" ? "max-w-3xl" : "max-w-lg")}
    >
      {step === "upload" ? (
        <div>
          <button
            type="button"
            onClick={() => void downloadTemplate()}
            disabled={templateBusy}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:underline disabled:opacity-60"
          >
            <Download className="size-4" />
            {templateBusy ? "Preparing…" : "Download template (.xlsx)"}
          </button>

          <ul className="mt-2.5 list-disc space-y-1 pl-4 text-xs text-gray-500">
            <li>
              <span className="font-semibold text-gray-700">name, email, phone, brand</span>{" "}
              are required; the rest are optional.
            </li>
            <li>brand: airkrit or edulyt</li>
            <li>programKind: course or internship</li>
            <li>status and subStatus: leave blank for the default stage</li>
            <li>extras: a JSON object, shown in the lead&apos;s details</li>
          </ul>

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => !busy && fileInputRef.current?.click()}
            className={cn(
              "mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
              dragActive
                ? "border-orange-400 bg-orange-50"
                : "border-gray-300 hover:border-gray-400",
              busy && "pointer-events-none opacity-60",
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleInputChange}
            />
            {busy ? (
              <Loader2 className="size-6 animate-spin text-gray-400" />
            ) : (
              <UploadCloud className="size-6 text-gray-400" />
            )}
            <p className="text-sm font-medium text-gray-900">
              {busy ? "Reading file…" : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-gray-500">
              .xlsx only, up to {LEAD_IMPORT_MAX_ROWS.toLocaleString()} rows
            </p>
          </div>

          {uploadError ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
              <AlertCircle className="size-3.5 shrink-0" />
              {uploadError}
            </p>
          ) : null}
        </div>
      ) : null}

      {step === "preview" && preview ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex rounded-full bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
              {preview.summary.ok} ready · {preview.summary.duplicate} duplicates ·{" "}
              {preview.summary.error} with errors
            </span>
            {preview.summary.error > 0 ? (
              <button
                type="button"
                onClick={downloadErrorRows}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:underline"
              >
                <Download className="size-3.5" />
                Download rows with errors
              </button>
            ) : null}
          </div>

          <div className="mt-3 flex gap-1.5">
            {(["all", "error", "duplicate"] as FilterTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => changeTab(t)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  tab === t
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
              >
                {TAB_LABEL[t]}
              </button>
            ))}
          </div>

          <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-gray-200">
            <table className="w-full text-left text-[13px]">
              <thead className="sticky top-0 bg-gray-50 text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Outcome</th>
                  <th className="px-3 py-2">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleResults.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                      No rows in this filter.
                    </td>
                  </tr>
                ) : (
                  visibleResults.map((r) => (
                    <tr key={r.row}>
                      <td className="px-3 py-2 text-gray-500">{r.row}</td>
                      <td className="px-3 py-2 text-gray-900">{r.name || "—"}</td>
                      <td className="px-3 py-2 text-gray-600">{r.email || "—"}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${OUTCOME_STYLE[r.outcome]}`}
                        >
                          {OUTCOME_LABEL[r.outcome]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500">{r.error ?? ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredResults.length > visibleResults.length ? (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PREVIEW_PAGE_SIZE)}
              className="mt-2 text-sm font-semibold text-orange-600 hover:underline"
            >
              Show more ({filteredResults.length - visibleResults.length} remaining)
            </button>
          ) : null}

          <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-4">
            <WhiteButton type="button" glow={false} onClick={startOver} disabled={importing}>
              Start over
            </WhiteButton>
            <OrangeButton
              type="button"
              glow={false}
              disabled={importing || preview.summary.ok === 0}
              onClick={() => void handleImport()}
            >
              {importing ? "Importing…" : `Import ${preview.summary.ok} leads`}
            </OrangeButton>
          </div>
        </div>
      ) : null}

      {step === "done" ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 className="size-10 text-green-500" />
          <p className="text-lg font-bold text-gray-900">{created} leads imported</p>
          <p className="text-sm text-gray-500">
            The leads list will refresh once you close this.
          </p>
          <OrangeButton type="button" glow={false} onClick={dismiss} className="mt-1">
            Done
          </OrangeButton>
        </div>
      ) : null}
    </Modal>
  );
}
