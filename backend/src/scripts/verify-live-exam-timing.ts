/**
 * READ-ONLY verification of the live-timing refactor. Calls the real
 * getSubmissionById() (which runs serializeSubmission → resolveLiveExamTiming)
 * for one DA June 2026 entrance-exam submission and asserts the returned
 * templateSnapshot.examEndAt equals the LIVE batch window — regardless of what
 * (if anything) is frozen in the stored snapshot.
 *
 *   npx ts-node src/scripts/verify-live-exam-timing.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InternshipModel } from "../models/internship.schema";
import { InternshipSubmissionModel } from "../models/internshipSubmission.schema";
import { getSubmissionById } from "../services/internshipSubmission.services";
// Register schemas referenced via populate / live lookups.
import "../models/user.schema";
import "../models/internshipExam.schema";
import "../models/internshipEnrollment.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const INTERNSHIP_ID = "69de2ba621cc5887eb083db4";
const BATCH_ID = "69e64f1c60cbc413aefb9448";

const ist = (d?: unknown) =>
  d ? new Date(d as string).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—";

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  const ins = (await InternshipModel.findById(INTERNSHIP_ID)
    .select("batches._id batches.entranceExamStartAt batches.entranceExamEndAt")
    .lean()) as any;
  const batch = (ins?.batches ?? []).find((b: any) => String(b._id) === BATCH_ID);
  const liveEnd = batch?.entranceExamEndAt ? new Date(batch.entranceExamEndAt) : undefined;
  console.log(`Live batch window end (IST): ${ist(liveEnd)}`);

  const oneSub = (await InternshipSubmissionModel.findOne({
    submissionFor: "exam",
    internshipId: new mongoose.Types.ObjectId(INTERNSHIP_ID),
    batchId: BATCH_ID,
  })
    .select("_id templateSnapshot.examEndAt")
    .lean()) as any;

  if (!oneSub) {
    console.log("No exam submission found to verify.");
    await mongoose.disconnect();
    return;
  }

  console.log(`\nSubmission: ${oneSub._id}`);
  console.log(`  stored snapshot.examEndAt (IST): ${ist(oneSub.templateSnapshot?.examEndAt)}`);

  const serialized = await getSubmissionById(String(oneSub._id), true);
  const overlaidEnd = (serialized.templateSnapshot as any)?.examEndAt;
  console.log(`  serialized (live) examEndAt (IST): ${ist(overlaidEnd)}`);

  const ok =
    liveEnd && overlaidEnd &&
    new Date(overlaidEnd).getTime() === liveEnd.getTime();
  console.log(`\n${ok ? "PASS" : "FAIL"}: serialized examEndAt matches the live batch window.`);

  await mongoose.disconnect();
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
