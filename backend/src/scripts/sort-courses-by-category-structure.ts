/**
 * Sorts courses and categories according to the structure defined in course-category-structure.json.
 *
 * The structure file defines:
 * - Category order (grid: top row 1-5, bottom row 6-10)
 * - Course order within each category
 *
 * Output: A flat mapping array compatible with assign-courses-to-categories.ts
 *
 * Usage (from backend root):
 *   npx ts-node src/scripts/sort-courses-by-category-structure.ts
 *   npx ts-node src/scripts/sort-courses-by-category-structure.ts --output scripts/course-category-mapping.json
 *   npx ts-node src/scripts/sort-courses-by-category-structure.ts --apply   # Also run the assign script
 */

import path from "path";
import fs from "fs";
import { spawnSync } from "child_process";

const DEFAULT_STRUCTURE_PATH = path.resolve(
  __dirname,
  "../../scripts/course-category-structure.json"
);
const DEFAULT_OUTPUT_PATH = path.resolve(
  __dirname,
  "../../scripts/course-category-mapping.json"
);

interface CategoryStructure {
  categoryName: string;
  courses: string[];
}

interface StructureFile {
  description?: string;
  structure: CategoryStructure[];
}

interface MappingEntry {
  courseName: string;
  categoryName: string;
}

function loadStructure(filePath: string): StructureFile {
  const raw = fs.readFileSync(filePath, "utf-8");
  try {
    const data = JSON.parse(raw);
    if (!data.structure || !Array.isArray(data.structure)) {
      throw new Error("structure must be a non-empty array");
    }
    return data;
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error(`Invalid JSON in structure file: ${e.message}`);
    }
    throw e;
  }
}

function structureToMapping(structure: StructureFile): MappingEntry[] {
  const mapping: MappingEntry[] = [];

  for (const cat of structure.structure) {
    const categoryName = (cat.categoryName || "").trim();
    if (!categoryName) continue;

    const courses = cat.courses || [];
    for (const courseName of courses) {
      const trimmed = (courseName || "").trim();
      if (!trimmed) continue;
      mapping.push({ courseName: trimmed, categoryName });
    }
  }

  return mapping;
}

function main() {
  const args = process.argv.slice(2);
  const outputIdx = args.indexOf("--output");
  const outputPath =
    outputIdx >= 0 && args[outputIdx + 1]
      ? path.resolve(process.cwd(), args[outputIdx + 1])
      : DEFAULT_OUTPUT_PATH;
  const shouldApply = args.includes("--apply");
  const dryRun = args.includes("--dry-run");

  console.log("📁 Loading structure from:", DEFAULT_STRUCTURE_PATH);

  const structure = loadStructure(DEFAULT_STRUCTURE_PATH);
  const mapping = structureToMapping(structure);

  console.log(`📊 Categories: ${structure.structure.length}`);
  console.log(`📝 Mapping entries: ${mapping.length}`);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    outputPath,
    JSON.stringify(mapping, null, 2),
    "utf-8"
  );
  console.log("✅ Wrote mapping to:", outputPath);

  if (dryRun) {
    console.log("\n[DRY RUN] Use --apply to run the assign script after generating the mapping.");
  }

  if (args.includes("--update-category-order") || shouldApply) {
    console.log("\n🔄 Updating category sort order in database...");
    const orderResult = spawnSync(
      "npx",
      [
        "ts-node",
        path.resolve(__dirname, "update-category-sort-order.ts"),
        ...(dryRun ? ["--dry-run"] : []),
      ],
      {
        stdio: "inherit",
        cwd: path.resolve(__dirname, "../.."),
      }
    );
    if (orderResult.status !== 0) {
      process.exit(orderResult.status);
    }
  }

  if (shouldApply) {
    console.log("\n🔄 Running assign script...");
    const result = spawnSync(
      "npx",
      [
        "ts-node",
        path.resolve(__dirname, "assign-courses-to-categories.ts"),
        outputPath,
        ...(dryRun ? ["--dry-run"] : []),
      ],
      {
        stdio: "inherit",
        cwd: path.resolve(__dirname, "../.."),
      }
    );
    process.exit(result.status ?? 0);
  }
}

main();
