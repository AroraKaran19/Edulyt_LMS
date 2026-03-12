/**
 * Resets enrollments where the user completed the course (status=completed or progress=100%)
 * but no certificate was generated. Sets progress to 0 so they can re-complete properly.
 *
 * Run from backend root: npx ts-node src/scripts/reset-enrollments-without-certificate.ts [--dry-run]
 */

import mongoose from "mongoose";
import { EnrollmentModel, CertificateModel, CourseModel } from "../models";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function resetEnrollmentsWithoutCertificate() {
  const dryRun = process.argv.includes("--dry-run");

  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully\n");

    // Find enrollments that are "completed" (status or 100% progress) but have no certificate
    const completedEnrollments = await EnrollmentModel.find({
      $or: [
        { status: "completed" },
        { "progress.overallCompletion": { $gte: 100 } },
      ],
    })
      .populate("courseId", "title isCertified")
      .lean();

    console.log(`Found ${completedEnrollments.length} enrollments marked as completed`);

    const toReset: typeof completedEnrollments = [];

    for (const enrollment of completedEnrollments) {
      // Skip partial access - they don't get certificates by design
      const accessControl = (enrollment as any).accessControl;
      if (accessControl && accessControl.accessType === "partial") {
        continue;
      }

      // Check if certificate exists for this enrollment
      const certificate = await CertificateModel.findOne({
        enrollmentId: enrollment._id,
      }).lean();

      if (certificate) {
        continue; // Has certificate, skip
      }

      // Only reset for certified courses (non-certified courses never generate certificates)
      const course = enrollment.courseId as any;
      if (!course?.isCertified) {
        continue;
      }

      toReset.push(enrollment);
    }

    console.log(`\nEnrollments to reset (completed, no certificate, certified course): ${toReset.length}`);
    console.log("=".repeat(60));

    if (toReset.length === 0) {
      console.log("No enrollments need resetting.");
      await mongoose.connection.close();
      process.exit(0);
      return;
    }

    // Log affected enrollments
    for (let i = 0; i < Math.min(toReset.length, 10); i++) {
      const e = toReset[i] as any;
      const course = e.courseId;
      console.log(`  ${i + 1}. Enrollment ${e._id} | User: ${e.userId} | Course: ${course?.title || "?"}`);
    }
    if (toReset.length > 10) {
      console.log(`  ... and ${toReset.length - 10} more`);
    }

    if (dryRun) {
      console.log("\n[DRY RUN] No changes written. Remove --dry-run to apply.");
      await mongoose.connection.close();
      process.exit(0);
      return;
    }

    const enrollmentIds = toReset.map((e) => e._id);
    const result = await EnrollmentModel.updateMany(
      { _id: { $in: enrollmentIds } },
      {
        $set: {
          status: "active",
          "progress.overallCompletion": 0,
          "progress.completedModules": 0,
          "progress.completedLessons": 0,
          completedContents: [],
          completedAt: null,
          totalTimeSpent: 0,
          lastUpdated: new Date(),
        },
      }
    );

    console.log("\n✅ Reset completed:");
    console.log(`   - Matched: ${result.matchedCount}`);
    console.log(`   - Modified: ${result.modifiedCount}`);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\nMongoDB connection closed");
    process.exit(0);
  }
}

resetEnrollmentsWithoutCertificate();
