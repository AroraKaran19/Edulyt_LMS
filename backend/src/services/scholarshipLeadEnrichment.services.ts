import mongoose from "mongoose";
import { ScholarshipAttemptModel } from "../models/scholarshipAttempt.schema";
import { ScholarshipCouponEntitlementModel } from "../models/scholarshipCouponEntitlement.schema";
import type { Lead } from "../types/lead";
import type {
  ScholarshipAttemptStatus,
  ScholarshipCouponEntitlement,
} from "../types/scholarship";


/** Precedence order, worst-to-best news, is encoded in `couponStateOf`. */
export type ScholarshipCouponState =
  | "revoked"
  | "redeemed"
  | "expired"
  | "issued";

export interface LeadAttemptView {
  status: ScholarshipAttemptStatus;
  attemptNumber: number;
  correctCount: number;
  totalQuestions: number;
  startedAt: Date;
  submittedAt: Date | null;
}

export interface LeadCouponView {
  state: ScholarshipCouponState;
  expiresAt: Date;
  redeemedAt: Date | null;
}

export interface LeadScholarshipView {
  attempt: LeadAttemptView | null;
  coupon: LeadCouponView | null;
  /** From the attempt snapshot, so a later campaign edit cannot rewrite it. */
  discountPercent: number | null;
}

interface AttemptRow {
  testId?: mongoose.Types.ObjectId | null;
  email: string;
  attemptNumber: number;
  status: ScholarshipAttemptStatus;
  correctCount: number;
  totalQuestions: number;
  startedAt: Date;
  submittedAt?: Date | null;
  testSnapshot?: { discountPercent?: number };
}

/**
 * `(campaign, email)` identifies a scholarship lead's activity. Both
 * collections store the email lowercased, as does the lead.
 */
export const pairKey = (testId: unknown, email: string): string =>
  `${String(testId)}::${String(email).trim().toLowerCase()}`;

export interface ScholarshipPair {
  testId: mongoose.Types.ObjectId;
  email: string;
}

/**
 * The pairs worth looking up on this page.
 *
 * A null `testId` is skipped: rows the source migration backfilled carry one,
 * and there is nothing to join to. Note that deleting a campaign detaches the
 * *attempts* (`testId: null`) and leaves the lead's pointer intact, so such a
 * lead is looked up and simply finds no attempt.
 */
export const scholarshipPairsOf = (
  leads: Pick<Lead, "source" | "email">[],
): ScholarshipPair[] => {
  const seen = new Map<string, ScholarshipPair>();
  for (const lead of leads) {
    if (lead.source?.kind !== "scholarship") continue;
    const testId = lead.source.testId;
    if (!testId) continue;
    const email = String(lead.email).trim().toLowerCase();
    const key = pairKey(testId, email);
    if (!seen.has(key)) {
      seen.set(key, { testId: testId as mongoose.Types.ObjectId, email });
    }
  }
  return [...seen.values()];
};

/**
 * One `$or` over `(testId, email)` rather than a query per row. Both
 * collections index that pair as a prefix, so each branch is an index seek.
 */
export const buildPairFilter = (
  pairs: ScholarshipPair[],
): mongoose.FilterQuery<unknown> => ({
  $or: pairs.map(({ testId, email }) => ({ testId, email })),
});

/**
 * Which of two attempts by the same person on the same campaign to show.
 *
 * A finished attempt is the outcome worth reporting even when they later
 * started another, so it wins over a higher number that is still running.
 */
export const isBetterAttempt = (
  candidate: Pick<AttemptRow, "status" | "attemptNumber">,
  current: Pick<AttemptRow, "status" | "attemptNumber"> | undefined,
): boolean => {
  if (!current) return true;
  const done = (a: { status: ScholarshipAttemptStatus }) =>
    a.status === "submitted";
  if (done(candidate) !== done(current)) return done(candidate);
  return candidate.attemptNumber > current.attemptNumber;
};

