/**
 * One-off migration: flip every existing `enrolled` learner whose enrollment
 * has no `documentation` sub-document into `pending_documentation`. They stay
 * blocked from tasks / certification until they submit Aadhar + photo via the
 * dashboard modal (late submissions accepted; flagged with `submittedLate: true`).
 *
 * No internship-side filter — all enrolled learners across all programs are
 * moved. Configure documentation windows on each internship beforehand so the
 * dashboard modal can show learners a meaningful submission deadline (windows
 * are not strictly required for submission to succeed; missing-window means
 * `submittedLate` defaults to false on the resulting documentation row).
 *
 * Run from backend root:
 *   # preview only:
 *   npx ts-node src/scripts/migrate-enrolled-to-pending-documentation.ts
 *   # actually apply:
 *   npx ts-node src/scripts/migrate-enrolled-to-pending-documentation.ts --apply
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const APPLY = process.argv.includes("--apply");

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");

  console.log(
    `Mode: ${APPLY ? "APPLY (writes enabled)" : "DRY RUN (no writes)"}`,
  );
  console.log("Connecting to MongoDB…");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  const filter = {
    status: "enrolled",
    documentation: { $exists: false },
  };

  const candidates = await InternshipEnrollmentModel.countDocuments(filter);
  console.log(
    `Enrollments to flip enrolled → pending_documentation: ${candidates}\n`,
  );

  if (candidates === 0) {
    console.log("Nothing to migrate.");
    await mongoose.disconnect();
    return;
  }

  if (!APPLY) {
    console.log("Dry run complete. Re-run with --apply to write.");
    await mongoose.disconnect();
    return;
  }

  const result = await InternshipEnrollmentModel.updateMany(filter, {
    $set: { status: "pending_documentation" },
  });

  console.log(`Matched: ${result.matchedCount}`);
  console.log(`Modified: ${result.modifiedCount}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
