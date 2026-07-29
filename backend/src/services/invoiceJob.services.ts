import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware";
import { InvoiceJobModel } from "../models/invoiceJob.schema";
import { InvoiceJob, InvoiceJobStatus } from "../types/invoiceJob";
import { v4 as uuidv4 } from "uuid";

/**
 * Read a numeric env var, falling back when unset or unparseable.
 * Written out rather than using `Number(x) || fallback` because a legitimate
 * configured 0 is falsy and would silently take the fallback.
 */
function envNumber(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * How long a job may sit in `processing` before the manual sweep treats it as
 * stuck. A healthy job takes seconds, so 10 minutes is a wide margin.
 * Env: INVOICE_WORKER_STUCK_TIMEOUT_MIN (default 10).
 *
 * Read by the API process, since the sweep runs from the admin endpoint rather
 * than the worker. Set it wherever the API runs, not only on the worker box.
 */
const STUCK_TIMEOUT_MIN = Math.max(
  1,
  envNumber(process.env.INVOICE_WORKER_STUCK_TIMEOUT_MIN, 10),
);

/**
 * After this many reclaims a job is marked `failed` instead of requeued, so it
 * surfaces for a deliberate retry rather than cycling.
 * Env: INVOICE_WORKER_MAX_STUCK_RECLAIMS (default 2). 0 means never requeue.
 */
const MAX_STUCK_RECLAIMS = Math.max(
  0,
  envNumber(process.env.INVOICE_WORKER_MAX_STUCK_RECLAIMS, 2),
);

/**
 * Queue an invoice for a paid order.
 *
 * Atomic upsert plus the partial unique index on `orderId` means the three
 * concurrent callers of `applyPaymentResult` (status poll, webhook, reconcile
 * cron) collapse onto one job.
 */
export const createInvoiceJobService = async (
  orderId: string,
): Promise<InvoiceJob> => {
  try {
    const job = await InvoiceJobModel.findOneAndUpdate(
      { orderId, status: { $in: ["pending", "processing"] } },
      {
        $setOnInsert: {
          jobId: uuidv4(),
          orderId,
          status: "pending" as InvoiceJobStatus,
          progress: 0,
          retryCount: 0,
        },
      },
      { upsert: true, new: true },
    ).lean();

    return job as InvoiceJob;
  } catch (error: any) {
    // E11000: another caller inserted between our query and write.
    if (error.code === 11000) {
      const existing = await InvoiceJobModel.findOne({
        orderId,
        status: { $in: ["pending", "processing"] },
      }).lean();
      if (existing) return existing as InvoiceJob;
    }
    console.error("Error creating invoice job:", error);
    throw new AppError("Failed to create invoice job", 500);
  }
};

/**
 * Queue an invoice without ever throwing.
 *
 * Called from the payment-success path, where the money has already moved. A
 * queueing failure must not propagate and make a settled order look unpaid;
 * the reconcile cron re-enters `applyPaymentResult` and will try again.
 */
export const enqueueInvoiceJobSafe = async (orderId: string): Promise<void> => {
  try {
    await createInvoiceJobService(orderId);
  } catch (error) {
    console.error(`[Invoice] Failed to enqueue invoice for order ${orderId}:`, error);
  }
};

/** Claim the oldest pending job, flipping it to processing in one atomic step. */
export const getNextPendingInvoiceJobService =
  async (): Promise<InvoiceJob | null> => {
    try {
      const job = await InvoiceJobModel.findOneAndUpdate(
        { status: "pending" },
        { $set: { status: "processing", startedAt: new Date() } },
        { sort: { createdAt: 1 }, new: true },
      ).lean();
      return job as InvoiceJob | null;
    } catch (error) {
      console.error("Error claiming next invoice job:", error);
      return null;
    }
  };

export const updateInvoiceJobStatusService = async (
  jobId: string,
  updates: {
    status?: InvoiceJobStatus;
    progress?: number;
    invoiceNumber?: string;
    invoiceUrl?: string;
    error?: string;
    startedAt?: Date;
  },
): Promise<InvoiceJob | null> => {
  try {
    const updateData: Record<string, unknown> = { ...updates };
    if (updates.status === "processing" && !updates.startedAt) {
      updateData.startedAt = new Date();
    }
    if (updates.status === "completed" || updates.status === "failed") {
      updateData.completedAt = new Date();
    }

    const job = await InvoiceJobModel.findOneAndUpdate(
      { jobId },
      { $set: updateData },
      { new: true },
    ).lean();

    return job as InvoiceJob | null;
  } catch (error) {
    console.error("Error updating invoice job:", error);
    return null;
  }
};

export const incrementInvoiceJobRetryService = async (
  jobId: string,
): Promise<void> => {
  try {
    await InvoiceJobModel.findOneAndUpdate({ jobId }, { $inc: { retryCount: 1 } });
  } catch (error) {
    console.error("Error incrementing invoice job retry:", error);
  }
};

/**
 * Manually sweep invoice jobs wedged in `processing`.
 */
export const reclaimStuckInvoiceJobsService = async (): Promise<{
  reclaimed: number;
  failed: number;
  reclaimedJobIds: string[];
  failedJobIds: string[];
  /** Echoed back so the admin can see what the server was configured with. */
  timeoutMinutes: number;
  maxReclaims: number;
}> => {
  const minutes = Math.floor(STUCK_TIMEOUT_MIN);
  const limit = Math.floor(MAX_STUCK_RECLAIMS);
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);

  // `startedAt` is written atomically by the claim, so a live job always has
  // one. The `updatedAt` arm only catches legacy or hand-edited rows sitting in
  // `processing` without it, which would otherwise never be reclaimable.
  const stuck = await InvoiceJobModel.find({
    status: "processing",
    $or: [
      { startedAt: { $lt: cutoff } },
      { startedAt: null, updatedAt: { $lt: cutoff } },
    ],
  })
    .select("jobId retryCount")
    .lean();

  if (stuck.length === 0) {
    return {
      reclaimed: 0,
      failed: 0,
      reclaimedJobIds: [],
      failedJobIds: [],
      timeoutMinutes: minutes,
      maxReclaims: limit,
    };
  }

  const reclaimedJobIds: string[] = [];
  const failedJobIds: string[] = [];

  for (const job of stuck) {
    const next = (job.retryCount ?? 0) + 1;

    // The `status: "processing"` filter means a job the worker finalises
    // between our read and this write is left alone.
    if (next > limit) {
      await InvoiceJobModel.updateOne(
        { jobId: job.jobId, status: "processing" },
        {
          $set: {
            status: "failed",
            completedAt: new Date(),
            error: `Stuck in processing > ${minutes} min across ${next} reclaim(s); marked failed for admin retry.`,
          },
        },
      );
      failedJobIds.push(job.jobId);
    } else {
      await InvoiceJobModel.updateOne(
        { jobId: job.jobId, status: "processing" },
        {
          $set: {
            status: "pending",
            progress: 0,
            retryCount: next,
            error: `Reclaimed manually: stuck in processing > ${minutes} min (reclaim ${next}/${limit})`,
          },
          $unset: { startedAt: "" },
        },
      );
      reclaimedJobIds.push(job.jobId);
    }
  }

  console.log(
    `[Invoice Job] Manual reclaim sweep: reset=${reclaimedJobIds.length}, marked-failed=${failedJobIds.length} (timeout=${minutes}m, maxReclaims=${limit})`,
  );

  return {
    reclaimed: reclaimedJobIds.length,
    failed: failedJobIds.length,
    reclaimedJobIds,
    failedJobIds,
    timeoutMinutes: minutes,
    maxReclaims: limit,
  };
};

