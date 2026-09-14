/**
 * Admin report row/response shapes. Mirrors the interfaces in
 * `backend/src/services/report.services.ts`; keep the two in sync.
 */

import type { Brand } from "@/constants/brands";

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

/** One internship's slice of a learner's internship success points. */
export interface InternshipPointsSlice {
  internshipId: string;
  internshipTitle: string;
  /** Batch name(s) the learner holds for this internship. */
  batches: string[];
  earned: number;
  /** Live counter across the learner's enrollments — always all-time. */
  currentPoints: number;
  tasks: number;
  meetings: number;
  purchased: number;
}

export interface InternshipPointsRow {
  userId: string;
  name: string;
  email: string;
  /** Total across every internship. */
  earned: number;
  currentPoints: number;
  earnedBreakdown: {
    tasks: number;
    meetings: number;
    purchased: number;
  };
  /** The learner's points divided by internship, highest earning first. */
  internships: InternshipPointsSlice[];
}

export interface InternshipPointsTotals {
  /** Row count — one per learner. */
  learners: number;
  /** Distinct internships represented across the filtered rows. */
  internships: number;
  earned: number;
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
  /** Each brand keeps its own referral balance, so a referrer can have one row per brand. */
  brand: Brand;
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
  /** Only the referral report reads it. */
  brand?: Brand;
}
