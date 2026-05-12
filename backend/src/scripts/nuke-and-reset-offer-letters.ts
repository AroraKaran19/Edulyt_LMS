/**
 * Full reset for offer letters + sequential intern-ID re-assignment.
 *
 *   1. Delete every offer letter PDF in S3 referenced by an enrollment or job.
 *   2. Clear `internId`, `offerLetterUrl`, `offerLetterGeneratedAt` on every
 *      affected enrollment and revert status to `offer_letter_pending` so the
 *      worker will regenerate.
 *   3. Sort the affected enrollments by enrolledAt (fallback createdAt → _id)
 *      ascending and assign sequential intern IDs (AI-00001, AI-00002, …) by
 *      direct write — bypassing the live atomic allocator so order is
 *      deterministic.
 *   4. Seed the `AppCounter` doc to the last assigned number so every future
 *      live allocation in adminVerifyInternshipDocumentation continues the
 *      sequence (AI-00046 next, etc).
 *   5. For each enrollment with offer-letter job rows: keep the most recent
 *      one, reset it to `pending`, delete the rest. Worker picks it up next
 *      tick.
 *
 * Run from backend root:
 *   # preview:
 *   npx ts-node src/scripts/nuke-and-reset-offer-letters.ts
 *   # apply:
 *   npx ts-node src/scripts/nuke-and-reset-offer-letters.ts --apply
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { OfferLetterJobModel } from "../models/offerLetterJob.schema";
import { AppCounterModel } from "../models/appCounter.schema";
import {
  deleteFileFromS3,
  extractS3KeyFromUrl,
} from "../services/upload.services";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const APPLY = process.argv.includes("--apply");

type EnrollmentRow = {
  _id: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  status?: string;
  internId?: string;
  offerLetterUrl?: string;
  enrolledAt?: Date;
  createdAt?: Date;
};

function pickOrderTimestamp(e: EnrollmentRow): number {
  const t =
    (e.enrolledAt instanceof Date && e.enrolledAt.getTime()) ||
    (e.createdAt instanceof Date && e.createdAt.getTime()) ||
    e._id.getTimestamp().getTime();
  return t;
}

function formatInternId(seq: number): string {
  return `AI-${seq.toString().padStart(5, "0")}`;
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");

  console.log(`Mode: ${APPLY ? "APPLY (writes enabled)" : "DRY RUN (no writes)"}`);
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  // Find every enrollment that's "in the offer-letter pipeline". This includes
  // rows already in offer_letter_pending (from earlier cleanup) AND any row
  // still carrying internId/offerLetterUrl regardless of status.
  const candidates = (await InternshipEnrollmentModel.find({
    $or: [
      { status: "offer_letter_pending" },
      { internId: { $exists: true, $ne: null } },
      { offerLetterUrl: { $exists: true, $ne: null } },
    ],
  })
    .select("_id user status internId offerLetterUrl enrolledAt createdAt")
    .lean()) as unknown as EnrollmentRow[];

  const jobsWithUrl = await OfferLetterJobModel.find({
    offerLetterUrl: { $exists: true, $ne: null },
  })
    .select("offerLetterUrl")
    .lean();
  const allJobs = await OfferLetterJobModel.find({})
    .select("jobId internshipEnrollmentId status createdAt")
    .lean();

  const urls = new Set<string>();
  for (const e of candidates) if (e.offerLetterUrl) urls.add(e.offerLetterUrl);
  for (const j of jobsWithUrl) {
    const u = (j as { offerLetterUrl?: string }).offerLetterUrl;
    if (u) urls.add(u);
  }

  console.log(`Enrollments in scope: ${candidates.length}`);
  console.log(`Jobs total: ${allJobs.length}`);
  console.log(`Distinct S3 PDF URLs to delete: ${urls.size}\n`);

  // Sort by enrolledAt → createdAt → _id timestamp ascending. This is the
  // order in which IDs will be assigned (oldest enrollment → AI-00001).
  candidates.sort((a, b) => pickOrderTimestamp(a) - pickOrderTimestamp(b));

  console.log("Assignment preview (first 10, oldest first):");
  for (let i = 0; i < Math.min(10, candidates.length); i++) {
    const e = candidates[i];
    const when = new Date(pickOrderTimestamp(e)).toISOString();
    console.log(
      `  ${formatInternId(i + 1)}  ← ${e._id} | status=${e.status} | order-ts=${when}`,
    );
  }
  if (candidates.length > 10)
    console.log(`  … (+${candidates.length - 10} more)`);

  if (candidates.length === 0 && urls.size === 0 && allJobs.length === 0) {
    console.log("\nNothing to reset.");
    await mongoose.disconnect();
    return;
  }

  if (!APPLY) {
    console.log("\nDry run complete. Re-run with --apply to execute.");
    await mongoose.disconnect();
    return;
  }

  // 1. Delete S3 PDFs.
  let s3Deleted = 0;
  let s3Skipped = 0;
  for (const url of urls) {
    const key = extractS3KeyFromUrl(url);
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

  // 2. Clear & assign per enrollment. We write per-row instead of bulk so
  //    each $set carries that row's freshly-allocated sequential ID.
  let assigned = 0;
  for (let i = 0; i < candidates.length; i++) {
    const e = candidates[i];
    const seq = i + 1;
    await InternshipEnrollmentModel.updateOne(
      { _id: e._id },
      {
        $set: {
          status: "offer_letter_pending",
          internId: formatInternId(seq),
        },
        $unset: {
          offerLetterUrl: "",
          offerLetterGeneratedAt: "",
        },
      },
    );
    assigned += 1;
  }
  console.log(`Enrollments reset + intern IDs assigned: ${assigned}`);

  // 3. Seed the live counter to the last assigned number so subsequent
  //    allocations in adminVerifyInternshipDocumentation continue the
  //    sequence (next will be candidates.length + 1).
  await AppCounterModel.findOneAndUpdate(
    { _id: "internId" },
    { $set: { seq: candidates.length } },
    { upsert: true },
  );
  console.log(
    `Counter seeded to seq=${candidates.length} → next live allocation will be ${formatInternId(candidates.length + 1)}`,
  );

  // 4. Reset jobs: keep the most recent row per enrollment, reset to pending,
  //    delete the rest. Avoids the partial unique index on {pending,
  //    processing} while preserving a tracked jobId per enrollment.
  const byEnrollment = new Map<string, typeof allJobs>();
  for (const j of allJobs) {
    const list = byEnrollment.get(j.internshipEnrollmentId) ?? [];
    list.push(j);
    byEnrollment.set(j.internshipEnrollmentId, list);
  }

  let kept = 0;
  let deletedRows = 0;
  for (const [, jobs] of byEnrollment) {
    jobs.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
    const [keep, ...rest] = jobs;

    if (rest.length > 0) {
      const restIds = rest.map((r) => r.jobId);
      const del = await OfferLetterJobModel.deleteMany({ jobId: { $in: restIds } });
      deletedRows += del.deletedCount ?? 0;
    }

    await OfferLetterJobModel.updateOne(
      { jobId: keep.jobId },
      {
        $set: { status: "pending", progress: 0, retryCount: 0 },
        $unset: {
          error: "",
          startedAt: "",
          completedAt: "",
          internId: "",
          offerLetterUrl: "",
        },
      },
    );
    kept += 1;
  }
  console.log(`Jobs reset to pending (one per enrollment): ${kept}`);
  console.log(`Duplicate/extra job rows deleted: ${deletedRows}`);

  console.log(
    "\nDone. Restart the offer-letter worker so it picks up the reset enrollments.",
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
