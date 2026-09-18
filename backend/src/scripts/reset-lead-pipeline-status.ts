/**
 * Moves every lead onto the stage/sub-status pipeline, once, per environment.
 *
 * The old flat vocabulary ("contacted", "qualified", "converted", "lost") has
 * no faithful home in the new grid, so every lead is reset to New / New Lead
 * and the pipeline starts clean.
 *
 * `convertedAt`, `convertedBy` and `statusHistory` are deliberately left alone:
 * they are what the CRM leaderboards and the conversion reports read, and
 * clearing them would erase who closed what. A lead therefore may read as
 * New / New Lead while still carrying a conversion date, until someone moves it
 * again; `transitionLeadStatus` clears the pair on the next move that is not a
 * close-won.
 *
 * Re-runs are safe: the filter skips leads already on a valid new-vocabulary
 * stage, so a second run reports zero changes.
 *
 * Usage (from backend/):
 *   npx ts-node src/scripts/reset-lead-pipeline-status.ts
 *   npx ts-node src/scripts/reset-lead-pipeline-status.ts --apply
 */

import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/database";
import {
  DEFAULT_LEAD_STAGE,
  DEFAULT_LEAD_SUB_STATUS,
  LEAD_STAGES,
} from "../constants/leadPipeline";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function main() {
  const apply = process.argv.includes("--apply");
  await connectDB();
  const db = mongoose.connection;

  try {
    const leads = db.collection("leads");

    // A lead is stale when its stage is not one of the new five, or when it
    // carries no sub-status at all.
    const stale = {
      $or: [
        { status: { $nin: [...LEAD_STAGES] } },
        { subStatus: { $exists: false } },
        { subStatus: null },
        { subStatus: "" },
      ],
    };

    const byStatus = await leads
      .aggregate([
        { $match: stale },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    const total = byStatus.reduce((sum, row) => sum + Number(row.count), 0);
    console.log(`leads to reset: ${total}`);
    for (const row of byStatus) {
      console.log(`  ${String(row._id ?? "(none)")}: ${row.count}`);
    }

    const converted = await leads.countDocuments({
      ...stale,
      convertedAt: { $ne: null },
    });
    console.log(`\nof those, carrying a conversion date (kept): ${converted}`);

    if (apply) {
      const result = await leads.updateMany(stale, {
        $set: {
          status: DEFAULT_LEAD_STAGE,
          subStatus: DEFAULT_LEAD_SUB_STATUS,
        },
      });
      console.log(`\nreset: ${result.modifiedCount}`);
    } else {
      console.log("\nNo --apply: nothing was written.");
    }
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