/**
 * Revoked and redeemed are facts; expiry is only ever derived, since nothing
 * writes a state when a deadline passes. Revocation outranks redemption so a
 * coupon clawed back after use does not still read as a win.
 */
export const couponStateOf = (
  entitlement: Pick<
    ScholarshipCouponEntitlement,
    "revokedAt" | "redeemedAt" | "expiresAt"
  >,
  now: Date,
): ScholarshipCouponState => {
  if (entitlement.revokedAt) return "revoked";
  if (entitlement.redeemedAt) return "redeemed";
  if (entitlement.expiresAt && entitlement.expiresAt.getTime() < now.getTime()) {
    return "expired";
  }
  return "issued";
};

/**
 * Builds the scholarship view for a page of leads, keyed by `pairKey`.
 *
 * Joined on read rather than mirrored onto the lead, because every field here
 * changes *after* the lead is written: they submit, the coupon is issued,
 * redeemed, revoked, or simply lapses. A copy on the lead would need three
 * write hooks plus a backfill and would still be wrong the moment a deadline
 * passed with nobody watching.
 *
 * Two queries total regardless of row count, and none at all when the page
 * holds no scholarship leads. Never throws: this is decoration on a pipeline
 * view, so a failed join must leave the leads readable.
 */
export const buildScholarshipViews = async (
  leads: Pick<Lead, "source" | "email">[],
  now: Date = new Date(),
): Promise<Map<string, LeadScholarshipView>> => {
  const views = new Map<string, LeadScholarshipView>();
  const pairs = scholarshipPairsOf(leads);
  if (pairs.length === 0) return views;

  try {
    const filter = buildPairFilter(pairs);

    const [attempts, entitlements] = await Promise.all([
      ScholarshipAttemptModel.find(filter, {
        testId: 1,
        email: 1,
        attemptNumber: 1,
        status: 1,
        correctCount: 1,
        totalQuestions: 1,
        startedAt: 1,
        submittedAt: 1,
        "testSnapshot.discountPercent": 1,
      }).lean<AttemptRow[]>(),
      ScholarshipCouponEntitlementModel.find(filter, {
        testId: 1,
        email: 1,
        expiresAt: 1,
        redeemedAt: 1,
        revokedAt: 1,
      }).lean<ScholarshipCouponEntitlement[]>(),
    ]);

    const bestAttempt = new Map<string, AttemptRow>();
    for (const attempt of attempts) {
      const key = pairKey(attempt.testId, attempt.email);
      if (isBetterAttempt(attempt, bestAttempt.get(key))) {
        bestAttempt.set(key, attempt);
      }
    }

    for (const pair of pairs) {
      const key = pairKey(pair.testId, pair.email);
      const attempt = bestAttempt.get(key);
      if (!attempt) continue;
      views.set(key, {
        attempt: {
          status: attempt.status,
          attemptNumber: attempt.attemptNumber,
          correctCount: attempt.correctCount,
          totalQuestions: attempt.totalQuestions,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt ?? null,
        },
        coupon: null,
        discountPercent: attempt.testSnapshot?.discountPercent ?? null,
      });
    }

    for (const entitlement of entitlements) {
      const key = pairKey(entitlement.testId, entitlement.email);
      const view = views.get(key) ?? {
        attempt: null,
        coupon: null,
        discountPercent: null,
      };
      view.coupon = {
        state: couponStateOf(entitlement, now),
        expiresAt: entitlement.expiresAt,
        redeemedAt: entitlement.redeemedAt ?? null,
      };
      views.set(key, view);
    }
  } catch (error) {
    console.error("[leads] scholarship enrichment failed:", error);
  }

  return views;
};

/** The view for one lead, or null when it is not a joinable scholarship lead. */
export const scholarshipViewFor = (
  views: Map<string, LeadScholarshipView>,
  lead: Pick<Lead, "source" | "email">,
): LeadScholarshipView | null => {
  if (lead.source?.kind !== "scholarship" || !lead.source.testId) return null;
  return views.get(pairKey(lead.source.testId, lead.email)) ?? null;
};
