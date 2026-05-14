/**
 * Drop the `taskType` field from all InternshipTask documents.
 *
 * Schema previously had `taskType: "attendance" | "task"` — the attendance
 * concept was removed and the field is no longer modeled. With Mongoose strict
 * mode, leaving the field in the DB is harmless but `$exists`-based queries
 * and dumps still see it. This sweep cleans it up.
 *
 * Run from backend root:
 *   # preview
 *   npx ts-node src/scripts/drop-taskType-from-internship-tasks.ts
 *   # apply
 *   npx ts-node src/scripts/drop-taskType-from-internship-tasks.ts --apply
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "";
const APPLY = process.argv.includes("--apply");

async function main() {
  if (!MONGO_URI) {
    console.error("No MONGO_URI / MONGODB_URI in env");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  if (!db) throw new Error("DB connection not established");
  const col = db.collection("internshiptasks");

  const filter = { taskType: { $exists: true } };
  const count = await col.countDocuments(filter);
  console.log(`Documents with a taskType field: ${count}`);

  if (!APPLY) {
    console.log("Dry run — pass --apply to write changes");
    await mongoose.disconnect();
    return;
  }

  if (count === 0) {
    console.log("Nothing to update");
    await mongoose.disconnect();
    return;
  }

  const result = await col.updateMany(filter, { $unset: { taskType: "" } });
  console.log(`Unset taskType on ${result.modifiedCount} document(s)`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
