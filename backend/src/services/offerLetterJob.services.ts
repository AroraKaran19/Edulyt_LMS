import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware";
import { OfferLetterJobModel } from "../models/offerLetterJob.schema";
import {
  OfferLetterJob,
  OfferLetterJobData,
  OfferLetterJobListRow,
  OfferLetterJobStatus,
} from "../types/offerLetterJob";
import { v4 as uuidv4 } from "uuid";

export const createOfferLetterJobService = async (
  data: OfferLetterJobData,
): Promise<OfferLetterJob> => {
  try {
    const jobId = uuidv4();

    const job = await OfferLetterJobModel.findOneAndUpdate(
      {
        internshipEnrollmentId: data.internshipEnrollmentId,
        status: { $in: ["pending", "processing"] },
      },
      {
        $setOnInsert: {
          jobId,
          internshipEnrollmentId: data.internshipEnrollmentId,
          status: "pending" as OfferLetterJobStatus,
          progress: 0,
          retryCount: 0,
        },
      },
      { upsert: true, new: true },
    ).lean();

    return job as OfferLetterJob;
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 11000) {
      const existingJob = await OfferLetterJobModel.findOne({
        internshipEnrollmentId: data.internshipEnrollmentId,
        status: { $in: ["pending", "processing"] },
      }).lean();
      if (existingJob) {
        return existingJob as OfferLetterJob;
      }
    }
    console.error("Error creating offer letter job:", error);
    throw new AppError("Failed to create offer letter job", 500);
  }
};

export const getOfferLetterJobService = async (
  jobId: string,
): Promise<OfferLetterJob | null> => {
  try {
    const job = await OfferLetterJobModel.findOne({ jobId }).lean();
    return job as OfferLetterJob | null;
  } catch (error) {
    console.error("Error getting offer letter job:", error);
    throw new AppError("Failed to get offer letter job", 500);
  }
};

export const updateOfferLetterJobStatusService = async (
  jobId: string,
  updates: {
    status?: OfferLetterJobStatus;
    progress?: number;
    internId?: string;
    offerLetterUrl?: string;
    error?: string;
    startedAt?: Date;
  },
): Promise<OfferLetterJob> => {
  try {
    const updateData: Record<string, unknown> = { ...updates };

    if (updates.status === "processing" && !updates.startedAt) {
      updateData.startedAt = new Date();
    }

    if (updates.status === "completed" || updates.status === "failed") {
      updateData.completedAt = new Date();
    }

    const job = await OfferLetterJobModel.findOneAndUpdate(
      { jobId },
      { $set: updateData },
      { new: true },
    ).lean();

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    return job as OfferLetterJob;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error updating offer letter job:", error);
    throw new AppError("Failed to update offer letter job", 500);
  }
};

export const getNextPendingOfferLetterJobService = async (): Promise<OfferLetterJob | null> => {
  try {
    const job = await OfferLetterJobModel.findOneAndUpdate(
      { status: "pending" },
      {
        $set: {
          status: "processing",
          startedAt: new Date(),
        },
      },
      {
        sort: { createdAt: 1 },
        new: true,
      },
    ).lean();

    return job as OfferLetterJob | null;
  } catch (error) {
    console.error("Error getting next pending offer letter job:", error);
    return null;
  }
};

export const incrementOfferLetterJobRetryService = async (jobId: string): Promise<void> => {
  try {
    await OfferLetterJobModel.findOneAndUpdate({ jobId }, { $inc: { retryCount: 1 } });
  } catch (error) {
    console.error("Error incrementing offer letter job retry:", error);
  }
};

function toListRow(
  job: OfferLetterJob & { internshipTitle?: string; userName?: string; userEmail?: string },
): OfferLetterJobListRow {
  return {
    jobId: job.jobId,
    enrollmentId: job.internshipEnrollmentId,
    status: job.status,
    internshipTitle: job.internshipTitle ?? "",
    userName: job.userName ?? "",
    userEmail: job.userEmail ?? "",
    internId: job.internId,
    offerLetterUrl: job.offerLetterUrl,
    error: job.error,
    progress: job.progress,
    createdAt: job.createdAt instanceof Date ? job.createdAt.toISOString() : undefined,
    completedAt: job.completedAt instanceof Date ? job.completedAt.toISOString() : undefined,
  };
}

