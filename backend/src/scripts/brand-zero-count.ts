/**
 * The gate between branding the data and enforcing it. Read-only.
 *
 * Counts what must be zero before `BRAND_ENFORCEMENT` may leave `off`:
 * accounts with no membership, products with no brand, and access records whose
 * brand disagrees with their product's. Exits non-zero when anything is left,
 * so it can gate a deploy.
 *
 * Usage (from backend/):
 *   npx ts-node src/scripts/brand-zero-count.ts
 */

import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/database";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function main() {
  await connectDB();
  const db = mongoose.connection;

  try {
    const checks: { label: string; count: number }[] = [];

    checks.push({
      label: "users with no membership",
      count: await db.collection("users").countDocuments({
        $or: [{ brands: { $exists: false } }, { brands: { $size: 0 } }],
      }),
    });

    for (const collection of [
      "courses",
      "internships",
      "categories",
      "enrollments",
      "certificates",
      "orders",
      "referralprofiles",
      "referralsales",
      "referralwithdrawals",
    ]) {
      checks.push({
        label: `${collection} with no brand`,
        count: await db.collection(collection).countDocuments({ brand: { $exists: false } }),
      });
    }

    checks.push({
      label: "internship enrollments not on edulyt",
      count: await db.collection("internshipenrollments").countDocuments({ brand: { $ne: "edulyt" } }),
    });

    // Access records whose brand no longer matches the course they point at.
    const mismatched = await db.collection("enrollments").aggregate([
      { $match: { courseId: { $ne: null } } },
      { $lookup: { from: "courses", localField: "courseId", foreignField: "_id", as: "course" } },
      { $unwind: "$course" },
      { $match: { $expr: { $ne: ["$brand", "$course.brand"] } } },
      { $count: "count" },
    ]).toArray();
    checks.push({
      label: "enrollments disagreeing with their course",
      count: Number(mismatched[0]?.count ?? 0),
    });

    let failed = 0;
    for (const check of checks) {
      console.log(`${check.label.padEnd(46)} ${String(check.count).padStart(8)}`);
      if (check.count > 0) failed += 1;
    }

    if (failed > 0) {
      console.log(`\n${failed} check(s) are not zero. Do not enable enforcement yet.`);
      process.exitCode = 1;
      return;
    }
    console.log("\nAll checks are zero. Enforcement is safe to enable.");
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
