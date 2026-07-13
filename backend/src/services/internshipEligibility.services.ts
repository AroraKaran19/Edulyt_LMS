import mongoose from "mongoose";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { InternshipTaskModel } from "../models/internshipTask.schema";
import { InternshipExamModel } from "../models/internshipExam.schema";
import { InternshipLiveMeetingModel } from "../models/liveMeeting.schema";
import { InternshipSubmissionModel } from "../models/internshipSubmission.schema";
import { AppError } from "../middlewares/error.middleware";
import {
  computeProgramEndDate,
  computeAchievableTaskPoints,
} from "../lib/internshipProgramWindow";

export interface InternshipEligibility {
  /** Work points a learner can earn: tasks + live-meeting attendance.
   *  The certification exam is a SEPARATE gate and is NOT included here. */
  totalAchievable: number;
  /** Work points earned toward the %: tasks + attendance + purchased points.
   *  Excludes any certification-exam points folded into the accumulator. */
  earned: number;
  /** Configured percentage threshold (0–100). 0 = no gate. */
  thresholdPct: number;
  /** Points the learner needs to earn to meet the threshold. */
  requiredPoints: number;
  /** Gate 1 — true when work points meet the threshold (always true at 0%). */
  meetsThreshold: boolean;
  /** Points still needed; 0 if already met or no gate. */
  shortfall: number;
  /** Breakdown of where points came from (certExamTotal is informational only). */
  breakdown: {
    tasksTotal: number;
    meetingsTotal: number;
    certExamTotal: number;
  };
  /** Whether an active certification exam is configured for this internship. */
  examConfigured: boolean;
  /** Whether the learner has a certification-exam submission. */
  examSubmitted: boolean;
  /** The learner's certification-exam score (0 if not taken). */
  examScore: number;
  /** Passing threshold for the certification exam. */
  examThreshold: number;
  /** Gate 2 — true when the learner has cleared the certification exam. */
  examPassed: boolean;
  /** Both gates cleared — the learner qualifies for the certificate. */
  certificateEligible: boolean;
  /** Admin verdict override in effect, if any ("pass" | "fail" | null). */
  certificateOverride: "pass" | "fail" | null;
}

/**
 * Compute a learner's certification eligibility.
 *
 * "Total achievable" = sum of points for tasks + live meetings + the
 * certification exam that all fall within the learner's enrollment window
 * (`enrolledAt` → `endDate`, where `endDate = enrolledAt + programDurationMonths`).
 *
 * The certificate is issued only when
 *   `earned >= totalAchievable × thresholdPct / 100`.
 *
 * Returns 0-everything when window anchors are missing so callers can render
 * a "pending" state without throwing.
 */
