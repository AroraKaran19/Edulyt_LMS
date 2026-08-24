import mongoose from "mongoose";
import { RoleChangeJobModel } from "../models/roleChangeJob.schema";
import {
  runRoleChangeJob,
  type RoleChangeDirection,
} from "../services/roleChange.services";

const POLL_MS = 10_000;
const MAX_ATTEMPTS = 3;

let running = false;

/**
 * Claims one job at a time with a conditional update, so two worker processes
 * cannot both purge the same account: whichever `findOneAndUpdate` matches
 * first flips the status, and the other sees nothing pending.
 */
const claimNext = async () => {
  return RoleChangeJobModel.findOneAndUpdate(
    { status: "pending", attempts: { $lt: MAX_ATTEMPTS } },
    { $set: { status: "processing" }, $inc: { attempts: 1 } },
    { sort: { createdAt: 1 }, new: true },
  ).lean();
};

const tick = async () => {
  // A purge can outlast the interval; overlapping ticks would double-claim.
  if (running) return;
  running = true;
  try {
    for (;;) {
      const job = await claimNext();
      if (!job) return;

      try {
        await runRoleChangeJob({
          _id: job._id as mongoose.Types.ObjectId,
          userId: job.userId as mongoose.Types.ObjectId,
          direction: job.direction as RoleChangeDirection,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown failure";
        console.error(`[roleChange] job ${job.jobId} failed:`, message);
        await RoleChangeJobModel.updateOne(
          { _id: job._id },
          {
            $set: {
              // Back to pending until the attempt cap, then left failed for a
              // human: a half-purged account must not be silently forgotten.
              status:
                (job.attempts ?? 1) >= MAX_ATTEMPTS ? "failed" : "pending",
              error: message,
            },
          },
        );
      }
    }
  } catch (error) {
    console.error("[roleChange] worker tick failed:", error);
  } finally {
    running = false;
  }
};

export const startRoleChangeWorker = () => {
  console.log("👤 Role-change worker started");
  void tick();
  setInterval(() => {
    void tick();
  }, POLL_MS);
};
