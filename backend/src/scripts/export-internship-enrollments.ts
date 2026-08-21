/**
 * Export EVERY InternshipEnrollment to a single-sheet .xlsx, one row per
 * enrollment, joined to the full user profile (base + student discriminator +
 * college) and to every answer captured by the public enroll form.
 *
 * Unlike export-internship-applications.ts this does not filter on
 * `applicationAnswers`, so pipeline rows (exam_registered, in_merit_pool,
 * admin_rejected, ...) are included too. All datetimes render as IST.
 *
 * Aadhar stays out on purpose: it is stored as AES-256-GCM ciphertext and a
 * spreadsheet is the wrong place to decrypt it into.
 *
 * Run from backend root:
 *   npx ts-node src/scripts/export-internship-enrollments.ts
 *   npx ts-node src/scripts/export-internship-enrollments.ts --out=./internship-enrollments.xlsx
 */

import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import "../models"; // registers User + its discriminators, Internship, College
import { writeXlsx, XlsxCell } from "../lib/xlsx";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

type Row = Record<string, unknown>;

function parseArgs() {
  let outPath = path.resolve(process.cwd(), "internship-enrollments.xlsx");
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--out=(.+)$/);
    if (m) outPath = path.resolve(process.cwd(), m[1]);
  }
  return { outPath };
}

const obj = (v: unknown): Row | undefined =>
  v && typeof v === "object" ? (v as Row) : undefined;

/** Dates go through as Date so the writer emits real Excel date cells. */
function cell(v: unknown): XlsxCell {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v;
  if (typeof v === "number" || typeof v === "boolean") return v;
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join("; ");
  if (v instanceof mongoose.Types.ObjectId) return v.toHexString();
  return JSON.stringify(v);
}

const fullName = (u: Row | undefined): string => {
  if (!u) return "";
  const name = `${(u.firstName as string) ?? ""} ${(u.lastName as string) ?? ""}`.trim();
  return name || ((u.email as string) ?? "");
};

