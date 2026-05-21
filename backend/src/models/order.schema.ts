import { PaymentOrder } from "../types/order";
import { model, Schema } from "mongoose";

const orderSchema = new Schema<PaymentOrder>(
  {
    txnId: { type: String, required: true, unique: true },
    token: { type: String, required: false },
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
    /** Referral code snapshot — payout to referrer, doesn't alter order amount. */
    referralCode: { type: String, required: false, uppercase: true, trim: true },
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

orderSchema.pre("save", async function (next) {
  if (!this.isNew) return next();
  this.createdAt = new Date();
  this.updatedAt = new Date();
  next();
});

export const OrderModel = model<PaymentOrder>("Order", orderSchema);
