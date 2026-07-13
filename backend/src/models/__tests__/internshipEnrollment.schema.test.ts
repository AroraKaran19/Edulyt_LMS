import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { InternshipEnrollmentModel } from "../internshipEnrollment.schema";

const base = () => ({
  internship: new mongoose.Types.ObjectId(),
  user: new mongoose.Types.ObjectId(),
  status: "enrolled",
  batchSnapshot: {
    batchId: "b1",
    name: "Batch A",
    internshipStartDate: new Date("2025-08-01T00:00:00.000Z"),
  },
});

describe("InternshipEnrollment schema", () => {
  it("rejects an enrollment with no programDurationMonths", () => {
    const doc = new InternshipEnrollmentModel(base());
    const err = doc.validateSync();
    expect(err?.errors?.programDurationMonths).toBeDefined();
  });

  it("accepts an enrollment with a duration", () => {
    const doc = new InternshipEnrollmentModel({
      ...base(),
      programDurationMonths: 3,
    });
    const err = doc.validateSync();
    expect(err?.errors?.programDurationMonths).toBeUndefined();
  });

  it("accepts a certificateEvaluation snapshot", () => {
    const doc = new InternshipEnrollmentModel({
      ...base(),
      programDurationMonths: 3,
      certificateEvaluation: {
        evaluatedAt: new Date(),
        verdict: "fail",
        reason: "points_shortfall",
        earned: 120,
        totalAchievable: 200,
        thresholdPct: 70,
        requiredPoints: 140,
      },
    });
    expect(doc.validateSync()?.errors?.certificateEvaluation).toBeUndefined();
    expect(doc.get("certificateEvaluation.verdict")).toBe("fail");
  });

  it("rejects an unknown verdict value", () => {
    const doc = new InternshipEnrollmentModel({
      ...base(),
      programDurationMonths: 3,
      certificateEvaluation: {
        evaluatedAt: new Date(),
        verdict: "maybe",
        reason: "points_shortfall",
        earned: 0,
        totalAchievable: 0,
        thresholdPct: 0,
        requiredPoints: 0,
      },
    });
    expect(doc.validateSync()).toBeDefined();
  });
});
