/**
 * Undo the premature certificate-evaluation sweep so those learners are judged
 * again under the current (points-only, exam-is-bonus) logic.
 *
 * Targets every enrollment the worker already finalised — status "completed"
 * WITH a written `certificateEvaluation`. For each it:
 *   - deletes the issued internship Certificate document(s),
 *   - deletes related certificate jobs and evaluation jobs,
 *   - clears `certificateEvaluation`,
 *   - resets status "completed" -> "enrolled".
 *
 * Their program window has already ended, so submissions/attendance stay closed
 * (the window guard still applies); only the verdict is re-opened. The next
 * evaluation sweep (or the dry-run) re-judges them on success points.
 *
 * Seed/demo certificates are untouched: they live on enrollments that are NOT
 * status "completed" with a worker-written evaluation.
 *
 * DRY RUN by default. Run from backend root:
 *   npx ts-node src/scripts/reset-premature-internship-verdicts.ts
 *   npx ts-node src/scripts/reset-premature-internship-verdicts.ts --apply
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { CertificateModel } from "../models/certificate.schema";
import { CertificateJobModel } from "../models/certificateJob.schema";
import { InternshipEvaluationJobModel } from "../models/internshipEvaluationJob.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const APPLY = process.argv.includes("--apply");

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("MONGODB_URI not defined");
  await mongoose.connect(uri);

  console.log(APPLY ? "MODE: APPLY (writing)\n" : "MODE: DRY RUN (no writes)\n");

  const targets = await InternshipEnrollmentModel.find({
    status: "completed",
    certificateEvaluation: { $exists: true },
  })
    .select("_id certificateEvaluation internshipSnapshot user")
    .lean();

  const ids = targets.map((t) => new mongoose.Types.ObjectId(String(t._id)));
  const idStrs = targets.map((t) => String(t._id));

  const verdicts = new Map<string, number>();
  for (const t of targets as any[]) {
    const v = String(t.certificateEvaluation?.verdict ?? "?");
    verdicts.set(v, (verdicts.get(v) ?? 0) + 1);
  }

  // Certs to delete: internship certs on the targeted enrollments only.
  const certs = await CertificateModel.find({
    certificateType: "internship",
    enrollmentId: { $in: ids },
  })
    .select("_id certificateId studentName enrollmentId")
    .lean();

  console.log(`Enrollments to reset (completed + evaluated): ${targets.length}`);
  for (const [v, n] of verdicts) console.log(`    verdict ${v}: ${n}`);
  console.log(`Internship certificates to delete:          ${certs.length}`);
  for (const c of certs as any[]) {
    console.log(`    ${c.certificateId}  ${c.studentName}  (enrollment ${c.enrollmentId})`);
  }

  if (targets.length === 0) {
    console.log("\nNothing to reset.");
    return;
  }

  if (!APPLY) {
    console.log(`\nRe-run with --apply to delete the certificates and reset these rows.`);
    return;
  }

  const certResult = await CertificateModel.deleteMany({
    certificateType: "internship",
    enrollmentId: { $in: ids },
  });
  const certJobResult = await CertificateJobModel.deleteMany({
    enrollmentId: { $in: idStrs },
  });
  const evalJobResult = await InternshipEvaluationJobModel.deleteMany({
    internshipEnrollmentId: { $in: idStrs },
  });
  const enrollResult = await InternshipEnrollmentModel.updateMany(
    { _id: { $in: ids } },
    { $set: { status: "enrolled" }, $unset: { certificateEvaluation: "" } },
  );

  console.log(`\nDeleted certificates:        ${certResult.deletedCount}`);
  console.log(`Deleted certificate jobs:    ${certJobResult.deletedCount}`);
  console.log(`Deleted evaluation jobs:     ${evalJobResult.deletedCount}`);
  console.log(`Enrollments reset to enrolled: ${enrollResult.modifiedCount}`);
  console.log(
    `\nDone. These learners will be re-judged on success points at the next ` +
      `evaluation sweep (or run the dry-run to preview).`,
  );
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
