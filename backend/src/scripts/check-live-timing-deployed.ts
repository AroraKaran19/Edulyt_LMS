/**
 * READ-ONLY: is the live-timing fix actually RUNNING in production?
 *
 * Signal: the new buildExamSnapshot no longer writes examResultAt /
 * examStartAt / examEndAt into templateSnapshot. The manual sync script only
 * ever touches examStartAt/examEndAt — never examResultAt. So examResultAt on
 * the NEWEST-created exam submission is a clean tell:
 *   • present  → OLD code still running (not rebuilt/reloaded)
 *   • absent   → NEW code is live
 *
 *   npx ts-node src/scripts/check-live-timing-deployed.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InternshipSubmissionModel } from "../models/internshipSubmission.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const ist = (d?: unknown) =>
  d ? new Date(d as string).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—";

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  const recent = (await InternshipSubmissionModel.find({ submissionFor: "exam" })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("createdAt status templateSnapshot.examResultAt templateSnapshot.examStartAt templateSnapshot.examEndAt templateSnapshot.title")
    .lean()) as any[];

  if (recent.length === 0) {
    console.log("No exam submissions found.");
    await mongoose.disconnect();
    return;
  }

  console.log("Newest exam submissions (by createdAt):\n");
  for (const s of recent) {
    const snap = s.templateSnapshot ?? {};
    console.log(
      `  created ${ist(s.createdAt)}  status=${s.status}  ` +
        `examResultAt=${snap.examResultAt ? "PRESENT" : "absent"}  ` +
        `examEndAt=${snap.examEndAt ? "present" : "absent"}`,
    );
  }

  const newest = recent[0];
  const hasResult = !!newest.templateSnapshot?.examResultAt;
  console.log("\n=== VERDICT ===");
  if (hasResult) {
    console.log(
      `OLD code still running — newest attempt (created ${ist(newest.createdAt)}) still has examResultAt frozen.`,
    );
    console.log("→ The live-timing fix is committed but NOT built+reloaded on the server.");
  } else {
    console.log(
      `NEW code is live — newest attempt (created ${ist(newest.createdAt)}) has no frozen timing.`,
    );
    console.log("→ Window extensions now apply to in-progress students automatically.");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
