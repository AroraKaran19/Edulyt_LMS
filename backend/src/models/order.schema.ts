import { PaymentOrder } from "../types/order";
import { model, Schema } from "mongoose";

const orderSchema = new Schema<PaymentOrder>(
  {
    txnId: { type: String, required: true, unique: true },
    token: { type: String, required: false },
    gatewayOrderId: { type: String, required: false, trim: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderKind: {
      type: String,
      required: true,
      enum: ["course", "internship_seat", "internship_success_points"],
      default: "course",
    },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: false },
    courseName: { type: String, required: false },
    userName: { type: String, required: false },
    planType: {
      type: String,
      required: false,
      enum: ["elite", "essential"],
    },
    internshipId: {
      type: Schema.Types.ObjectId,
      ref: "Internship",
      required: false,
    },
    batchId: { type: String, required: false, trim: true },
    internshipEnrollmentId: {
      type: Schema.Types.ObjectId,
      ref: "InternshipEnrollment",
      required: false,
    },
    internshipTitle: { type: String, required: false, trim: true },
    internshipSuccessPointsQuantity: {
      type: Number,
      required: false,
      min: 1,
    },
    internshipSuccessPointsFulfillmentApplied: {
      type: Boolean,
      required: false,
      default: false,
    },
    paymentMode: { type: String, required: true, default: "online" },
    paymentMethod: { type: String, required: true, default: "paytm" },
    paymentStatus: {
      type: String,
      required: true,
      default: "pending",
      enum: ["pending", "success", "failed"],
    },
    paymentErrorReason: { type: String, required: false },
    couponCode: { type: String, required: false },
    couponDiscount: { type: Number, required: false, default: 0 },
    collaborationDiscount: { type: Number, required: false, default: 0 },
    collaborationDomainId: {
      type: Schema.Types.ObjectId,
      ref: "CollaborationDomain",
      required: false,
    },
    partnershipImportConfigId: {
      type: Schema.Types.ObjectId,
      ref: "PartnershipImportConfig",
      required: false,
    },
    /** Referral code snapshot — drives both the referrer payout and the buyer discount below. */
    referralCode: { type: String, required: false, uppercase: true, trim: true },
    /** ₹ discount the buyer received from the configured referral buyer-discount %. */
    referralDiscount: { type: Number, required: false, default: 0, min: 0 },
    /** Idempotency flag: per-plan `purchaseSuccessPoints` already credited. */
    successPointsPurchaseGranted: {
      type: Boolean,
      required: false,
      default: false,
    },
    /** Number of success points the buyer chose to redeem at checkout. */
    successPointsApplied: { type: Number, required: false, default: 0, min: 0 },
    /** ₹ discount produced by `successPointsApplied × redemption rate`. */
    successPointsDiscount: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },
    /** Idempotency flag: redeemed points already deducted from buyer's wallet. */
    successPointsRedeemed: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  { timestamps: true },
);

// indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ courseId: 1, createdAt: -1 });
orderSchema.index({ orderKind: 1, createdAt: -1 });
orderSchema.index({ planType: 1, createdAt: -1 });
orderSchema.index({ paymentMode: 1, createdAt: -1 });
orderSchema.index({ paymentMethod: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ internshipEnrollmentId: 1 }, { sparse: true });
orderSchema.index({ gatewayOrderId: 1 }, { sparse: true });

orderSchema.pre("save", async function (next) {
  if (!this.isNew) return next();
  this.createdAt = new Date();
  this.updatedAt = new Date();
  next();
});

export const OrderModel = model<PaymentOrder>("Order", orderSchema);
