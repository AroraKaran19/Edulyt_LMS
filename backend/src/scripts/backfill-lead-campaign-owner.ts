/**
 * Fills `Lead.source.campaignOwnerName` on scholarship leads captured before
 * the field existed, so the CRM can name who ran the campaign that produced
 * them rather than showing them as "Direct".
 *
 * The name is copied from the campaign's own frozen `createdByName`. Leads
 * whose campaign has since been deleted keep an empty owner: there is nothing
 * left to read it from, and the lead's title and slug still identify it.
 *
 * Re-runs are safe: rows that already carry a non-empty owner are skipped.
 *
 * Usage (from backend/):
 *   npx ts-node src/scripts/backfill-lead-campaign-owner.ts --dry-run
 *   npx ts-node src/scripts/backfill-lead-campaign-owner.ts
 */

import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/database";
import { LeadModel } from "../models";
import { ScholarshipTestModel } from "../models/scholarshipTest.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const CHUNK_SIZE = 500;

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  await connectDB();

  try {
    const leads = await LeadModel.find(
      {
        "source.kind": "scholarship",
        "source.testId": { $ne: null },
        $or: [
          { "source.campaignOwnerName": { $exists: false } },
          { "source.campaignOwnerName": "" },
        ],
      },
      { "source.testId": 1 },
    ).lean();

    console.log(`Scholarship leads missing an owner: ${leads.length}`);
    if (leads.length === 0) return;

    // One query for the distinct campaigns rather than one per lead: a campaign
    // that ran well is behind hundreds of these rows.
    const testIds = [
      ...new Set(leads.map((lead) => String(lead.source?.testId))),
    ].map((id) => new mongoose.Types.ObjectId(id));

    const campaigns = await ScholarshipTestModel.find(
      { _id: { $in: testIds } },
      { createdByName: 1 },
    ).lean();

    const ownerById = new Map(
      campaigns.map((c) => [String(c._id), c.createdByName ?? ""]),
    );
    console.log(`Campaigns still on record: ${ownerById.size}`);

    const ops: Parameters<typeof LeadModel.bulkWrite>[0] = [];
    let unresolved = 0;
    for (const lead of leads) {
      const owner = ownerById.get(String(lead.source?.testId));
      if (!owner) {
        unresolved += 1;
        continue;
      }
      ops.push({
        updateOne: {
          filter: { _id: lead._id },
          update: { $set: { "source.campaignOwnerName": owner } },
        },
      });
    }

    console.log(`To update: ${ops.length}`);
    console.log(`Left blank (campaign deleted or unnamed): ${unresolved}`);

    if (dryRun) {
      console.log("\n--dry-run: no database writes.");
      return;
    }
    if (ops.length === 0) return;

    let modified = 0;
    for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
      const res = await LeadModel.bulkWrite(ops.slice(i, i + CHUNK_SIZE), {
        ordered: false,
      });
      modified += res.modifiedCount;
      console.log(
        `Progress: ${Math.min(i + CHUNK_SIZE, ops.length)} / ${ops.length}`,
      );
    }
    console.log(`\nDone. Documents modified: ${modified}`);
  } finally {
    await disconnectDB();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
