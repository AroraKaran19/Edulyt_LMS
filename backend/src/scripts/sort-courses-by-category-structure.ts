/**
 * Sorts courses and categories according to the structure defined in course-category-structure.json.
 *
 * Fetches all courses from DB, resolves course names to IDs, outputs mapping with courseId.
 *
 * Usage (from backend root):
 *   npx ts-node src/scripts/sort-courses-by-category-structure.ts
 *   npx ts-node src/scripts/sort-courses-by-category-structure.ts --output scripts/course-category-mapping.json
 *   npx ts-node src/scripts/sort-courses-by-category-structure.ts --apply   # Also run the assign script
 *   npx ts-node src/scripts/sort-courses-by-category-structure.ts --list-courses  # Output courses list for reference
 */

import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { spawnSync } from "child_process";
import { connectDB, disconnectDB } from "../config/database";
import { CourseModel } from "../models";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const DEFAULT_STRUCTURE_PATH = path.resolve(
  __dirname,
  "../../scripts/course-category-structure.json"
);
const DEFAULT_OUTPUT_PATH = path.resolve(
  __dirname,
  "../../scripts/course-category-mapping.json"
);
const DEFAULT_COURSES_LIST_PATH = path.resolve(
  __dirname,
  "../../scripts-output/courses-list.json"
);

interface CategoryStructure {
  categoryName: string;
  courses: string[];
}

interface StructureFile {
  description?: string;
  structure: CategoryStructure[];
  structureProfessionals?: CategoryStructure[];
}

interface MappingEntryByName {
  courseName: string;
  categoryName: string;
}

interface MappingEntryById {
  courseId: string;
  categoryName: string;
  courseTitle?: string;
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

function structureToMappingByName(structure: StructureFile): MappingEntryByName[] {
  const mapping: MappingEntryByName[] = [];

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

async function main() {
  const args = process.argv.slice(2);
  const outputIdx = args.indexOf("--output");
  const outputPath =
    outputIdx >= 0 && args[outputIdx + 1]
      ? path.resolve(process.cwd(), args[outputIdx + 1])
      : DEFAULT_OUTPUT_PATH;
  const shouldApply = args.includes("--apply");
  const dryRun = args.includes("--dry-run");
  const listCoursesOnly = args.includes("--list-courses");

  if (listCoursesOnly) {
    await connectDB();
    const courses = await CourseModel.find({}).select("_id title").lean();
    const list = courses.map((c) => ({
      _id: String(c._id),
      title: c.title,
    }));
    const dir = path.dirname(DEFAULT_COURSES_LIST_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DEFAULT_COURSES_LIST_PATH, JSON.stringify(list, null, 2), "utf-8");
    console.log(`✅ Wrote ${list.length} courses to: ${DEFAULT_COURSES_LIST_PATH}`);
    await disconnectDB();
    process.exit(0);
    return;
  }

  console.log("📁 Loading structure from:", DEFAULT_STRUCTURE_PATH);
  const structure = loadStructure(DEFAULT_STRUCTURE_PATH);

  let mappingByName = structureToMappingByName(structure);
  if (structure.structureProfessionals?.length) {
    const profMapping = structureToMappingByName({
      structure: structure.structureProfessionals,
    });
    mappingByName = [...mappingByName, ...profMapping];
    console.log(
      `📊 Categories: ${structure.structure.length} college + ${structure.structureProfessionals.length} professionals`
    );
  } else {
    console.log(`📊 Categories: ${structure.structure.length}`);
  }

  console.log("🔄 Connecting to DB and fetching courses...");
  await connectDB();
  const courses = await CourseModel.find({}).select("_id title").lean();
  const titleToId = new Map<string, string>();
  const idToTitle = new Map<string, string>();
  for (const c of courses) {
    const id = String(c._id);
    const title = (c.title || "").trim();
    titleToId.set(title, id);
    idToTitle.set(id, title);
  }
  console.log(`📋 Loaded ${courses.length} courses from DB`);

  // Optionally write courses list for reference
  const listPath = path.resolve(path.dirname(outputPath), "courses-list.json");
  const listDir = path.dirname(listPath);
  if (!fs.existsSync(listDir)) fs.mkdirSync(listDir, { recursive: true });
  const coursesList = Array.from(courses).map((c) => ({
    _id: String(c._id),
    title: c.title,
  }));
  fs.writeFileSync(listPath, JSON.stringify(coursesList, null, 2), "utf-8");
  console.log(`📄 Courses list written to: ${listPath}`);

  // Resolve course names to IDs
  const mapping: MappingEntryById[] = [];
  const notFound: string[] = [];
  for (const entry of mappingByName) {
    const courseName = entry.courseName.trim();
    const courseId = titleToId.get(courseName);
    if (courseId) {
      mapping.push({
        courseId,
        categoryName: entry.categoryName,
        courseTitle: idToTitle.get(courseId),
      });
    } else {
      notFound.push(courseName);
    }
  }

  const uniqueNotFound = [...new Set(notFound)];
  if (uniqueNotFound.length > 0) {
    console.warn("\n⚠️  Course names in structure not found in DB (exact title match):");
    uniqueNotFound.forEach((n) => console.warn("  -", n));
  }

  console.log(`📝 Mapping entries (resolved to IDs): ${mapping.length}`);

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write mapping with courseId (assign script will use IDs directly)
  const mappingForAssign = mapping.map(({ courseId, categoryName }) => ({
    courseId,
    categoryName,
  }));
  fs.writeFileSync(outputPath, JSON.stringify(mappingForAssign, null, 2), "utf-8");
  console.log("✅ Wrote mapping (with course IDs) to:", outputPath);

  await disconnectDB();

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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
