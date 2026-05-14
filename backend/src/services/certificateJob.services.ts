import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware";
import { CertificateJobModel } from "../models/certificateJob.schema";
import { CertificateJob, CertificateJobData, CertificateJobStatus, CertificateJobType } from "../types/certificateJob";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { v4 as uuidv4 } from "uuid";

/**
 * Create a new certificate generation job
 * Uses atomic findOneAndUpdate + partial unique index to prevent duplicate jobs under concurrent requests
 */
export const createCertificateJobService = async (
  data: CertificateJobData
): Promise<CertificateJob> => {
  try {
    const jobId = uuidv4();

    // Atomic: find existing or create new. Partial unique index ensures only one pending/processing per enrollment
    const job = await CertificateJobModel.findOneAndUpdate(
      {
        enrollmentId: data.enrollmentId,
        status: { $in: ["pending", "processing"] },
      },
      {
        $setOnInsert: {
          jobId,
          enrollmentId: data.enrollmentId,
          certificateType: (data.certificateType ?? "course") as CertificateJobType,
          status: "pending" as CertificateJobStatus,
          progress: 0,
          retryCount: 0,
        },
      },
      { upsert: true, new: true }
    ).lean();

    return job as CertificateJob;
  } catch (error: any) {
    // Duplicate key (E11000): another request created the job concurrently
    if (error.code === 11000) {
      const existingJob = await CertificateJobModel.findOne({
        enrollmentId: data.enrollmentId,
        status: { $in: ["pending", "processing"] },
      }).lean();
      if (existingJob) {
        return existingJob as CertificateJob;
      }
    }
    console.error("Error creating certificate job:", error);
    throw new AppError("Failed to create certificate job", 500);
  }
};

/**
 * Get job by jobId
 */
export const getCertificateJobService = async (
  jobId: string
): Promise<CertificateJob | null> => {
  try {
    const job = await CertificateJobModel.findOne({ jobId }).lean();
    return job as CertificateJob | null;
  } catch (error) {
    console.error("Error getting certificate job:", error);
    throw new AppError("Failed to get certificate job", 500);
  }
};

/**
 * Get job by enrollmentId
 */
export const getCertificateJobByEnrollmentService = async (
  enrollmentId: string
): Promise<CertificateJob | null> => {
  try {
    const job = await CertificateJobModel.findOne({ enrollmentId })
      .sort({ createdAt: -1 })
      .lean();
    return job as CertificateJob | null;
  } catch (error) {
    console.error("Error getting certificate job by enrollment:", error);
    throw new AppError("Failed to get certificate job", 500);
  }
};

/**
 * Update job status (used by worker)
 */
export const updateCertificateJobStatusService = async (
  jobId: string,
  updates: {
    status?: CertificateJobStatus;
    progress?: number;
    certificateId?: string;
    certificateUrl?: string;
    error?: string;
    startedAt?: Date;
  }
): Promise<CertificateJob> => {
  try {
    const updateData: any = { ...updates };

    if (updates.status === "processing" && !updates.startedAt) {
      updateData.startedAt = new Date();
    }

    if (updates.status === "completed" || updates.status === "failed") {
      updateData.completedAt = new Date();
    }

    const job = await CertificateJobModel.findOneAndUpdate(
      { jobId },
      { $set: updateData },
      { new: true }
    ).lean();

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    return job as CertificateJob;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error updating certificate job:", error);
    throw new AppError("Failed to update certificate job", 500);
  }
};

/**
 * Get next pending job (used by worker)
 */
export const getNextPendingJobService = async (): Promise<CertificateJob | null> => {
  try {
    // Use findOneAndUpdate with atomic lock to prevent multiple workers from picking the same job
    const job = await CertificateJobModel.findOneAndUpdate(
      { status: "pending" },
      {
        $set: {
          status: "processing",
          startedAt: new Date(),
        },
      },
      {
        sort: { createdAt: 1 }, // Process oldest first
        new: true,
      }
    ).lean();

    return job as CertificateJob | null;
  } catch (error) {
    console.error("Error getting next pending job:", error);
    return null;
  }
};

/**
 * Increment retry count for failed jobs
 */
export const incrementJobRetryService = async (jobId: string): Promise<void> => {
  try {
    await CertificateJobModel.findOneAndUpdate(
      { jobId },
      { $inc: { retryCount: 1 } }
    );
  } catch (error) {
    console.error("Error incrementing job retry:", error);
  }
};

