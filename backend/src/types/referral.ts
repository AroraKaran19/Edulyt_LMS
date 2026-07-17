import mongoose from "mongoose";

export interface ReferralCommissionTier {
  thresholdSales: number;
  commissionPercent: number;
}

/** Singleton document describing the cumulative commission tiers. */
export interface ReferralCommissionConfig {
  _id?: string;
  tiers: ReferralCommissionTier[];
  /**
   * Discount (0–100 %) granted to a buyer who checks out using another
   * student's referral code. 0 = no buyer discount (default). Mutually
   * exclusive with coupons at checkout.
   */
  buyerDiscountPercent: number;
  updatedAt?: Date;
  updatedBy?: mongoose.Types.ObjectId | string | null;
}

/** Per-user referral profile — holds the unique code + UPI payout target. */
export interface ReferralProfile {
  _id?: string;
  userId: mongoose.Types.ObjectId | string;
  code: string;
  upiId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ReferralSaleStatus = "active" | "reversed";

/** One row per qualifying course-order paid using a referral code. */
export interface ReferralSale {
  _id?: string;
  referrerUserId: mongoose.Types.ObjectId | string;
  buyerUserId: mongoose.Types.ObjectId | string;
  orderId: mongoose.Types.ObjectId | string;
  courseId?: mongoose.Types.ObjectId | string;
  /** Snapshot fields so listings work even if the source records are deleted. */
  courseName: string;
  buyerName: string;
  /** Order amount (what the buyer paid) — base for commission calculation. */
  amount: number;
  /**
   * Commission rate live at the moment this sale was recorded, and the rupee
   * figure derived from it. Both are write-once: an admin editing the tier
   * config never re-rates a sale that has already been earned.
   */
  commissionPercent: number;
  commissionAmount: number;
  code: string;
  status: ReferralSaleStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ReferralWithdrawalStatus =
  | "pending"
  | "processing"
  | "success"
  | "rejected";

export interface ReferralWithdrawal {
  _id?: string;
  referrerUserId: mongoose.Types.ObjectId | string;
  amount: number;
  upiIdSnapshot: string;
  status: ReferralWithdrawalStatus;
  notes?: string;
  decidedAt?: Date | null;
  decidedBy?: mongoose.Types.ObjectId | string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
