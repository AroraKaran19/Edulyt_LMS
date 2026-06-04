import { CertificateJobModel } from "../models/certificateJob.schema";
import {
  getNextPendingJobService,
  updateCertificateJobStatusService,
  incrementJobRetryService,
} from "../services/certificateJob.services";
import {
  createCertificateService,
  createInternshipCertificateService,
} from "../services/certificate.services";
import { EnrollmentModel } from "../models/enrollment.schema";
import { UserModel } from "../models/user.schema";
import { CourseModel } from "../models/course.schema";
import { CertificateGenerationData } from "../types/certificate";

const MAX_RETRIES = 3;

/** How often the worker wakes to drain the queue (ms). Env: CERTIFICATE_WORKER_POLL_MS (default 5 minutes). */
const POLL_INTERVAL_MS = Math.max(
  200,
  Number(process.env.CERTIFICATE_WORKER_POLL_MS) || 300_000
);

/** Max jobs claimed per poll tick. Env: CERTIFICATE_WORKER_MAX_JOBS_PER_TICK (default 5). */
const MAX_JOBS_PER_TICK = Math.max(
  1,
  Number(process.env.CERTIFICATE_WORKER_MAX_JOBS_PER_TICK) || 5
);

/** Max jobs running at once (pool). Defaults to MAX_JOBS_PER_TICK (all claimed jobs in parallel). Env: CERTIFICATE_WORKER_MAX_PARALLEL */
const MAX_PARALLEL = Math.max(
  1,
  Math.min(
    MAX_JOBS_PER_TICK,
    Number.isFinite(Number(process.env.CERTIFICATE_WORKER_MAX_PARALLEL))
      ? Number(process.env.CERTIFICATE_WORKER_MAX_PARALLEL)
      : MAX_JOBS_PER_TICK
  )
);

/** Run tasks with at most `concurrency` in flight (sliding pool). */
async function runPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  if (items.length === 0) return;
  const c = Math.min(Math.max(1, concurrency), items.length);
  let next = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: c }, () => worker()));
}

/**
 * Process an internship certificate generation job
 */
async function processInternshipCertificateJob(job: any): Promise<void> {
  const { jobId, enrollmentId } = job;
  try {
    console.log(`[Certificate Worker] Processing internship job ${jobId} for enrollment ${enrollmentId}`);

    await updateCertificateJobStatusService(jobId, { progress: 20 });
    const result = await createInternshipCertificateService(enrollmentId);
    await updateCertificateJobStatusService(jobId, {
      status: "completed",
      progress: 100,
      certificateId: result.certificateId,
      certificateUrl: result.fileUrl,
    });

    console.log(`[Certificate Worker] Internship job ${jobId} completed. Certificate: ${result.certificateId}`);
  } catch (error: any) {
    console.error(`[Certificate Worker] Error processing internship job ${jobId}:`, error);
    const currentRetryCount = job.retryCount || 0;
    if (currentRetryCount < MAX_RETRIES) {
      await incrementJobRetryService(jobId);
      await updateCertificateJobStatusService(jobId, {
        status: "pending",
        error: `Retry ${currentRetryCount + 1}/${MAX_RETRIES}: ${error.message}`,
      });
    } else {
      await updateCertificateJobStatusService(jobId, {
        status: "failed",
        error: error.message || "Internship certificate generation failed",
      });
    }
  }
}

/**
 * Process a single certificate generation job
 */
async function processCertificateJob(job: any): Promise<void> {
  if (job.certificateType === "internship") {
    return processInternshipCertificateJob(job);
  }

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
  // Never run in development: certificate generation builds QR/verification URLs
  // from FRONTEND_URL and uploads real PDFs to S3 — a dev FRONTEND_URL would
  // bake wrong links into live certificates. Force on with
  // CERTIFICATE_WORKER_ENABLED=true only if you explicitly need it locally.
  if (
    process.env.NODE_ENV === "development" &&
    process.env.CERTIFICATE_WORKER_ENABLED !== "true"
  ) {
    console.log(
      "[Certificate Worker] Disabled in development (set CERTIFICATE_WORKER_ENABLED=true to force on).",
    );
    return;
  }
  console.log("[Certificate Worker] Starting certificate generation worker...");

  let tickRunning = false;

  const processJobs = async () => {
    if (tickRunning) {
      return;
    }
    tickRunning = true;
    try {
      const jobs: any[] = [];
      for (let i = 0; i < MAX_JOBS_PER_TICK; i++) {
        const job = await getNextPendingJobService();
        if (!job) break;
        jobs.push(job);
      }
      if (jobs.length > 0) {
        await runPool(jobs, MAX_PARALLEL, (job) => processCertificateJob(job));
        console.log(
          `[Certificate Worker] Finished ${jobs.length} job(s) this tick (parallelism ${MAX_PARALLEL}, max batch ${MAX_JOBS_PER_TICK}).`
        );
      }
    } catch (error) {
      console.error("[Certificate Worker] Error in job processing loop:", error);
    } finally {
      tickRunning = false;
    }
  };

  // Process jobs immediately on start
  void processJobs();

  // Poll on an interval; each tick claims up to MAX_JOBS_PER_TICK jobs, then runs them with bounded parallelism
  setInterval(() => {
    void processJobs();
  }, POLL_INTERVAL_MS);

  console.log(
    `[Certificate Worker] Worker started. Poll every ${POLL_INTERVAL_MS}ms, batch ≤${MAX_JOBS_PER_TICK}, parallel ≤${MAX_PARALLEL}.`
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

