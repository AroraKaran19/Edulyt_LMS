import { AppError } from "../middlewares/error.middleware";
import { CertificateJobModel } from "../models/certificateJob.schema";
import { CertificateJob, CertificateJobData, CertificateJobStatus } from "../types/certificateJob";
import { v4 as uuidv4 } from "uuid";

/**
 * Create a new certificate generation job
 */
export const createCertificateJobService = async (
  data: CertificateJobData
): Promise<CertificateJob> => {
  try {
    // Check if a job already exists for this enrollment
    const existingJob = await CertificateJobModel.findOne({
      enrollmentId: data.enrollmentId,
      status: { $in: ["pending", "processing"] },
    });

    if (existingJob) {
      return existingJob.toObject() as CertificateJob;
    }

    // Create new job
    const jobId = uuidv4();
    const job = new CertificateJobModel({
      jobId,
      enrollmentId: data.enrollmentId,
      status: "pending",
      progress: 0,
      retryCount: 0,
    });

    await job.save();
    return job.toObject() as CertificateJob;
  } catch (error) {
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

