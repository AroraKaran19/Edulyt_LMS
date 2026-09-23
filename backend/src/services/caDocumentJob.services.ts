import mongoose from "mongoose";
import { CaDocumentJobModel } from "../models";
import type { CaDocumentJob, CaDocumentKind } from "../models/caDocumentJob.schema";
import { sendOpsAlert } from "./opsAlert.services";

export const CA_DOCUMENT_JOB_MAX_RETRIES = 3;
const STUCK_AFTER_MS = 15 * 60 * 1000;

/** Backoff before each of the three allowed retries: 1, then 5, then 30 minutes. */
const RETRY_BACKOFF_MS = [1, 5, 30].map((minutes) => minutes * 60 * 1000);

const REARM = {
  status: "pending",
  retryCount: 0,
  error: null,
  note: null,
  startedAt: null,
  completedAt: null,
  nextAttemptAt: null,
} as const;

export const enqueueCaDocumentJob = async (
  applicationId: mongoose.Types.ObjectId,
  kind: CaDocumentKind,
): Promise<boolean> => {
  // Re-arming is safe: both processors skip work already done and email once through claim markers.
  const rearmed = await CaDocumentJobModel.updateOne(
    { applicationId, kind, status: { $in: ["completed", "failed"] } },
    { $set: REARM },
  );
  if (rearmed.modifiedCount > 0) return true;
  try {
    const res = await CaDocumentJobModel.updateOne(
      { applicationId, kind },
      { $setOnInsert: { status: "pending", retryCount: 0, nextAttemptAt: null } },
      { upsert: true },
    );
    return res.upsertedCount > 0;
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return false;
    throw error;
  }
};

/** Skips jobs still backing off from a previous failure: `nextAttemptAt` null or in the past. */
export const claimNextCaDocumentJob = async (): Promise<CaDocumentJob | null> =>
  (await CaDocumentJobModel.findOneAndUpdate(
    {
      status: "pending",
      $or: [{ nextAttemptAt: null }, { nextAttemptAt: { $lte: new Date() } }],
    },
    { $set: { status: "processing", startedAt: new Date() } },
    { sort: { nextAttemptAt: 1 }, new: true },
  ).lean()) as CaDocumentJob | null;

export const completeCaDocumentJob = async (
  id: mongoose.Types.ObjectId,
  note?: string,
): Promise<void> => {
  await CaDocumentJobModel.updateOne(
    { _id: id, status: "processing" },
    { $set: { status: "completed", completedAt: new Date(), error: null, note: note ?? null } },
  );
};

export const failCaDocumentJob = async (
  job: CaDocumentJob,
  error: unknown,
): Promise<"retry" | "failed"> => {
  const message = error instanceof Error ? error.message : String(error);
  if (job.retryCount < CA_DOCUMENT_JOB_MAX_RETRIES) {
    const delay = RETRY_BACKOFF_MS[job.retryCount] ?? RETRY_BACKOFF_MS[RETRY_BACKOFF_MS.length - 1];
    await CaDocumentJobModel.updateOne(
      { _id: job._id, status: "processing" },
      {
        $set: { status: "pending", error: message, nextAttemptAt: new Date(Date.now() + delay) },
        $inc: { retryCount: 1 },
      },
    );
    return "retry";
  }

  await CaDocumentJobModel.updateOne(
    { _id: job._id, status: "processing" },
    { $set: { status: "failed", error: message, completedAt: new Date() } },
  );
  void sendOpsAlert({
    key: `ca-document-failed:${job.kind}`,
    title: `CA ${job.kind} documents failed`,
    body: [
      `application: ${String(job.applicationId)}`,
      `retries:     ${job.retryCount}/${CA_DOCUMENT_JOB_MAX_RETRIES}`,
      `error:       ${message}`,
      "",
      "Set the CaDocumentJob back to pending once the cause is fixed.",
    ].join("\n"),
  });
  return "failed";
};

/** LibreOffice can hang; a job stuck in processing goes back to the queue. */
export const reclaimStuckCaDocumentJobs = async (
  olderThanMs = STUCK_AFTER_MS,
): Promise<number> => {
  const cutoff = new Date(Date.now() - olderThanMs);

  const reclaimedRes = await CaDocumentJobModel.updateMany(
    { status: "processing", startedAt: { $lt: cutoff }, retryCount: { $lt: CA_DOCUMENT_JOB_MAX_RETRIES } },
    { $set: { status: "pending" }, $inc: { retryCount: 1 } },
  );

  const failedRes = await CaDocumentJobModel.updateMany(
    { status: "processing", startedAt: { $lt: cutoff }, retryCount: { $gte: CA_DOCUMENT_JOB_MAX_RETRIES } },
    { $set: { status: "failed", error: "Stuck in processing", completedAt: new Date() } },
  );

  if (failedRes.modifiedCount > 0) {
    void sendOpsAlert({
      key: "ca-document-stuck",
      title: "CA document jobs stuck",
      body: `${failedRes.modifiedCount} CA document jobs stuck in processing at retry cap.`,
    });
  }

  return reclaimedRes.modifiedCount;
};

/** Gives every failed job of one application a fresh retry budget. Returns how many were re-armed. */
export const rearmFailedCaDocumentJobs = async (
  applicationId: mongoose.Types.ObjectId,
): Promise<number> => {
  const res = await CaDocumentJobModel.updateMany({ applicationId, status: "failed" }, { $set: REARM });
  return res.modifiedCount;
};

/** Admin retry: runs one job on the next worker pass with a fresh budget, skipping any backoff. Refuses a job that is running right now. */
export const retryCaDocumentJobNow = async (jobId: mongoose.Types.ObjectId | string): Promise<boolean> => {
  const res = await CaDocumentJobModel.updateOne(
    { _id: jobId, status: { $ne: "processing" } },
    { $set: REARM },
  );
  return res.matchedCount > 0;
};
