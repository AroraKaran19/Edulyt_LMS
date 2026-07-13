import { v4 as uuidv4 } from "uuid";
import { AppError } from "../middlewares/error.middleware";
import { InternshipEvaluationJobModel } from "../models/internshipEvaluationJob.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import {
  InternshipEvaluationJob,
  InternshipEvaluationJobData,
  InternshipEvaluationJobStatus,
} from "../types/internshipEvaluationJob";

export const createInternshipEvaluationJobService = async (
  data: InternshipEvaluationJobData,
): Promise<InternshipEvaluationJob> => {
  try {
    const jobId = uuidv4();
    const job = await InternshipEvaluationJobModel.findOneAndUpdate(
      {
        internshipEnrollmentId: data.internshipEnrollmentId,
        status: { $in: ["pending", "processing"] },
      },
      {
        $setOnInsert: {
          jobId,
          internshipEnrollmentId: data.internshipEnrollmentId,
          status: "pending" as InternshipEvaluationJobStatus,
          retryCount: 0,
        },
      },
      { upsert: true, new: true },
    ).lean();
    return job as InternshipEvaluationJob;
  } catch (error: unknown) {
    // Concurrent enqueue raced us on the partial unique index.
    if ((error as { code?: number }).code === 11000) {
      const existing = await InternshipEvaluationJobModel.findOne({
        internshipEnrollmentId: data.internshipEnrollmentId,
        status: { $in: ["pending", "processing"] },
      }).lean();
      if (existing) return existing as InternshipEvaluationJob;
    }
    console.error("Error creating internship evaluation job:", error);
    throw new AppError("Failed to create internship evaluation job", 500);
  }
};

/** Atomically claim the oldest pending job (`pending` -> `processing`). */
export const getNextPendingInternshipEvaluationJobService =
  async (): Promise<InternshipEvaluationJob | null> => {
    const job = await InternshipEvaluationJobModel.findOneAndUpdate(
      { status: "pending" },
      { $set: { status: "processing", startedAt: new Date() } },
      { sort: { createdAt: 1 }, new: true },
    ).lean();
    return (job as InternshipEvaluationJob) ?? null;
  };

export const updateInternshipEvaluationJobStatusService = async (
  jobId: string,
  updates: {
    status?: InternshipEvaluationJobStatus;
    verdict?: "pass" | "fail";
    error?: string;
  },
): Promise<void> => {
  const set: Record<string, unknown> = { ...updates };
  if (updates.status === "completed" || updates.status === "failed") {
    set.completedAt = new Date();
  }
  await InternshipEvaluationJobModel.updateOne({ jobId }, { $set: set });
};

/**
 * Rescue jobs wedged in `processing` (e.g. the process died mid-run). The
 * partial unique index covers `processing`, so a stuck row would otherwise
 * block every future enqueue for that enrollment.
 */
export const reclaimStuckInternshipEvaluationJobs = async (
  timeoutMinutes: number,
  maxReclaims: number,
): Promise<{ reclaimed: number; failed: number }> => {
  const cutoff = new Date(Date.now() - timeoutMinutes * 60_000);
  const stuck = await InternshipEvaluationJobModel.find({
    status: "processing",
    startedAt: { $lt: cutoff },
  })
    .select("jobId retryCount")
    .lean();

  let reclaimed = 0;
  let failed = 0;
  for (const job of stuck as { jobId: string; retryCount?: number }[]) {
    const next = Number(job.retryCount ?? 0) + 1;
    if (next > maxReclaims) {
      await InternshipEvaluationJobModel.updateOne(
        { jobId: job.jobId },
        {
          $set: {
            status: "failed",
            retryCount: next,
            error: `Auto-failed: stuck in processing > ${timeoutMinutes} min (reclaim ${next}/${maxReclaims})`,
            completedAt: new Date(),
          },
        },
      );
      failed += 1;
    } else {
      await InternshipEvaluationJobModel.updateOne(
        { jobId: job.jobId },
        {
          $set: { status: "pending", retryCount: next },
          $unset: { startedAt: "" },
        },
      );
      reclaimed += 1;
    }
  }
  if (reclaimed || failed) {
    console.log(
      `[Internship Evaluation] Reclaim sweep: reset=${reclaimed}, failed=${failed}`,
    );
  }
  return { reclaimed, failed };
};

/**
 * Enqueue every enrollment whose certificate verdict is now due.
 *
 * The certificate is decided by success points alone, so EVERY enrolled learner
 * is judged the same way — with or without a certification exam (the exam is
 * just a bonus points source now).
 *
 * Selection:
 *   status = "enrolled"          paused/completed/dropped/revoked are not judged
 *   endDate < now                endDate is IST end-of-day, so the 01:00 IST run
 *                                the next morning is safely past it (the N+1 rule)
 *   no certificateEvaluation     never re-judge a learner
 */
export const enqueueDueInternshipEvaluations = async (): Promise<number> => {
  const now = new Date();

  const due = await InternshipEnrollmentModel.find({
    status: "enrolled",
    endDate: { $lt: now },
    certificateEvaluation: { $exists: false },
  })
    .select("_id")
    .lean();

  let enqueued = 0;
  for (const e of due as { _id: unknown }[]) {
    try {
      await createInternshipEvaluationJobService({
        internshipEnrollmentId: String(e._id),
      });
      enqueued += 1;
    } catch (err) {
      console.error(
        "[Internship Evaluation] Failed to enqueue enrollment",
        String(e._id),
        err,
      );
    }
  }

  if (enqueued > 0) {
    console.log(
      `[Internship Evaluation] Enqueued ${enqueued} due enrollment(s)`,
    );
  }
  return enqueued;
};
