import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { processOfferLetterForEnrollment } from "../services/cron.services";
import {
  getNextPendingOfferLetterJobService,
  reclaimStuckOfferLetterJobs,
  syncOfferLetterJobsForPendingEnrollments,
  updateOfferLetterJobStatusService,
} from "../services/offerLetterJob.services";

/**
 * How long a job may sit in `processing` before the reclaim sweep considers
 * it stuck. A real job is ~10–60s (LibreOffice + S3), so 10 min is a wide
 * margin. Env: OFFER_LETTER_WORKER_STUCK_TIMEOUT_MIN.
 */
const STUCK_TIMEOUT_MIN = Math.max(
  1,
  Number(process.env.OFFER_LETTER_WORKER_STUCK_TIMEOUT_MIN) || 10,
);

/**
 * After this many reclaim attempts the job is marked `failed` so the admin can
 * retry from the dashboard rather than the worker looping forever silently.
 * Env: OFFER_LETTER_WORKER_MAX_STUCK_RECLAIMS.
 */
const MAX_STUCK_RECLAIMS = Math.max(
  1,
  Number(process.env.OFFER_LETTER_WORKER_MAX_STUCK_RECLAIMS) || 2,
);

/** Poll interval (ms). Env: OFFER_LETTER_WORKER_POLL_MS (default 10 seconds). */
const POLL_INTERVAL_MS = Math.max(
  200,
  Number(process.env.OFFER_LETTER_WORKER_POLL_MS) || 10_000,
);

/** Max jobs claimed per tick. Env: OFFER_LETTER_WORKER_MAX_JOBS_PER_TICK (default 5). */
const MAX_JOBS_PER_TICK = Math.max(
  1,
  Number(process.env.OFFER_LETTER_WORKER_MAX_JOBS_PER_TICK) || 5,
);

/**
 * Max concurrent jobs. Env: OFFER_LETTER_WORKER_MAX_PARALLEL (default 3).
 * Each parallel job spawns its own LibreOffice instance (~100–200 MB RAM,
 * one CPU core for 5–15s) so this is the resource ceiling, not a correctness
 * one — per-invocation profile dirs prevent any soffice lock contention.
 */
const MAX_PARALLEL = Math.max(
  1,
  Math.min(
    MAX_JOBS_PER_TICK,
    Number.isFinite(Number(process.env.OFFER_LETTER_WORKER_MAX_PARALLEL))
      ? Number(process.env.OFFER_LETTER_WORKER_MAX_PARALLEL)
      : 3,
  ),
);

async function runPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
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

async function processOfferLetterJob(job: {
  jobId: string;
  internshipEnrollmentId: string;
  retryCount?: number;
}): Promise<void> {
  const { jobId, internshipEnrollmentId } = job;

  try {
    console.log(
      `[Offer Letter Worker] Processing job ${jobId} for enrollment ${internshipEnrollmentId}`,
    );

    await updateOfferLetterJobStatusService(jobId, { progress: 15 });

    const enrollment = await InternshipEnrollmentModel.findById(internshipEnrollmentId).lean();
    if (!enrollment) {
      throw new Error("Internship enrollment not found");
    }

    const st = String((enrollment as { status?: string }).status);
    const offerUrl = (enrollment as { offerLetterUrl?: string }).offerLetterUrl;
    if (st === "enrolled" && offerUrl) {
      await updateOfferLetterJobStatusService(jobId, {
        status: "completed",
        progress: 100,
        internId: (enrollment as { internId?: string }).internId,
        offerLetterUrl: offerUrl,
      });
      console.log(`[Offer Letter Worker] Job ${jobId} — enrollment already completed, synced job`);
      return;
    }

    if (st !== "offer_letter_pending") {
      throw new Error(
        `Enrollment must be "offer_letter_pending" to generate offer letter (got "${st}")`,
      );
    }

    await updateOfferLetterJobStatusService(jobId, { progress: 40 });

    const result = await processOfferLetterForEnrollment(internshipEnrollmentId);

    await updateOfferLetterJobStatusService(jobId, {
      status: "completed",
      progress: 100,
      internId: result.internId,
      offerLetterUrl: result.offerLetterUrl,
    });

    console.log(
      `[Offer Letter Worker] Job ${jobId} completed — ${result.internId} — ${result.offerLetterUrl}`,
    );
  } catch (error: unknown) {
    const err = error as { message?: string };
    const message = err.message || "Offer letter generation failed";
    console.error(`[Offer Letter Worker] Error processing job ${jobId}:`, error);

    // No silent auto-retry — pounding LibreOffice/S3 inside the same tick
    // rarely succeeds and hides the real failure. Mark the job failed; the
    // admin can retry it from the dashboard (POST /admin/offer-letter-jobs/
    // :jobId/retry) which resets status to `pending` for the next tick.
    // The stuck-job reclaim sweep handles the separate case of jobs that
    // crashed mid-run without reaching this handler.
    await updateOfferLetterJobStatusService(jobId, {
      status: "failed",
      error: message,
    });
    console.log(
      `[Offer Letter Worker] Job ${jobId} marked failed — awaiting admin retry.`,
    );
  }
}

