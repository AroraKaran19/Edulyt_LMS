import mongoose, { Document, Schema } from "mongoose";

/**
 * When each kind of ops alert was last emailed, shared across every process.
 *
 * The in-process throttle in `opsAlert.services` cannot cover the two cases that
 * matter most. A crashing worker gets a fresh empty map on every restart, so a
 * crash loop emails on every restart. And six PM2 apps hitting one root cause
 * (Mongo unreachable, expired S3 credentials) each keep their own map, so one
 * cause pages six times.
 *
 * `suppressedCount` turns suppression into information: the next alert that does
 * go out reports how many it stands for, rather than silently hiding volume.
 */
export interface OpsAlertLog extends Document {
  /** Alert kind, e.g. `certificate-generation-failed`. Not the occurrence. */
  key: string;
  lastSentAt: Date;
  /** Alerts dropped since `lastSentAt`. Reset each time one is sent. */
  suppressedCount: number;
}

const opsAlertLogSchema = new Schema<OpsAlertLog>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    lastSentAt: { type: Date, required: true },
    suppressedCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: "opsalertlogs" },
);

/**
 * Drop rows for alert kinds that have been quiet for a month. Losing one only
 * resets that key's throttle, which is the correct behaviour for a kind that has
 * not fired in 30 days anyway.
 */
opsAlertLogSchema.index({ lastSentAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const OpsAlertLogModel = mongoose.model<OpsAlertLog>(
  "OpsAlertLog",
  opsAlertLogSchema,
);
