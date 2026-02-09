/**
 * Assigns courses to categories using a mapping file.
 * Run from backend root: npx ts-node src/scripts/assign-courses-to-categories.ts path/to/mapping.json
 *
 * Mapping file format (JSON):
 * [
 *   { "courseName": "Exact Course Title", "categoryName": "Exact Category Name" },
 *   ...
 * ]
 * OR by category ID:
 * [
 *   { "courseName": "Exact Course Title", "categoryId": "507f1f77bcf86cd799439011" },
 *   ...
 * ]
 *
 * Matching is exact by course title (case-sensitive). Category can be name or _id.
 */

import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/database";
import { CourseModel, CategoryModel } from "../models";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

interface MappingByCategoryName {
  courseName: string;
  categoryName: string;
}

interface MappingByCategoryId {
  courseName: string;
  categoryId: string;
}

type MappingEntry = MappingByCategoryName | MappingByCategoryId;

function isByCategoryId(entry: MappingEntry): entry is MappingByCategoryId {
  return "categoryId" in entry && typeof (entry as MappingByCategoryId).categoryId === "string";
}

async function main() {
  const mappingPath = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");

  if (!mappingPath || !fs.existsSync(mappingPath)) {
    console.error("Usage: npx ts-node src/scripts/assign-courses-to-categories.ts <mapping.json> [--dry-run]");
    console.error("Example mapping.json:");
    console.error('  [{"courseName": "My Course", "categoryName": "My Category"}]');
    process.exit(1);
  }

  const raw = fs.readFileSync(mappingPath, "utf-8");
  let mapping: MappingEntry[];
  try {
    mapping = JSON.parse(raw);
  } catch (e) {
    console.error("Invalid JSON in mapping file:", e);
    process.exit(1);
  }

  if (!Array.isArray(mapping) || mapping.length === 0) {
    console.error("Mapping must be a non-empty array of { courseName, categoryName } or { courseName, categoryId }");
    process.exit(1);
  }

  await connectDB();

  const categories = await CategoryModel.find({}).select("_id name").lean();
  const nameToId = new Map<string, string>();
  const idToId = new Map<string, string>();
  const idPriority = new Map<string, number>();

  // Desired display / storage order for categories (matches screenshot order)
  const desiredCategoryOrder = [
    "Python",
    "Data Analytics",
    "Data Science",
    "SAS Ecosystem - Base, SQL, Macros & BI",
    "SAS - Tools & Modeling",
    "Data Visualization (Power BI, Tableau, SAS, Excel-",
    "Artificial Intelligence (AI & NLP)",
    "Machine Learning & Deep Learning",
    "Business Intelligence & Analytics",
    "Data Science - Architecture & Engineering",
  ];

  for (const c of categories) {
    const id = String(c._id);
    const name = c.name.trim();
    nameToId.set(name, id);
    idToId.set(id, id);

    const idx = desiredCategoryOrder.indexOf(name);
    if (idx !== -1) {
      idPriority.set(id, idx);
    }
  }

  const courseNameToId = new Map<string, string>();
  const courses = await CourseModel.find({}).select("_id title").lean();
  for (const c of courses) {
    courseNameToId.set(c.title.trim(), String(c._id));
  }

  const updates: { courseId: string; courseTitle: string; categoryId: string; categoryName?: string }[] = [];
  const notFoundCourses: string[] = [];
  const notFoundCategories: string[] = [];

  for (const entry of mapping) {
    const courseName = (entry.courseName || "").trim();
    let categoryId: string | null = null;
    let categoryName: string | undefined;

    if (isByCategoryId(entry)) {
      const id = entry.categoryId.trim();
      categoryId = idToId.get(id) ?? null;
    } else {
      categoryName = entry.categoryName.trim();
      categoryId = nameToId.get(categoryName) ?? null;
    }

    const courseId = courseNameToId.get(courseName) ?? null;

    if (!courseId) {
      notFoundCourses.push(courseName);
      continue;
    }
    if (!categoryId) {
      const catLabel = categoryName ?? (isByCategoryId(entry) ? entry.categoryId : "?");
      notFoundCategories.push(catLabel);
      continue;
    }

    updates.push({
      courseId,
      courseTitle: courseName,
      categoryId,
      categoryName,
    });
  }

  const uniqueNotFoundCourses = [...new Set(notFoundCourses)];
  const uniqueNotFoundCategories = [...new Set(notFoundCategories)];

  if (uniqueNotFoundCourses.length > 0) {
    console.warn("\n⚠️  Courses not found (no match by exact title):");
    uniqueNotFoundCourses.forEach((n) => console.warn("  -", n));
  }
  if (uniqueNotFoundCategories.length > 0) {
    console.warn("\n⚠️  Categories not found:");
    uniqueNotFoundCategories.forEach((n) => console.warn("  -", n));
  }

  // Group by course: each course gets an array of all category IDs (unique)
  const courseToCategories = new Map<string, { title: string; categoryIds: string[] }>();
  for (const u of updates) {
    const existing = courseToCategories.get(u.courseId);
    const ids = existing ? existing.categoryIds : [];
    if (!ids.includes(u.categoryId)) ids.push(u.categoryId);
    courseToCategories.set(u.courseId, {
      title: u.courseTitle,
      categoryIds: ids,
    });
  }

  // Per-category order: for each category, order of first appearance of each course in mapping = display order
  const categoryOrderMap = new Map<string, Map<string, number>>(); // categoryId -> (courseId -> order)
  for (const u of updates) {
    if (!categoryOrderMap.has(u.categoryId)) {
      categoryOrderMap.set(u.categoryId, new Map());
    }
    const courseOrderInCat = categoryOrderMap.get(u.categoryId)!;
    if (!courseOrderInCat.has(u.courseId)) {
      courseOrderInCat.set(u.courseId, courseOrderInCat.size + 1);
    }
  }

  // Helper to sort category IDs according to desiredCategoryOrder (fallback keeps relative order)
  const sortCategoryIds = (ids: string[]): string[] => {
    return Array.from(new Set(ids)).sort((a, b) => {
      const pa = idPriority.has(a) ? (idPriority.get(a) as number) : Number.MAX_SAFE_INTEGER;
      const pb = idPriority.has(b) ? (idPriority.get(b) as number) : Number.MAX_SAFE_INTEGER;
      if (pa === pb) return 0;
      return pa - pb;
    });
  };

  const groupedUpdates = Array.from(courseToCategories.entries()).map(([courseId, { title, categoryIds }]) => ({
    courseId,
    courseTitle: title,
    categoryIds: sortCategoryIds(categoryIds),
  }));

  console.log("\n========== Updates to apply (course → categories) ==========");
  console.log(JSON.stringify(groupedUpdates, null, 2));

  if (dryRun) {
    console.log("\n[DRY RUN] No changes written. Remove --dry-run to apply.");
    await disconnectDB();
    process.exit(0);
    return;
  }

  for (const [courseId, { title, categoryIds }] of courseToCategories) {
    const sortedCategories = sortCategoryIds(categoryIds);
    const categoryOrders: { categoryId: mongoose.Types.ObjectId; order: number }[] = [];
    for (const catId of sortedCategories) {
      const order = categoryOrderMap.get(catId)?.get(courseId);
      if (typeof order === "number") {
        categoryOrders.push({
          categoryId: new mongoose.Types.ObjectId(catId),
          order,
        });
      }
    }

    const update: any = {
      category: sortedCategories.map((id) => new mongoose.Types.ObjectId(id)),
      categoryOrders,
    };

    await CourseModel.findByIdAndUpdate(courseId, update);
    console.log(`✅ ${title} → ${sortedCategories.length} categor(ies), categoryOrders set`);
  }

  console.log(`\n✅ Done. Updated ${courseToCategories.size} course(s).`);
  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
