/** Admin Excel (.xlsx) lead import. Mirrors the backend's row, preview and job shapes. */

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
  creatorEmail?: string;
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
  "creatorEmail",
] as const satisfies readonly (keyof LeadImportRow)[];

export const LEAD_IMPORT_MAX_ROWS = 2000;

export type LeadImportOutcome = "ok" | "error";

export interface LeadImportRowResult {
  /** 1-based index into the `rows` array sent to the API. */
  row: number;
  outcome: LeadImportOutcome;
  error?: string;
  creatorNotFound?: boolean;
  existing?: boolean;
}

export interface LeadImportSummary {
  ok: number;
  error: number;
  existing: number;
  creatorNotFound: number;
}

export interface LeadImportPreview {
  results: LeadImportRowResult[];
  summary: LeadImportSummary;
}

export type LeadImportJobStatus = "queued" | "running" | "done" | "failed";

export interface LeadImportJobSummary {
  _id: string;
  fileName: string;
  createdBy: { userId: string | null; name: string };
  status: LeadImportJobStatus;
  totalRows: number;
  processedRows: number;
  created: number;
  errorCount: number;
  creatorNotFound: number;
  startedAt: string | null;
  finishedAt: string | null;
  failureMessage: string;
  createdAt: string;
}

export interface LeadImportJobIssue {
  row: number;
  kind: "error" | "creator-not-found";
  message: string;
  data: Partial<LeadImportRow>;
}

export interface LeadImportJobDetail extends LeadImportJobSummary {
  issues: LeadImportJobIssue[];
}

export interface LeadImportJobList {
  items: LeadImportJobSummary[];
  total: number;
  page: number;
  limit: number;
}
