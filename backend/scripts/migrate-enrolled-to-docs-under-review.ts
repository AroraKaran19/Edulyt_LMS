/**
 * One-time migration: move all "enrolled" enrollments that have documentation
 * (i.e. went through the old auto-enroll doc-submit flow) to "docs_under_review"
 * so admins can verify them under the new review gate.
 *
 * Run from the backend directory:
 *   npx ts-node --transpile-only scripts/migrate-enrolled-to-docs-under-review.ts
 *
 * Dry-run mode (no writes):
 *   DRY_RUN=true npx ts-node --transpile-only scripts/migrate-enrolled-to-docs-under-review.ts
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

  const collection = mongoose.connection.collection("internshipenrollments");

  const filter = {
    status: "enrolled",
    documentation: { $exists: true, $ne: null },
  };

  const count = await collection.countDocuments(filter);
  console.log(`Found ${count} enrolled enrollment(s) with documentation`);

  if (count === 0) {
    console.log("Nothing to migrate.");
    await mongoose.disconnect();
    return;
  }

  if (DRY_RUN) {
    console.log("DRY_RUN=true — no writes performed.");
    await mongoose.disconnect();
    return;
  }

  const result = await collection.updateMany(filter, {
    $set: { status: "docs_under_review", updatedAt: new Date() },
  });

  console.log(`Updated ${result.modifiedCount} enrollment(s) → docs_under_review`);
  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
