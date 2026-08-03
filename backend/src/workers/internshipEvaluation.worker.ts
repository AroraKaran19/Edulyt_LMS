import { sendOpsAlert } from "../services/opsAlert.services";
import {
  enqueueDueInternshipEvaluations,
  getNextPendingInternshipEvaluationJobService,
  reclaimStuckInternshipEvaluationJobs,
  updateInternshipEvaluationJobStatusService,
} from "../services/internshipEvaluationJob.services";
import { evaluateInternshipEnrollment } from "../services/internshipCertificateEvaluation.services";

/** How long a job may sit in `processing` before the reclaim sweep rescues it. */
const STUCK_TIMEOUT_MIN = Math.max(
  1,
  Number(process.env.INTERNSHIP_EVALUATION_STUCK_TIMEOUT_MIN) || 10,
);

/** After this many reclaims the job is failed so a human looks at it. */
const MAX_STUCK_RECLAIMS = Math.max(
  1,
  Number(process.env.INTERNSHIP_EVALUATION_MAX_STUCK_RECLAIMS) || 2,
);

// Poll interval (ms). Env: INTERNSHIP_EVALUATION_POLL_MS (default 3 min).
// Work only appears once a day (the cron enqueues at 01:00 IST), so there is
// nothing to gain from polling fast — an idle tick is two indexed no-op queries.
// 3 min drains even a large first sweep within minutes, and the downstream
// certificate worker polls every 5 min anyway, so faster buys no real latency.
const POLL_INTERVAL_MS = Math.max(
  1_000,
  Number(process.env.INTERNSHIP_EVALUATION_POLL_MS) || 180_000,
);

/** Max jobs drained per tick. Env: INTERNSHIP_EVALUATION_MAX_JOBS_PER_TICK. */
const MAX_JOBS_PER_TICK = Math.max(
  1,
  Number(process.env.INTERNSHIP_EVALUATION_MAX_JOBS_PER_TICK) || 25,
);

async function processJob(job: {
  jobId: string;
  internshipEnrollmentId: string;
}): Promise<void> {
  const { jobId, internshipEnrollmentId } = job;
  try {
    const result = await evaluateInternshipEnrollment(internshipEnrollmentId);
    await updateInternshipEvaluationJobStatusService(jobId, {
      status: "completed",
      verdict: result.verdict,
    });
  } catch (error: unknown) {
    const message =
      (error as { message?: string })?.message || "Evaluation failed";
    console.error(`[Internship Evaluation Worker] Job ${jobId} failed:`, error);
    // No silent auto-retry. A verdict is a decision about a real learner, so a
    // failure is worth a human look; the admin can re-enqueue once the cause is
    // fixed. The reclaim sweep separately handles jobs that died mid-run.
    await updateInternshipEvaluationJobStatusService(jobId, {
      status: "failed",
      error: message,
    });

    // A stalled verdict means a learner who finished their programme is told
    // nothing at all: no certificate, no closure email, no explanation. Nothing
    // else surfaces that, so it is worth an alert rather than a job row.
    await sendOpsAlert({
      key: "internship-evaluation-failed",
      title: "Internship certificate evaluation failed",
      body: [
        `job:   ${jobId}`,
        `error: ${message}`,
        "",
        "This learner has no verdict, so they have not been told how their",
        "internship closed. Re-enqueue the job once the cause is fixed.",
      ].join("\n"),
    });
  }
}

export function startInternshipEvaluationWorker(): void {
  if (process.env.INTERNSHIP_EVALUATION_ENABLED !== "true") {
    console.log(
      "[Internship Evaluation Worker] Disabled " +
        "(set INTERNSHIP_EVALUATION_ENABLED=true to enable). " +
        "Review the dry-run report first: npm run scripts:dry-run-cert-verdicts",
    );
    return;
  }

  console.log("[Internship Evaluation Worker] Starting...");

  let tickRunning = false;

  const tick = async () => {
    if (tickRunning) return;
    tickRunning = true;
    try {
      // Self-heal: rescue rows wedged in `processing`. The partial unique index
      // covers `processing`, so a stuck row blocks future enqueues otherwise.
      await reclaimStuckInternshipEvaluationJobs(
        STUCK_TIMEOUT_MIN,
        MAX_STUCK_RECLAIMS,
      );

      for (let i = 0; i < MAX_JOBS_PER_TICK; i++) {
        const job = await getNextPendingInternshipEvaluationJobService();
        if (!job) break;
        await processJob({
          jobId: job.jobId,
          internshipEnrollmentId: job.internshipEnrollmentId,
        });
      }
    } catch (error) {
      console.error("[Internship Evaluation Worker] Tick failed:", error);
      void sendOpsAlert({
        key: "internship-evaluation-worker-tick",
        title: "Internship evaluation worker tick failed",
        body: [
          "The evaluation loop threw. The loop continues, but verdicts may not be",
          "being decided, which stalls every closure email behind them.",
          "",
          `error: ${error instanceof Error ? error.stack || error.message : String(error)}`,
        ].join("\n"),
      });
    } finally {
      tickRunning = false;
    }
  };

  void (async () => {
    // On boot: rescue rows the previous process left in `processing`, then
    // enqueue anything already due (self-heals a missed cron tick).
    await reclaimStuckInternshipEvaluationJobs(
      STUCK_TIMEOUT_MIN,
      MAX_STUCK_RECLAIMS,
    );
    await enqueueDueInternshipEvaluations();
    void tick();
  })();

  setInterval(() => void tick(), POLL_INTERVAL_MS);

  console.log(
    `[Internship Evaluation Worker] Poll every ${POLL_INTERVAL_MS}ms, <=${MAX_JOBS_PER_TICK} jobs/tick.`,
  );
}
