import { Request, Response } from "express";
import { asyncHandler, sendSuccessResponse } from "../middlewares/error.middleware";
import {
  csvRangeFilename,
  isFullExport,
  sendCsvResponse,
  wantsCsv,
  type CsvColumn,
} from "../utils/lib/csv";
import { parseDateRange } from "../utils/lib/dateRange";
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

function parseReportQuery(req: Request): ReportQuery {
  const { from, to } = parseDateRange(req.query.from, req.query.to);

  return {
    from,
    to,
    q: typeof req.query.q === "string" ? req.query.q : "",
    page: Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1),
    limit: Math.min(
      200,
      Math.max(1, parseInt(String(req.query.limit ?? "20"), 10) || 20),
    ),
    exportAll: isFullExport(req.query),
  };
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

    if (wantsCsv(req.query)) {
      sendCsvResponse(
        res,
        result.items,
        PLATFORM_COLUMNS,
        csvRangeFilename("platform-success-points", result.range),
      );
      return;
    }
    sendSuccessResponse(res, result, "Platform success points report fetched");
  },
);

// ─── Internship success points ───────────────────────────────────────────────

/**
 * The API nests each learner's internships; a spreadsheet wants them flat, so
 * the CSV emits one line per (learner × internship). A learner with no
 * internship slice at all still gets a single line, so nobody vanishes.
 */
interface FlatInternshipRow {
  name: string;
  email: string;
  internshipTitle: string;
  batches: string[];
  earned: number;
  tasks: number;
  meetings: number;
  purchased: number;
  currentPoints: number;
  learnerTotalEarned: number;
}

function flattenInternshipRows(
  rows: readonly InternshipPointsRow[],
): FlatInternshipRow[] {
  const out: FlatInternshipRow[] = [];
  for (const r of rows) {
    if (r.internships.length === 0) {
      out.push({
        name: r.name,
        email: r.email,
        internshipTitle: "",
        batches: [],
        earned: r.earned,
        tasks: r.earnedBreakdown.tasks,
        meetings: r.earnedBreakdown.meetings,
        purchased: r.earnedBreakdown.purchased,
        currentPoints: r.currentPoints,
        learnerTotalEarned: r.earned,
      });
      continue;
    }
    for (const s of r.internships) {
      out.push({
        name: r.name,
        email: r.email,
        internshipTitle: s.internshipTitle,
        batches: s.batches,
        earned: s.earned,
        tasks: s.tasks,
        meetings: s.meetings,
        purchased: s.purchased,
        currentPoints: s.currentPoints,
        learnerTotalEarned: r.earned,
      });
    }
  }
  return out;
}

const INTERNSHIP_COLUMNS: CsvColumn<FlatInternshipRow>[] = [
  { header: "Name", pick: (r) => r.name },
  { header: "Email", pick: (r) => r.email },
  { header: "Internship", pick: (r) => r.internshipTitle },
  { header: "Batches", pick: (r) => r.batches.join(" | ") },
  { header: "Earned (this internship)", pick: (r) => r.earned },
  { header: "Earned: Tasks & Exams", pick: (r) => r.tasks },
  { header: "Earned: Live Meetings", pick: (r) => r.meetings },
  { header: "Earned: Purchased", pick: (r) => r.purchased },
  { header: "Current Points (all-time)", pick: (r) => r.currentPoints },
  { header: "Learner Total Earned", pick: (r) => r.learnerTotalEarned },
];

export const getInternshipSuccessPointsReportController = asyncHandler(
  async (req: Request, res: Response) => {
    const opts = parseReportQuery(req);
    const result = await getInternshipSuccessPointsReport(opts);

    if (wantsCsv(req.query)) {
      sendCsvResponse(
        res,
        flattenInternshipRows(result.items),
        INTERNSHIP_COLUMNS,
        csvRangeFilename("internship-success-points", result.range),
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

    if (wantsCsv(req.query)) {
      sendCsvResponse(
        res,
        result.items,
        REFERRAL_COLUMNS,
        csvRangeFilename("referral-report", result.range),
      );
      return;
    }
    sendSuccessResponse(res, result, "Referral report fetched");
  },
);

/** Surfaced so the UI can warn before an export is silently truncated. */
export const reportExportMaxRows = REPORT_EXPORT_MAX_ROWS;
