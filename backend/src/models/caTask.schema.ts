import mongoose, { Schema } from "mongoose";
import type { CaTask } from "../types/caTask";

const caTaskSchema = new Schema<CaTask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    questions: [{ type: Schema.Types.ObjectId, ref: "InternshipQuestion" }],
    totalScore: { type: Number, required: true, default: 0, min: 0 },
    passScore: { type: Number, required: true, default: 0, min: 0 },
    successPoints: { type: Number, required: true, default: 0, min: 0 },
    startFromDay: { type: Number, required: true, default: 0, min: 0 },
    endOnDay: { type: Number, required: true, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

caTaskSchema.index({ isActive: 1, startFromDay: 1 });

export const CaTaskModel = mongoose.model<CaTask>("CaTask", caTaskSchema);
