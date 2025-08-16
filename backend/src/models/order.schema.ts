import { PaymentOrder } from "@/types/order";
import { model, Schema } from "mongoose";

const orderSchema = new Schema<PaymentOrder>(
  {
    orderId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    planType: { type: String, required: true, enum: ["elite", "essential"] },
    paymentMode: { type: String, required: true, default: "online" },
    paymentMethod: { type: String, required: true, default: "phonepe" },
    paymentStatus: {
      type: String,
      required: true,
      default: "pending",
      enum: ["pending", "success", "failed"],
    },
  },
  { timestamps: true }
);

orderSchema.pre("save", async function (next) {
  if (!this.isNew) return next();
  this.createdAt = new Date();
  this.updatedAt = new Date();
  next();
});

export const OrderModel = model<PaymentOrder>("Order", orderSchema);