export async function computeInternshipEligibility(
  enrollmentId: string,
): Promise<InternshipEligibility> {
  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError("Invalid enrollment id", 400);
  }

  const enrollment = await InternshipEnrollmentModel.findById(enrollmentId)
    .select(
      "internship batchSnapshot enrolledAt endDate programDurationMonths internshipSuccessPoints certificateOverride",
    )
    .lean<{
      internship?: mongoose.Types.ObjectId;
      batchSnapshot?: { batchId?: string; internshipStartDate?: Date };
      enrolledAt?: Date;
      endDate?: Date;
      programDurationMonths?: number;
      internshipSuccessPoints?: number;
      certificateOverride?: "pass" | "fail" | null;
    } | null>();
  if (!enrollment) throw new AppError("Enrollment not found", 404);

  const internship = await InternshipModel.findById(enrollment.internship)
    .select("certificationThreshold batches")
    .lean<{
      certificationThreshold?: number;
      batches?: {
        _id?: unknown;
        taskTemplateIds?: mongoose.Types.ObjectId[];
        certificationExamTemplateId?: mongoose.Types.ObjectId | null;
      }[];
    } | null>();
  if (!internship) throw new AppError("Internship not found", 404);

  // Tasks and the certification exam are configured PER BATCH (not at the
  // internship level). Resolve the learner's batch config — reading the
  // internship-level fields returns undefined, which is why tasks/exam were
  // silently counting as 0 in the achievable pool.
  const batchCfg = (internship.batches ?? []).find(
    (b) => String(b._id) === String(enrollment.batchSnapshot?.batchId),
  );
  const taskTemplateIds = (batchCfg?.taskTemplateIds ?? []).filter(Boolean);
  const certificationExamTemplateId =
    batchCfg?.certificationExamTemplateId ?? null;

  // The window is anchored on the COHORT start — the same anchor that decides
  // which tasks the learner is actually shown (getLearnerProgramBySlug).
  // Anchoring on `enrolledAt` (set when an admin approves them, or when the
  // offer-letter worker runs — days or weeks after the cohort begins) measured
  // the pool over a different window than the learner's real task calendar, so
  // the certificate denominator did not match what they were asked to do.
  const cohortStart = enrollment.batchSnapshot?.internshipStartDate
    ? new Date(enrollment.batchSnapshot.internshipStartDate)
    : null;
  const months = enrollment.programDurationMonths;
  let endDate: Date | null = null;
  if (
    cohortStart &&
    !Number.isNaN(cohortStart.getTime()) &&
    months &&
    months > 0
  ) {
    endDate = computeProgramEndDate(cohortStart, months);
  }

  let tasksTotal = 0;
  let meetingsTotal = 0;
  let certExamTotal = 0;

  if (cohortStart && endDate) {
    // Tasks: every active template whose due date (cohort start + dueDays)
    // lands at or before the learner's window end. A task contributes its
    // configured success points (the certificate "credits"), not its grading
    // totalScore.
    const taskIds = taskTemplateIds;
    if (taskIds.length > 0) {
      const tasks = await InternshipTaskModel.find({
        _id: { $in: taskIds },
      })
        .select("successPoints dueDays isActive")
        .lean<
          { successPoints?: number; dueDays?: number; isActive?: boolean }[]
        >();
      tasksTotal = computeAchievableTaskPoints(tasks, cohortStart, endDate);
    }

    // Live meetings: those scheduled inside the window for the learner's batch.
    const batchId = enrollment.batchSnapshot?.batchId;
    if (batchId) {
      const meetings = await InternshipLiveMeetingModel.find({
        internship: enrollment.internship,
        batchId,
        startDateTime: { $gte: cohortStart, $lte: endDate },
      })
        .select("successPoints")
        .lean<{ successPoints?: number }[]>();
      for (const m of meetings) {
        meetingsTotal += Math.max(0, Number(m.successPoints ?? 0));
      }
    }
  }

  // Certification exam is a SEPARATE pass/fail gate — intentionally EXCLUDED
  // from the success-points pool. We still load it for the breakdown (totalScore)
  // and to evaluate the pass gate (thresholdScore).
  let examConfigured = false;
  let examThreshold = 0;
  if (certificationExamTemplateId) {
    const exam = await InternshipExamModel.findById(
      certificationExamTemplateId,
    )
      .select("totalScore thresholdScore isActive")
      .lean<{
        totalScore?: number;
        thresholdScore?: number;
        isActive?: boolean;
      } | null>();
    if (exam && exam.isActive !== false) {
      examConfigured = true;
      certExamTotal = Math.max(0, Number(exam.totalScore ?? 0));
      examThreshold = Math.max(0, Number(exam.thresholdScore ?? 0));
    }
  }

  // The learner's certification-exam submission — reported for information only.
  // The exam is a BONUS points source, not a gate: any points it awards are
  // already folded into `internshipSuccessPoints` (accrueSuccessPointsIfPassed)
  // and count toward the threshold like tasks/meetings.
  let examSubmitted = false;
  let examScore = 0;
  if (examConfigured) {
    const certSub = await InternshipSubmissionModel.findOne({
      enrollmentId: new mongoose.Types.ObjectId(enrollmentId),
      submissionFor: "exam",
      examId: String(certificationExamTemplateId),
    })
      .select("totalAwardedScore status")
      .lean<{ totalAwardedScore?: number; status?: string } | null>();
    if (certSub) {
      examSubmitted = true;
      examScore = Math.max(0, Number(certSub.totalAwardedScore ?? 0));
    }
  }
  const examPassed = examSubmitted && examScore >= examThreshold;

  // Pool the learner is measured against: tasks + live-meeting attendance. The
  // exam is bonus credit on top, so it is intentionally NOT part of the pool.
  const totalAchievable = tasksTotal + meetingsTotal;

  const rawPct = internship.certificationThreshold;
  const thresholdPct =
    typeof rawPct === "number" && Number.isFinite(rawPct)
      ? Math.max(0, Math.min(100, rawPct))
      : 0;

  // Success points earned — includes any exam bonus already folded into the
  // accumulator. The exam simply helps a learner reach the threshold.
  const earned = Math.max(
    0,
    Math.floor(Number(enrollment.internshipSuccessPoints ?? 0)),
  );
  const requiredPoints = Math.ceil((totalAchievable * thresholdPct) / 100);
  const meetsThreshold = thresholdPct === 0 || earned >= requiredPoints;
  const shortfall = meetsThreshold
    ? 0
    : Math.max(0, requiredPoints - earned);

  // Certificate is decided by SUCCESS POINTS ALONE. The certification exam is a
  // bonus point source, never a gate — configured or not, taken or not.
  const computedEligible = meetsThreshold;

  // Admin override wins over the computed verdict. "pass" force-clears both
  // gates (so the certificate-issuance path, which gates on `meetsThreshold`,
  // also passes); "fail" force-blocks eligibility.
  const override =
    enrollment.certificateOverride === "pass" ||
    enrollment.certificateOverride === "fail"
      ? enrollment.certificateOverride
      : null;

  const certificateEligible =
    override === "pass" ? true : override === "fail" ? false : computedEligible;

  return {
    totalAchievable,
    earned,
    thresholdPct,
    requiredPoints,
    meetsThreshold: override === "pass" ? true : meetsThreshold,
    shortfall: override === "pass" ? 0 : shortfall,
    breakdown: { tasksTotal, meetingsTotal, certExamTotal },
    examConfigured,
    examSubmitted,
    examScore,
    examThreshold,
    examPassed: override === "pass" ? true : examPassed,
    certificateEligible,
    certificateOverride: override,
  };
}
