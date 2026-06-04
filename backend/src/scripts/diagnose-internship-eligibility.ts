/**
 * Dump a learner's internship eligibility inputs to debug the % gate.
 * READ ONLY. Run from backend root:
 *   npx ts-node src/scripts/diagnose-internship-eligibility.ts <email> [titleSubstring]
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { UserModel } from "../models";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { InternshipSubmissionModel } from "../models/internshipSubmission.schema";
import { InternshipTaskModel } from "../models/internshipTask.schema";
import { computeInternshipEligibility } from "../services/internshipEligibility.services";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function run() {
  const email = (process.argv[2] || "test123@gmail.com").trim();
  const titleFilter = (process.argv[3] || "data analytics").trim().toLowerCase();
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("MONGODB_URI not defined");
  await mongoose.connect(uri);

  const user = await UserModel.findOne({
    email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  }).lean();
  if (!user) { console.log(`No user for ${email}`); return; }

  const enrollments = await InternshipEnrollmentModel.find({ user: (user as any)._id }).lean();
  const enr = (enrollments as any[]).find((e) =>
    (e.internshipSnapshot?.title || "").toLowerCase().includes(titleFilter),
  );
  if (!enr) { console.log(`No enrollment matching "${titleFilter}"`); return; }

  console.log(`Enrollment ${enr._id}`);
  console.log(`  status:                 ${enr.status}`);
  console.log(`  internshipSuccessPoints:${enr.internshipSuccessPoints}`);
  console.log(`  batchId:                ${enr.batchSnapshot?.batchId}`);

  const internship = await InternshipModel.findById(enr.internship)
    .select("certificationThreshold taskTemplateIds certificationExamTemplateId batches")
    .lean<any>();

  console.log(`\nInternship-level (what computeInternshipEligibility currently reads):`);
  console.log(`  certificationThreshold:        ${internship?.certificationThreshold}`);
  console.log(`  internship.taskTemplateIds:    ${JSON.stringify(internship?.taskTemplateIds ?? "undefined")}`);
  console.log(`  internship.certificationExamId:${JSON.stringify(internship?.certificationExamTemplateId ?? "undefined")}`);

  const batch = (internship?.batches ?? []).find(
    (b: any) => String(b._id) === String(enr.batchSnapshot?.batchId),
  );
  console.log(`\nBatch-level (the real config for this learner):`);
  console.log(`  batch.taskTemplateIds:         ${JSON.stringify(batch?.taskTemplateIds ?? "none")}`);
  console.log(`  batch.certificationExamId:     ${JSON.stringify(batch?.certificationExamTemplateId ?? "none")}`);

  if (batch?.taskTemplateIds?.length) {
    const tasks = await InternshipTaskModel.find({ _id: { $in: batch.taskTemplateIds } })
      .select("title totalScore dueDays isActive").lean<any[]>();
    console.log(`\n  Batch tasks:`);
    for (const t of tasks) {
      console.log(`    - "${t.title}" total=${t.totalScore} dueDays=${t.dueDays} active=${t.isActive !== false}`);
    }
  }

  const subs = await InternshipSubmissionModel.find({ enrollmentId: enr._id })
    .select("submissionFor taskId examId status totalAwardedScore creditedSuccessPoints")
    .lean<any[]>();
  console.log(`\nSubmissions for this enrollment (${subs.length}):`);
  for (const s of subs) {
    console.log(
      `  - for=${s.submissionFor} status=${String(s.status).padEnd(18)} awarded=${s.totalAwardedScore} creditedSuccessPoints=${s.creditedSuccessPoints ?? "(unset)"} ${s.taskId ? `task=${s.taskId}` : `exam=${s.examId}`}`,
    );
  }

  const elig = await computeInternshipEligibility(String(enr._id));
  console.log(`\ncomputeInternshipEligibility() result (after fix):`);
  console.log(JSON.stringify(elig, null, 2));
}

run()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(async () => { await mongoose.connection.close(); process.exit(process.exitCode ?? 0); });
