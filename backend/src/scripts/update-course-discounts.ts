/**
 * Updates course and plan discounts across all courses.
 *
 * - Course discount: 10% for all courses
 * - Essential plan discount: 20% for all courses that have an essential plan
 *   (with start/end date - only active within that period)
 *
 * Adjust PLAN_DISCOUNT_START_DATE and PLAN_DISCOUNT_END_DATE at top of file
 * to change the essential plan discount validity period.
 *
 * Run from backend root: npx ts-node src/scripts/update-course-discounts.ts [--dry-run]
 */

import mongoose from "mongoose";
import { CourseModel } from "../models";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const COURSE_DISCOUNT_PERCENT = 10;
const ESSENTIAL_PLAN_DISCOUNT_PERCENT = 20;

// Essential plan discount date range (plan discount only applies within these dates)
const PLAN_DISCOUNT_START_DATE = new Date("2025-01-01T00:00:00.000Z");
const PLAN_DISCOUNT_END_DATE = new Date("2025-12-31T23:59:59.999Z");

async function updateCourseDiscounts() {
  const dryRun = process.argv.includes("--dry-run");

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully\n");

    const totalCourses = await CourseModel.countDocuments();
    const coursesWithEssential = await CourseModel.countDocuments({
      "plans.essential": { $exists: true, $ne: null },
    });

    console.log("=".repeat(60));
    console.log("Course & Plan Discount Update Script");
    console.log("=".repeat(60));
    console.log(`\nTotal courses: ${totalCourses}`);
    console.log(`Courses with Essential plan: ${coursesWithEssential}`);
    console.log(`\nPlanned updates:`);
    console.log(`  - Course discount: ${COURSE_DISCOUNT_PERCENT}% (all courses)`);
    console.log(
      `  - Essential plan discount: ${ESSENTIAL_PLAN_DISCOUNT_PERCENT}% (courses with essential plan)`
    );
    console.log(
      `  - Plan discount period: ${PLAN_DISCOUNT_START_DATE.toISOString().split("T")[0]} to ${PLAN_DISCOUNT_END_DATE.toISOString().split("T")[0]}`
    );

    if (dryRun) {
      console.log("\n[DRY RUN] No changes written. Remove --dry-run to apply.");
      await mongoose.connection.close();
      process.exit(0);
      return;
    }

    // 1. Update course discount (10%) for all courses
    const courseDiscountUpdate = {
      discount: "percentage",
      value: COURSE_DISCOUNT_PERCENT,
      isActive: true,
      startTime: null,
      endTime: null,
    };

    const courseResult = await CourseModel.updateMany(
      {},
      { $set: { discount: courseDiscountUpdate } }
    );

    console.log("\n✅ Course discount update:");
    console.log(`   - Matched: ${courseResult.matchedCount}`);
    console.log(`   - Modified: ${courseResult.modifiedCount}`);

    // 2. Update essential plan discount (20%) for courses that have an essential plan
    const essentialPlanDiscountUpdate = {
      discount: "percentage",
      value: ESSENTIAL_PLAN_DISCOUNT_PERCENT,
      isActive: true,
      startDate: PLAN_DISCOUNT_START_DATE,
      endDate: PLAN_DISCOUNT_END_DATE,
    };

    const essentialResult = await CourseModel.updateMany(
      { "plans.essential": { $exists: true, $ne: null } },
      { $set: { "plans.essential.discount": essentialPlanDiscountUpdate } }
    );

    console.log("\n✅ Essential plan discount update:");
    console.log(`   - Matched: ${essentialResult.matchedCount}`);
    console.log(`   - Modified: ${essentialResult.modifiedCount}`);

    // Verify with sample courses
    console.log("\nVerifying with sample courses...");
    const sampleCourses = await CourseModel.find({})
      .select("title discount plans.essential.discount")
      .limit(3)
      .lean();

    sampleCourses.forEach((course: any, index: number) => {
      console.log(`\n${index + 1}. ${course.title}`);
      console.log(
        `   Course discount: ${course.discount?.value ?? "N/A"}% (${course.discount?.isActive ? "active" : "inactive"})`
      );
      if (course.plans?.essential?.discount) {
        const d = course.plans.essential.discount;
        const startStr = d.startDate ? new Date(d.startDate).toISOString().split("T")[0] : "N/A";
        const endStr = d.endDate ? new Date(d.endDate).toISOString().split("T")[0] : "N/A";
        console.log(
          `   Essential plan discount: ${d.value}% (${d.isActive ? "active" : "inactive"})`
        );
        console.log(`   Date range: ${startStr} to ${endStr}`);
      } else {
        console.log("   Essential plan: not present");
      }
    });

    console.log("\n✅ Update completed successfully!");
  } catch (error) {
    console.error("\n❌ Error updating discounts:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nMongoDB connection closed");
    process.exit(0);
  }
}

updateCourseDiscounts();
