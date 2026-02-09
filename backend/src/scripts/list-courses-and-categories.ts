/**
 * Lists all courses (title, _id, category ids) and all categories (_id, name).
 * Run from backend root: npx ts-node src/scripts/list-courses-and-categories.ts
 *
 * Optionally writes to JSON files: --output-dir=./scripts-output
 */

import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { connectDB, disconnectDB } from "../config/database";
import { CourseModel, CategoryModel } from "../models";

// Load .env from backend root (when run as ts-node src/scripts/..., __dirname is backend/src/scripts)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

interface CourseListItem {
  _id: string;
  title: string;
  category: string[];
}

interface CategoryListItem {
  _id: string;
  name: string;
}

async function main() {
  const outputDir = process.argv.find((a) => a.startsWith("--output-dir="))?.split("=")[1];

  await connectDB();

  const courses = await CourseModel.find({})
    .select("title _id category")
    .lean();

  const categories = await CategoryModel.find({})
    .select("_id name")
    .lean();

  const courseList: CourseListItem[] = courses.map((c) => {
    const raw = c.category;
    const arr = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
    return {
      _id: String(c._id),
      title: c.title,
      category: arr.map((id: unknown) => String(id)),
    };
  });

  const categoryList: CategoryListItem[] = categories.map((c) => ({
    _id: String(c._id),
    name: c.name,
  }));

  console.log("\n========== CATEGORIES (use these IDs or names in your mapping) ==========\n");
  console.log(JSON.stringify(categoryList, null, 2));
  console.log("\n========== COURSES (name, id, current category ids) ==========\n");
  console.log(JSON.stringify(courseList, null, 2));

  if (outputDir) {
    const dir = path.resolve(process.cwd(), outputDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "categories.json"), JSON.stringify(categoryList, null, 2));
    fs.writeFileSync(path.join(dir, "courses.json"), JSON.stringify(courseList, null, 2));
    console.log(`\n✅ Written to ${dir}/categories.json and ${dir}/courses.json`);
  }

  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
