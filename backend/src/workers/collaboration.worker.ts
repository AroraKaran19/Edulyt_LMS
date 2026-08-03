import { sendOpsAlert } from "../services/opsAlert.services";
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware";
import {
  CollaborationDomainModel,
  PartnershipImportConfigModel,
  UserModel,
} from "../models";
import { CollegeModel } from "../models/college.schema";
import { CollaborationEnrollmentAccess } from "../types/collaborationDomain";
import { collaborationAccessToEnrollmentFields } from "../services/collaborationAllotment.helpers";
import { CreateEnrollmentService } from "../services/enrollment.services";
import {
  getNextPendingCollaborationJobService,
  incrementCollaborationJobRetryService,
  updateCollaborationJobStatusService,
} from "../services/collaborationJob.services";
import {
  processCollaborationWhitelistBatchService,
  syncCollaborationWhitelistWithJobStatus,
} from "../services/collaborationWhitelist.services";

const MAX_RETRIES = 3;

const POLL_INTERVAL_MS = Math.max(
  200,
  Number(process.env.COLLABORATION_WORKER_POLL_MS) || 10_000
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
  collaborationDomainId?: unknown;
  partnershipImportConfigId?: unknown;
  retryCount?: number;
}): Promise<void> {
  const { jobId } = job;
  const userId = String(job.userId);

  try {
    let courseList: unknown[] = [];
    let accessPayload: ReturnType<typeof collaborationAccessToEnrollmentFields>;
    let promotionCode: string;
    // When the source (partnership-import config or collaboration domain) is
    // bound to a college, every enrolled student is stamped with that college
    // below.
    let boundCollegeId: mongoose.Types.ObjectId | undefined;

    if (job.partnershipImportConfigId) {
      const configId = String(job.partnershipImportConfigId);
      const cfg = await PartnershipImportConfigModel.findById(configId).lean();

      if (!cfg || !cfg.isActive) {
        throw new Error("Partnership import config not found or inactive");
      }
      if (cfg.kind !== "course_allot") {
        throw new Error("Partnership import config is not course allot");
      }

      const ea = cfg.enrollmentAccess as CollaborationEnrollmentAccess | undefined;
      if (!ea) {
        throw new Error("Partnership import config missing enrollment access");
      }

      accessPayload = collaborationAccessToEnrollmentFields(ea);
      courseList = cfg.courses ?? [];

      if (cfg.college && mongoose.Types.ObjectId.isValid(String(cfg.college))) {
        boundCollegeId = new mongoose.Types.ObjectId(
          String(cfg.college)
        );
      }

      if (!Array.isArray(courseList) || courseList.length === 0) {
        throw new Error("Partnership import config has no linked courses");
      }

      promotionCode = `partnership_import:${configId}`;
    } else {
      const collaborationDomainId = String(job.collaborationDomainId ?? "");
      if (!collaborationDomainId) {
        throw new Error("Job missing collaboration domain or import config");
      }

      const domain = await CollaborationDomainModel.findById(
        collaborationDomainId
      ).lean();

      if (!domain || !domain.isActive) {
        throw new Error("Collaboration domain not found or inactive");
      }

      if (domain.collaborationKind !== "course_allot") {
        throw new Error("Collaboration domain is not course allot");
      }

      const ea = domain.enrollmentAccess as
        | CollaborationEnrollmentAccess
        | undefined;
      if (!ea) {
        throw new Error("Collaboration domain missing enrollment access");
      }

      accessPayload = collaborationAccessToEnrollmentFields(ea);
      courseList = domain.courses ?? [];

      if (!Array.isArray(courseList) || courseList.length === 0) {
        throw new Error("Course allot domain has no linked courses");
      }

      // Collaboration domains can be bound to a college the same way
      // partnership-import configs are — stamp it on the student below.
      if (
        domain.college &&
        mongoose.Types.ObjectId.isValid(String(domain.college))
      ) {
        boundCollegeId = new mongoose.Types.ObjectId(
          String(domain.college)
        );
      }

      promotionCode = `collaboration:${collaborationDomainId}`;
    }

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

    await UserModel.updateOne(
      {
        _id: new mongoose.Types.ObjectId(userId),
        joinSource: { $ne: "affiliate" },
      },
      { $set: { joinSource: "promotion" } }
    );

    // The bound college (from partnership-import or collaboration-domain) is
    // stamped onto the student (ref + name snapshot), overwriting any
    // college they set themselves — the binding is authoritative about
    // which college they're from.
    if (boundCollegeId) {
      const college = await CollegeModel.findById(boundCollegeId)
        .select("name")
        .lean();
      if (college) {
        await UserModel.updateOne(
          {
            _id: new mongoose.Types.ObjectId(userId),
            userType: "student",
          },
          {
            $set: {
              college: college._id,
              collegeName: String(college.name ?? "").trim(),
            },
          }
        );
      }
    }

    await updateCollaborationJobStatusService(jobId, { status: "completed" });
    await syncCollaborationWhitelistWithJobStatus(jobId, "completed");
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
      await syncCollaborationWhitelistWithJobStatus(jobId, "failed", message);

      // Out of retries. A partner-college learner is on a whitelist expecting
      // access that will now never be granted, and only the job row records it.
      await sendOpsAlert({
        key: "collaboration-allotment-failed",
        title: "Collaboration allotment failed",
        body: [
          `job:     ${jobId}`,
          `retries: ${currentRetry}/${MAX_RETRIES}`,
          `error:   ${message}`,
          "",
          "The whitelist entry has been marked failed. Re-queue the job once the",
          "cause is fixed so the learner receives their access.",
        ].join("\n"),
      });
    }
  }
}

