/**
 * Backfill `student.college` (ObjectId ref) from the free-text `collegeName`
 * field that was written before ID-based linking was added.
 *
 * Matching strategy (tried in order, first hit wins):
 *   1. Exact — split `collegeName` at the first ", " to get (name, location);
 *      query CollegeModel for an exact case-insensitive match on both.
 *   2. Name-only — same split, match only on the name field (ignores location
 *      differences like "Mumbai" vs "Mumbai, Maharashtra").
 *   3. Unresolved — logged for manual review; nothing written.
 *
 * Run from backend root:
 *   # preview every row that would be touched:
 *   npx ts-node src/scripts/backfill-student-college-ids.ts
 *   # apply changes:
 *   npx ts-node src/scripts/backfill-student-college-ids.ts --apply
 */

import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { UserModel } from "../models/user.schema";
import { CollegeModel } from "../models/college.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const APPLY = process.argv.includes("--apply");

interface CollegeLean {
  _id: unknown;
  name: string;
  location?: string;
}

async function findCollegeForName(
  collegeName: string,
  collegeCache: Map<string, CollegeLean | null>,
): Promise<CollegeLean | null> {
  const key = collegeName.trim().toLowerCase();
  if (collegeCache.has(key)) return collegeCache.get(key)!;

  const separatorIdx = collegeName.indexOf(", ");
  const namePart =
    separatorIdx !== -1 ? collegeName.slice(0, separatorIdx).trim() : collegeName.trim();
  const locationPart =
    separatorIdx !== -1 ? collegeName.slice(separatorIdx + 2).trim() : null;

  // Strategy 1: exact name + location match
  if (locationPart) {
    const hit = await CollegeModel.findOne({
      name: { $regex: `^${escapeRegex(namePart)}$`, $options: "i" },
      $or: [
        { location: { $regex: `^${escapeRegex(locationPart)}$`, $options: "i" } },
        { city: { $regex: `^${escapeRegex(locationPart)}$`, $options: "i" } },
      ],
    })
      .select("_id name location")
      .lean() as unknown as CollegeLean | null;

    if (hit) {
      collegeCache.set(key, hit);
      return hit;
    }
  }

  // Strategy 2: name-only match (unique result required to avoid ambiguity)
  const nameMatches = await CollegeModel.find({
    name: { $regex: `^${escapeRegex(namePart)}$`, $options: "i" },
  })
    .select("_id name location")
    .lean() as unknown as CollegeLean[];

  if (nameMatches.length === 1) {
    collegeCache.set(key, nameMatches[0]);
    return nameMatches[0];
  }

  if (nameMatches.length > 1) {
    console.warn(
      `  ~ ambiguous: "${collegeName}" matched ${nameMatches.length} colleges by name — skipping`,
    );
    collegeCache.set(key, null);
    return null;
  }

  collegeCache.set(key, null);
  return null;
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}\n`);

  const students = await UserModel.find({
    userType: "student",
    collegeName: { $exists: true, $ne: "" },
    $or: [{ college: { $exists: false } }, { college: null }],
  })
    .select("_id email collegeName")
    .lean();

  console.log(`Students with collegeName but no college link: ${students.length}\n`);
  if (students.length === 0) {
    await mongoose.disconnect();
    return;
  }

  const collegeCache = new Map<string, CollegeLean | null>();
  let matched = 0;
  let unmatched = 0;
  let updated = 0;

  for (const s of students) {
    const sr = s as Record<string, unknown>;
    const collegeName = String(sr.collegeName ?? "").trim();
    if (!collegeName) continue;

    const college = await findCollegeForName(collegeName, collegeCache);

    if (!college) {
      console.log(`  UNMATCHED  ${sr._id} | ${sr.email} | "${collegeName}"`);
      unmatched += 1;
      continue;
    }

    console.log(
      `  MATCH  ${sr._id} | "${collegeName}" → ${college._id} (${college.name}${college.location ? ", " + college.location : ""})`,
    );
    matched += 1;

    if (APPLY) {
      await UserModel.updateOne(
        { _id: sr._id },
        { $set: { college: college._id } },
      );
      updated += 1;
    }
  }

  console.log(`\nMatched:   ${matched}`);
  console.log(`Unmatched: ${unmatched}`);
  if (APPLY) {
    console.log(`Updated:   ${updated}`);
  } else {
    console.log("\nDry run complete. Re-run with --apply to write.");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
