import mongoose from "mongoose";
import { ScholarshipTestDailyStat } from "../types/scholarship";

const IST_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Bucketed funnel counters, one document per campaign per IST day.
 *
 * Counting on the campaign document instead would serialize writes on the one
 * document every public page load reads. Only the daily chart trusts these;
 * every headline number is aggregated from ScholarshipAttempt, which cannot
 * drift.
 */
const scholarshipTestDailyStatSchema =
  new mongoose.Schema<ScholarshipTestDailyStat>(
    {
      testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ScholarshipTest",
        required: true,
      },
      day: {
        type: String,
        required: true,
        trim: true,
        match: [IST_DAY_RE, "Day must be an IST calendar date (YYYY-MM-DD)"],
      },
      views: { type: Number, required: true, default: 0, min: 0 },
      otpRequested: { type: Number, required: true, default: 0, min: 0 },
      started: { type: Number, required: true, default: 0, min: 0 },
      submitted: { type: Number, required: true, default: 0, min: 0 },
    },
    { timestamps: true },
  );

scholarshipTestDailyStatSchema.index({ testId: 1, day: 1 }, { unique: true });

export const ScholarshipTestDailyStatModel =
  mongoose.model<ScholarshipTestDailyStat>(
    "ScholarshipTestDailyStat",
    scholarshipTestDailyStatSchema,
  );