export const getAllOfferLetterJobsService = async (
  options: {
    page?: number;
    limit?: number;
    status?: OfferLetterJobStatus | OfferLetterJobStatus[];
    search?: string;
  } = {},
): Promise<{
  jobs: OfferLetterJobListRow[];
  total: number;
  page: number;
  limit: number;
}> => {
  try {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;
    const searchTrimmed = options.search?.trim();

    const filter: Record<string, unknown> = {};
    if (options.status !== undefined) {
      filter.status = Array.isArray(options.status)
        ? { $in: options.status }
        : options.status;
    }

    if (searchTrimmed) {
      const searchRegex = new RegExp(
        searchTrimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );

      const pipeline: mongoose.PipelineStage[] = [
        { $match: filter },
        {
          $lookup: {
            from: "internshipenrollments",
            let: {
              eid: {
                $convert: {
                  input: "$internshipEnrollmentId",
                  to: "objectId",
                  onError: null,
                  onNull: null,
                },
              },
            },
            pipeline: [
              {
                $match: {
                  $expr: { $and: [{ $ne: ["$$eid", null] }, { $eq: ["$_id", "$$eid"] }] },
                },
              },
              { $project: { user: 1, internshipSnapshot: 1 } },
              { $limit: 1 },
            ],
            as: "enrollment",
          },
        },
        { $unwind: { path: "$enrollment", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "users",
            localField: "enrollment.user",
            foreignField: "_id",
            as: "user",
            pipeline: [{ $project: { firstName: 1, lastName: 1, name: 1, email: 1 } }],
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            userName: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ["$user.firstName", ""] },
                    " ",
                    { $ifNull: ["$user.lastName", ""] },
                  ],
                },
              },
            },
            userEmail: { $ifNull: ["$user.email", ""] },
            internshipTitle: { $ifNull: ["$enrollment.internshipSnapshot.title", ""] },
          },
        },
        {
          $match: {
            $or: [
              { jobId: searchRegex },
              { internshipEnrollmentId: searchRegex },
              { internId: searchRegex },
              { userName: searchRegex },
              { internshipTitle: searchRegex },
              { userEmail: searchRegex },
            ],
          },
        },
      ];

      const [countResult, jobsResult] = await Promise.all([
        OfferLetterJobModel.aggregate([...pipeline, { $count: "total" }]),
        OfferLetterJobModel.aggregate([
          ...pipeline,
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              enrollment: 0,
              user: 0,
            },
          },
        ]),
      ]);

      const total = countResult[0]?.total ?? 0;
      const jobs = (jobsResult as OfferLetterJob[]).map((j) => toListRow(j));

      return { jobs, total, page, limit };
    }

    const [jobsRaw, total] = await Promise.all([
      OfferLetterJobModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OfferLetterJobModel.countDocuments(filter),
    ]);

    const { InternshipEnrollmentModel } = await import("../models/internshipEnrollment.schema");
    const { UserModel } = await import("../models/user.schema");

    const enriched = await Promise.all(
      (jobsRaw as OfferLetterJob[]).map(async (job) => {
        let internshipTitle = "";
        let userName = "";
        let userEmail = "";
        try {
          const eid = job.internshipEnrollmentId;
          if (!eid || typeof eid !== "string") return { ...job, internshipTitle, userName, userEmail };

          const objId = mongoose.Types.ObjectId.isValid(eid)
            ? new mongoose.Types.ObjectId(eid)
            : null;
          if (!objId) return { ...job, internshipTitle, userName, userEmail };

          const enrollment = await InternshipEnrollmentModel.findById(objId)
            .select("user internshipSnapshot")
            .lean();
          if (!enrollment?.user) return { ...job, internshipTitle, userName, userEmail };

          const user = await UserModel.findById(enrollment.user)
            .select("firstName lastName name email")
            .lean();

          internshipTitle =
            (enrollment as { internshipSnapshot?: { title?: string } }).internshipSnapshot
              ?.title ?? "";
          if (user && typeof user === "object") {
            userName =
              `${(user as { firstName?: string }).firstName || ""} ${(user as { lastName?: string }).lastName || ""}`.trim() ||
              (user as { name?: string }).name ||
              "";
            userEmail = (user as { email?: string }).email ?? "";
          }
        } catch {
          /* keep empty */
        }
        return { ...job, internshipTitle, userName, userEmail };
      }),
    );

    return {
      jobs: enriched.map((j) => toListRow(j)),
      total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error getting all offer letter jobs:", error);
    throw new AppError("Failed to get offer letter jobs", 500);
  }
};

