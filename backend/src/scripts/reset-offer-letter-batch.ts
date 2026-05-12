/**
 * One-off: reset every `enrolled` learner who received an offer letter under
 * the racy count-based intern-ID generator. Clears `internId`, `offerLetterUrl`,
 * `offerLetterGeneratedAt`, deletes the S3 PDF, and reverts status to
 * `offer_letter_pending` so the worker re-generates with the fixed
 * deterministic generator (hash of userId + enrollmentId). Also wipes the
 * `offerletterjobs` queue rows for those enrollments so the worker's sync
 * re-enqueues cleanly on its next tick.
 *
 * Run from backend root:
 *   # preview (no writes):
 *   npx ts-node src/scripts/reset-offer-letter-batch.ts
 *   # actually apply:
 *   npx ts-node src/scripts/reset-offer-letter-batch.ts --apply
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { OfferLetterJobModel } from "../models/offerLetterJob.schema";
import {
  deleteFileFromS3,
  extractS3KeyFromUrl,
} from "../services/upload.services";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const APPLY = process.argv.includes("--apply");

type ResetTarget = {
  _id: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  internId?: string;
  offerLetterUrl?: string;
};

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");

  console.log(`Mode: ${APPLY ? "APPLY (writes enabled)" : "DRY RUN (no writes)"}`);
  console.log("Connecting to MongoDB…");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  const filter = {
    status: "enrolled" as const,
    $or: [
      { internId: { $exists: true, $ne: null } },
      { offerLetterUrl: { $exists: true, $ne: null } },
    ],
  };

  const targets = (await InternshipEnrollmentModel.find(filter)
    .select("_id user internId offerLetterUrl")
    .lean()) as unknown as ResetTarget[];

  console.log(`Enrollments to reset: ${targets.length}`);

  // Surface duplicate internIds explicitly so the admin can audit them in the log.
  const idCounts = new Map<string, number>();
  for (const t of targets) {
    if (t.internId) idCounts.set(t.internId, (idCounts.get(t.internId) ?? 0) + 1);
  }
  const dupes = [...idCounts.entries()].filter(([, n]) => n > 1);
  if (dupes.length > 0) {
    console.log(`\nDuplicate internIds detected (${dupes.length}):`);
    for (const [id, n] of dupes) console.log(`  ${id} × ${n}`);
  }

  console.log("\nSample (first 5):");
  for (const t of targets.slice(0, 5)) {
    console.log(
      `  - ${t._id} | internId=${t.internId ?? "—"} | url=${t.offerLetterUrl ?? "—"}`,
    );
  }
  if (targets.length > 5) console.log(`  … (+${targets.length - 5} more)`);

  if (targets.length === 0 || !APPLY) {
    if (!APPLY && targets.length > 0) {
      console.log("\nDry run complete. Re-run with --apply to execute.");
    }
    await mongoose.disconnect();
    return;
  }

  // 1. Delete S3 PDFs (best-effort; missing/external URLs are skipped).
  let s3Deleted = 0;
  let s3Skipped = 0;
  for (const t of targets) {
    if (!t.offerLetterUrl) {
      s3Skipped += 1;
      continue;
    }
    const key = extractS3KeyFromUrl(t.offerLetterUrl);
    if (!key) {
      s3Skipped += 1;
      continue;
    }
    try {
      await deleteFileFromS3(key);
      s3Deleted += 1;
    } catch (e) {
      console.error(`  S3 delete failed for ${key}:`, e);
    }
  }
  console.log(`\nS3 PDFs deleted: ${s3Deleted}, skipped: ${s3Skipped}`);

  // 2. Reset the enrollment documents back to offer_letter_pending.
  const enrollmentIds = targets.map((t) => t._id);
  const reset = await InternshipEnrollmentModel.updateMany(
    { _id: { $in: enrollmentIds } },
    {
      $set: { status: "offer_letter_pending" },
      $unset: {
        internId: "",
        offerLetterUrl: "",
        offerLetterGeneratedAt: "",
      },
    },
  );
  console.log(`Enrollments reset: ${reset.modifiedCount}`);

  // 3. Wipe queue rows for these enrollments — worker sync will re-enqueue.
  const enrollmentIdStrings = enrollmentIds.map((id) => String(id));
  const queueDel = await OfferLetterJobModel.deleteMany({
    internshipEnrollmentId: { $in: enrollmentIdStrings },
  });
  console.log(`Offer-letter job rows deleted: ${queueDel.deletedCount}`);

  console.log(
    "\nDone. The worker's next tick will re-enqueue and regenerate offer letters with the fixed deterministic generator.",
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
