/**
 * Bulk-reset every offer letter job currently in `failed` back to `pending` so
 * the worker picks them up on the next tick. Per-enrollment sibling jobs in
 * pending/processing are deleted first to avoid tripping the partial unique
 * index — same logic as `retryOfferLetterJobService`.
 *
 * Run from backend root:
 *   # preview:
 *   npx ts-node src/scripts/reset-failed-offer-letter-jobs.ts
 *   # apply:
 *   npx ts-node src/scripts/reset-failed-offer-letter-jobs.ts --apply
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { OfferLetterJobModel } from "../models/offerLetterJob.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const APPLY = process.argv.includes("--apply");

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");

  console.log(`Mode: ${APPLY ? "APPLY (writes enabled)" : "DRY RUN (no writes)"}`);
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  const failed = await OfferLetterJobModel.find({ status: "failed" })
    .select("jobId internshipEnrollmentId error")
    .lean();

  console.log(`Failed jobs to reset: ${failed.length}`);
  if (failed.length === 0) {
    await mongoose.disconnect();
    return;
  }

  console.log("\nSample (first 5):");
  for (const j of failed.slice(0, 5)) {
    const err = (j.error ?? "").slice(0, 60);
    console.log(`  - ${j.jobId} | enr=${j.internshipEnrollmentId} | err="${err}…"`);
  }
  if (failed.length > 5) console.log(`  … (+${failed.length - 5} more)`);

  if (!APPLY) {
    console.log("\nDry run complete. Re-run with --apply to execute.");
    await mongoose.disconnect();
    return;
  }

  // For each failed job, clear any sibling active job for the same enrollment
  // (worker sync may have already enqueued a fresh pending row), then flip
  // this row back to pending.
  let reset = 0;
  let siblingsCleared = 0;
  for (const j of failed) {
    const sibDel = await OfferLetterJobModel.deleteMany({
      internshipEnrollmentId: j.internshipEnrollmentId,
      jobId: { $ne: j.jobId },
      status: { $in: ["pending", "processing"] },
    });
    siblingsCleared += sibDel.deletedCount ?? 0;

    await OfferLetterJobModel.updateOne(
      { jobId: j.jobId },
      {
        $set: { status: "pending", progress: 0 },
        $unset: {
          error: "",
          startedAt: "",
          completedAt: "",
          internId: "",
          offerLetterUrl: "",
        },
      },
    );
    reset += 1;
  }

  console.log(`\nJobs reset to pending: ${reset}`);
  console.log(`Sibling active jobs cleared: ${siblingsCleared}`);
  console.log("\nDone. Worker will pick these up on the next tick.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
