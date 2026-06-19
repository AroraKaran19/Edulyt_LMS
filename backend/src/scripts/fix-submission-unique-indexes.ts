/**
 * Fix the InternshipSubmission unique indexes.
 *
 * BUG: `{ userId, examId, batchId }` and `{ userId, taskId, batchId }` were
 * created with `sparse: true`. A COMPOUND sparse index indexes a document that
 * has at least one of its keys, so a task submission (no examId) is indexed by
 * the examId index with examId=null — making a user's 2nd task in a batch fail
 * to create with E11000 ("Duplicate value for userId").
 *
 * FIX: drop the two sparse indexes and recreate them with a partialFilter
 * expression scoped to the field that must exist. Existing data is unaffected
 * (the old index was over-strict; it blocked inserts, it never created dupes).
 *
 * Run from backend root:
 *   npx ts-node src/scripts/fix-submission-unique-indexes.ts            (dry run)
 *   npx ts-node src/scripts/fix-submission-unique-indexes.ts --apply
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const COLLECTION = "internshipsubmissions";
const OLD = ["userId_1_examId_1_batchId_1", "userId_1_taskId_1_batchId_1"];

async function run() {
  const apply = process.argv.includes("--apply");
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not defined");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  const coll = mongoose.connection.collection(COLLECTION);

  const before = await coll.indexes();
  console.log("\nCurrent indexes:");
  before.forEach((i) => console.log(`  ${i.name}  ${JSON.stringify(i.key)}  ${i.sparse ? "sparse" : i.partialFilterExpression ? "partial" : ""}`));

  // Pre-flight: confirm the partial unique indexes won't collide with existing data.
  for (const [field, key] of [
    ["examId", { userId: 1, examId: 1, batchId: 1 }],
    ["taskId", { userId: 1, taskId: 1, batchId: 1 }],
  ] as const) {
    const dupes = await coll
      .aggregate([
        { $match: { [field]: { $exists: true } } },
        { $group: { _id: { u: "$userId", k: `$${field}`, b: "$batchId" }, n: { $sum: 1 } } },
        { $match: { n: { $gt: 1 } } },
        { $count: "groups" },
      ])
      .toArray();
    const n = (dupes[0] as { groups?: number } | undefined)?.groups ?? 0;
    console.log(`\nDuplicate (userId, ${field}, batchId) groups: ${n}${n ? "  ⚠️ would block the unique index — investigate before applying" : "  ✓"}`);
    void key;
  }

  if (!apply) {
    console.log("\n[DRY RUN] No changes written. Re-run with --apply to drop the sparse indexes and create partial ones.");
    await mongoose.connection.close();
    process.exit(0);
  }

  for (const name of OLD) {
    if (before.some((i) => i.name === name)) {
      console.log(`\nDropping ${name}...`);
      await coll.dropIndex(name);
    } else {
      console.log(`\n${name} not present (already migrated?) — skipping drop.`);
    }
  }

  // Recreate with the SAME default names Mongoose generates from the schema
  // (userId_1_examId_1_batchId_1, ...) so the app's autoIndex sees them as
  // already-present and never tries to create a conflicting duplicate.
  console.log("\nCreating partial unique indexes...");
  await coll.createIndex(
    { userId: 1, examId: 1, batchId: 1 },
    { unique: true, partialFilterExpression: { examId: { $exists: true } } },
  );
  await coll.createIndex(
    { userId: 1, taskId: 1, batchId: 1 },
    { unique: true, partialFilterExpression: { taskId: { $exists: true } } },
  );

  const after = await coll.indexes();
  console.log("\nIndexes after migration:");
  after.forEach((i) => console.log(`  ${i.name}  ${JSON.stringify(i.key)}  ${i.partialFilterExpression ? "partial " + JSON.stringify(i.partialFilterExpression) : ""}`));

  console.log("\n✅ Done.");
  await mongoose.connection.close();
  process.exit(0);
}

run().catch(async (e) => {
  console.error("\n❌ Error:", e);
  try {
    await mongoose.connection.close();
  } catch {}
  process.exit(1);
});
