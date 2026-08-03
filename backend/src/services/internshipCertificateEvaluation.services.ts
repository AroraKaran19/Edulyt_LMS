/**
 * Decide, once, whether a learner earned their internship certificate.
 * Runs on day N+1 after their program window closes.
 *
 * EVERY enrolled learner reaches here, with or without a certification exam:
 * issuance is decided on success points alone and the exam is only a bonus points
 * source (see `enqueueDueInternshipEvaluations`, which applies no exam filter, and
 * `finalizeCertificationExamReview`, which queues no certificate job).
 *
 * A `fail` written here is not the last word: an admin can still rescue the
 * learner with `certificateOverride: "pass"`, which wins over this snapshot in
 * `computeInternshipEligibility` and at the certificate generator's gate.
 *
 * This is also where a learner is told they finished without a certificate. A
 * pass says nothing yet — the certificate does not exist until the worker has
 * built it, so that email is sent from there.
 */
import mongoose from "mongoose";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { computeInternshipEligibility } from "./internshipEligibility.services";
import { createCertificateJobService } from "./certificateJob.services";
import { deriveCertificateVerdict } from "../lib/internshipProgramWindow";
import { sendInternshipClosureEmail } from "./internshipClosureMail.services";
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
    // It also sends the learner's email, because neither the certificate URL nor
    // the verification URL that email needs exists until the PDF is built.
    await createCertificateJobService({
      enrollmentId,
      certificateType: "internship",
      studentName: "",
      courseName: "",
      completionDate: new Date(),
    });
  } else {
    // Nothing to wait for on a fail, so the learner hears now. Swallows its own
    // failures: a mail problem must not undo a written verdict.
    await sendInternshipClosureEmail(enrollmentId, { kind: "withheld" });
  }

  return { verdict, reason, alreadyEvaluated: false };
}