const COLUMNS: { header: string; pick: (r: Row) => unknown }[] = [
  // ── Identity ──────────────────────────────────────────────────────────────
  { header: "Enrollment ID", pick: (r) => r._id },
  { header: "User ID", pick: (r) => r.user },
  { header: "Name", pick: (r) => fullName(obj(r.userDoc)) },
  { header: "Email", pick: (r) => obj(r.userDoc)?.email },
  { header: "Phone", pick: (r) => obj(r.userDoc)?.phone },
  { header: "WhatsApp", pick: (r) => obj(r.userDoc)?.whatsappNumber },
  { header: "Intern ID", pick: (r) => r.internId },

  // ── Cohort ────────────────────────────────────────────────────────────────
  { header: "Internship ID", pick: (r) => r.internship },
  {
    header: "Internship Title",
    pick: (r) => obj(r.internshipSnapshot)?.title ?? obj(r.internshipDoc)?.title,
  },
  {
    header: "Internship Slug",
    pick: (r) => obj(r.internshipSnapshot)?.slug ?? obj(r.internshipDoc)?.slug,
  },
  { header: "Batch ID", pick: (r) => obj(r.batchSnapshot)?.batchId },
  { header: "Batch Name", pick: (r) => obj(r.batchSnapshot)?.name },
  { header: "Batch Start", pick: (r) => obj(r.batchSnapshot)?.internshipStartDate },
  { header: "Application Last Date", pick: (r) => obj(r.batchSnapshot)?.applicationLastDate },

  // ── Status / lifecycle ────────────────────────────────────────────────────
  { header: "Status", pick: (r) => r.status },
  { header: "Enrollment Type", pick: (r) => r.enrollmentType },
  { header: "Program Duration (months)", pick: (r) => r.programDurationMonths },
  { header: "Enrolled At", pick: (r) => r.enrolledAt },
  { header: "End Date", pick: (r) => r.endDate },
  { header: "Application Submitted At", pick: (r) => r.applicationSubmittedAt },
  { header: "Created At", pick: (r) => r.createdAt },
  { header: "Updated At", pick: (r) => r.updatedAt },

  // ── Merit path ────────────────────────────────────────────────────────────
  { header: "Exam Score", pick: (r) => r.examScore },
  { header: "Exam Attempted At", pick: (r) => r.examAttemptedAt },
  { header: "Admin Action By", pick: (r) => fullName(obj(r.adminActionByDoc)) },
  { header: "Admin Action At", pick: (r) => r.adminActionAt },
  { header: "Admin Rejection Note", pick: (r) => r.adminRejectionNote },

  // ── Paid path ─────────────────────────────────────────────────────────────
  { header: "Payment Amount", pick: (r) => r.paymentAmount },
  { header: "Payment Order ID", pick: (r) => r.paymentOrderId },
  { header: "Payment Confirmed At", pick: (r) => r.paymentConfirmedAt },

  // ── Documentation / offer letter ──────────────────────────────────────────
  { header: "Docs Submitted At", pick: (r) => obj(r.documentation)?.submittedAt },
  { header: "Learner Photo URL", pick: (r) => obj(r.documentation)?.learnerPhoto },
  { header: "Docs Reviewed By", pick: (r) => fullName(obj(r.documentationReviewedByDoc)) },
  { header: "Docs Reviewed At", pick: (r) => r.documentationReviewedAt },
  { header: "Docs Rejection Note", pick: (r) => r.documentationRejectionNote },
  { header: "Terms Accepted At", pick: (r) => r.termsAcceptedAt },
  { header: "Offer Letter Generated At", pick: (r) => r.offerLetterGeneratedAt },
  { header: "Offer Letter URL", pick: (r) => r.offerLetterUrl },

  // ── Points / certificate ──────────────────────────────────────────────────
  { header: "Internship Success Points", pick: (r) => r.internshipSuccessPoints },
  { header: "Registration Points Awarded", pick: (r) => r.registrationSuccessPointsAwarded },
  { header: "Certificate Override", pick: (r) => r.certificateOverride },
  { header: "Cert Verdict", pick: (r) => obj(r.certificateEvaluation)?.verdict },
  { header: "Cert Reason", pick: (r) => obj(r.certificateEvaluation)?.reason },
  { header: "Cert Evaluated At", pick: (r) => obj(r.certificateEvaluation)?.evaluatedAt },
  { header: "Cert Points Earned", pick: (r) => obj(r.certificateEvaluation)?.earned },
  { header: "Cert Points Achievable", pick: (r) => obj(r.certificateEvaluation)?.totalAchievable },
  { header: "Cert Threshold %", pick: (r) => obj(r.certificateEvaluation)?.thresholdPct },
  { header: "Cert Required Points", pick: (r) => obj(r.certificateEvaluation)?.requiredPoints },

  // ── Email send markers ────────────────────────────────────────────────────
  { header: "Entrance Result Email Sent At", pick: (r) => r.entranceResultEmailSentAt },
  { header: "Closure Email Sent At", pick: (r) => r.closureEmailSentAt },
  { header: "Closure Pending Email Sent At", pick: (r) => r.closurePendingEmailSentAt },

  // ── User profile ──────────────────────────────────────────────────────────
  { header: "User Type", pick: (r) => obj(r.userDoc)?.userType },
  { header: "Account Status", pick: (r) => obj(r.userDoc)?.status },
  { header: "Provider", pick: (r) => obj(r.userDoc)?.provider },
  { header: "Phone Verified At", pick: (r) => obj(r.userDoc)?.phoneVerifiedAt },
  { header: "Gender", pick: (r) => obj(r.userDoc)?.gender },
  { header: "DOB", pick: (r) => obj(r.userDoc)?.dob },
  { header: "College", pick: (r) => obj(r.collegeDoc)?.name ?? obj(r.userDoc)?.collegeName },
  { header: "Degree", pick: (r) => obj(r.userDoc)?.degreeName },
  { header: "Passing Year", pick: (r) => obj(r.userDoc)?.passingYear },
  { header: "Area of Interest", pick: (r) => obj(r.userDoc)?.areaOfInterest },
  { header: "Experience Level", pick: (r) => obj(r.userDoc)?.experienceLevel },
  { header: "Current Position", pick: (r) => obj(r.userDoc)?.currentPosition },
  { header: "Current Company", pick: (r) => obj(r.userDoc)?.currentCompany },
  { header: "Domain", pick: (r) => obj(r.userDoc)?.domain },
  { header: "Profile LinkedIn URL", pick: (r) => obj(r.userDoc)?.linkedinUrl },
  { header: "Portfolio", pick: (r) => obj(r.userDoc)?.portfolio },
  { header: "Join Source", pick: (r) => obj(r.userDoc)?.joinSource },
  { header: "Father Occupation", pick: (r) => obj(r.userDoc)?.fatherOccupation },
  { header: "Wallet Success Points", pick: (r) => obj(r.userDoc)?.successPoints },
  { header: "Address", pick: (r) => obj(obj(r.userDoc)?.address)?.address },
  { header: "City", pick: (r) => obj(obj(r.userDoc)?.address)?.city },
  { header: "State", pick: (r) => obj(obj(r.userDoc)?.address)?.state },
  { header: "Country", pick: (r) => obj(obj(r.userDoc)?.address)?.country },
  { header: "Pincode", pick: (r) => obj(obj(r.userDoc)?.address)?.pincode },
  { header: "Google Email", pick: (r) => obj(obj(obj(r.userDoc)?.accounts)?.google)?.email },
  { header: "LinkedIn Email", pick: (r) => obj(obj(obj(r.userDoc)?.accounts)?.linkedin)?.email },
  { header: "GitHub", pick: (r) => obj(obj(r.userDoc)?.accounts)?.github },
  { header: "Instagram", pick: (r) => obj(obj(r.userDoc)?.accounts)?.instagram },
  { header: "User Created At", pick: (r) => obj(r.userDoc)?.createdAt },
];

