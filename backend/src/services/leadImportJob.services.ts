import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware";
import {
  LeadImportJobModel,
  LeadImportPayloadModel,
  type LeadImportIssue,
  type LeadImportJob,
} from "../models/leadImportJob.schema";
import {
  buildImportContext,
  importLeads,
  type ImportActor,
  type ImportRow,
} from "./leadImport.services";

const CHUNK_SIZE = 500;
const LEASE_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;
const MAX_JOBS_PER_TICK = 5;

export const createLeadImportJob = async (
  rows: ImportRow[],
  fileName: string,
  createdBy: ImportActor,
): Promise<{ jobId: string }> => {
  const jobId = new mongoose.Types.ObjectId();
  // Payload first: the worker must never claim a job whose rows are not written yet.
  await LeadImportPayloadModel.create({ jobId, rows });
  try {
    await LeadImportJobModel.create({ _id: jobId, fileName, createdBy, totalRows: rows.length });
  } catch (error) {
    await LeadImportPayloadModel.deleteOne({ jobId });
    throw error;
  }
  return { jobId: String(jobId) };
};

const LIST_PROJECTION = { issues: 0 } as const;

export const listLeadImportJobs = async (page: number, limit: number) => {
  const [items, total] = await Promise.all([
    LeadImportJobModel.find({}, LIST_PROJECTION)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    LeadImportJobModel.estimatedDocumentCount(),
  ]);
  return { items, total, page, limit };
};

export const getLeadImportJob = async (id: string) => {
  if (!mongoose.isValidObjectId(id)) throw new AppError("Import not found", 404);
  const job = await LeadImportJobModel.findById(id).lean();
  if (!job) throw new AppError("Import not found", 404);
  return job;
};

const finishJob = async (
  jobId: mongoose.Types.ObjectId,
  status: "done" | "failed",
  failureMessage = "",
): Promise<void> => {
  await LeadImportJobModel.updateOne(
    { _id: jobId },
    { $set: { status, finishedAt: new Date(), lockedUntil: null, failureMessage } },
  );
  await LeadImportPayloadModel.deleteOne({ jobId });
};

/** Claims the next job in upload order, or resumes one whose worker died mid-run. */
const claimNextJob = async (): Promise<LeadImportJob | null> => {
  const now = new Date();
  // One at a time: a live lease on any job holds back everything queued after it.
  const busy = await LeadImportJobModel.exists({ status: "running", lockedUntil: { $gt: now } });
  if (busy) return null;

  return LeadImportJobModel.findOneAndUpdate(
    {
      $or: [{ status: "queued" }, { status: "running", lockedUntil: { $lte: now } }],
    },
    {
      $set: { status: "running", lockedUntil: new Date(now.getTime() + LEASE_MS) },
      $inc: { attempts: 1 },
    },
    { sort: { createdAt: 1 }, new: true },
  ).lean();
};

const runJob = async (job: LeadImportJob): Promise<void> => {
  if (job.attempts > MAX_ATTEMPTS) {
    await finishJob(job._id, "failed", "Stopped after repeated failures");
    return;
  }
  const payload = await LeadImportPayloadModel.findOne({ jobId: job._id }, { rows: 1 }).lean();
  if (!payload) {
    await finishJob(job._id, "failed", "The uploaded rows are missing");
    return;
  }
  const rows = payload.rows;
  if (!job.startedAt) {
    await LeadImportJobModel.updateOne({ _id: job._id }, { $set: { startedAt: new Date() } });
  }

  const importedBy = job.createdBy;
  const context = await buildImportContext(rows.slice(job.processedRows) as ImportRow[]);
  const resumed = job.attempts > 1;
  for (let cursor = job.processedRows; cursor < job.totalRows; cursor += CHUNK_SIZE) {
    const chunk = rows.slice(cursor, cursor + CHUNK_SIZE) as ImportRow[];
    const result = await importLeads(
      chunk,
      {
        fileName: job.fileName,
        dryRun: false,
        importedBy,
        rowOffset: cursor,
        jobId: job._id,
        mayHavePartialInsert: resumed && cursor === job.processedRows,
      },
      context,
    );

    const issues: LeadImportIssue[] = [];
    for (const r of result.results) {
      const data = (rows[r.row - 1] ?? {}) as Record<string, unknown>;
      if (r.outcome === "error") {
        issues.push({ row: r.row, kind: "error", message: r.error ?? "Invalid row", data });
      } else if (r.creatorNotFound) {
        issues.push({ row: r.row, kind: "creator-not-found", message: "Creator not found", data });
      }
    }

    // Counts and cursor move together, so a crash re-runs this chunk from scratch.
    await LeadImportJobModel.updateOne(
      { _id: job._id },
      {
        $set: {
          processedRows: Math.min(cursor + CHUNK_SIZE, job.totalRows),
          lockedUntil: new Date(Date.now() + LEASE_MS),
        },
        $inc: {
          created: result.created,
          errorCount: result.summary.error,
          creatorNotFound: result.summary.creatorNotFound,
        },
        ...(issues.length > 0 && { $push: { issues: { $each: issues } } }),
      },
    );
  }

  await finishJob(job._id, "done");
};

/** Runs queued imports one after another, in upload order. Returns how many finished. */
export const runLeadImportJobs = async (): Promise<number> => {
  let finished = 0;
  for (let i = 0; i < MAX_JOBS_PER_TICK; i += 1) {
    const job = await claimNextJob();
    if (!job) break;
    await runJob(job);
    finished += 1;
  }
  return finished;
};
