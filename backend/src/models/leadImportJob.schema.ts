import mongoose, { Schema, type Types } from "mongoose";

export type LeadImportJobStatus = "queued" | "running" | "done" | "failed";
export type LeadImportIssueKind = "error" | "creator-not-found";

export interface LeadImportIssue {
  row: number;
  kind: LeadImportIssueKind;
  message: string;
  /** The row as uploaded, so problem rows can be downloaded after the file is gone. */
  data: Record<string, unknown>;
}

export interface LeadImportJob {
  _id: Types.ObjectId;
  fileName: string;
  createdBy: { userId: Types.ObjectId | null; name: string };
  status: LeadImportJobStatus;
  totalRows: number;
  processedRows: number;
  created: number;
  errorCount: number;
  creatorNotFound: number;
  issues: LeadImportIssue[];
  attempts: number;
  lockedUntil: Date | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  failureMessage: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadImportPayload {
  jobId: Types.ObjectId;
  rows: Record<string, unknown>[];
}

const issueSchema = new Schema(
  {
    row: { type: Number, required: true },
    kind: { type: String, enum: ["error", "creator-not-found"], required: true },
    message: { type: String, default: "" },
    data: { type: Schema.Types.Mixed, default: () => ({}) },
  },
  { _id: false },
);

const leadImportJobSchema = new Schema<LeadImportJob>(
  {
    fileName: { type: String, default: "" },
    createdBy: {
      userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
      name: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["queued", "running", "done", "failed"],
      required: true,
      default: "queued",
    },
    totalRows: { type: Number, required: true },
    processedRows: { type: Number, default: 0 },
    created: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    creatorNotFound: { type: Number, default: 0 },
    issues: { type: [issueSchema], default: [] },
    attempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    failureMessage: { type: String, default: "" },
  },
  { timestamps: true, minimize: false },
);

leadImportJobSchema.index({ status: 1, createdAt: 1 });
leadImportJobSchema.index({ createdAt: -1 });

// Apart from the job so progress updates never rewrite the whole file; deleted when the job ends.
const leadImportPayloadSchema = new Schema<LeadImportPayload>({
  jobId: { type: Schema.Types.ObjectId, ref: "LeadImportJob", required: true },
  rows: { type: Schema.Types.Mixed, default: () => [] },
});

leadImportPayloadSchema.index({ jobId: 1 }, { unique: true });

export const LeadImportJobModel = mongoose.model<LeadImportJob>(
  "LeadImportJob",
  leadImportJobSchema,
);

export const LeadImportPayloadModel = mongoose.model<LeadImportPayload>(
  "LeadImportPayload",
  leadImportPayloadSchema,
);
