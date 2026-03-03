/**
 * Updates course plan pricing based on audience.
 *
 * College student courses:
 *   - Essential: ₹3,999
 *   - Elite: ₹9,999
 *
 * Professional courses:
 *   - Essential: ₹6,999
 *   - Elite: ₹18,999
 *
 * Run from backend root: npx ts-node src/scripts/update-course-plan-pricing.ts [--dry-run]
 */

import mongoose from "mongoose";
import { CourseModel } from "../models";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const PRICING = {
  "college-students": {
    essential: 3999,
    elite: 9999,
  },
  professionals: {
    essential: 6999,
    elite: 18999,
  },
} as const;

async function updatePlanPricing() {
  const dryRun = process.argv.includes("--dry-run");

  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully\n");

    const collegeCount = await CourseModel.countDocuments({
      audience: "college-students",
    });
    const professionalCount = await CourseModel.countDocuments({
      audience: "professionals",
    });

    console.log("=".repeat(60));
    console.log("Course Plan Pricing Update Script");
    console.log("=".repeat(60));
    console.log(`\nCollege student courses: ${collegeCount}`);
    console.log(`  - Essential: ₹${PRICING["college-students"].essential}`);
    console.log(`  - Elite: ₹${PRICING["college-students"].elite}`);
    console.log(`\nProfessional courses: ${professionalCount}`);
    console.log(`  - Essential: ₹${PRICING.professionals.essential}`);
    console.log(`  - Elite: ₹${PRICING.professionals.elite}`);

    if (dryRun) {
      console.log("\n[DRY RUN] No changes written. Remove --dry-run to apply.");
      await mongoose.connection.close();
      process.exit(0);
      return;
    }

    // Update college student courses
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

    // Update professional courses
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

    // Verify with sample courses
    console.log("\nVerifying with sample courses...");
    const samples = await CourseModel.find({})
      .select("title audience plans.essential.price plans.elite.price")
      .limit(4)
      .lean();

    samples.forEach((course: any, index: number) => {
      const pricing = PRICING[course.audience as keyof typeof PRICING];
      console.log(`\n${index + 1}. ${course.title} (${course.audience})`);
      if (course.plans?.essential) {
        console.log(`   Essential: ₹${course.plans.essential.price} (expected ₹${pricing?.essential ?? "N/A"})`);
      }
      if (course.plans?.elite) {
        console.log(`   Elite: ₹${course.plans.elite.price} (expected ₹${pricing?.elite ?? "N/A"})`);
      }
    });

    console.log("\n✅ Update completed successfully!");
  } catch (error) {
    console.error("\n❌ Error updating plan pricing:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nMongoDB connection closed");
    process.exit(0);
  }
}

updatePlanPricing();
