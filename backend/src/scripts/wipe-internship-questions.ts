/**
 * One-off cleanup: wipe every InternshipQuestion document and clear the
 * `questions[]` array (and recompute `totalScore = 0`) on every exam and task
 * template that currently references them.
 *
 * Why both exam AND task? Both schemas hold an array of question ObjectIds.
 * Deleting questions without clearing those arrays leaves orphaned refs, which
 * the admin detail endpoints try to populate and which the new picker reads.
 *
 * Usage (from backend/):
 *   # 1. Dry-run — shows counts, makes no changes:
 *   npx ts-node src/scripts/wipe-internship-questions.ts
 *
 *   # 2. Actually wipe — requires --confirm:
 *   npx ts-node src/scripts/wipe-internship-questions.ts --confirm
 *
 * Submissions are NOT touched: they store frozen question snapshots, so existing
 * learner attempts remain intact and gradeable.
 */

import path from "path";
import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../config/database";
import { InternshipQuestionModel } from "../models/internshipQuestion.schema";
import { InternshipExamModel } from "../models/internshipExam.schema";
import { InternshipTaskModel } from "../models/internshipTask.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function main() {
  const confirm = process.argv.includes("--confirm");

  await connectDB();

  const questionCount = await InternshipQuestionModel.estimatedDocumentCount();
  const examCount = await InternshipExamModel.countDocuments({
    questions: { $exists: true, $not: { $size: 0 } },
  });
  const taskCount = await InternshipTaskModel.countDocuments({
    questions: { $exists: true, $not: { $size: 0 } },
  });

  // eslint-disable-next-line no-console
  console.log("─── Internship question wipe ───");
  // eslint-disable-next-line no-console
  console.log(`Questions to delete: ${questionCount}`);
  // eslint-disable-next-line no-console
  console.log(`Exam templates to clear: ${examCount}`);
  // eslint-disable-next-line no-console
  console.log(`Task templates to clear: ${taskCount}`);

  if (!confirm) {
    // eslint-disable-next-line no-console
    console.log(
      "\nDry-run only. Re-run with --confirm to apply these changes.",
    );
    await disconnectDB();
    return;
  }

  // Clear refs first so no exam/task transiently holds dangling IDs.
  const examRes = await InternshipExamModel.updateMany(
    {},
    { $set: { questions: [], totalScore: 0 } },
  );
  const taskRes = await InternshipTaskModel.updateMany(
    {},
    { $set: { questions: [], totalScore: 0 } },
  );
  const delRes = await InternshipQuestionModel.deleteMany({});

  // eslint-disable-next-line no-console
  console.log("\n─── Done ───");
  // eslint-disable-next-line no-console
  console.log(`Exam templates cleared: ${examRes.modifiedCount}`);
  // eslint-disable-next-line no-console
  console.log(`Task templates cleared: ${taskRes.modifiedCount}`);
  // eslint-disable-next-line no-console
  console.log(`Questions deleted: ${delRes.deletedCount}`);

  await disconnectDB();
}

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error("Wipe failed:", err);
  await disconnectDB().catch(() => undefined);
  process.exit(1);
});
