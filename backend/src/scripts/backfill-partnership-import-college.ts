/**
 * Backfill `partnershipImportConfig.college` (ObjectId ref) on configs that
 * pre-date the college-binding change.
 *
 * The old modal stored a free-text `title` ("MVC Uni partnership"). The new
 * modal binds a `College` and snapshots its name into `title`. This script
 * tries to attach existing configs to a real college so admins don't have to
 * re-edit each one by hand.
 *
 * Matching strategy (tried in order, first hit wins):
 *   1. Exact — case-insensitive match of `title` against `College.name`.
 *   2. Name-contained — exactly one college whose `name` appears as a
 *      substring of the title (handles "MVC Uni partnership" → "MVC Uni").
 *      Skipped when 2+ colleges match to avoid mis-binding.
 *   3. Unresolved — logged for manual review; nothing written. The admin can
 *      open the config in the modal and pick a college.
 *
 * When a match is found, `college` is set AND `title` is normalised to the
 * matched `College.name` so the display name stays a clean snapshot.
 *
 * Run from backend root:
 *   # preview every config that would be touched:
 *   npx ts-node src/scripts/backfill-partnership-import-college.ts
 *   # apply changes:
 *   npx ts-node src/scripts/backfill-partnership-import-college.ts --apply
 */

import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { PartnershipImportConfigModel } from "../models/partnershipImportConfig.schema";
import { CollegeModel } from "../models/college.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const APPLY = process.argv.includes("--apply");

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface CollegeLean {
  _id: unknown;
  name: string;
  location?: string;
}

type MatchOutcome =
  | { kind: "exact"; college: CollegeLean }
  | { kind: "contained"; college: CollegeLean }
  | { kind: "ambiguous"; count: number }
  | { kind: "none" };

async function matchCollegeForTitle(
  title: string,
  cache: Map<string, MatchOutcome>,
): Promise<MatchOutcome> {
  const key = title.trim().toLowerCase();
  const cached = cache.get(key);
  if (cached) return cached;

  // 1. Exact, case-insensitive.
  const exact = (await CollegeModel.findOne({
    name: { $regex: `^${escapeRegex(title.trim())}$`, $options: "i" },
  })
    .select("_id name location")
    .lean()) as unknown as CollegeLean | null;

  if (exact) {
    const out: MatchOutcome = { kind: "exact", college: exact };
    cache.set(key, out);
    return out;
  }

  // 2. Title contains a known college name. Querying the other direction
  //    (name regex against title) isn't index-friendly, so scan colleges and
  //    keep matches whose name is a case-insensitive substring of the title.
  //    Performance is fine for the size of the colleges collection.
  const candidates = (await CollegeModel.find()
    .select("_id name location")
    .lean()) as unknown as CollegeLean[];

  const lowerTitle = title.toLowerCase();
  const hits = candidates.filter((c) => {
    const n = String(c.name ?? "").trim().toLowerCase();
    return n.length >= 3 && lowerTitle.includes(n);
  });

  let out: MatchOutcome;
  if (hits.length === 1) {
    out = { kind: "contained", college: hits[0] };
  } else if (hits.length > 1) {
    out = { kind: "ambiguous", count: hits.length };
  } else {
    out = { kind: "none" };
  }
  cache.set(key, out);
  return out;
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}\n`);

  const configs = await PartnershipImportConfigModel.find({
    $or: [{ college: { $exists: false } }, { college: null }],
  })
    .select("_id title kind isActive")
    .lean();

  console.log(`Configs missing a college link: ${configs.length}\n`);
  if (configs.length === 0) {
    await mongoose.disconnect();
    return;
  }

  const cache = new Map<string, MatchOutcome>();
  let exactCount = 0;
  let containedCount = 0;
  let ambiguousCount = 0;
  let unmatchedCount = 0;
  let updated = 0;

  for (const c of configs) {
    const cr = c as Record<string, unknown>;
    const title = String(cr.title ?? "").trim();
    if (!title) {
      console.log(`  SKIP (empty title)  ${cr._id}`);
      unmatchedCount += 1;
      continue;
    }

    const result = await matchCollegeForTitle(title, cache);

    if (result.kind === "none") {
      console.log(`  UNMATCHED   ${cr._id} | "${title}"`);
      unmatchedCount += 1;
      continue;
    }

    if (result.kind === "ambiguous") {
      console.log(
        `  AMBIGUOUS   ${cr._id} | "${title}" — ${result.count} colleges contained, skipping`,
      );
      ambiguousCount += 1;
      continue;
    }

    const tag = result.kind === "exact" ? "MATCH(exact)    " : "MATCH(contained)";
    console.log(
      `  ${tag} ${cr._id} | "${title}" → ${result.college._id} (${result.college.name}${result.college.location ? ", " + result.college.location : ""})`,
    );
    if (result.kind === "exact") exactCount += 1;
    else containedCount += 1;

    if (APPLY) {
      await PartnershipImportConfigModel.updateOne(
        { _id: cr._id },
        {
          $set: {
            college: result.college._id,
            // Normalise the display-name snapshot to the canonical college name.
            title: String(result.college.name ?? "").trim(),
          },
        },
      );
      updated += 1;
    }
  }

  console.log(`\nMatched (exact):     ${exactCount}`);
  console.log(`Matched (contained): ${containedCount}`);
  console.log(`Ambiguous (skipped): ${ambiguousCount}`);
  console.log(`Unmatched:           ${unmatchedCount}`);
  if (APPLY) {
    console.log(`Updated:             ${updated}`);
  } else {
    console.log("\nDry run complete. Re-run with --apply to write.");
  }
  console.log(
    "\nUnmatched / ambiguous configs need a manual college pick — open each in the partnership import modal and select one.",
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