export const retryOfferLetterJobService = async (jobId: string): Promise<OfferLetterJob> => {
  try {
    const job = await OfferLetterJobModel.findOne({ jobId }).lean();

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    if (job.status !== "failed") {
      throw new AppError(
        "Only failed jobs can be retried. Current status: " + job.status,
        400,
      );
    }

    const updated = await OfferLetterJobModel.findOneAndUpdate(
      { jobId },
      {
        $set: { status: "pending", progress: 0 },
        $unset: {
          error: "",
          startedAt: "",
          completedAt: "",
          internId: "",
          offerLetterUrl: "",
        },
      },
      { new: true },
    ).lean();

    return updated as OfferLetterJob;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error retrying offer letter job:", error);
    throw new AppError("Failed to retry offer letter job", 500);
  }
};

/**
 * Sweep jobs wedged in `processing` for longer than `timeoutMinutes`. These
 * are rows the worker claimed but never finalised — typically because the
 * process crashed mid-job (LibreOffice OOM, server SIGKILL, etc.) or the job
 * silently hung. Without this, the unique partial index (which covers both
 * `pending` and `processing`) would block any new enqueue for the same
 * enrollment indefinitely.
 *
 * Each stuck job has `retryCount` bumped:
 *   • retryCount ≤ maxReclaims → reset to `pending` for the next tick
 *   • retryCount > maxReclaims → mark `failed` so an admin can manually retry
 *     from the dashboard (instead of looping forever silently).
 *
 * Idempotent and cheap — uses the existing `{ status: 1, createdAt: 1 }`
 * index range.
 */
export const reclaimStuckOfferLetterJobs = async (
  timeoutMinutes: number = 10,
  maxReclaims: number = 2,
): Promise<{ reclaimed: number; failed: number }> => {
  const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);

  const stuck = await OfferLetterJobModel.find({
    status: "processing",
    startedAt: { $lt: cutoff },
  })
    .select("jobId retryCount")
    .lean();

  if (stuck.length === 0) return { reclaimed: 0, failed: 0 };

  let reclaimed = 0;
  let failed = 0;

  for (const job of stuck) {
    const currentRetries = job.retryCount ?? 0;
    const next = currentRetries + 1;

    if (next > maxReclaims) {
      await OfferLetterJobModel.updateOne(
        { jobId: job.jobId },
        {
          $set: {
            status: "failed",
            completedAt: new Date(),
            error: `Stuck in processing > ${timeoutMinutes} min for ${next} reclaim(s); marked failed for admin retry.`,
          },
        },
      );
      failed += 1;
    } else {
      await OfferLetterJobModel.updateOne(
        { jobId: job.jobId },
        {
          $set: {
            status: "pending",
            progress: 0,
            retryCount: next,
            error: `Auto-reclaimed: stuck in processing > ${timeoutMinutes} min (reclaim ${next}/${maxReclaims})`,
          },
          $unset: { startedAt: "" },
        },
      );
      reclaimed += 1;
    }
  }

  console.log(
    `[Offer Letter Job] Reclaim sweep: reset=${reclaimed}, marked-failed=${failed} (timeout=${timeoutMinutes}m, maxReclaims=${maxReclaims})`,
  );
  return { reclaimed, failed };
};

/** Ensure every `offer_letter_pending` enrollment has a queue job (idempotent). */
export const syncOfferLetterJobsForPendingEnrollments = async (): Promise<void> => {
  const { InternshipEnrollmentModel } = await import("../models/internshipEnrollment.schema");
  const rows = await InternshipEnrollmentModel.find({ status: "offer_letter_pending" })
    .select("_id")
    .lean();
  for (const row of rows) {
    try {
      await createOfferLetterJobService({ internshipEnrollmentId: String(row._id) });
    } catch (e) {
      console.error(
        "[Offer Letter Job] Failed to enqueue for enrollment",
        String(row._id),
        e,
      );
    }
  }
  if (rows.length > 0) {
    console.log(
      `[Offer Letter Job] Synced queue for ${rows.length} offer_letter_pending enrollment(s)`,
    );
  }
};
