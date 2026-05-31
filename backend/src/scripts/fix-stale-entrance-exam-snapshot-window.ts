/**
 * HOTFIX: when an admin extends a batch's entrance-exam window AFTER learners
 * have already started their attempt, the in-progress submissions keep the
 * frozen `templateSnapshot.examStart/EndAt` from creation time, so they hit
 * "The exam window has closed" (assertWithinExamSnapshotWindow) even though the
 * live batch window is now longer.
 *
 * This syncs each matching exam submission's snapshot window to the batch's
 * CURRENT entranceExamStartAt / entranceExamEndAt.
 *
 *   npx ts-node src/scripts/fix-stale-entrance-exam-snapshot-window.ts          # dry run
 *   npx ts-node src/scripts/fix-stale-entrance-exam-snapshot-window.ts --apply  # write
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InternshipModel } from "../models/internship.schema";
import { InternshipSubmissionModel } from "../models/internshipSubmission.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Data Analytics – June 2026
const INTERNSHIP_ID = "69de2ba621cc5887eb083db4";
const BATCH_ID = "69e64f1c60cbc413aefb9448";

const apply = process.argv.includes("--apply");

function iso(d?: Date | null) {
  return d ? new Date(d).toISOString() : "—";
}
function ist(d?: Date | null) {
  return d ? new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—";
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}`);
  console.log(`NOW IST: ${ist(new Date())}\n`);

  const ins = (await InternshipModel.findById(INTERNSHIP_ID)
    .select("title batches._id batches.name batches.entranceExamTemplateId batches.entranceExamStartAt batches.entranceExamEndAt")
    .lean()) as any;
  if (!ins) throw new Error("Internship not found");

  const batch = (ins.batches ?? []).find((b: any) => String(b._id) === BATCH_ID);
  if (!batch) throw new Error("Batch not found");

  const examId = String(batch.entranceExamTemplateId);
  const newStart = batch.entranceExamStartAt as Date | undefined;
  const newEnd = batch.entranceExamEndAt as Date | undefined;

  console.log(`Internship: ${ins.title}`);
  console.log(`Batch:      ${batch.name} (${BATCH_ID})`);
  console.log(`examId:     ${examId}`);
  console.log(`Batch window now -> start ${ist(newStart)} | end ${ist(newEnd)}\n`);

  if (!newEnd) {
    console.error("ABORT: batch has no entranceExamEndAt set.");
    await mongoose.disconnect();
    process.exit(1);
  }

  const subs = await InternshipSubmissionModel.find({
    submissionFor: "exam",
    internshipId: new mongoose.Types.ObjectId(INTERNSHIP_ID),
    batchId: BATCH_ID,
    examId,
  }).lean();

  console.log(`Matching exam submissions: ${subs.length}\n`);

  let needFix = 0;
  for (const s of subs as any[]) {
    const snap = s.templateSnapshot ?? {};
    const curEnd = snap.examEndAt ? new Date(snap.examEndAt) : undefined;
    const curStart = snap.examStartAt ? new Date(snap.examStartAt) : undefined;
    const stale =
      (curEnd ? curEnd.getTime() : 0) !== new Date(newEnd).getTime() ||
      (newStart
        ? (curStart ? curStart.getTime() : 0) !== new Date(newStart).getTime()
        : false);
    console.log(
      `  ${s._id} status=${s.status} snapEnd(IST)=${ist(curEnd)} ${stale ? "→ STALE" : "ok"}`,
    );
    if (stale) needFix++;
  }

  console.log(`\n${needFix} submission(s) need their snapshot window updated.`);

  if (!apply) {
    console.log("\nDRY RUN — re-run with --apply to write.");
    await mongoose.disconnect();
    return;
  }

  const set: Record<string, Date> = { "templateSnapshot.examEndAt": new Date(newEnd) };
  if (newStart) set["templateSnapshot.examStartAt"] = new Date(newStart);

  const res = await InternshipSubmissionModel.updateMany(
    {
      submissionFor: "exam",
      internshipId: new mongoose.Types.ObjectId(INTERNSHIP_ID),
      batchId: BATCH_ID,
      examId,
      // Only in-progress attempts — never reopen finalized/graded submissions.
      status: "draft",
    },
    { $set: set },
  );

  console.log(`\nUpdated: matched=${res.matchedCount} modified=${res.modifiedCount}`);
  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
