import mongoose from "mongoose";

/** Optional hero image. `s3Key` is internal and never leaves the backend. */
export interface ScholarshipTestImage {
  url: string;
  s3Key?: string;
}

export interface ScholarshipTest {
  _id?: string;
  title: string;
  slug: string;
  description: string;
  questions: mongoose.Types.ObjectId[];
  durationMinutes: number;
  attemptsAllowed: number;
  /**
   * Inclusive bounds of the reward. A winner's actual percentage is rolled at
   * submit and lives on their entitlement, never here.
   */
  minDiscountPercent: number;
  maxDiscountPercent: number;
  /**
   * Days a winner has to redeem, counted from when they finish the test. Each
   * winner therefore has their own deadline, stored on the entitlement.
   */
  couponValidForDays: number;
  /**
   * Optional hero image. Present means the landing page drops to the smaller
   * headline and renders this above it; absent leaves the hero as it was.
   */
  image?: ScholarshipTestImage | null;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  /** Frozen at creation, so a deleted author is still named. */
  createdByName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScholarshipTestSnapshot {
  title: string;
  slug: string;
  minDiscountPercent: number;
  maxDiscountPercent: number;
  totalQuestions: number;
  marketerName: string;
}

export type ScholarshipAttemptStatus = "in_progress" | "submitted" | "expired";

export interface ScholarshipAttemptAnswer {
  questionId: mongoose.Types.ObjectId;
  selectedOptionIds: string[];
}

export interface ScholarshipAttempt {
  _id?: string;
  /** Nulled when the campaign is deleted; `testSnapshot` carries the row. */
  testId?: mongoose.Types.ObjectId | null;
  testSnapshot: ScholarshipTestSnapshot;
  email: string;
  attemptNumber: number;
  status: ScholarshipAttemptStatus;
  /** Frozen at start: a refresh must not reshuffle, a restart must not reroll. */
  questionOrder: mongoose.Types.ObjectId[];
  startedAt: Date;
  expiresAt: Date;
  answers: ScholarshipAttemptAnswer[];
  /**
   * Kept for analytics only. Finishing the test earns the coupon, so this
   * never gates the reward.
   */
  correctCount: number;
  totalQuestions: number;
  submittedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Enough to name a campaign after it has been deleted. */
export interface ScholarshipCampaignSnapshot {
  title: string;
  slug: string;
  ownerName: string;
}

/** Worst-to-best precedence; `couponStateOf` encodes the order. */
export type ScholarshipCouponState =
  | "revoked"
  | "redeemed"
  | "expired"
  | "issued";

export interface ScholarshipCouponEntitlement {
  _id?: string;
  /** Nulled when the coupon is deleted; `couponCode` carries the record. */
  couponId?: mongoose.Types.ObjectId | null;
  /** The percentage this person rolled, drawn from the campaign's range. */
  awardedPercent: number;
  /** Snapshot of the code; outlives the coupon document itself. */
  couponCode: string;
  /** Frozen at issue; outlives the campaign itself. */
  campaignSnapshot?: ScholarshipCampaignSnapshot;
  testId: mongoose.Types.ObjectId;
  email: string;
  userId?: mongoose.Types.ObjectId | null;
  attemptId?: mongoose.Types.ObjectId | null;
  issuedAt: Date;
  /** `issuedAt + couponValidForDays`. The authoritative per-person deadline. */
  expiresAt: Date;
  /** Null for an automatic grant; the admin's id for a manual one. */
  grantedBy?: mongoose.Types.ObjectId | null;
  redeemedAt?: Date | null;
  orderId?: mongoose.Types.ObjectId | null;
  revokedAt?: Date | null;
  revokedBy?: mongoose.Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScholarshipTestDailyStat {
  _id?: string;
  testId: mongoose.Types.ObjectId;
  /** IST calendar date, `YYYY-MM-DD`. */
  day: string;
  views: number;
  otpRequested: number;
  started: number;
  submitted: number;
  createdAt?: Date;
  updatedAt?: Date;
}