/**
 * Paginated invoice jobs for the admin dashboard, enriched from the order.
 *
 * The order already snapshots `userName` / `courseName` / `internshipTitle` at
 * checkout, so one lookup covers every display column without touching the user
 * or course collections.
 */
export const getAllInvoiceJobsService = async (
  options: {
    page?: number;
    limit?: number;
    status?: InvoiceJobStatus;
    search?: string;
  } = {},
): Promise<{
  jobs: Array<InvoiceJob & { userName?: string; itemName?: string; amount?: number }>;
  total: number;
  page: number;
  limit: number;
}> => {
  try {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const skip = (page - 1) * limit;
    const searchTrimmed = options.search?.trim();

    const filter: Record<string, unknown> = {};
    if (options.status) filter.status = options.status;

    // `orderId` is stored as a string; orders key on ObjectId.
    const oidConvert = {
      $convert: { input: "$orderId", to: "objectId", onError: null, onNull: null },
    };

    const pipeline: mongoose.PipelineStage[] = [
      { $match: filter },
      {
        $lookup: {
          from: "orders",
          let: { oid: oidConvert },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $ne: ["$$oid", null] }, { $eq: ["$_id", "$$oid"] }],
                },
              },
            },
            {
              $project: {
                userName: 1,
                courseName: 1,
                internshipTitle: 1,
                orderKind: 1,
                amount: 1,
                paymentMethod: 1,
              },
            },
            { $limit: 1 },
          ],
          as: "order",
        },
      },
      { $unwind: { path: "$order", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          userName: { $ifNull: ["$order.userName", ""] },
          itemName: {
            $ifNull: [
              "$order.courseName",
              { $ifNull: ["$order.internshipTitle", ""] },
            ],
          },
          amount: "$order.amount",
          orderKind: "$order.orderKind",
          paymentMethod: "$order.paymentMethod",
        },
      },
    ];

    if (searchTrimmed) {
      const searchRegex = new RegExp(
        searchTrimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      pipeline.push({
        $match: {
          $or: [
            { jobId: searchRegex },
            { orderId: searchRegex },
            { invoiceNumber: searchRegex },
            { userName: searchRegex },
            { itemName: searchRegex },
          ],
        },
      });
    }

    const [countResult, jobs] = await Promise.all([
      InvoiceJobModel.aggregate([...pipeline, { $count: "total" }]),
      InvoiceJobModel.aggregate([
        ...pipeline,
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $project: { order: 0 } },
      ]),
    ]);

    return {
      jobs: jobs as Array<InvoiceJob & { userName?: string; itemName?: string }>,
      total: countResult[0]?.total ?? 0,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error getting all invoice jobs:", error);
    throw new AppError("Failed to get invoice jobs", 500);
  }
};

/** Reset a failed job to pending so the worker picks it up again (admin). */
export const retryInvoiceJobService = async (
  jobId: string,
): Promise<InvoiceJob> => {
  const job = await InvoiceJobModel.findOne({ jobId }).lean();
  if (!job) throw new AppError("Invoice job not found", 404);
  if (job.status !== "failed") {
    throw new AppError(
      `Only failed jobs can be retried. Current status: ${job.status}`,
      400,
    );
  }

  const updated = await InvoiceJobModel.findOneAndUpdate(
    { jobId },
    {
      // invoiceNumber is deliberately kept: the order already holds it, and
      // reusing it stops a retry from consuming a fresh number.
      $set: { status: "pending", progress: 0 },
      $unset: { error: "", startedAt: "", completedAt: "", invoiceUrl: "" },
    },
    { new: true },
  ).lean();

  return updated as InvoiceJob;
};
