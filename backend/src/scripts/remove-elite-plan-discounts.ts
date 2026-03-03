/**
 * Removes discount from all Elite plans across all courses.
 *
 * Run from backend root: npx ts-node src/scripts/remove-elite-plan-discounts.ts [--dry-run]
 */

import mongoose from "mongoose";
import { CourseModel } from "../models";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function removeElitePlanDiscounts() {
  const dryRun = process.argv.includes("--dry-run");

  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully\n");

    const coursesWithElite = await CourseModel.countDocuments({
      "plans.elite": { $exists: true, $ne: null },
    });
    const coursesWithEliteDiscount = await CourseModel.countDocuments({
      "plans.elite": { $exists: true, $ne: null },
      "plans.elite.discount": { $exists: true, $ne: null },
    });

    console.log("=".repeat(60));
    console.log("Remove Elite Plan Discounts Script");
    console.log("=".repeat(60));
    console.log(`\nCourses with Elite plan: ${coursesWithElite}`);
    console.log(`Courses with Elite discount to remove: ${coursesWithEliteDiscount}`);

    if (dryRun) {
      console.log("\n[DRY RUN] No changes written. Remove --dry-run to apply.");
      await mongoose.connection.close();
      process.exit(0);
      return;
    }

    const result = await CourseModel.updateMany(
      { "plans.elite": { $exists: true, $ne: null } },
      { $unset: { "plans.elite.discount": "" } }
    );

    console.log("\n✅ Elite plan discount removal:");
    console.log(`   - Matched: ${result.matchedCount}`);
    console.log(`   - Modified: ${result.modifiedCount}`);

    // Verify with sample courses
    console.log("\nVerifying with sample courses...");
    const samples = await CourseModel.find({ "plans.elite": { $exists: true, $ne: null } })
      .select("title plans.elite.discount")
      .limit(3)
      .lean();

    samples.forEach((course: any, index: number) => {
      console.log(`\n${index + 1}. ${course.title}`);
      console.log(`   Elite discount: ${course.plans?.elite?.discount ? "present" : "removed"}`);
    });

    console.log("\n✅ Update completed successfully!");
  } catch (error) {
    console.error("\n❌ Error removing elite plan discounts:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nMongoDB connection closed");
    process.exit(0);
  }
}

removeElitePlanDiscounts();
