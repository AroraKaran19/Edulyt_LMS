import mongoose from "mongoose";
import { InvoiceJob } from "../types/invoiceJob";
import { brandPlugin } from "./plugins/brand.plugin";

const invoiceJobSchema = new mongoose.Schema<InvoiceJob>(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true },
    snapshot: {
      userName: { type: String },
      itemName: { type: String },
      amount: { type: Number },
      orderKind: { type: String },
      paymentMethod: { type: String },
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    invoiceNumber: { type: String, default: null },
    invoiceUrl: { type: String, default: null },
    error: { type: String, default: null },
    retryCount: { type: Number, default: 0 },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Drives the worker's claim query (oldest pending first).
invoiceJobSchema.index({ status: 1, createdAt: 1 });

// Stamped from the order at enqueue. Jobs are only ever upserted, which skips
// validation, so the plugin documents the field rather than enforcing it.
invoiceJobSchema.plugin(brandPlugin);
invoiceJobSchema.index({ brand: 1, createdAt: -1 });

// At most one live job per order, so a webhook + status poll + reconcile cron
// racing on the same payment cannot queue three invoices for it.
invoiceJobSchema.index(
  { orderId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "processing"] } },
  },
);

export const InvoiceJobModel = mongoose.model<InvoiceJob>(
  "InvoiceJob",
  invoiceJobSchema,
);