export function startCollaborationWorker(): void {
  // Default: run only in production. On local / dev machines we don't want
  // the queue picking up real jobs from a shared database. Set
  // COLLABORATION_WORKER_ENABLED=true to force it on, or =false to disable
  // it in production. Applies to every entry point that calls this fn
  // (server.ts, worker.ts, collaboration-worker.ts).
  const override = process.env.COLLABORATION_WORKER_ENABLED;
  const isProd = process.env.NODE_ENV === "production";
  const enabled = override === "true" || (override == null && isProd);
  if (!enabled) {
    console.log(
      `[Collaboration Worker] Disabled (NODE_ENV=${process.env.NODE_ENV ?? "<unset>"}, COLLABORATION_WORKER_ENABLED=${override ?? "<unset>"}). Set COLLABORATION_WORKER_ENABLED=true to force on.`
    );
    return;
  }

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
        collaborationDomainId?: unknown;
        partnershipImportConfigId?: unknown;
        retryCount?: number;
      }> = [];
      for (let i = 0; i < MAX_JOBS_PER_TICK; i++) {
        const job = await getNextPendingCollaborationJobService();
        if (!job) break;
        jobs.push(job as (typeof jobs)[0]);
      }
      if (jobs.length > 0) {
        await runPool(jobs, MAX_PARALLEL, (j) =>
          processCollaborationAllotmentJob(j)
        );
        console.log(
          `[Collaboration Worker] Finished ${jobs.length} job(s) this tick (parallelism ${MAX_PARALLEL}, max batch ${MAX_JOBS_PER_TICK}).`
        );
      }

      const wl = await processCollaborationWhitelistBatchService();
      if (wl.processed > 0) {
        console.log(
          `[Collaboration Worker] Whitelist batch: processed ${wl.processed}, queued ${wl.queued}, skipped ${wl.skipped}`
        );
      }
    } catch (e) {
      console.error("[Collaboration Worker] Tick error:", e);
      void sendOpsAlert({
        key: "collaboration-worker-tick",
        title: "Collaboration worker tick failed",
        body: [
          "The collaboration loop threw. The loop continues, but allotments may",
          "not be draining.",
          "",
          `error: ${e instanceof Error ? e.stack || e.message : String(e)}`,
        ].join("\n"),
      });
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
