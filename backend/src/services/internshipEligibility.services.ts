import mongoose from "mongoose";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { InternshipTaskModel } from "../models/internshipTask.schema";
import { InternshipExamModel } from "../models/internshipExam.schema";
import { InternshipLiveMeetingModel } from "../models/liveMeeting.schema";
import { AppError } from "../middlewares/error.middleware";

export interface InternshipEligibility {
  /** Sum of points a learner could earn within their enrollment window. */
  totalAchievable: number;
  /** Per-enrollment `internshipSuccessPoints` (snapshot). */
  earned: number;
  /** Configured percentage threshold (0–100). 0 = no gate. */
  thresholdPct: number;
  /** Points the learner needs to earn to meet the threshold. */
  requiredPoints: number;
  /** True if the learner has met the threshold (always true when thresholdPct = 0). */
  meetsThreshold: boolean;
  /** Points still needed; 0 if already met or no gate. */
  shortfall: number;
  /** Breakdown of where total achievable came from. */
  breakdown: {
    tasksTotal: number;
    meetingsTotal: number;
    certExamTotal: number;
  };
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
    .select(
      "certificationThreshold certificationExamTemplateId taskTemplateIds",
    )
    .lean<{
      certificationThreshold?: number;
      certificationExamTemplateId?: mongoose.Types.ObjectId | null;
      taskTemplateIds?: mongoose.Types.ObjectId[];
    } | null>();
  if (!internship) throw new AppError("Internship not found", 404);

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
    const taskIds = (internship.taskTemplateIds ?? []).filter(Boolean);
    if (taskIds.length > 0) {
      const tasks = await InternshipTaskModel.find({
        _id: { $in: taskIds },
      })
        .select("totalScore dueDays isActive")
        .lean<
          { totalScore?: number; dueDays?: number; isActive?: boolean }[]
        >();
      for (const t of tasks) {
        if (t.isActive === false) continue;
        const dueDays = Number(t.dueDays ?? 0);
        const dueAt = new Date(enrolledAt);
        dueAt.setDate(dueAt.getDate() + dueDays);
        if (dueAt <= endDate) {
          tasksTotal += Math.max(0, Number(t.totalScore ?? 0));
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

  // Certification exam: counted regardless of date (it sits on the last day
  // of the window by definition). Skipped when no template / inactive.
  if (internship.certificationExamTemplateId) {
    const exam = await InternshipExamModel.findById(
      internship.certificationExamTemplateId,
    )
      .select("totalScore isActive")
      .lean<{ totalScore?: number; isActive?: boolean } | null>();
    if (exam && exam.isActive !== false) {
      certExamTotal = Math.max(0, Number(exam.totalScore ?? 0));
    }
  }

  const totalAchievable = tasksTotal + meetingsTotal + certExamTotal;

  const rawPct = internship.certificationThreshold;
  const thresholdPct =
    typeof rawPct === "number" && Number.isFinite(rawPct)
      ? Math.max(0, Math.min(100, rawPct))
      : 0;

  const earned = Math.max(
    0,
    Math.floor(Number(enrollment.internshipSuccessPoints ?? 0)),
  );
  const requiredPoints = Math.ceil((totalAchievable * thresholdPct) / 100);
  const meetsThreshold = thresholdPct === 0 || earned >= requiredPoints;
  const shortfall = meetsThreshold
    ? 0
    : Math.max(0, requiredPoints - earned);

  return {
    totalAchievable,
    earned,
    thresholdPct,
    requiredPoints,
    meetsThreshold,
    shortfall,
    breakdown: { tasksTotal, meetingsTotal, certExamTotal },
  };
}
