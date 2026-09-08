import { PaymentOrder } from "../types/order";
import { model, Schema } from "mongoose";

/**
 * Why a scholarship-discounted order was discounted, frozen at checkout.
 *
 * Everything upstream of this is deletable: the campaign is hard-deleted by an
 * admin, the winner's coupon is deleted the moment it is spent, and the buying
 * account can be hard-deleted too. A payment record has to answer "why 37% off"
 * on its own, without a join to any of them.
 *
 * `candidateEmail` is the identity the reward was actually earned under, which
 * can differ from the buying account, so it is the crux of the record rather
 * than duplicated noise. Only `couponCode` and `awardedPercent` are required:
 * a partial reconstruction beats no record at all on a payment.
 */
const scholarshipSnapshotSchema = new Schema(
  {
    testId: { type: Schema.Types.ObjectId, ref: "ScholarshipTest" },
    title: { type: String, default: "" },
    slug: { type: String, default: "" },
    ownerName: { type: String, default: "" },
    awardedPercent: { type: Number, required: true },
    couponCode: { type: String, required: true, uppercase: true, trim: true },
    candidateEmail: { type: String, default: "", lowercase: true, trim: true },
  },
  { _id: false },
);

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
    /**
     * Course-internship add-on chosen at checkout. `orderKind` stays "course" —
     * this is a course purchase with an add-on, not a new kind of order.
     * The price is recorded as charged so a later change to the course's offer
     * never rewrites history.
     */
    courseInternshipProgramId: {
      type: Schema.Types.ObjectId,
      ref: "CourseInternship",
      required: false,
    },
    courseInternshipMonths: { type: Number, required: false, min: 1 },
    courseInternshipPrice: { type: Number, required: false, min: 0 },
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
    scholarshipTestId: {
      type: Schema.Types.ObjectId,
      ref: "ScholarshipTest",
      required: false,
      default: null,
    },
    scholarshipSnapshot: {
      type: scholarshipSnapshotSchema,
      required: false,
      default: null,
    },
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
    /** Tax-invoice sequence, allocated once and reused across job retries. */
    invoiceNumber: { type: String, required: false, trim: true },
    /** Public S3 URL of the generated invoice PDF. */
    invoiceUrl: { type: String, required: false, trim: true },
    /** When the invoice PDF was rendered and uploaded. */
    invoicedAt: { type: Date, required: false },

    /**
     * When the buyer was emailed their confirmation and invoice.
     *
     * Claimed atomically before the send. The invoice worker retries, a
     * reconcile cron can re-settle an order, and `generateInvoiceForOrderService`
     * returns early for an order that already has an invoice, so without this a
     * customer could be sent the same receipt several times.
     */
    confirmationEmailSentAt: { type: Date, required: false },
  },
  { timestamps: true },
);

// indexes
orderSchema.index({ createdAt: -1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ courseId: 1, createdAt: -1 });
orderSchema.index({ orderKind: 1, createdAt: -1 });
orderSchema.index({ planType: 1, createdAt: -1 });
orderSchema.index({ paymentMode: 1, createdAt: -1 });
orderSchema.index({ paymentMethod: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ scholarshipTestId: 1, paymentStatus: 1 });
orderSchema.index({ internshipEnrollmentId: 1 }, { sparse: true });
orderSchema.index({ gatewayOrderId: 1 }, { sparse: true });
// A tax-invoice number must never repeat. Sparse so the many orders without
// one (pending, failed, not yet invoiced) do not collide on null.
orderSchema.index({ invoiceNumber: 1 }, { unique: true, sparse: true });

orderSchema.pre("save", async function (next) {
  if (!this.isNew) return next();
  this.createdAt = new Date();
  this.updatedAt = new Date();
  next();
});

export const OrderModel = model<PaymentOrder>("Order", orderSchema);
