import mongoose from "mongoose";
import { ScholarshipCouponEntitlement } from "../types/scholarship";

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
        required: true,
      },
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

scholarshipCouponEntitlementSchema.index(
  { couponId: 1, email: 1 },
  { unique: true },
);
scholarshipCouponEntitlementSchema.index({ testId: 1, redeemedAt: 1 });
// The CRM reads a page of leads back by (campaign, email). Neither of the other
// two indexes serves that: `email` is not a prefix of {couponId, email}.
scholarshipCouponEntitlementSchema.index({ testId: 1, email: 1 });
scholarshipCouponEntitlementSchema.index({ expiresAt: 1 });

export const ScholarshipCouponEntitlementModel =
  mongoose.model<ScholarshipCouponEntitlement>(
    "ScholarshipCouponEntitlement",
    scholarshipCouponEntitlementSchema,
  );
