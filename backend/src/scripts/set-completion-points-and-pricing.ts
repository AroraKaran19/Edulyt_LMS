/**
 * One-off bulk update for ALL courses:
 *
 *   1. Set completion success points to 2000 on every course
 *      (`completionSuccessPoints` — awarded when the completion certificate
 *       is generated).
 *
 *   2. Reset plan pricing by audience:
 *      College Students  — Essential ₹5,999   Elite ₹9,999
 *      Working Profs.    — Essential ₹8,999   Elite ₹19,999
 *
 *   3. Remove ALL per-plan discounts (essential + elite) and set a flat
 *      10% course-level discount on every course.
 *
 * Only existing (non-null) plans are repriced; absent plans are left untouched.
 *
 * Run from backend root:
 *   npx ts-node src/scripts/set-completion-points-and-pricing.ts [--dry-run]
 */

import mongoose from "mongoose";
import { CourseModel } from "../models";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const COMPLETION_SUCCESS_POINTS = 2000;
const COURSE_DISCOUNT_PERCENT = 10;

// Flat course-level discount applied to every course (replaces per-plan discounts).
const COURSE_DISCOUNT = {
  discount: "percentage",
  value: COURSE_DISCOUNT_PERCENT,
  isActive: true,
  startTime: null,
  endTime: null,
} as const;

const PRICING = {
  "college-students": {
    essential: 5999,
    elite: 9999,
  },
  professionals: {
    essential: 8999,
    elite: 19999,
  },
} as const;

async function run() {
  const dryRun = process.argv.includes("--dry-run");

  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully\n");

    const totalCourses = await CourseModel.countDocuments({});
    const collegeCount = await CourseModel.countDocuments({
      audience: "college-students",
    });
    const professionalCount = await CourseModel.countDocuments({
      audience: "professionals",
    });

    console.log("=".repeat(60));
    console.log("Completion Points + Plan Pricing Update Script");
    console.log("=".repeat(60));
    console.log(`\nTotal courses: ${totalCourses}`);
    console.log(`Completion success points → ${COMPLETION_SUCCESS_POINTS} (all courses)`);
    console.log(`\nCollege student courses: ${collegeCount}`);
    console.log(`  - Essential: ₹${PRICING["college-students"].essential}`);
    console.log(`  - Elite: ₹${PRICING["college-students"].elite}`);
    console.log(`\nProfessional courses: ${professionalCount}`);
    console.log(`  - Essential: ₹${PRICING.professionals.essential}`);
    console.log(`  - Elite: ₹${PRICING.professionals.elite}`);
    console.log(`\nDiscounts:`);
    console.log(`  - Per-plan discounts (essential + elite): REMOVED`);
    console.log(`  - Course-level discount: ${COURSE_DISCOUNT_PERCENT}% (all courses)`);

    if (dryRun) {
      console.log("\n[DRY RUN] No changes written. Remove --dry-run to apply.");
      await mongoose.connection.close();
      process.exit(0);
      return;
    }

    // 1. Completion success points — every course.
    const pointsResult = await CourseModel.updateMany(
      {},
      { $set: { completionSuccessPoints: COMPLETION_SUCCESS_POINTS } }
    );
    console.log("\n✅ Completion success points:");
    console.log(
      `   matched ${pointsResult.matchedCount}, modified ${pointsResult.modifiedCount}`
    );

    // 2a. College student plan pricing.
    const collegeEssentialResult = await CourseModel.updateMany(
      { audience: "college-students", "plans.essential": { $exists: true, $ne: null } },
      { $set: { "plans.essential.price": PRICING["college-students"].essential } }
    );
    const collegeEliteResult = await CourseModel.updateMany(
      { audience: "college-students", "plans.elite": { $exists: true, $ne: null } },
      { $set: { "plans.elite.price": PRICING["college-students"].elite } }
    );

    console.log("\n✅ College student courses:");
    console.log(`   Essential: matched ${collegeEssentialResult.matchedCount}, modified ${collegeEssentialResult.modifiedCount}`);
    console.log(`   Elite: matched ${collegeEliteResult.matchedCount}, modified ${collegeEliteResult.modifiedCount}`);

    // 2b. Professional plan pricing.
    const profEssentialResult = await CourseModel.updateMany(
      { audience: "professionals", "plans.essential": { $exists: true, $ne: null } },
      { $set: { "plans.essential.price": PRICING.professionals.essential } }
    );
    const profEliteResult = await CourseModel.updateMany(
      { audience: "professionals", "plans.elite": { $exists: true, $ne: null } },
      { $set: { "plans.elite.price": PRICING.professionals.elite } }
    );

    console.log("\n✅ Professional courses:");
    console.log(`   Essential: matched ${profEssentialResult.matchedCount}, modified ${profEssentialResult.modifiedCount}`);
    console.log(`   Elite: matched ${profEliteResult.matchedCount}, modified ${profEliteResult.modifiedCount}`);

    // 3a. Remove per-plan discounts (essential + elite) from every course.
    const removePlanDiscountsResult = await CourseModel.updateMany(
      {},
      {
        $unset: {
          "plans.essential.discount": "",
          "plans.elite.discount": "",
        },
      }
    );
    console.log("\n✅ Per-plan discount removal:");
    console.log(
      `   matched ${removePlanDiscountsResult.matchedCount}, modified ${removePlanDiscountsResult.modifiedCount}`
    );

    // 3b. Set a flat 10% course-level discount on every course.
    const courseDiscountResult = await CourseModel.updateMany(
      {},
      { $set: { discount: COURSE_DISCOUNT } }
    );
    console.log("\n✅ Course-level discount (10%):");
    console.log(
      `   matched ${courseDiscountResult.matchedCount}, modified ${courseDiscountResult.modifiedCount}`
    );

    // Verify with sample courses.
    console.log("\nVerifying with sample courses...");
    const samples = await CourseModel.find({})
      .select(
        "title audience completionSuccessPoints discount plans.essential.price plans.essential.discount plans.elite.price plans.elite.discount"
      )
      .limit(6)
      .lean();

    samples.forEach((course: any, index: number) => {
      const pricing = PRICING[course.audience as keyof typeof PRICING];
      console.log(`\n${index + 1}. ${course.title} (${course.audience})`);
      console.log(
        `   Completion points: ${course.completionSuccessPoints} (expected ${COMPLETION_SUCCESS_POINTS})`
      );
      console.log(
        `   Course discount: ${course.discount?.value ?? "N/A"}% (${course.discount?.isActive ? "active" : "inactive"}) (expected ${COURSE_DISCOUNT_PERCENT}%)`
      );
      if (course.plans?.essential) {
        console.log(
          `   Essential: ₹${course.plans.essential.price} (expected ₹${pricing?.essential ?? "N/A"}), discount ${course.plans.essential.discount ? "PRESENT ⚠️" : "removed"}`
        );
      }
      if (course.plans?.elite) {
        console.log(
          `   Elite: ₹${course.plans.elite.price} (expected ₹${pricing?.elite ?? "N/A"}), discount ${course.plans.elite.discount ? "PRESENT ⚠️" : "removed"}`
        );
      }
    });

    console.log("\n✅ Update completed successfully!");
  } catch (error) {
    console.error("\n❌ Error running update:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nMongoDB connection closed");
    process.exit(0);
  }
}

run();
