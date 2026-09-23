/**
 * Admin Excel (.xlsx) lead import. Mirrors the backend contract for
 * `POST /api/admin/leads/import` — keep in sync with the backend's row and
 * response shapes.
 */

/** One row from an uploaded .xlsx file, before the API validates it. Every field is a string. */
export interface LeadImportRow {
  name: string;
  email: string;
  phone: string;
  brand: string;
  collegeName?: string;
  state?: string;
  programKind?: string;
  programSlug?: string;
  status?: string;
  subStatus?: string;
  /** Raw JSON text, shown verbatim in the lead's details. */
  extras?: string;
}

/** Column order for both the downloaded template and the parsed upload. */
export const LEAD_IMPORT_COLUMNS = [
  "name",
  "email",
  "phone",
  "brand",
  "collegeName",
  "state",
  "programKind",
  "programSlug",
  "status",
  "subStatus",
  "extras",
] as const satisfies readonly (keyof LeadImportRow)[];

export const LEAD_IMPORT_MAX_ROWS = 2000;

export type LeadImportOutcome = "ok" | "duplicate" | "error";

export interface LeadImportRowResult {
  /** 1-based index into the `rows` array sent to the API. */
  row: number;
  outcome: LeadImportOutcome;
  error?: string;
}

export interface LeadImportSummary {
  ok: number;
  duplicate: number;
  error: number;
}

export interface LeadImportResponse {
  results: LeadImportRowResult[];
  summary: LeadImportSummary;
  created: number;
}

export interface LeadImportRequest {
  fileName: string;
  dryRun: boolean;
  rows: LeadImportRow[];
}
