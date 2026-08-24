/**
 * Backfills `College.state` from the free-text `location`.
 *
 * `location` was only ever a display string, so the directory accumulated four
 * shapes: "{State}, India" (what the importer writes), "{City}, {State}", a
 * bare state, and a bare city. `deriveStateFromLocation` handles the first
 * three; the bare cities are listed in CITY_STATES below because no rule can
 * recover them.
 *
 * Rows that already carry a state are left alone unless --overwrite is passed,
 * so re-running never stomps a correction an admin made by hand.
 *
 * Usage (from backend/):
 *   npx ts-node src/scripts/backfill-college-state.ts --dry-run
 *   npx ts-node src/scripts/backfill-college-state.ts
 *   npx ts-node src/scripts/backfill-college-state.ts --overwrite
 */

import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/database";
import { CollegeModel } from "../models";
import {
  deriveStateFromLocation,
  normalizeState,
  type IndianState,
} from "../constants/indianStates";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const CHUNK_SIZE = 1000;

/**
 * Locations that name only a city (or a parenthesised district), keyed by the
 * exact stored value, lowercased. Every entry here was read out of the live
 * directory; anything not listed is reported as unresolved rather than guessed.
 */
const CITY_STATES: Record<string, IndianState> = {
  agartala: "Tripura",
  aizawl: "Mizoram",
  "andhra pradesh (tadepalligudem)": "Andhra Pradesh",
  bengaluru: "Karnataka",
  "greater noida": "Uttar Pradesh",
  gurgaon: "Haryana",
  gurugram: "Haryana",
  gwalior: "Madhya Pradesh",
  jaipur: "Rajasthan",
  karaikal: "Puducherry",
  kolkata: "West Bengal",
  lucknow: "Uttar Pradesh",
  mohali: "Punjab",
  mumbai: "Maharashtra",
  noida: "Uttar Pradesh",
  patna: "Bihar",
  raipur: "Chhattisgarh",
  ranchi: "Jharkhand",
  ravangla: "Sikkim",
  shillong: "Meghalaya",
};

const resolveState = (location: unknown): IndianState | null => {
  const derived = deriveStateFromLocation(location);
  if (derived) return derived;
  if (typeof location !== "string") return null;
  return CITY_STATES[location.trim().toLowerCase().replace(/\s+/g, " ")] ?? null;
};

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const overwrite = args.includes("--overwrite");

  await connectDB();

  try {
    const docs = await CollegeModel.find(
      {},
      { _id: 1, name: 1, location: 1, state: 1 },
    ).lean();

    const byState = new Map<IndianState, mongoose.Types.ObjectId[]>();
    const unresolved = new Map<string, number>();
    let alreadySet = 0;
    let unchanged = 0;

    for (const doc of docs) {
      const current = normalizeState(
        (doc as { state?: unknown }).state,
      );
      if (current && !overwrite) {
        alreadySet++;
        continue;
      }

      const state = resolveState(doc.location);
      if (!state) {
        const key = String(doc.location ?? "");
        unresolved.set(key, (unresolved.get(key) ?? 0) + 1);
        continue;
      }
      if (state === current) {
        unchanged++;
        continue;
      }

      // `College._id` is typed as a string, but a lean doc hands back the real
      // ObjectId; normalise so the $in matches regardless.
      const id = new mongoose.Types.ObjectId(String(doc._id));
      const list = byState.get(state);
      if (list) list.push(id);
      else byState.set(state, [id]);
    }

    const toWrite = [...byState.values()].reduce((n, ids) => n + ids.length, 0);

    console.log(`Colleges scanned:          ${docs.length}`);
    console.log(`Already had a state:       ${alreadySet}`);
    console.log(`Already correct:           ${unchanged}`);
    console.log(`Will set a state:          ${toWrite}`);
    console.log(`Distinct states resolved:  ${byState.size}`);
    console.log(
      `Unresolved rows:           ${[...unresolved.values()].reduce(
        (n, c) => n + c,
        0,
      )}`,
    );
    if (unresolved.size > 0) {
      console.log("\nUnresolved location values (left without a state):");
      for (const [loc, count] of [...unresolved].sort((a, b) => b[1] - a[1])) {
        console.log(`  ${JSON.stringify(loc)} x${count}`);
      }
    }

    if (dryRun) {
      console.log("\n--dry-run: no database writes.");
      return;
    }

    // One updateMany per state, chunked, rather than a write per document:
    // every filter is an _id $in, so each batch is index-driven.
    let modified = 0;
    for (const [state, ids] of byState) {
      for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        const chunk = ids.slice(i, i + CHUNK_SIZE);
        const res = await CollegeModel.updateMany(
          { _id: { $in: chunk } },
          { $set: { state } },
        );
        modified += res.modifiedCount;
      }
      console.log(`  ${state}: ${ids.length}`);
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
