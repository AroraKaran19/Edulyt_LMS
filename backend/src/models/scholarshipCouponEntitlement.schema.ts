import mongoose from "mongoose";
import { ScholarshipCouponEntitlement } from "../types/scholarship";

/**
 * Enough to name the campaign after it is gone.
 *
 * A campaign is hard-deleted by an admin, and a redeemed entitlement outlives
 * it, so `testId` alone would leave a spent reward unable to say what paid for
 * it. `ownerName` defaults to empty rather than being required because authors
 * are hard-deleted too.
 */
const campaignSnapshotSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    ownerName: { type: String, required: false, default: "" },
  },
  { _id: false },
);

/**
 * One document per person who may redeem a campaign's coupon.
 *
 * A list on the coupon would be unbounded and would put a `$push` per winner on
 * a single hot document. Records also let support grant manually and revoke one
 * person, neither of which a derived rule can express.
 */
const scholarshipCouponEntitlementSchema =
  new mongoose.Schema<ScholarshipCouponEntitlement>(
    {
      couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
        required: false,
        default: null,
      },
      /**
       * The percentage this person rolled. Authoritative: the coupon carrying
       * it is deleted once spent, and the campaign only stores the range.
       */
      awardedPercent: { type: Number, required: true, min: 1, max: 100 },
      /**
       * Snapshot of the coupon's code. Load-bearing twice: it names the code on
       * the result page after the coupon document is gone, and it is the only
       * handle settlement has, since Order stores a code string and no ref.
       */
      couponCode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
      },
      /** Frozen at issue, so a deleted campaign is still nameable. */
      campaignSnapshot: { type: campaignSnapshotSchema, required: false },
      testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ScholarshipTest",
        required: true,
      },
      email: { type: String, required: true, lowercase: true, trim: true },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      attemptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ScholarshipAttempt",
        default: null,
      },
      issuedAt: { type: Date, required: true, default: Date.now },
      /**
       * Per-person deadline, set from the campaign's `couponValidForDays` when
       * the entitlement is issued. Copied rather than derived so that editing
       * the campaign later cannot retroactively shorten a deadline someone was
       * already told.
       */
      expiresAt: { type: Date, required: true },
      grantedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      redeemedAt: { type: Date, default: null },
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        default: null,
      },
      revokedAt: { type: Date, default: null },
      revokedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    { timestamps: true },
  );

// Not (couponId, email): a per-winner coupon makes that pair unique by
// construction, so it would enforce nothing. One entitlement per campaign per
// email is the actual rule, and it also serves the CRM's (campaign, email) read
// and getResultForEmail.
scholarshipCouponEntitlementSchema.index(
  { testId: 1, email: 1 },
  { unique: true },
);
scholarshipCouponEntitlementSchema.index({ testId: 1, redeemedAt: 1 });
// Settlement resolves an order to its entitlement through the code alone.
// Deliberately NOT unique: the migration backfills legacy rows from the one
// shared coupon their campaign used, so old codes repeat across winners.
scholarshipCouponEntitlementSchema.index({ couponCode: 1 });
scholarshipCouponEntitlementSchema.index({ expiresAt: 1 });

export const ScholarshipCouponEntitlementModel =
  mongoose.model<ScholarshipCouponEntitlement>(
    "ScholarshipCouponEntitlement",
    scholarshipCouponEntitlementSchema,
  );
