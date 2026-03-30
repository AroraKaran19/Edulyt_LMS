import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware";
import { CollaborationDomainModel, UserModel } from "../models";
import { CollaborationEnrollmentAccess } from "../types/collaborationDomain";
import { collaborationAccessToEnrollmentFields } from "../services/collaborationAllotment.helpers";
import { CreateEnrollmentService } from "../services/enrollment.services";
import {
  getNextPendingCollaborationJobService,
  incrementCollaborationJobRetryService,
  updateCollaborationJobStatusService,
} from "../services/collaborationJob.services";

const MAX_RETRIES = 3;

const POLL_INTERVAL_MS = Math.max(
  200,
  Number(process.env.COLLABORATION_WORKER_POLL_MS) || 120_000
);

const MAX_JOBS_PER_TICK = Math.max(
  1,
  Number(process.env.COLLABORATION_WORKER_MAX_JOBS_PER_TICK) || 10
);

const MAX_PARALLEL = Math.max(
  1,
  Math.min(
    MAX_JOBS_PER_TICK,
    Number.isFinite(Number(process.env.COLLABORATION_WORKER_MAX_PARALLEL))
      ? Number(process.env.COLLABORATION_WORKER_MAX_PARALLEL)
      : MAX_JOBS_PER_TICK
  )
);

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

async function processCollaborationAllotmentJob(job: {
  jobId: string;
  userId: unknown;
  collaborationDomainId: unknown;
  retryCount?: number;
}): Promise<void> {
  const { jobId } = job;
  const userId = String(job.userId);
  const collaborationDomainId = String(job.collaborationDomainId);

  try {
    const domain = await CollaborationDomainModel.findById(
      collaborationDomainId
    ).lean();

    if (!domain || !domain.isActive) {
      throw new Error("Collaboration domain not found or inactive");
    }

    if (domain.collaborationKind !== "course_allot") {
      throw new Error("Collaboration domain is not course allot");
    }

    const ea = domain.enrollmentAccess as CollaborationEnrollmentAccess | undefined;
    if (!ea) {
      throw new Error("Collaboration domain missing enrollment access");
    }

    const accessPayload = collaborationAccessToEnrollmentFields(ea);
    const courseList = domain.courses ?? [];

    if (!Array.isArray(courseList) || courseList.length === 0) {
      throw new Error("Course allot domain has no linked courses");
    }

    const promotionCode = `collaboration:${collaborationDomainId}`;

    for (const cid of courseList) {
      const courseId = String(cid);
      try {
        await CreateEnrollmentService({
          userId,
          courseId,
          enrollmentSource: "promotion",
          promotionCode,
          ...accessPayload,
        });
      } catch (err: unknown) {
        if (
          err instanceof AppError &&
          err.message.includes("already enrolled")
        ) {
          continue;
        }
        throw err;
      }
    }

    // Align with enrollmentSource: "promotion"; do not override affiliate joins.
    await UserModel.updateOne(
      {
        _id: new mongoose.Types.ObjectId(userId),
        joinSource: { $ne: "affiliate" },
      },
      { $set: { joinSource: "promotion" } }
    );

    await updateCollaborationJobStatusService(jobId, { status: "completed" });
    console.log(
      `[Collaboration Worker] Job ${jobId} completed for user ${userId}`
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Collaboration allotment failed";
    console.error(`[Collaboration Worker] Job ${jobId} error:`, error);

    const currentRetry = job.retryCount ?? 0;
    if (currentRetry < MAX_RETRIES) {
      await incrementCollaborationJobRetryService(jobId);
      await updateCollaborationJobStatusService(jobId, {
        status: "pending",
        error: `Retry ${currentRetry + 1}/${MAX_RETRIES}: ${message}`,
      });
    } else {
      await updateCollaborationJobStatusService(jobId, {
        status: "failed",
        error: message,
      });
    }
  }
}

export function startCollaborationWorker(): void {
  console.log(
    "[Collaboration Worker] Starting collaboration allotment worker..."
  );

  let tickRunning = false;

  const processJobs = async () => {
    if (tickRunning) return;
    tickRunning = true;
    try {
      const jobs: Array<{
        jobId: string;
        userId: unknown;
        collaborationDomainId: unknown;
        retryCount?: number;
      }> = [];
      for (let i = 0; i < MAX_JOBS_PER_TICK; i++) {
        const job = await getNextPendingCollaborationJobService();
        if (!job) break;
        jobs.push(job);
      }
      if (jobs.length > 0) {
        await runPool(jobs, MAX_PARALLEL, (j) =>
          processCollaborationAllotmentJob(j)
        );
        console.log(
          `[Collaboration Worker] Finished ${jobs.length} job(s) this tick (parallelism ${MAX_PARALLEL}, max batch ${MAX_JOBS_PER_TICK}).`
        );
      }
    } catch (e) {
      console.error("[Collaboration Worker] Tick error:", e);
    } finally {
      tickRunning = false;
    }
  };

  void processJobs();
  setInterval(() => {
    void processJobs();
  }, POLL_INTERVAL_MS);

  console.log(
    `[Collaboration Worker] Worker started. Poll every ${POLL_INTERVAL_MS}ms, batch ≤${MAX_JOBS_PER_TICK}, parallel ≤${MAX_PARALLEL}.`
  );
}
