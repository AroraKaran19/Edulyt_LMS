/**
 * READ-ONLY: did a user actually sit an entrance exam? Shows their internship
 * enrollment statuses and any exam submissions (entrance/certification),
 * including whether each was just started (draft) or submitted.
 *
 *   npx ts-node src/scripts/check-user-entrance-exam.ts <email>
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { UserModel } from "../models/user.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipSubmissionModel } from "../models/internshipSubmission.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const email = process.argv[2] || "";

const fmt = (d?: unknown) =>
  d ? new Date(d as string).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—";

async function main() {
  if (!email) throw new Error("Pass an email as the first argument");
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  const user = (await UserModel.findOne({ email })
    .select("_id email firstName lastName")
    .lean()) as any;
  if (!user) {
    console.log(`No user found with email ${email}`);
    await mongoose.disconnect();
    return;
  }
  console.log(`User: ${user.firstName ?? ""} ${user.lastName ?? ""} <${user.email}>  id=${user._id}\n`);

  const enrollments = (await InternshipEnrollmentModel.find({ user: user._id })
    .select("status internshipSnapshot.title batchSnapshot.name examScore examAttemptedAt enrollmentType")
    .lean()) as any[];

  console.log(`Internship enrollments: ${enrollments.length}`);
  for (const e of enrollments) {
    console.log(
      `  • ${e.internshipSnapshot?.title ?? "—"} [${e.batchSnapshot?.name ?? "—"}]  ` +
        `status=${e.status}  type=${e.enrollmentType ?? "—"}  ` +
        `examScore=${e.examScore ?? "—"}  examAttemptedAt=${fmt(e.examAttemptedAt)}`,
    );
  }

  const subs = (await InternshipSubmissionModel.find({
    userId: user._id,
    submissionFor: "exam",
  })
    .select("examId status submittedAt totalAwardedScore templateSnapshot.title templateSnapshot.examType createdAt")
    .lean()) as any[];

  console.log(`\nExam submissions: ${subs.length}`);
  for (const s of subs) {
    const sat = s.status !== "draft" || s.submittedAt;
    console.log(
      `  • "${s.templateSnapshot?.title ?? "—"}" type=${s.templateSnapshot?.examType ?? "entrance"}  ` +
        `status=${s.status}  submittedAt=${fmt(s.submittedAt)}  score=${s.totalAwardedScore ?? "—"}  ` +
        `started=${fmt(s.createdAt)}  ${sat ? "→ SAT THE EXAM" : "→ only opened (draft, not submitted)"}`,
    );
  }

  const entranceSubmitted = subs.filter(
    (s) =>
      (s.templateSnapshot?.examType ?? "entrance") === "entrance" &&
      (s.status !== "draft" || s.submittedAt),
  );
  const entranceStartedOnly = subs.filter(
    (s) =>
      (s.templateSnapshot?.examType ?? "entrance") === "entrance" &&
      s.status === "draft" &&
      !s.submittedAt,
  );

  console.log("\n=== VERDICT ===");
  if (entranceSubmitted.length > 0) {
    console.log(`YES — submitted ${entranceSubmitted.length} entrance exam(s).`);
  } else if (entranceStartedOnly.length > 0) {
    console.log(
      `PARTIAL — opened an entrance exam (draft) but never submitted it.`,
    );
  } else {
    console.log("NO — no entrance exam attempt on record (at most registered).");
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
