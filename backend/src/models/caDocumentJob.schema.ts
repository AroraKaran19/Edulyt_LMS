import mongoose, { Schema } from "mongoose";

export type CaDocumentKind = "offer-letter" | "completion";
export type CaDocumentJobStatus = "pending" | "processing" | "completed" | "failed";

export interface CaDocumentJob {
  _id: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  kind: CaDocumentKind;
  status: CaDocumentJobStatus;
  retryCount: number;
  error?: string | null;
  note?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  /** Null (or past) means claimable now; a failure pushes it forward by a backoff delay. */
  nextAttemptAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const caDocumentJobSchema = new Schema<CaDocumentJob>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: "CaApplication", required: true },
    kind: { type: String, enum: ["offer-letter", "completion"], required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      required: true,
      default: "pending",
    },
    retryCount: { type: Number, default: 0 },
    error: { type: String, default: null },
    note: { type: String, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    nextAttemptAt: { type: Date, default: null },
  },
  { timestamps: true },
);

caDocumentJobSchema.index({ applicationId: 1, kind: 1 }, { unique: true });
caDocumentJobSchema.index({ status: 1, nextAttemptAt: 1 });
caDocumentJobSchema.index({ status: 1, startedAt: 1 });

export const CaDocumentJobModel = mongoose.model<CaDocumentJob>(
  "CaDocumentJob",
  caDocumentJobSchema,
);
