/**
 * Diagnostic: find a specific video content row by course title + content
 * title and dump its full document so we can see what didn't save (empty
 * sources, missing videoUrl, zero duration, etc).
 *
 *   npx ts-node src/scripts/inspect-course-video.ts
 *   # or override:
 *   npx ts-node src/scripts/inspect-course-video.ts --course="Advanced Data Manipulation in SAS (Base SAS - 2)" --content="What is a Merge?"
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { CourseModel } from "../models/course.schema";
import {
  CourseModuleModel,
  CourseLessonModel,
  ContentModel,
} from "../models/course-module.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function arg(key: string, def: string): string {
  const found = process.argv.find((a) => a.startsWith(`--${key}=`));
  return found ? found.split("=").slice(1).join("=") : def;
}

const courseTitle = arg(
  "course",
  "Advanced Data Manipulation in SAS (Base SAS - 2)",
);
const contentTitle = arg("content", "What is a Merge?");

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  // 1. Course
  const course = await CourseModel.findOne({
    title: new RegExp(courseTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
  })
    .select("_id title modules")
    .lean();

  if (!course) {
    console.log(`No course matching "${courseTitle}"`);
    await mongoose.disconnect();
    return;
  }
  console.log(`Course: ${course.title} (${course._id})`);
  console.log(`Modules linked on course doc: ${(course.modules ?? []).length}\n`);

  // 2. All content rows on this course (across modules + lessons) matching the title
  const escTitle = contentTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const contents = await ContentModel.find({
    title: new RegExp(escTitle, "i"),
  }).lean();

  if (contents.length === 0) {
    console.log(`No content matching "${contentTitle}" anywhere.`);
    await mongoose.disconnect();
    return;
  }

  // 3. For each match, walk back up via module → course to confirm it belongs
  for (const c of contents) {
    const cc = c as Record<string, unknown>;
    const module = await CourseModuleModel.findById(cc.moduleId)
      .select("_id title courseId")
      .lean();
    if (!module) continue;
    const mm = module as Record<string, unknown>;
    if (String(mm.courseId) !== String(course._id)) continue;

    const lesson = await CourseLessonModel.findById(cc.lessonId)
      .select("_id title")
      .lean();
    const ll = lesson as Record<string, unknown> | null;

    console.log("─".repeat(70));
    console.log("Content match in this course:");
    console.log("  _id:          ", cc._id);
    console.log("  type:         ", cc.type);
    console.log("  title:        ", cc.title);
    console.log("  description:  ", cc.description);
    console.log("  order:        ", cc.order);
    console.log("  createdAt:    ", cc.createdAt);
    console.log("  updatedAt:    ", cc.updatedAt);
    console.log(`  module:        ${mm.title} (${mm._id})`);
    console.log(`  lesson:        ${ll?.title ?? "—"} (${cc.lessonId})`);

    if (cc.type === "video") {
      console.log("  sources:      ", JSON.stringify(cc.sources, null, 4));
      console.log("  thumbnailUrl: ", cc.thumbnailUrl);
      console.log("  duration:     ", cc.duration);

      const sources = (cc.sources ?? []) as Array<{
        quality?: string;
        videoUrl?: string;
      }>;
      const issues: string[] = [];
      if (!Array.isArray(sources) || sources.length === 0) {
        issues.push("sources array is empty — no playable URL stored");
      }
      for (const [i, s] of sources.entries()) {
        if (!s?.videoUrl) issues.push(`sources[${i}].videoUrl is missing`);
        if (s?.videoUrl && !/^https?:\/\//i.test(s.videoUrl))
          issues.push(`sources[${i}].videoUrl is not http(s): "${s.videoUrl}"`);
        if (!s?.quality) issues.push(`sources[${i}].quality is missing`);
      }
      if (typeof cc.duration !== "number" || cc.duration === 0) {
        issues.push("duration is 0 or missing");
      }
      if (
        cc.thumbnailUrl &&
        typeof cc.thumbnailUrl === "string" &&
        !/^https?:\/\//i.test(cc.thumbnailUrl)
      ) {
        issues.push(`thumbnailUrl is not http(s): "${cc.thumbnailUrl}"`);
      }

      console.log("\n  Issues found:");
      if (issues.length === 0) console.log("    (none — looks valid)");
      else for (const x of issues) console.log("    ✗ " + x);
    } else {
      console.log(
        "  (non-video content) full doc:",
        JSON.stringify(cc, null, 2),
      );
    }
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
