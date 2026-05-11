/**
 * One-time migration: route existing `enrolled` internship enrollments that
 * have NOT yet been issued an offer letter back through the new
 * documentation flow.
 *
 *   • Submitted docs (documentation field present) → docs_under_review
 *   • Not submitted yet (no documentation field)   → pending_documentation
 *
 * Safety filters:
 *   - Only touches rows where `offerLetterUrl` is unset and `internId` is
 *     unset (i.e. they have NOT gone through the offer-letter cron).
 *   - `enrolledAt` is intentionally preserved — the offer-letter generator
 *     uses it as the letter date, so keeping it lets backfilled letters carry
 *     the original enrollment day rather than today.
 *
 * Run from the backend directory:
 *   npx ts-node --transpile-only scripts/migrate-fix-enrollment-statuses.ts
 *
 * Dry-run mode (no writes, just prints what would change):
 *   DRY_RUN=true npx ts-node --transpile-only scripts/migrate-fix-enrollment-statuses.ts
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

  // Base filter — only fix legacy "enrolled" rows that never got an offer
  // letter. Anyone with offerLetterUrl/internId already went through the new
  // flow and is legitimately enrolled; do NOT touch them.
  const base: Record<string, unknown> = {
    status: "enrolled",
    $and: [
      {
        $or: [
          { offerLetterUrl: { $exists: false } },
          { offerLetterUrl: null },
          { offerLetterUrl: "" },
        ],
      },
      {
        $or: [
          { internId: { $exists: false } },
          { internId: null },
          { internId: "" },
        ],
      },
    ],
  };

  const withDocsFilter = {
    ...base,
    documentation: { $exists: true, $ne: null },
  };
  const withoutDocsFilter = {
    ...base,
    $or: [{ documentation: { $exists: false } }, { documentation: null }],
  };

  const [withDocsCount, withoutDocsCount] = await Promise.all([
    collection.countDocuments(withDocsFilter),
    // countDocuments rejects multiple $or at the same level; merge with $and
    collection.countDocuments({
      $and: [base, { $or: withoutDocsFilter.$or }],
    }),
  ]);

  console.log("─────────────────────────────────────────────");
  console.log(`Would move → docs_under_review:       ${withDocsCount}`);
  console.log(`Would move → pending_documentation:   ${withoutDocsCount}`);
  console.log(`Total affected:                       ${withDocsCount + withoutDocsCount}`);
  console.log("─────────────────────────────────────────────");

  if (withDocsCount + withoutDocsCount === 0) {
    console.log("Nothing to migrate.");
    await mongoose.disconnect();
    return;
  }

  if (DRY_RUN) {
    console.log("DRY_RUN=true — no writes performed.");
    await mongoose.disconnect();
    return;
  }

  const now = new Date();

  const r1 = await collection.updateMany(withDocsFilter, {
    $set: { status: "docs_under_review", updatedAt: now },
  });
  console.log(`Updated ${r1.modifiedCount} → docs_under_review`);

  const r2 = await collection.updateMany(
    { $and: [base, { $or: withoutDocsFilter.$or }] },
    {
      $set: { status: "pending_documentation", updatedAt: now },
    },
  );
  console.log(`Updated ${r2.modifiedCount} → pending_documentation`);

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
