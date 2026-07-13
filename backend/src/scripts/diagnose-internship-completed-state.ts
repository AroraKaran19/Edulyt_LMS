/**
 * READ ONLY. Did anyone get marked `completed` / evaluated, and was that
 * legitimate? Reports internship enrollment status counts, the certificate
 * evaluation verdicts written, when they were written, and certificates issued.
 *
 *   npx ts-node src/scripts/diagnose-internship-completed-state.ts
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { CertificateModel } from "../models/certificate.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("MONGODB_URI not defined");
  await mongoose.connect(uri);

  // Status counts
  const byStatus = await InternshipEnrollmentModel.aggregate([
    { $group: { _id: "$status", n: { $sum: 1 } } },
    { $sort: { n: -1 } },
  ]);
  console.log("\nEnrollments by status:");
  for (const s of byStatus) console.log(`  ${String(s._id).padEnd(26)} ${s.n}`);

  // Who carries a written certificateEvaluation (i.e. the worker judged them)?
  const evaluated = await InternshipEnrollmentModel.find({
    certificateEvaluation: { $exists: true },
  })
    .select("status certificateEvaluation certificateOverride internshipSnapshot user")
    .lean();

  console.log(`\nEnrollments with a written certificateEvaluation: ${evaluated.length}`);
  const verdictCount = new Map<string, number>();
  let minAt: Date | null = null;
  let maxAt: Date | null = null;
  for (const e of evaluated as any[]) {
    const v = String(e.certificateEvaluation?.verdict ?? "?");
    verdictCount.set(v, (verdictCount.get(v) ?? 0) + 1);
    const at = e.certificateEvaluation?.evaluatedAt
      ? new Date(e.certificateEvaluation.evaluatedAt)
      : null;
    if (at && !Number.isNaN(at.getTime())) {
      if (!minAt || at < minAt) minAt = at;
      if (!maxAt || at > maxAt) maxAt = at;
    }
  }
  for (const [v, n] of verdictCount) console.log(`    verdict ${v}: ${n}`);
  if (minAt && maxAt) {
    console.log(`    evaluatedAt range: ${minAt.toISOString()}  ->  ${maxAt.toISOString()}`);
  }

  // Status of the evaluated rows (should all be "completed" if the worker ran)
  const evalStatus = new Map<string, number>();
  for (const e of evaluated as any[]) {
    evalStatus.set(String(e.status), (evalStatus.get(String(e.status)) ?? 0) + 1);
  }
  console.log(`  Their current status:`);
  for (const [s, n] of evalStatus) console.log(`    ${s}: ${n}`);

  // `completed` rows that DON'T have an evaluation — marked completed some other way
  const completedNoEval = await InternshipEnrollmentModel.countDocuments({
    status: "completed",
    certificateEvaluation: { $exists: false },
  });
  console.log(`\ncompleted WITHOUT a certificateEvaluation: ${completedNoEval}`);

  // Internship certificates issued
  const certs = await CertificateModel.find({ certificateType: "internship", isActive: true })
    .select("issuedAt enrollmentId studentName")
    .sort({ issuedAt: -1 })
    .lean();
  console.log(`\nInternship certificates issued (active): ${certs.length}`);
  for (const c of (certs as any[]).slice(0, 15)) {
    console.log(`  ${new Date(c.issuedAt).toISOString()}  ${c.studentName}  (enrollment ${c.enrollmentId})`);
  }
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
