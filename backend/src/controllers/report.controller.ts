import { Request, Response } from "express";
import { asyncHandler, AppError, sendSuccessResponse } from "../middlewares/error.middleware";
import { buildCsv, type CsvColumn } from "../utils/lib/csv";
import {
  getInternshipSuccessPointsReport,
  getPlatformSuccessPointsReport,
  getReferralReport,
  REPORT_EXPORT_MAX_ROWS,
  type InternshipPointsRow,
  type PlatformPointsRow,
  type ReferralReportRow,
  type ReportQuery,
} from "../services/report.services";

/**
 * `from` is snapped to 00:00:00.000 and `to` to 23:59:59.999 so a same-day
 * range (from = to) covers that whole day rather than a zero-width instant.
 * Dates arrive as `YYYY-MM-DD` from the admin date pickers.
 */
function parseDateParam(raw: unknown, edge: "start" | "end"): Date | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const d = new Date(raw.trim());
  if (Number.isNaN(d.getTime())) {
    throw new AppError(`Invalid date: ${raw}`, 400);
  }
  // Only snap bare calendar dates; a full ISO timestamp is taken as given.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
    if (edge === "start") d.setUTCHours(0, 0, 0, 0);
    else d.setUTCHours(23, 59, 59, 999);
  }
  return d;
}

function parseReportQuery(req: Request): ReportQuery {
  const from = parseDateParam(req.query.from, "start");
  const to = parseDateParam(req.query.to, "end");
  if (from && to && from > to) {
    throw new AppError("`from` must not be after `to`", 400);
  }

  const exportAll =
    String(req.query.format ?? "").toLowerCase() === "csv" &&
    String(req.query.scope ?? "range").toLowerCase() !== "page";

  return {
    from,
    to,
    q: typeof req.query.q === "string" ? req.query.q : "",
    page: Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1),
    limit: Math.min(
      200,
      Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20),
    ),
    exportAll,
  };
}

const wantsCsv = (req: Request) =>
  String(req.query.format ?? "").toLowerCase() === "csv";

/** Builds a filename that records which window the export covers. */
function csvFilename(base: string, range: { from: string | null; to: string | null }) {
  const day = (iso: string | null) => (iso ? iso.slice(0, 10) : null);
  const from = day(range.from);
  const to = day(range.to);
  const suffix = from || to ? `_${from ?? "start"}_to_${to ?? "today"}` : "_all-time";
  return `${base}${suffix}.csv`;
}

function sendCsv<T>(
  res: Response,
  rows: readonly T[],
  columns: readonly CsvColumn<T>[],
  filename: string,
): void {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  // Lets the browser read the filename when the request is a same-origin XHR.
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.status(200).send(buildCsv(rows, columns));
}

// ─── Platform success points ─────────────────────────────────────────────────

const PLATFORM_COLUMNS: CsvColumn<PlatformPointsRow>[] = [
  { header: "Name", pick: (r) => r.name },
  { header: "Email", pick: (r) => r.email },
  { header: "Total Earned", pick: (r) => r.earned },
  { header: "Total Spent", pick: (r) => r.spent },
  { header: "Net", pick: (r) => r.earned - r.spent },
  { header: "Current Balance", pick: (r) => r.balance },
  { header: "Earned: Courses", pick: (r) => r.earnedBreakdown.courses },
  { header: "Earned: Rewards", pick: (r) => r.earnedBreakdown.rewards },
  { header: "Earned: Transfers In", pick: (r) => r.earnedBreakdown.transfersIn },
  { header: "Earned: Admin Grants", pick: (r) => r.earnedBreakdown.adminGrants },
  { header: "Spent: Redeemed", pick: (r) => r.spentBreakdown.redeemed },
  { header: "Spent: Transfers Out", pick: (r) => r.spentBreakdown.transfersOut },
  {
    header: "Spent: Admin Deductions",
    pick: (r) => r.spentBreakdown.adminDeductions,
  },
];

export const getPlatformSuccessPointsReportController = asyncHandler(
  async (req: Request, res: Response) => {
    const opts = parseReportQuery(req);
    const result = await getPlatformSuccessPointsReport(opts);

    if (wantsCsv(req)) {
      sendCsv(
        res,
        result.items,
        PLATFORM_COLUMNS,
        csvFilename("platform-success-points", result.range),
      );
      return;
    }
    sendSuccessResponse(res, result, "Platform success points report fetched");
  },
);

// ─── Internship success points ───────────────────────────────────────────────

const INTERNSHIP_COLUMNS: CsvColumn<InternshipPointsRow>[] = [
  { header: "Name", pick: (r) => r.name },
  { header: "Email", pick: (r) => r.email },
  { header: "Total Earned", pick: (r) => r.earned },
  { header: "Total Spent", pick: (r) => r.spent },
  { header: "Earned: Tasks & Exams", pick: (r) => r.earnedBreakdown.tasks },
  { header: "Earned: Live Meetings", pick: (r) => r.earnedBreakdown.meetings },
  { header: "Earned: Purchased", pick: (r) => r.earnedBreakdown.purchased },
];

export const getInternshipSuccessPointsReportController = asyncHandler(
  async (req: Request, res: Response) => {
    const opts = parseReportQuery(req);
    const result = await getInternshipSuccessPointsReport(opts);

    if (wantsCsv(req)) {
      sendCsv(
        res,
        result.items,
        INTERNSHIP_COLUMNS,
        csvFilename("internship-success-points", result.range),
      );
      return;
    }
    sendSuccessResponse(res, result, "Internship success points report fetched");
  },
);

// ─── Referrals ───────────────────────────────────────────────────────────────

const REFERRAL_COLUMNS: CsvColumn<ReferralReportRow>[] = [
  { header: "Name", pick: (r) => r.name },
  { header: "Email", pick: (r) => r.email },
  { header: "Referral Code", pick: (r) => r.code },
  { header: "Total Referrals", pick: (r) => r.totalReferrals },
  { header: "Total Earned (INR)", pick: (r) => r.totalEarned },
  { header: "Total Paid (INR)", pick: (r) => r.totalPaid },
  { header: "Pending Payout (INR)", pick: (r) => r.pendingPayout },
  { header: "Balance (INR)", pick: (r) => r.balance },
];

export const getReferralReportController = asyncHandler(
  async (req: Request, res: Response) => {
    const opts = parseReportQuery(req);
    const result = await getReferralReport(opts);

    if (wantsCsv(req)) {
      sendCsv(
        res,
        result.items,
        REFERRAL_COLUMNS,
        csvFilename("referral-report", result.range),
      );
      return;
    }
    sendSuccessResponse(res, result, "Referral report fetched");
  },
);

/** Surfaced so the UI can warn before an export is silently truncated. */
export const reportExportMaxRows = REPORT_EXPORT_MAX_ROWS;
