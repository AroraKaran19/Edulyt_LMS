/**
 * Moves three unique keys from a single field to a brand-scoped pair:
 *   referralprofiles  userId        -> { userId, brand }
 *   categories        name          -> { name, brand }
 *   courses           slug          -> { slug, brand }
 *
 * Mongoose creates the new indexes on boot but never drops the old ones, and
 * the old ones keep enforcing one referral profile per person, one category per
 * name, and one course per slug across both brands. Brand-scoped referral
 * cannot ship until this has run, and until the course swap runs, a course
 * copied to the other brand cannot keep its URL.
 *
 * Re-runs are safe: an existing index is left alone and a missing one is not an
 * error.
 *
 * Usage (from backend/):
 *   npx ts-node src/scripts/migrate-brand-unique-indexes.ts
 *   npx ts-node src/scripts/migrate-brand-unique-indexes.ts --apply
 */

import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/database";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

interface IndexSwap {
  collection: string;
  create: { keys: Record<string, 1>; name: string };
  drop: string;
}

const SWAPS: IndexSwap[] = [
  {
    collection: "referralprofiles",
    create: { keys: { userId: 1, brand: 1 }, name: "userId_1_brand_1" },
    drop: "userId_1",
  },
  {
    collection: "categories",
    create: { keys: { name: 1, brand: 1 }, name: "name_1_brand_1" },
    drop: "name_1",
  },
  {
    collection: "courses",
    create: { keys: { slug: 1, brand: 1 }, name: "slug_1_brand_1" },
    drop: "slug_1",
  },
];

async function main() {
  const apply = process.argv.includes("--apply");
  await connectDB();

  try {
    for (const swap of SWAPS) {
      const collection = mongoose.connection.collection(swap.collection);
      const existing = await collection.indexes();
      const names = new Set(existing.map((index) => index.name));

      const needsCreate = !names.has(swap.create.name);
      const needsDrop = names.has(swap.drop);

      console.log(`\n${swap.collection}`);
      console.log(`  create ${swap.create.name}: ${needsCreate ? "yes" : "already there"}`);
      console.log(`  drop   ${swap.drop}: ${needsDrop ? "yes" : "already gone"}`);

      if (!apply) continue;

      if (needsCreate) {
        await collection.createIndex(swap.create.keys, {
          unique: true,
          name: swap.create.name,
        });
        console.log(`  created ${swap.create.name}`);
      }
      // Only after the replacement exists, so the constraint is never absent.
      if (needsDrop) {
        await collection.dropIndex(swap.drop);
        console.log(`  dropped ${swap.drop}`);
      }
    }

    if (!apply) {
      console.log("\nNo --apply: nothing was changed.");
    }
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
