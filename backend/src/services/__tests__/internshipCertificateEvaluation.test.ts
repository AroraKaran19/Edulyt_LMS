import { describe, it, expect, vi, beforeEach } from "vitest";

const updateOne = vi.fn();
const computeInternshipEligibility = vi.fn();
const createCertificateJobService = vi.fn();

vi.mock("../../models/internshipEnrollment.schema", () => ({
  InternshipEnrollmentModel: {
    updateOne: (...a: unknown[]) => updateOne(...a),
  },
}));
vi.mock("../internshipEligibility.services", () => ({
  computeInternshipEligibility: (...a: unknown[]) =>
    computeInternshipEligibility(...a),
}));
vi.mock("../certificateJob.services", () => ({
  createCertificateJobService: (...a: unknown[]) =>
    createCertificateJobService(...a),
}));

import { evaluateInternshipEnrollment } from "../internshipCertificateEvaluation.services";

const ID = "507f1f77bcf86cd799439011";

const eligibility = (over: Record<string, unknown> = {}) => ({
  certificateEligible: false,
  earned: 120,
  totalAchievable: 200,
  thresholdPct: 70,
  requiredPoints: 140,
  ...over,
});

beforeEach(() => {
  updateOne.mockReset().mockResolvedValue({ modifiedCount: 1 });
  computeInternshipEligibility.mockReset();
  createCertificateJobService.mockReset().mockResolvedValue({});
});

describe("evaluateInternshipEnrollment", () => {
  it("writes a pass and queues the certificate", async () => {
    computeInternshipEligibility.mockResolvedValue(
      eligibility({ certificateEligible: true, earned: 150 }),
    );

    const out = await evaluateInternshipEnrollment(ID);

    expect(out.verdict).toBe("pass");
    expect(createCertificateJobService).toHaveBeenCalledWith(
      expect.objectContaining({
        enrollmentId: ID,
        certificateType: "internship",
      }),
    );
    const [, update] = updateOne.mock.calls[0];
    expect(update.$set.certificateEvaluation.verdict).toBe("pass");
    expect(update.$set.status).toBe("completed");
  });

  it("writes a fail with the shortfall numbers and queues NO certificate", async () => {
    computeInternshipEligibility.mockResolvedValue(eligibility());

    const out = await evaluateInternshipEnrollment(ID);

    expect(out.verdict).toBe("fail");
    expect(createCertificateJobService).not.toHaveBeenCalled();
    const [, update] = updateOne.mock.calls[0];
    expect(update.$set.certificateEvaluation).toMatchObject({
      verdict: "fail",
      reason: "points_shortfall",
      earned: 120,
      requiredPoints: 140,
      totalAchievable: 200,
      thresholdPct: 70,
    });
    expect(update.$set.status).toBe("completed");
  });

  it("guards the write on there being no existing verdict", async () => {
    computeInternshipEligibility.mockResolvedValue(eligibility());
    await evaluateInternshipEnrollment(ID);
    const [filter] = updateOne.mock.calls[0];
    expect(filter.certificateEvaluation).toEqual({ $exists: false });
  });

  it("does not queue a certificate when another worker already wrote the verdict", async () => {
    computeInternshipEligibility.mockResolvedValue(
      eligibility({ certificateEligible: true }),
    );
    updateOne.mockResolvedValue({ modifiedCount: 0 });

    const out = await evaluateInternshipEnrollment(ID);

    expect(out.alreadyEvaluated).toBe(true);
    expect(createCertificateJobService).not.toHaveBeenCalled();
  });

  it("rejects an invalid enrollment id", async () => {
    await expect(evaluateInternshipEnrollment("not-an-id")).rejects.toThrow();
  });
});
