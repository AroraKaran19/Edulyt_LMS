/**
 * READ-ONLY: live counts for one batch's entrance exam — how many students
 * opened it (draft, in-progress) vs submitted it, plus how many registered but
 * never opened. Uses one aggregation to stay light on the cluster.
 *
 *   npx ts-node src/scripts/count-entrance-exam-attempts.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InternshipModel } from "../models/internship.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipSubmissionModel } from "../models/internshipSubmission.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const SLUG = "business-development-associate-analytics-h1-2026";
const BATCH_NAME = "June 2026";

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  const ins = (await InternshipModel.findOne({ slug: SLUG })
    .select("_id title batches._id batches.name batches.entranceExamTemplateId")
    .lean()) as any;
  if (!ins) throw new Error(`Internship not found: ${SLUG}`);

  const batch = (ins.batches ?? []).find((b: any) => b.name === BATCH_NAME);
  if (!batch) throw new Error(`Batch not found: ${BATCH_NAME}`);

  const internshipId = ins._id;
  const batchId = String(batch._id);
  const examId = String(batch.entranceExamTemplateId ?? "");

  console.log(`Internship: ${ins.title}`);
  console.log(`Batch:      ${batch.name} (${batchId})`);
  console.log(`Exam tmpl:  ${examId}\n`);

  // Submissions grouped by status (one aggregation).
  const grouped = await InternshipSubmissionModel.aggregate([
    {
      $match: {
        submissionFor: "exam",
        internshipId: new mongoose.Types.ObjectId(internshipId),
        batchId,
        examId,
      },
    },
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);

  const byStatus: Record<string, number> = {};
  for (const g of grouped) byStatus[g._id] = g.n;

  const draft = byStatus["draft"] ?? 0;
  const submitted =
    (byStatus["submitted"] ?? 0) +
    (byStatus["partially_reviewed"] ?? 0) +
    (byStatus["fully_reviewed"] ?? 0);
  const totalOpened = draft + submitted;

  // Registered enrollments for this batch (merit entrance path).
  const registered = await InternshipEnrollmentModel.countDocuments({
    internship: internshipId,
    "batchSnapshot.batchId": batchId,
    status: { $in: ["exam_registered", "exam_attempted"] },
  });

  console.log("=== Entrance exam — live counts ===");
  console.log(`Registered (exam_registered/attempted): ${registered}`);
  console.log(`Opened the exam (have an attempt):       ${totalOpened}`);
  console.log(`   • in progress (draft, not submitted): ${draft}`);
  console.log(`   • submitted/finished:                 ${submitted}`);
  console.log(`Registered but never opened:             ${Math.max(0, registered - totalOpened)}`);
  console.log(`\nRaw status breakdown: ${JSON.stringify(byStatus)}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
