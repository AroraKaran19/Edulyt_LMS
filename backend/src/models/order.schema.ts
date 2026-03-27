import { PaymentOrder } from "../types/order";
import { model, Schema } from "mongoose";

const orderSchema = new Schema<PaymentOrder>(
  {
    txnId: { type: String, required: true, unique: true },
    token: { type: String, required: false },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    courseName: { type: String, required: false },
    userName: { type: String, required: false },
    planType: { type: String, required: true, enum: ["elite", "essential"] },
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
  },
  { timestamps: true }
);

// indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ courseId: 1, createdAt: -1 });
orderSchema.index({ planType: 1, createdAt: -1 });
orderSchema.index({ paymentMode: 1, createdAt: -1 });
orderSchema.index({ paymentMethod: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });

orderSchema.pre("save", async function (next) {
  if (!this.isNew) return next();
  this.createdAt = new Date();
  this.updatedAt = new Date();
  next();
});

export const OrderModel = model<PaymentOrder>("Order", orderSchema);
