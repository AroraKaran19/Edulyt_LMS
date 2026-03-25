/**
 * Removes all certificates and certificate jobs, and resets certificate flags on enrollments.
 *
 * Run from backend root: npm run scripts:remove-certificates-all [--dry-run]
 */

import mongoose from "mongoose";
import { EnrollmentModel, CertificateModel } from "../models";
import { CertificateJobModel } from "../models/certificateJob.schema";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function removeCertificatesForAll() {
  const dryRun = process.argv.includes("--dry-run");

  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully\n");

    const certCount = await CertificateModel.countDocuments();
    const jobCount = await CertificateJobModel.countDocuments();
    const enrollmentsWithCert = await EnrollmentModel.countDocuments({
      certificateIssued: true,
    });

    console.log("Current state:");
    console.log(`  - Certificates: ${certCount}`);
    console.log(`  - Certificate jobs: ${jobCount}`);
    console.log(`  - Enrollments with certificateIssued=true: ${enrollmentsWithCert}`);
    console.log("");

    if (dryRun) {
      console.log("[DRY RUN] Would delete all certificates and jobs, and reset enrollment flags.");
      console.log("[DRY RUN] Run without --dry-run to apply changes.");
      await mongoose.connection.close();
      process.exit(0);
      return;
    }

    console.log("Deleting all certificates...");
    const certResult = await CertificateModel.deleteMany({});
    console.log(`  Deleted ${certResult.deletedCount} certificates`);

    console.log("Deleting all certificate jobs...");
    const jobResult = await CertificateJobModel.deleteMany({});
    console.log(`  Deleted ${jobResult.deletedCount} certificate jobs`);

    console.log("Resetting certificateIssued on all enrollments...");
    const enrollResult = await EnrollmentModel.updateMany(
      { certificateIssued: true },
      {
        $set: { certificateIssued: false },
        $unset: { certificateIssuedAt: "" },
      }
    );
    console.log(`  Updated ${enrollResult.modifiedCount} enrollments`);

    console.log("\nDone.");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

removeCertificatesForAll();
