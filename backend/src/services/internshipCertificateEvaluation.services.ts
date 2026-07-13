/**
 * Decide, once, whether a learner earned their internship certificate.
 * Runs on day N+1 after their program window closes.
 *
 * Only EXAM-LESS enrollments reach here — the enqueuer filters exam batches out.
 * Batches with a certification exam still issue on finalize-grading, and admins
 * close their failures out with `certificateOverride: "fail"`.
 *
 * A `fail` written here is not the last word: an admin can still rescue the
 * learner with `certificateOverride: "pass"`, which wins over this snapshot in
 * `computeInternshipEligibility` and at the certificate generator's gate.
 */
import mongoose from "mongoose";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { computeInternshipEligibility } from "./internshipEligibility.services";
import { createCertificateJobService } from "./certificateJob.services";
import { deriveCertificateVerdict } from "../lib/internshipProgramWindow";
import { AppError } from "../middlewares/error.middleware";

export async function evaluateInternshipEnrollment(
  enrollmentId: string,
): Promise<{
  verdict: "pass" | "fail";
  reason: string;
  alreadyEvaluated: boolean;
}> {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }

  const eligibility = await computeInternshipEligibility(enrollmentId);
  const { verdict, reason } = deriveCertificateVerdict(eligibility);

  const certificateEvaluation = {
    evaluatedAt: new Date(),
    verdict,
    reason,
    earned: eligibility.earned,
    totalAchievable: eligibility.totalAchievable,
    thresholdPct: eligibility.thresholdPct,
    requiredPoints: eligibility.requiredPoints,
  };

  // Conditional write: `certificateEvaluation` must still be absent. Two workers
  // racing the same enrollment therefore produce exactly one verdict, and only
  // the winner goes on to enqueue a certificate.
  const res = await InternshipEnrollmentModel.updateOne(
    {
      _id: new mongoose.Types.ObjectId(enrollmentId),
      certificateEvaluation: { $exists: false },
    },
    { $set: { certificateEvaluation, status: "completed" } },
  );

  if (!res.modifiedCount) {
    console.log(
      `[Internship Evaluation] ${enrollmentId} already evaluated — skipping.`,
    );
    return { verdict, reason, alreadyEvaluated: true };
  }

  console.log(
    `[Internship Evaluation] ${enrollmentId}: ${verdict.toUpperCase()} ` +
      `(${eligibility.earned}/${eligibility.requiredPoints} pts, ` +
      `${eligibility.thresholdPct}% of ${eligibility.totalAchievable})`,
  );

  if (verdict === "pass") {
    // The existing certificate worker owns DOCX -> PDF -> S3 and its own retries.
    await createCertificateJobService({
      enrollmentId,
      certificateType: "internship",
      studentName: "",
      courseName: "",
      completionDate: new Date(),
    });
  }

  return { verdict, reason, alreadyEvaluated: false };
}
