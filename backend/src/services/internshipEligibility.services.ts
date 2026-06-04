import mongoose from "mongoose";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { InternshipTaskModel } from "../models/internshipTask.schema";
import { InternshipExamModel } from "../models/internshipExam.schema";
import { InternshipLiveMeetingModel } from "../models/liveMeeting.schema";
import { InternshipSubmissionModel } from "../models/internshipSubmission.schema";
import { AppError } from "../middlewares/error.middleware";

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
      "internship batchSnapshot enrolledAt endDate programDurationMonths internshipSuccessPoints",
    )
    .lean<{
      internship?: mongoose.Types.ObjectId;
      batchSnapshot?: { batchId?: string };
      enrolledAt?: Date;
      endDate?: Date;
      programDurationMonths?: number;
      internshipSuccessPoints?: number;
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

  // Resolve the window. Prefer stored endDate; fall back to derivation.
  const enrolledAt = enrollment.enrolledAt
    ? new Date(enrollment.enrolledAt)
    : null;
  let endDate: Date | null = enrollment.endDate
    ? new Date(enrollment.endDate)
    : null;
  if (!endDate && enrolledAt && enrollment.programDurationMonths) {
    endDate = new Date(enrolledAt);
    endDate.setMonth(endDate.getMonth() + enrollment.programDurationMonths);
  }

  let tasksTotal = 0;
  let meetingsTotal = 0;
  let certExamTotal = 0;

  if (enrolledAt && endDate) {
    // Tasks: count any task whose due date (enrolledAt + dueDays) lands at
    // or before the learner's window end. Inactive templates are skipped.
    const taskIds = taskTemplateIds;
    if (taskIds.length > 0) {
      const tasks = await InternshipTaskModel.find({
        _id: { $in: taskIds },
      })
        .select("successPoints dueDays isActive")
        .lean<
          { successPoints?: number; dueDays?: number; isActive?: boolean }[]
        >();
      for (const t of tasks) {
        if (t.isActive === false) continue;
        const dueDays = Number(t.dueDays ?? 0);
        const dueAt = new Date(enrolledAt);
        dueAt.setDate(dueAt.getDate() + dueDays);
        if (dueAt <= endDate) {
          // A task contributes its configured success points (the certificate
          // "credits"), not its grading totalScore.
          tasksTotal += Math.max(0, Number(t.successPoints ?? 0));
        }
      }
    }

    // Live meetings: those scheduled inside the window for the learner's batch.
    const batchId = enrollment.batchSnapshot?.batchId;
    if (batchId) {
      const meetings = await InternshipLiveMeetingModel.find({
        internship: enrollment.internship,
        batchId,
        startDateTime: { $gte: enrolledAt, $lte: endDate },
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

  // The learner's certification-exam submission, used to (a) report the pass
  // gate and (b) subtract any exam points already folded into
  // internshipSuccessPoints so the % reflects WORK points only.
  let examSubmitted = false;
  let examScore = 0;
  let examFinalized = false;
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
      examFinalized = String(certSub.status) === "fully_reviewed";
    }
  }
  // Exam points are credited into the accumulator only once the exam is
  // finalized AND passed (mirrors accrueSuccessPointsIfPassed) — subtract
  // exactly that so it never counts toward the work-points %.
  const examPassed = examSubmitted && examScore >= examThreshold;
  const examContribution = examFinalized && examPassed ? examScore : 0;

  // Pool the learner is measured against: tasks + live-meeting attendance only.
  const totalAchievable = tasksTotal + meetingsTotal;

  const rawPct = internship.certificationThreshold;
  const thresholdPct =
    typeof rawPct === "number" && Number.isFinite(rawPct)
      ? Math.max(0, Math.min(100, rawPct))
      : 0;

  // Work points only — strip out any exam points folded into the accumulator.
  const earned = Math.max(
    0,
    Math.floor(Number(enrollment.internshipSuccessPoints ?? 0)) -
      examContribution,
  );
  const requiredPoints = Math.ceil((totalAchievable * thresholdPct) / 100);
  const meetsThreshold = thresholdPct === 0 || earned >= requiredPoints;
  const shortfall = meetsThreshold
    ? 0
    : Math.max(0, requiredPoints - earned);

  // Certificate requires BOTH gates: work-points threshold AND a passed exam.
  // When no exam is configured, the exam gate is not applicable.
  const certificateEligible =
    meetsThreshold && (!examConfigured || examPassed);

  return {
    totalAchievable,
    earned,
    thresholdPct,
    requiredPoints,
    meetsThreshold,
    shortfall,
    breakdown: { tasksTotal, meetingsTotal, certExamTotal },
    examConfigured,
    examSubmitted,
    examScore,
    examThreshold,
    examPassed,
    certificateEligible,
  };
}
