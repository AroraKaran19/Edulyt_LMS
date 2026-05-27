/**
 * Export every internship application (InternshipEnrollment with
 * `applicationAnswers` set) to a CSV file (UTF-8 with BOM so Excel
 * opens it cleanly). Each row pairs the applicant's identity + the
 * internship + batch context with every field captured by the public
 * enroll form (see EnrollForm.tsx → buildApplicationAnswersPayload).
 *
 * Run from backend root:
 *   npx ts-node src/scripts/export-internship-applications.ts
 *   npx ts-node src/scripts/export-internship-applications.ts --out=./internship-applications.csv
 */

import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import "../models/user.schema"; // register User for $lookup
import "../models/internship.schema"; // register Internship for $lookup

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function parseArgs() {
  let outPath = path.resolve(process.cwd(), "internship-applications.csv");
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--out=(.+)$/);
    if (m) outPath = path.resolve(process.cwd(), m[1]);
  }
  return { outPath };
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s: string;
  if (v instanceof Date) {
    s = v.toISOString();
  } else if (typeof v === "object") {
    s = JSON.stringify(v);
  } else {
    s = String(v);
  }
  const needsQuote = /[",\r\n]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

// Columns derived from the enroll form schema (EnrollForm.tsx). The form
// payload is stored verbatim under `applicationAnswers`, so each key maps
// 1:1 to a question on the public application form.
const APPLICATION_FIELDS: { key: string; header: string }[] = [
  { key: "fullName", header: "Full Name" },
  { key: "email", header: "Email (form)" },
  { key: "phone", header: "Phone (form)" },
  { key: "dob", header: "DOB" },
  { key: "gender", header: "Gender" },
  { key: "experience", header: "Experience" },
  { key: "university", header: "University" },
  { key: "country", header: "Country" },
  { key: "courseName", header: "Course Name" },
  { key: "yearOfPassing", header: "Year of Passing" },
  { key: "linkedinUrl", header: "LinkedIn URL" },
  { key: "instagramUrl", header: "Instagram URL" },
  { key: "collegeEmail", header: "College Email" },
  { key: "guardianContact", header: "Guardian Contact" },
  { key: "joinReason", header: "Reason to Join" },
  { key: "crName", header: "CR Name" },
  { key: "crContact", header: "CR Contact" },
  { key: "paidTraining", header: "Paid Training" },
  { key: "whatsappJoined", header: "WhatsApp Joined" },
  { key: "internshipDuration", header: "Internship Duration" },
  { key: "referralSource", header: "Referral Source" },
  { key: "socialMediaFollowed", header: "Social Media Followed" },
  { key: "marks10thType", header: "10th Marks Type" },
  { key: "marks10thValue", header: "10th Marks Value" },
  { key: "marks12thType", header: "12th Marks Type" },
  { key: "marks12thValue", header: "12th Marks Value" },
  { key: "marksPursuingType", header: "Pursuing Marks Type" },
  { key: "marksPursuingValue", header: "Pursuing Marks Value" },
  { key: "marketingActivities", header: "Marketing Activities" },
  { key: "batchId", header: "Batch ID (form)" },
];

const BASE_COLUMNS: { header: string; pick: (row: Record<string, unknown>) => unknown }[] = [
  { header: "Enrollment ID", pick: (r) => r._id },
  { header: "User ID", pick: (r) => r.user },
  { header: "User Name", pick: (r) => {
    const u = r.userDoc as Record<string, unknown> | undefined;
    if (!u) return "";
    const fn = (u.firstName as string) || "";
    const ln = (u.lastName as string) || "";
    const full = `${fn} ${ln}`.trim();
    return full || (u.email as string) || "";
  } },
  { header: "User Email", pick: (r) => (r.userDoc as Record<string, unknown> | undefined)?.email },
  { header: "User Phone", pick: (r) => (r.userDoc as Record<string, unknown> | undefined)?.phone },
  { header: "Internship ID", pick: (r) => r.internship },
  { header: "Internship Title", pick: (r) => (r.internshipSnapshot as Record<string, unknown> | undefined)?.title ?? (r.internshipDoc as Record<string, unknown> | undefined)?.title },
  { header: "Internship Slug", pick: (r) => (r.internshipSnapshot as Record<string, unknown> | undefined)?.slug ?? (r.internshipDoc as Record<string, unknown> | undefined)?.slug },
  { header: "Batch ID", pick: (r) => (r.batchSnapshot as Record<string, unknown> | undefined)?.batchId },
  { header: "Batch Name", pick: (r) => (r.batchSnapshot as Record<string, unknown> | undefined)?.name },
  { header: "Batch Start", pick: (r) => (r.batchSnapshot as Record<string, unknown> | undefined)?.internshipStartDate },
  { header: "Application Last Date", pick: (r) => (r.batchSnapshot as Record<string, unknown> | undefined)?.applicationLastDate },
  { header: "Status", pick: (r) => r.status },
  { header: "Enrollment Type", pick: (r) => r.enrollmentType },
  { header: "Exam Score", pick: (r) => r.examScore },
  { header: "Exam Attempted At", pick: (r) => r.examAttemptedAt },
  { header: "Payment Amount", pick: (r) => r.paymentAmount },
  { header: "Payment Order ID", pick: (r) => r.paymentOrderId },
  { header: "Payment Confirmed At", pick: (r) => r.paymentConfirmedAt },
  { header: "Program Duration (months)", pick: (r) => r.programDurationMonths },
  { header: "Enrolled At", pick: (r) => r.enrolledAt },
  { header: "End Date", pick: (r) => r.endDate },
  { header: "Intern ID", pick: (r) => r.internId },
  { header: "Offer Letter URL", pick: (r) => r.offerLetterUrl },
  { header: "Internship Success Points", pick: (r) => r.internshipSuccessPoints },
  { header: "Application Submitted At", pick: (r) => r.applicationSubmittedAt },
  { header: "Created At", pick: (r) => r.createdAt },
  { header: "Updated At", pick: (r) => r.updatedAt },
];

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI (or MONGO_URI) must be set in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}`);

  const rows = await InternshipEnrollmentModel.aggregate<Record<string, unknown>>([
    { $match: { applicationAnswers: { $exists: true, $ne: null } } },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDoc",
      },
    },
    { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "internships",
        localField: "internship",
        foreignField: "_id",
        as: "internshipDoc",
      },
    },
    { $unwind: { path: "$internshipDoc", preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: 1 } },
  ]);

  const { outPath } = parseArgs();

  const headers = [
    ...BASE_COLUMNS.map((c) => c.header),
    ...APPLICATION_FIELDS.map((f) => f.header),
  ];
  const headerLine = headers.map(csvCell).join(",");

  const body = rows
    .map((r) => {
      const answers = (r.applicationAnswers as Record<string, unknown> | undefined) ?? {};
      const baseCells = BASE_COLUMNS.map((c) => csvCell(c.pick(r)));
      const answerCells = APPLICATION_FIELDS.map((f) => csvCell(answers[f.key]));
      return [...baseCells, ...answerCells].join(",");
    })
    .join("\r\n");

  fs.writeFileSync(outPath, "﻿" + headerLine + "\r\n" + body, "utf8");

  console.log(`Wrote ${rows.length} application rows to:\n  ${outPath}`);

  await mongoose.disconnect();
  console.log("Disconnected.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
