import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../middlewares/error.middleware";
import { CollaborationJobModel } from "../models/collaborationJob.schema";
import {
  CollaborationJob,
  CollaborationJobStatus,
} from "../types/collaborationJob";

export const createCollaborationAllotmentJobService = async (data: {
  userId: string;
  collaborationDomainId: string;
}): Promise<CollaborationJob> => {
  const jobId = uuidv4();

  try {
    const job = await CollaborationJobModel.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(data.userId),
        collaborationDomainId: new mongoose.Types.ObjectId(
          data.collaborationDomainId
        ),
        status: { $in: ["pending", "processing"] },
      },
      {
        $setOnInsert: {
          jobId,
          userId: new mongoose.Types.ObjectId(data.userId),
          collaborationDomainId: new mongoose.Types.ObjectId(
            data.collaborationDomainId
          ),
          status: "pending" as CollaborationJobStatus,
          retryCount: 0,
        },
      },
      { upsert: true, new: true }
    ).lean();

    return job as unknown as CollaborationJob;
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 11000) {
      const existing = await CollaborationJobModel.findOne({
        userId: new mongoose.Types.ObjectId(data.userId),
        collaborationDomainId: new mongoose.Types.ObjectId(
          data.collaborationDomainId
        ),
        status: { $in: ["pending", "processing"] },
      }).lean();
      if (existing) {
        return existing as unknown as CollaborationJob;
      }
    }
    console.error("Error creating collaboration allotment job:", error);
    throw new AppError("Failed to create collaboration allotment job", 500);
  }
};

export const updateCollaborationJobStatusService = async (
  jobId: string,
  updates: {
    status?: CollaborationJobStatus;
    error?: string | null;
    startedAt?: Date | null;
    completedAt?: Date | null;
  }
): Promise<CollaborationJob> => {
  const updateData: Record<string, unknown> = { ...updates };

  if (updates.status === "processing" && !updates.startedAt) {
    updateData.startedAt = new Date();
  }
  if (updates.status === "completed" || updates.status === "failed") {
    updateData.completedAt = new Date();
  }

  const job = await CollaborationJobModel.findOneAndUpdate(
    { jobId },
    { $set: updateData },
    { new: true }
  ).lean();

  if (!job) {
    throw new AppError("Collaboration job not found", 404);
  }

  return job as unknown as CollaborationJob;
};

export const incrementCollaborationJobRetryService = async (
  jobId: string
): Promise<void> => {
  await CollaborationJobModel.findOneAndUpdate({ jobId }, { $inc: { retryCount: 1 } });
};

export const getNextPendingCollaborationJobService =
  async (): Promise<CollaborationJob | null> => {
    const job = await CollaborationJobModel.findOneAndUpdate(
      { status: "pending" },
      {
        $set: {
          status: "processing",
          startedAt: new Date(),
        },
      },
      {
        sort: { createdAt: 1 },
        new: true,
      }
    ).lean();

    return job as unknown as CollaborationJob | null;
  };
