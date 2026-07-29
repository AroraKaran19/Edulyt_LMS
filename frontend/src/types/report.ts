/**
 * Admin report row/response shapes. Mirrors the interfaces in
 * `backend/src/services/report.services.ts`; keep the two in sync.
 */

export interface ReportPage<TRow, TTotals> {
  items: TRow[];
  total: number;
  page: number;
  totalPages: number;
  /** Covers the entire filtered set, not just the current page. */
  totals: TTotals;
  range: { from: string | null; to: string | null };
}

// ─── Platform success points (student wallet) ─────────────────────────────────

export interface PlatformPointsRow {
  userId: string;
  name: string;
  email: string;
  earned: number;
  spent: number;
  /** Live wallet balance — always all-time, never scoped to the date range. */
  balance: number;
  earnedBreakdown: {
    courses: number;
    rewards: number;
    transfersIn: number;
    adminGrants: number;
  };
  spentBreakdown: {
    redeemed: number;
    transfersOut: number;
    adminDeductions: number;
  };
}

export interface PlatformPointsTotals {
  users: number;
  earned: number;
  spent: number;
  net: number;
}

export type PlatformPointsReport = ReportPage<
  PlatformPointsRow,
  PlatformPointsTotals
>;

// ─── Internship success points ───────────────────────────────────────────────

export interface InternshipPointsRow {
  userId: string;
  name: string;
  email: string;
  earned: number;
  /** Always 0 — internship points have no redemption path. */
  spent: number;
  earnedBreakdown: {
    tasks: number;
    meetings: number;
    purchased: number;
  };
}

export interface InternshipPointsTotals {
  users: number;
  earned: number;
  spent: number;
  tasks: number;
  meetings: number;
  purchased: number;
}

export type InternshipPointsReport = ReportPage<
  InternshipPointsRow,
  InternshipPointsTotals
>;

// ─── Referrals ───────────────────────────────────────────────────────────────

export interface ReferralReportRow {
  userId: string;
  name: string;
  email: string;
  code: string;
  totalReferrals: number;
  totalEarned: number;
  totalPaid: number;
  pendingPayout: number;
  balance: number;
}

export interface ReferralReportTotals {
  users: number;
  totalReferrals: number;
  totalEarned: number;
  totalPaid: number;
  pendingPayout: number;
}

export type ReferralReport = ReportPage<ReferralReportRow, ReferralReportTotals>;

// ─── Shared query shape ──────────────────────────────────────────────────────

export interface ReportFilters {
  /** YYYY-MM-DD, inclusive. Empty string = unbounded. */
  from: string;
  /** YYYY-MM-DD, inclusive (snapped to end-of-day server-side). */
  to: string;
  q: string;
}
