import { CertificateJobModel } from "../models/certificateJob.schema";
import {
  getNextPendingJobService,
  updateCertificateJobStatusService,
  incrementJobRetryService,
} from "../services/certificateJob.services";
import { createCertificateService } from "../services/certificate.services";
import { EnrollmentModel } from "../models/enrollment.schema";
import { UserModel } from "../models/user.schema";
import { CourseModel } from "../models/course.schema";
import { CertificateGenerationData } from "../types/certificate";

const MAX_RETRIES = 3;
const POLL_INTERVAL = 3000; // 3 seconds

/**
 * Process a single certificate generation job
 */
async function processCertificateJob(job: any): Promise<void> {
  const { jobId, enrollmentId } = job;

  try {
    console.log(`[Certificate Worker] Processing job ${jobId} for enrollment ${enrollmentId}`);

    // Update progress: 10%
    await updateCertificateJobStatusService(jobId, { progress: 10 });

    // Get enrollment details
    const enrollment = await EnrollmentModel.findById(enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    if (enrollment.status !== "completed") {
      throw new Error("Enrollment must be completed to generate certificate");
    }

    if (enrollment.isTrial) {
      throw new Error("Certificates cannot be issued for trial enrollments");
    }

    // Update progress: 20%
    await updateCertificateJobStatusService(jobId, { progress: 20 });

    // Get user and course details
    const user = await UserModel.findById(enrollment.userId)
      .select("firstName lastName")
      .lean();
    const course = await CourseModel.findById(enrollment.courseId).lean();

    if (!user || !course) {
      throw new Error("User or course not found");
    }

    // Update progress: 30%
    await updateCertificateJobStatusService(jobId, { progress: 30 });

    // Get student full name
    const studentName = `${(user as any).firstName || ""} ${
      (user as any).lastName || ""
    }`.trim();

    // Get course name
    const courseName = (course as any).title || "";

    // Check if course is certified
    if (!(course as any).isCertified) {
      throw new Error("Course is not certified");
    }

    // Update progress: 40%
    await updateCertificateJobStatusService(jobId, { progress: 40 });

    // Prepare certificate generation data
    const certificateData: CertificateGenerationData = {
      enrollmentId: enrollmentId.toString(),
      studentName,
      courseName,
      completionDate: enrollment.completedAt || new Date(),
    };

    // Update progress: 50%
    await updateCertificateJobStatusService(jobId, { progress: 50 });

    // Generate certificate (this is the heavy operation)
    const certificate = await createCertificateService(certificateData);

    // Update progress: 90%
    await updateCertificateJobStatusService(jobId, {
      progress: 90,
      certificateId: certificate.certificateId,
    });

    // Update progress: 100% and mark as completed
    await updateCertificateJobStatusService(jobId, {
      status: "completed",
      progress: 100,
      certificateId: certificate.certificateId,
      certificateUrl: certificate.fileUrl || undefined,
    });

    console.log(
      `[Certificate Worker] Job ${jobId} completed successfully. Certificate ID: ${certificate.certificateId}`
    );
  } catch (error: any) {
    console.error(`[Certificate Worker] Error processing job ${jobId}:`, error);

    const currentRetryCount = job.retryCount || 0;

    if (currentRetryCount < MAX_RETRIES) {
      // Retry the job
      await incrementJobRetryService(jobId);
      await updateCertificateJobStatusService(jobId, {
        status: "pending", // Reset to pending for retry
        error: `Retry ${currentRetryCount + 1}/${MAX_RETRIES}: ${error.message}`,
      });
      console.log(
        `[Certificate Worker] Job ${jobId} will be retried (${currentRetryCount + 1}/${MAX_RETRIES})`
      );
    } else {
      // Mark as failed after max retries
      await updateCertificateJobStatusService(jobId, {
        status: "failed",
        error: error.message || "Certificate generation failed",
      });
      console.log(`[Certificate Worker] Job ${jobId} failed after ${MAX_RETRIES} retries`);
    }
  }
}

/**
 * Start the certificate worker
 * This function polls for pending jobs and processes them
 */
export function startCertificateWorker(): void {
  console.log("[Certificate Worker] Starting certificate generation worker...");

  const processJobs = async () => {
    try {
      const job = await getNextPendingJobService();

      if (job) {
        await processCertificateJob(job);
      }
    } catch (error) {
      console.error("[Certificate Worker] Error in job processing loop:", error);
    }
  };

  // Process jobs immediately on start
  processJobs();

  // Then poll every POLL_INTERVAL milliseconds
  setInterval(processJobs, POLL_INTERVAL);

  console.log(
    `[Certificate Worker] Worker started. Polling every ${POLL_INTERVAL}ms for pending jobs.`
  );
}

/**
 * Stop the worker (for graceful shutdown)
 */
export function stopCertificateWorker(): void {
  console.log("[Certificate Worker] Stopping worker...");
  // In a production environment, you might want to track the interval ID
  // and clear it here. For now, this is a placeholder.
}

