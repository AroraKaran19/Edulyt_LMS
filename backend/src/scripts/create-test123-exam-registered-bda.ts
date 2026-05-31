/**
 * One-off: recreate the test123@gmail.com merit enrollment for Business
 * Development Associate - Analytics - H1 2026 (June 2026 batch) at status
 * "exam_registered", reusing the applicationAnswers captured from the
 * previously-deleted revoked row. Mirrors registerForExam's create branch but
 * bypasses the (now-closed) application-window / active checks.
 *
 * Guarded: aborts if any enrollment already occupies the
 * {user, internship, batchId} slot (the unique index).
 *
 *   npx ts-node src/scripts/create-test123-exam-registered-bda.ts          # dry run
 *   npx ts-node src/scripts/create-test123-exam-registered-bda.ts --apply  # create
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const USER_ID = "694051f8682b885ede200b78";
const INTERNSHIP_ID = "6a057a5bba2b1b21d7642db1";
const BATCH_ID = "6a057a5bba2b1b21d7642dae";

const internshipSnapshot = {
  title: "Business Development Associate - Analytics - H1 2026",
  slug: "business-development-associate-analytics-h1-2026",
  thumbnail:
    "https://airkrit.s3.amazonaws.com/internships/business_development_associate___analytics/thumbnail/b13629c6-33b0-477a-8b0a-bbf24b3267cf.png",
};

const batchSnapshot = {
  batchId: BATCH_ID,
  name: "June 2026",
  internshipStartDate: new Date("2026-06-14T00:00:00.000Z"),
  applicationLastDate: new Date("2026-05-30T00:00:00.000Z"),
};

// Reused verbatim from the deleted revoked row.
const applicationAnswers = {
  fullName: "Test Account",
  email: "test123@gmail.com",
  phone: "6123456789",
  gender: "male",
  experience: "school-student",
  university: "Govt Degree College, Himachal Pradesh",
  country: "india",
  courseName: "btech",
  yearOfPassing: "2016",
  linkedinUrl: "https://www.linkedin.com/",
  instagramUrl: "",
  collegeEmail: "jehex58249@noyavip.com",
  guardianContact: "6123456789",
  joinReason: "te test test test",
  crName: "test",
  crContact: "6123456789",
  paidTraining: "no",
  whatsappJoined: "having-trouble",
  internshipDuration: "4",
  referralSource: "college",
  socialMediaFollowed: "no",
  marks10thType: "percentage",
  marks10thValue: "55",
  marks12thType: "percentage",
  marks12thValue: "55",
  marksPursuingType: "percentage",
  marksPursuingValue: "55",
  marketingActivities: "no",
  batchId: BATCH_ID,
  dob: new Date("1978-04-05T18:30:00.000Z"),
};

const apply = process.argv.includes("--apply");

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  // Guard: the unique slot must be free.
  const existing = await InternshipEnrollmentModel.findOne({
    user: new mongoose.Types.ObjectId(USER_ID),
    internship: new mongoose.Types.ObjectId(INTERNSHIP_ID),
    "batchSnapshot.batchId": BATCH_ID,
  }).lean();

  if (existing) {
    console.error(
      `ABORT: an enrollment already exists in this batch slot (_id ${String(
        (existing as any)._id,
      )}, status ${(existing as any).status}). No create performed.`,
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  const doc = {
    internship: new mongoose.Types.ObjectId(INTERNSHIP_ID),
    user: new mongoose.Types.ObjectId(USER_ID),
    enrollmentType: "merit" as const,
    status: "exam_registered" as const,
    internshipSnapshot,
    batchSnapshot,
    applicationAnswers,
    applicationSubmittedAt: new Date(),
    programDurationMonths: 4,
  };

  console.log("Will create enrollment:");
  console.log("  user:        ", USER_ID);
  console.log("  internship:  ", INTERNSHIP_ID);
  console.log("  batch:       ", batchSnapshot.name, `(${BATCH_ID})`);
  console.log("  status:      ", doc.status);
  console.log("  type:        ", doc.enrollmentType);
  console.log("  duration(mo):", doc.programDurationMonths);

  if (!apply) {
    console.log("\nDRY RUN — slot is free. Re-run with --apply to create.");
    await mongoose.disconnect();
    return;
  }

  const created = await InternshipEnrollmentModel.create(doc);
  console.log("\nCreated enrollment _id:", String(created._id));

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
