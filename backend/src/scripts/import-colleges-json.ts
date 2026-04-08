/**
 * Imports colleges from frontend/public/colleges.json into MongoDB.
 *
 * Source shape: { "Name of the college": string, "State": string }
 * Stored as:    { name, location: "{State}, India", isActive: true }
 *
 * Re-runs are safe: upserts on (name + location) so existing rows are not duplicated.
 *
 * Usage (from backend/):
 *   npx ts-node src/scripts/import-colleges-json.ts
 *   npx ts-node src/scripts/import-colleges-json.ts path/to/custom.json
 *   npx ts-node src/scripts/import-colleges-json.ts --dry-run
 */

import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../config/database";
import { CollegeModel } from "../models";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

interface RawCollege {
  "Name of the college"?: string;
  State?: string;
}

const DEFAULT_JSON = path.resolve(
  __dirname,
  "../../../frontend/public/colleges.json"
);
const CHUNK_SIZE = 1000;

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const pathArg = args.find((a) => !a.startsWith("--"));
  return {
    dryRun,
    jsonPath: pathArg ? path.resolve(process.cwd(), pathArg) : DEFAULT_JSON,
  };
}

function buildDocuments(rows: RawCollege[]) {
  const seen = new Set<string>();
  const docs: { name: string; location: string }[] = [];
  let skippedInvalid = 0;
  let skippedDupInFile = 0;

  for (const row of rows) {
    const name = row["Name of the college"]?.trim();
    const state = row.State?.trim();
    if (!name || !state) {
      skippedInvalid++;
      continue;
    }
    const location = `${state}, India`;
    const key = `${name.toLowerCase()}\u0000${location.toLowerCase()}`;
    if (seen.has(key)) {
      skippedDupInFile++;
      continue;
    }
    seen.add(key);
    docs.push({ name, location });
  }

  return { docs, skippedInvalid, skippedDupInFile };
}

async function main() {
  const { dryRun, jsonPath } = parseArgs();

  if (!fs.existsSync(jsonPath)) {
    console.error("File not found:", jsonPath);
    process.exit(1);
  }

  let rows: RawCollege[];
  try {
    rows = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  } catch (e) {
    console.error("Invalid JSON:", e);
    process.exit(1);
  }

  if (!Array.isArray(rows)) {
    console.error("Expected a JSON array of college objects.");
    process.exit(1);
  }

  const { docs, skippedInvalid, skippedDupInFile } = buildDocuments(rows);

  console.log(`Source file: ${jsonPath}`);
  console.log(`Total rows in file: ${rows.length}`);
  console.log(`Valid unique rows to import: ${docs.length}`);
  console.log(`Skipped (missing name/state): ${skippedInvalid}`);
  console.log(`Skipped (duplicate in file): ${skippedDupInFile}`);

  if (dryRun) {
    console.log("\n--dry-run: no database writes.");
    if (docs.length > 0) {
      console.log("Sample:", docs[0]);
    }
    process.exit(0);
  }

  await connectDB();

  let upserted = 0;
  let matched = 0;

  try {
    for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
      const chunk = docs.slice(i, i + CHUNK_SIZE);
      const bulkOps = chunk.map((d) => ({
        updateOne: {
          filter: { name: d.name, location: d.location },
          update: {
            $setOnInsert: {
              name: d.name,
              location: d.location,
              isActive: true,
            },
          },
          upsert: true,
        },
      }));

      const res = await CollegeModel.bulkWrite(bulkOps, { ordered: false });
      upserted += res.upsertedCount;
      matched += res.matchedCount;

      const done = Math.min(i + CHUNK_SIZE, docs.length);
      console.log(`Progress: ${done} / ${docs.length}`);
    }

    console.log("\nDone.");
    console.log(`Upserted (new documents): ${upserted}`);
    console.log(`Matched (already existed): ${matched}`);
  } finally {
    await disconnectDB();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
