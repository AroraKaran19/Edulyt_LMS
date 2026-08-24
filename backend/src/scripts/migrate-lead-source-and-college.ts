/**
 * Converts `Lead.source` from the old `"enquiry-form"` string to the
 * `{ kind }` object, and promotes each lead's free-text college answer to
 * indexed `collegeId` / `collegeName` / `state` fields.
 *
 * The college answer was stored as the display string `"{name}, {location}"`,
 * which cannot be split reliably because college names contain commas. It is
 * matched whole against the same string rebuilt from the directory.
 *
 * Leads whose college was typed rather than picked will not match, which is
 * expected; they keep the raw answer and gain no college fields.
 *
 * Re-runs are safe: rows already carrying an object source or a collegeId are
 * left alone.
 *
 * Usage (from backend/):
 *   npx ts-node src/scripts/migrate-lead-source-and-college.ts --dry-run
 *   npx ts-node src/scripts/migrate-lead-source-and-college.ts
 */

import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/database";
import { CollegeModel, LeadModel } from "../models";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const CHUNK_SIZE = 500;

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  await connectDB();

  try {
    // One pass over the directory into memory beats a query per lead. 12k
    // small documents is a few MB.
    const colleges = await CollegeModel.find(
      {},
      { name: 1, location: 1, state: 1 },
    ).lean();
    const byDisplay = new Map<
      string,
      { id: mongoose.Types.ObjectId; name: string; state: string }
    >();
    for (const c of colleges) {
      byDisplay.set(norm(`${c.name}, ${c.location}`), {
        id: c._id as unknown as mongoose.Types.ObjectId,
        name: c.name,
        state: (c as { state?: string }).state ?? "",
      });
    }
    console.log(`College directory loaded: ${byDisplay.size} display keys`);

    const leads = await LeadModel.find(
      {},
      { source: 1, answers: 1, collegeId: 1 },
    ).lean();
    console.log(`Leads scanned: ${leads.length}`);

    const ops: Parameters<typeof LeadModel.bulkWrite>[0] = [];
    let sourceFixed = 0;
    let collegeMatched = 0;
    let collegeUnmatched = 0;
    const unmatchedSamples: string[] = [];

    for (const lead of leads) {
      const set: Record<string, unknown> = {};

      // A pre-migration row has a bare string here; a migrated one has an
      // object with a `kind`.
      const rawSource = lead.source as unknown;
      if (typeof rawSource === "string" || !rawSource) {
        set.source = { kind: "enquiry", testId: null, title: "", slug: "" };
        sourceFixed++;
      }

      if (!lead.collegeId) {
        const answer = (lead.answers ?? []).find((a) => a.key === "college");
        const value = answer?.value?.trim();
        if (value) {
          const hit = byDisplay.get(norm(value));
          if (hit) {
            set.collegeId = hit.id;
            set.collegeName = hit.name;
            if (hit.state) set.state = hit.state;
            collegeMatched++;
          } else {
            collegeUnmatched++;
            if (unmatchedSamples.length < 15) unmatchedSamples.push(value);
          }
        }
      }

      if (Object.keys(set).length > 0) {
        ops.push({
          updateOne: { filter: { _id: lead._id }, update: { $set: set } },
        });
      }
    }

    console.log(`source converted:   ${sourceFixed}`);
    console.log(`college matched:    ${collegeMatched}`);
    console.log(`college unmatched:  ${collegeUnmatched}`);
    console.log(`documents to write: ${ops.length}`);
    if (unmatchedSamples.length > 0) {
      console.log("\nUnmatched college answers (sample):");
      for (const s of unmatchedSamples) console.log(`  ${JSON.stringify(s)}`);
    }

    if (dryRun) {
      console.log("\n--dry-run: no database writes.");
      return;
    }

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