export function startOfferLetterWorker(): void {
  console.log("[Offer Letter Worker] Starting offer letter worker...");

  let tickRunning = false;

  const processJobs = async () => {
    if (tickRunning) {
      return;
    }
    tickRunning = true;
    try {
      // Self-heal 1: rescue jobs wedged in `processing` for too long. The
      // unique partial index covers `processing`, so a stuck row blocks every
      // future enqueue for that enrollment — reclaim resets it to `pending`
      // (or fails it after enough attempts so admin can retry from the UI).
      // Runs before sync so a stuck reclaim doesn't race with a fresh enqueue.
      await reclaimStuckOfferLetterJobs(STUCK_TIMEOUT_MIN, MAX_STUCK_RECLAIMS);

      // Self-heal 2: ensure any offer_letter_pending enrollment that was
      // flipped without its inline enqueue (legacy rows, manual DB edits,
      // future codepaths that forget) has a queue row before we poll. The
      // sync is idempotent (upsert by enrollmentId + active-status).
      await syncOfferLetterJobsForPendingEnrollments();

      const jobs: Array<{
        jobId: string;
        internshipEnrollmentId: string;
        retryCount?: number;
      }> = [];
      for (let i = 0; i < MAX_JOBS_PER_TICK; i++) {
        const job = await getNextPendingOfferLetterJobService();
        if (!job) break;
        jobs.push({
          jobId: job.jobId,
          internshipEnrollmentId: job.internshipEnrollmentId,
          retryCount: job.retryCount,
        });
      }
      if (jobs.length > 0) {
        await runPool(jobs, MAX_PARALLEL, (j) => processOfferLetterJob(j));
        console.log(
          `[Offer Letter Worker] Finished ${jobs.length} job(s) this tick (parallelism ${MAX_PARALLEL}).`,
        );
      }
    } catch (error) {
      console.error("[Offer Letter Worker] Error in job processing loop:", error);
    } finally {
      tickRunning = false;
    }
  };

  const boot = async () => {
    // On boot: reclaim first (rescue rows the previous process left in
    // `processing` when it died), then sync, then start processing.
    await reclaimStuckOfferLetterJobs(STUCK_TIMEOUT_MIN, MAX_STUCK_RECLAIMS);
    await syncOfferLetterJobsForPendingEnrollments();
    void processJobs();
  };
  void boot();

  setInterval(() => {
    void processJobs();
  }, POLL_INTERVAL_MS);

  console.log(
    `[Offer Letter Worker] Poll every ${POLL_INTERVAL_MS}ms, batch ≤${MAX_JOBS_PER_TICK}, parallel ≤${MAX_PARALLEL}.`,
  );
}
