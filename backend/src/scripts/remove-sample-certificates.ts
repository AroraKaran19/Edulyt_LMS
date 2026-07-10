/**
 * Remove the SAMPLE certificate rows created by seed-sample-certificates.ts.
 *
 * Deletes only the CertificateModel documents whose certificateId is in the
 * known sample set (AI-990xx). The Offer Letter sample has no DB row, and S3
 * objects are left in place (delete them from the bucket manually if desired).
 *
 * WRITES to the database that backend/.env -> MONGODB_URI points to.
 *
 * Run from backend root:
 *   npx ts-node src/scripts/remove-sample-certificates.ts
 *   # or: npm run scripts:remove-sample-certs
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { CertificateModel } from "../models/certificate.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { UserModel } from "../models/user.schema";
import {
  SAMPLE_CERTIFICATE_IDS,
  SAMPLE_OFFER_INTERN_ID,
  SAMPLE_USER_EMAIL,
} from "./seed-sample-certificates";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function main(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not defined in .env");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected.\n");

  try {
    const res = await CertificateModel.deleteMany({
      certificateId: { $in: SAMPLE_CERTIFICATE_IDS },
    });
    console.log(
      `Removed ${res.deletedCount} sample certificate row(s) (${SAMPLE_CERTIFICATE_IDS.join(", ")}).`,
    );

    const enr = await InternshipEnrollmentModel.collection.deleteMany({
      internId: SAMPLE_OFFER_INTERN_ID,
    });
    console.log(
      `Removed ${enr.deletedCount} sample internship enrollment(s) (${SAMPLE_OFFER_INTERN_ID}).`,
    );

    const usr = await UserModel.collection.deleteMany({ email: SAMPLE_USER_EMAIL });
    console.log(`Removed ${usr.deletedCount} sample user(s) (${SAMPLE_USER_EMAIL}).`);
  } finally {
    await mongoose.connection.close();
  }
}

void main().catch((err) => {
  console.error("\nRemove failed:", err);
  process.exitCode = 1;
});
