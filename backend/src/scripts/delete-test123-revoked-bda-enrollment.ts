/**
 * One-off: delete a single revoked internship enrollment for test123@gmail.com
 * (Business Development Associate - Analytics - H1 2026, June 2026 batch) and
 * its task submissions. Mirrors deleteInternshipEnrollmentAdmin.
 *
 * Guarded: deletes ONLY if the target _id resolves to exactly the expected
 * record (right user, status "revoked", June 2026 batch). Aborts otherwise.
 *
 *   npx ts-node src/scripts/delete-test123-revoked-bda-enrollment.ts          # dry run
 *   npx ts-node src/scripts/delete-test123-revoked-bda-enrollment.ts --apply  # delete
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipSubmissionModel } from "../models/internshipSubmission.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const TARGET_ID = "6a0e3f4a3129a23b68cacfa1";
const EXPECTED_EMAIL_USER = "694051f8682b885ede200b78";
const EXPECTED_STATUS = "revoked";
const EXPECTED_BATCH_NAME = "June 2026";
const EXPECTED_TITLE = "Business Development Associate - Analytics - H1 2026";

const apply = process.argv.includes("--apply");

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  const enr = (await InternshipEnrollmentModel.findById(TARGET_ID).lean()) as
    | Record<string, any>
    | null;

  if (!enr) {
    console.log(`No enrollment found with _id ${TARGET_ID}. Nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  console.log("Found enrollment:");
  console.log("  _id:    ", String(enr._id));
  console.log("  user:   ", String(enr.user));
  console.log("  status: ", enr.status);
  console.log("  title:  ", enr.internshipSnapshot?.title);
  console.log("  batch:  ", enr.batchSnapshot?.name);

  // Safety guard — verify this is exactly the intended record.
  const ok =
    String(enr.user) === EXPECTED_EMAIL_USER &&
    enr.status === EXPECTED_STATUS &&
    enr.batchSnapshot?.name === EXPECTED_BATCH_NAME &&
    enr.internshipSnapshot?.title === EXPECTED_TITLE;

  if (!ok) {
    console.error(
      "\nABORT: record does not match the expected user/status/batch/title. No deletion performed.",
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  const submissionCount = await InternshipSubmissionModel.countDocuments({
    enrollmentId: enr._id,
  });
  console.log(`  task submissions linked: ${submissionCount}`);

  if (!apply) {
    console.log(
      "\nDRY RUN — matched and safe to delete. Re-run with --apply to delete.",
    );
    await mongoose.disconnect();
    return;
  }

  const delSubs = await InternshipSubmissionModel.deleteMany({
    enrollmentId: enr._id,
  });
  const delEnr = await InternshipEnrollmentModel.deleteOne({ _id: enr._id });

  console.log("\nDeleted:");
  console.log("  enrollment:  ", delEnr.deletedCount);
  console.log("  submissions: ", delSubs.deletedCount);

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