/**
 * Get all certificate jobs (admin) - with pagination, status filter, and search
 * Enriches with user and course details from enrollment
 */
export const getAllCertificateJobsService = async (
  options: {
    page?: number;
    limit?: number;
    status?: CertificateJobStatus;
    certificateType?: CertificateJobType;
    search?: string;
  } = {}
): Promise<{
  jobs: (CertificateJob & {
    userName?: string;
    courseName?: string;
  })[];
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
    if (options.status) {
      filter.status = options.status;
    }
    if (options.certificateType) {
      filter.certificateType = options.certificateType;
    }

    // When search is provided, use aggregation to search across jobId, enrollmentId, userName, courseName
    if (searchTrimmed) {
      const searchRegex = new RegExp(
        searchTrimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      const eidConvert = {
        $convert: { input: "$enrollmentId", to: "objectId", onError: null, onNull: null },
      };

      const pipeline: mongoose.PipelineStage[] = [
        { $match: filter },
        // Course enrollment lookup
        {
          $lookup: {
            from: "enrollments",
            let: { eid: eidConvert },
            pipeline: [
              { $match: { $expr: { $and: [{ $ne: ["$$eid", null] }, { $eq: ["$_id", "$$eid"] }] } } },
              { $project: { userId: 1, courseId: 1 } },
              { $limit: 1 },
            ],
            as: "enrollment",
          },
        },
        { $unwind: { path: "$enrollment", preserveNullAndEmptyArrays: true } },
        // Internship enrollment lookup
        {
          $lookup: {
            from: "internshipenrollments",
            let: { eid: eidConvert },
            pipeline: [
              { $match: { $expr: { $and: [{ $ne: ["$$eid", null] }, { $eq: ["$_id", "$$eid"] }] } } },
              { $project: { user: 1, internship: 1 } },
              { $limit: 1 },
            ],
            as: "internshipEnrollment",
          },
        },
        { $unwind: { path: "$internshipEnrollment", preserveNullAndEmptyArrays: true } },
        // User via course enrollment
        {
          $lookup: {
            from: "users",
            localField: "enrollment.userId",
            foreignField: "_id",
            as: "courseUser",
            pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
          },
        },
        { $unwind: { path: "$courseUser", preserveNullAndEmptyArrays: true } },
        // User via internship enrollment
        {
          $lookup: {
            from: "users",
            localField: "internshipEnrollment.user",
            foreignField: "_id",
            as: "internshipUser",
            pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
          },
        },
        { $unwind: { path: "$internshipUser", preserveNullAndEmptyArrays: true } },
        // Course lookup
        {
          $lookup: {
            from: "courses",
            localField: "enrollment.courseId",
            foreignField: "_id",
            as: "course",
            pipeline: [{ $project: { title: 1 } }],
          },
        },
        { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
        // Internship program lookup
        {
          $lookup: {
            from: "internships",
            localField: "internshipEnrollment.internship",
            foreignField: "_id",
            as: "internshipProgram",
            pipeline: [{ $project: { title: 1 } }],
          },
        },
        { $unwind: { path: "$internshipProgram", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            isInternship: { $eq: ["$certificateType", "internship"] },
            userName: {
              $trim: {
                input: {
                  $concat: [
                    {
                      $ifNull: [
                        { $cond: { if: { $eq: ["$certificateType", "internship"] }, then: "$internshipUser.firstName", else: "$courseUser.firstName" } },
                        "",
                      ],
                    },
                    " ",
                    {
                      $ifNull: [
                        { $cond: { if: { $eq: ["$certificateType", "internship"] }, then: "$internshipUser.lastName", else: "$courseUser.lastName" } },
                        "",
                      ],
                    },
                  ],
                },
              },
            },
            courseName: {
              $cond: {
                if: { $eq: ["$certificateType", "internship"] },
                then: { $ifNull: ["$internshipProgram.title", ""] },
                else: { $ifNull: ["$course.title", ""] },
              },
            },
            resolvedEmail: {
              $cond: {
                if: { $eq: ["$certificateType", "internship"] },
                then: "$internshipUser.email",
                else: "$courseUser.email",
              },
            },
          },
        },
        {
          $match: {
            $or: [
              { jobId: searchRegex },
              { enrollmentId: searchRegex },
              { userName: searchRegex },
              { courseName: searchRegex },
              { resolvedEmail: searchRegex },
            ],
          },
        },
      ];

      const [countResult, jobsResult] = await Promise.all([
        CertificateJobModel.aggregate([
          ...pipeline,
          { $count: "total" },
        ]),
        CertificateJobModel.aggregate([
          ...pipeline,
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              enrollment: 0,
              internshipEnrollment: 0,
              courseUser: 0,
              internshipUser: 0,
              course: 0,
              internshipProgram: 0,
              resolvedEmail: 0,
              isInternship: 0,
            },
          },
        ]),
      ]);

      const total = countResult[0]?.total ?? 0;
      const jobs = (jobsResult as any[]).map((j) => {
        const { userName: u, courseName: c, ...rest } = j;
        return { ...rest, userName: u || "", courseName: c || "" };
      });

      return { jobs, total, page, limit };
    }

    // No search: use existing find + enrich flow
    const [jobs, total] = await Promise.all([
      CertificateJobModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CertificateJobModel.countDocuments(filter),
    ]);

    const { EnrollmentModel } = await import("../models/enrollment.schema");
    const { UserModel } = await import("../models/user.schema");
    const { CourseModel } = await import("../models/course.schema");

    const enrichedJobs = await Promise.all(
      (jobs as CertificateJob[]).map(async (job) => {
        let userName = "";
        let courseName = "";
        try {
          const eid = job.enrollmentId;
          if (!eid || typeof eid !== "string") return { ...job, userName, courseName };
          const objId = mongoose.Types.ObjectId.isValid(eid)
            ? new mongoose.Types.ObjectId(eid)
            : null;
          if (!objId) return { ...job, userName, courseName };

          if (job.certificateType === "internship") {
            const enrollment = await InternshipEnrollmentModel.findById(objId)
              .select("user internship")
              .lean();
            if (!enrollment) return { ...job, userName, courseName };
            const [user, internship] = await Promise.all([
              UserModel.findById((enrollment as any).user).select("firstName lastName").lean(),
              (enrollment as any).internship
                ? InternshipModel.findById((enrollment as any).internship).select("title").lean()
                : null,
            ]);
            userName = user
              ? `${(user as any).firstName || ""} ${(user as any).lastName || ""}`.trim()
              : "";
            courseName = (internship as any)?.title || "";
          } else {
            const enrollment = await EnrollmentModel.findById(objId)
              .select("userId courseId")
              .lean();
            if (!enrollment?.userId) return { ...job, userName, courseName };
            const [user, course] = await Promise.all([
              UserModel.findById(enrollment.userId).select("firstName lastName").lean(),
              enrollment.courseId
                ? CourseModel.findById(enrollment.courseId).select("title").lean()
                : null,
            ]);
            userName = user
              ? `${(user as { firstName?: string }).firstName || ""} ${(user as { lastName?: string }).lastName || ""}`.trim()
              : "";
            courseName = (course as any)?.title || "";
          }
        } catch {
          // Ignore enrichment errors
        }
        return { ...job, userName, courseName };
      })
    );

    return {
      jobs: enrichedJobs,
      total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error getting all certificate jobs:", error);
    throw new AppError("Failed to get certificate jobs", 500);
  }
};

/**
 * Retry a failed certificate job (admin) - reset to pending for worker to pick up
 */
export const retryCertificateJobService = async (
  jobId: string
): Promise<CertificateJob> => {
  try {
    const job = await CertificateJobModel.findOne({ jobId }).lean();

    if (!job) {
      throw new AppError("Job not found", 404);
    }

    if (job.status !== "failed") {
      throw new AppError(
        "Only failed jobs can be retried. Current status: " + job.status,
        400
      );
    }

    const updated = await CertificateJobModel.findOneAndUpdate(
      { jobId },
      {
        $set: { status: "pending", progress: 0 },
        $unset: {
          error: "",
          startedAt: "",
          completedAt: "",
          certificateId: "",
          certificateUrl: "",
        },
      },
      { new: true }
    ).lean();

    return updated as CertificateJob;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error retrying certificate job:", error);
    throw new AppError("Failed to retry certificate job", 500);
  }
};

