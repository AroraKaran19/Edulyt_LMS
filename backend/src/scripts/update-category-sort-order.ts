/**
 * Updates category sortOrder in the database to match the order in course-category-structure.json.
 * Categories in the structure get sortOrder 1, 2, 3, ... (by position).
 * Categories not in the structure get sortOrder 999 (appear at end).
 *
 * Run from backend root:
 *   npx ts-node src/scripts/update-category-sort-order.ts
 *   npx ts-node src/scripts/update-category-sort-order.ts --dry-run
 */

import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { connectDB, disconnectDB } from "../config/database";
import { CategoryModel } from "../models";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const STRUCTURE_PATH = path.resolve(
  __dirname,
  "../../scripts/course-category-structure.json"
);

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (!fs.existsSync(STRUCTURE_PATH)) {
    console.error("Structure file not found:", STRUCTURE_PATH);
    process.exit(1);
  }

  const raw = fs.readFileSync(STRUCTURE_PATH, "utf-8");
  let data: {
    categoryOrder?: string[];
    structure?: { categoryName: string }[];
  };
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error("Invalid JSON in structure file");
    process.exit(1);
  }

  // Use categoryOrder if present (for display sort), else derive from structure
  const categoryOrder =
    data.categoryOrder && Array.isArray(data.categoryOrder)
      ? data.categoryOrder.map((n) => String(n).trim()).filter(Boolean)
      : (data.structure || []).map((s) => (s.categoryName || "").trim()).filter(Boolean);

  console.log("📁 Loaded", categoryOrder.length, "categories from structure");
  if (dryRun) {
    console.log("[DRY RUN] No changes will be written.");
  }

  await connectDB();

  const updates: { name: string; sortOrder: number }[] = [];
  const notFound: string[] = [];

  for (let i = 0; i < categoryOrder.length; i++) {
    const name = categoryOrder[i];
    const category = await CategoryModel.findOne({ name });
    if (category) {
      updates.push({ name, sortOrder: i + 1 });
    } else {
      notFound.push(name);
    }
  }

  if (notFound.length > 0) {
    console.warn("\n⚠️  Categories in structure not found in DB:");
    notFound.forEach((n) => console.warn("  -", n));
  }

  if (!dryRun) {
    for (const { name, sortOrder } of updates) {
      await CategoryModel.updateOne({ name }, { $set: { sortOrder } });
      console.log(`✅ ${name} → sortOrder ${sortOrder}`);
    }

    // Set sortOrder 999 for categories not in structure
    const updatedIds = (await CategoryModel.find({ name: { $in: categoryOrder } }).select("_id")).map(
      (c) => c._id
    );
    const result = await CategoryModel.updateMany(
      { _id: { $nin: updatedIds } },
      { $set: { sortOrder: 999 } }
    );
    if (result.modifiedCount > 0) {
      console.log(`✅ ${result.modifiedCount} other categories → sortOrder 999`);
    }
  } else {
    console.log("\nWould update:");
    updates.forEach((u) => console.log(`  ${u.name} → sortOrder ${u.sortOrder}`));
  }

  console.log(`\n✅ Done. ${updates.length} categories in structure.`);
  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