// Keys of the public enroll form payload, stored verbatim under
// `applicationAnswers` (see EnrollForm.tsx -> buildApplicationAnswersPayload).
const APPLICATION_FIELDS: { key: string; header: string }[] = [
  { key: "fullName", header: "Form: Full Name" },
  { key: "email", header: "Form: Email" },
  { key: "phone", header: "Form: Phone" },
  { key: "dob", header: "Form: DOB" },
  { key: "gender", header: "Form: Gender" },
  { key: "experience", header: "Form: Experience" },
  { key: "university", header: "Form: University" },
  { key: "country", header: "Form: Country" },
  { key: "courseName", header: "Form: Course Name" },
  { key: "yearOfPassing", header: "Form: Year of Passing" },
  { key: "linkedinUrl", header: "Form: LinkedIn URL" },
  { key: "instagramUrl", header: "Form: Instagram URL" },
  { key: "collegeEmail", header: "Form: College Email" },
  { key: "guardianContact", header: "Form: Guardian Contact" },
  { key: "joinReason", header: "Form: Reason to Join" },
  { key: "crName", header: "Form: CR Name" },
  { key: "crContact", header: "Form: CR Contact" },
  { key: "paidTraining", header: "Form: Paid Training" },
  { key: "whatsappJoined", header: "Form: WhatsApp Joined" },
  { key: "internshipDuration", header: "Form: Internship Duration" },
  { key: "referralSource", header: "Form: Referral Source" },
  { key: "socialMediaFollowed", header: "Form: Social Media Followed" },
  { key: "marks10thType", header: "Form: 10th Marks Type" },
  { key: "marks10thValue", header: "Form: 10th Marks Value" },
  { key: "marks12thType", header: "Form: 12th Marks Type" },
  { key: "marks12thValue", header: "Form: 12th Marks Value" },
  { key: "marksPursuingType", header: "Form: Pursuing Marks Type" },
  { key: "marksPursuingValue", header: "Form: Pursuing Marks Value" },
  { key: "marketingActivities", header: "Form: Marketing Activities" },
  { key: "batchId", header: "Form: Batch ID" },
];

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI (or MONGO_URI) must be set in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}`);

  // One pipeline, all joins done server-side. `users` is hit three times but
  // each is an _id lookup, and the admin/reviewer lookups are on sparse fields
  // so most rows match nothing.
  const rows = await InternshipEnrollmentModel.aggregate<Row>([
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDoc",
        pipeline: [{ $project: { password: 0, refreshTokens: 0, successPointsHistory: 0 } }],
      },
    },
    { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "colleges",
        localField: "userDoc.college",
        foreignField: "_id",
        as: "collegeDoc",
        pipeline: [{ $project: { name: 1 } }],
      },
    },
    { $unwind: { path: "$collegeDoc", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "internships",
        localField: "internship",
        foreignField: "_id",
        as: "internshipDoc",
        pipeline: [{ $project: { title: 1, slug: 1 } }],
      },
    },
    { $unwind: { path: "$internshipDoc", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "adminActionBy",
        foreignField: "_id",
        as: "adminActionByDoc",
        pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
      },
    },
    { $unwind: { path: "$adminActionByDoc", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "documentationReviewedBy",
        foreignField: "_id",
        as: "documentationReviewedByDoc",
        pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
      },
    },
    { $unwind: { path: "$documentationReviewedByDoc", preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: 1 } },
  ]).allowDiskUse(true);

  const { outPath } = parseArgs();

  const headers = [
    ...COLUMNS.map((c) => c.header),
    ...APPLICATION_FIELDS.map((f) => f.header),
  ];

  const sheetRows = rows.map((r) => {
    const answers = obj(r.applicationAnswers) ?? {};
    return [
      ...COLUMNS.map((c) => cell(c.pick(r))),
      ...APPLICATION_FIELDS.map((f) => cell(answers[f.key])),
    ];
  });

  await writeXlsx(outPath, [
    { name: "Internship Enrollments", headers, rows: sheetRows },
  ]);

  const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
    const key = String(r.status ?? "unknown");
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`Wrote ${rows.length} enrollment rows x ${headers.length} columns to:`);
  console.log(`  ${outPath}`);
  console.log("Status breakdown:");
  Object.entries(byStatus)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => console.log(`  ${status.padEnd(28)} ${count}`));

  await mongoose.disconnect();
  console.log("Disconnected.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
