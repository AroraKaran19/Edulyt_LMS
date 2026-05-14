/**
 * Backfill `certificateType` on CertificateJob documents that were created
 * before the field was added. All existing jobs are course certificates, so
 * every document missing the field gets set to "course".
 *
 * Safe to run multiple times — only touches documents where the field is absent.
 *
 * Run from backend root:
 *   # preview how many rows would be touched:
 *   npx ts-node src/scripts/backfill-certificate-job-type.ts
 *   # apply:
 *   npx ts-node src/scripts/backfill-certificate-job-type.ts --apply
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
  const col = db.collection("certificatejobs");

  const filter = { certificateType: { $exists: false } };

  const count = await col.countDocuments(filter);
  console.log(`Documents missing certificateType: ${count}`);

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

  const result = await col.updateMany(filter, {
    $set: { certificateType: "course" },
  });

  console.log(`Updated ${result.modifiedCount} document(s)`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
