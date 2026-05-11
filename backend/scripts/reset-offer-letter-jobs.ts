/**
 * One-time reset: wipe the offer-letter queue and clear assigned intern IDs
 * so the next offer letter generated starts at AI-00001.
 *
 * What it does:
 *   1. Deletes every row in the `offerletterjobs` collection.
 *   2. Unsets `internId`, `offerLetterUrl`, and `offerLetterGeneratedAt` on
 *      every InternshipEnrollment. (`internId` drives the AI-XXXXX counter via
 *      countDocuments({ internId: { $exists, $ne: null } }) in
 *      cron.services.ts, so clearing it forces the next call to return 00001.)
 *
 * What it does NOT do:
 *   - Touch enrollment `status`. If anyone is currently "enrolled" via the
 *     offer-letter flow, they stay "enrolled" but with no internId / URL.
 *     If you also want those rows regenerated, run a follow-up that flips
 *     status back to `offer_letter_pending` for the matching set.
 *   - Delete the actual PDF objects on S3 (existing letters are orphaned but
 *     accessible if anyone has the URL cached).
 *
 * Run from the backend directory:
 *   PowerShell preview:  $env:DRY_RUN="true"; npx ts-node --transpile-only scripts/reset-offer-letter-jobs.ts
 *   PowerShell real:     Remove-Item Env:DRY_RUN -ErrorAction SilentlyContinue; npx ts-node --transpile-only scripts/reset-offer-letter-jobs.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";
import mongoose from "mongoose";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in .env");
  process.exit(1);
}

const DRY_RUN = process.env.DRY_RUN === "true";

async function run() {
  await mongoose.connect(MONGODB_URI as string);
  console.log("Connected to MongoDB");

  const jobs = mongoose.connection.collection("offerletterjobs");
  const enrollments = mongoose.connection.collection("internshipenrollments");

  const jobsCount = await jobs.countDocuments({});
  const internIdCount = await enrollments.countDocuments({
    internId: { $exists: true, $ne: null, $nin: [""] },
  });
  const urlCount = await enrollments.countDocuments({
    offerLetterUrl: { $exists: true, $ne: null, $nin: [""] },
  });

  console.log("──────────────────────────────────────────────");
  console.log(`OfferLetterJob rows to delete:       ${jobsCount}`);
  console.log(`Enrollments with internId to clear:  ${internIdCount}`);
  console.log(`Enrollments with offerLetterUrl:     ${urlCount}`);
  console.log("──────────────────────────────────────────────");

  if (jobsCount + internIdCount + urlCount === 0) {
    console.log("Nothing to reset. Counter already at 00001 for next generation.");
    await mongoose.disconnect();
    return;
  }

  if (DRY_RUN) {
    console.log("DRY_RUN=true — no writes performed.");
    await mongoose.disconnect();
    return;
  }

  const delResult = await jobs.deleteMany({});
  console.log(`Deleted ${delResult.deletedCount} OfferLetterJob row(s)`);

  const unsetResult = await enrollments.updateMany(
    {
      $or: [
        { internId: { $exists: true } },
        { offerLetterUrl: { $exists: true } },
        { offerLetterGeneratedAt: { $exists: true } },
      ],
    },
    {
      $unset: {
        internId: "",
        offerLetterUrl: "",
        offerLetterGeneratedAt: "",
      },
      $set: { updatedAt: new Date() },
    },
  );
  console.log(
    `Cleared offer-letter fields on ${unsetResult.modifiedCount} enrollment(s)`,
  );

  // Sanity check: counter source for generateInternId()
  const remaining = await enrollments.countDocuments({
    internId: { $exists: true, $ne: null },
  });
  console.log(
    `Sanity: ${remaining} enrollment(s) still carry an internId — next generation will be AI-${String(
      remaining + 1,
    ).padStart(5, "0")}`,
  );

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
