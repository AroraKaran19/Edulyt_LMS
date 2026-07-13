/**
 * DRY RUN — what verdict would every learner receive if the certificate
 * evaluation worker ran right now?
 *
 * The worker evaluates an enrollment on day N+1 after its program window ends
 * and writes a FINAL pass/fail. This script computes the same verdict for every
 * enrollment that the first sweep would pick up, and prints who passes, who
 * fails, and by how much — WITHOUT writing anything.
 *
 * Run this and read the output before the cron is ever enabled. Every "FAIL"
 * below is a real learner who will be permanently denied a certificate.
 *
 * Selection mirrors the worker exactly:
 *   status              = "enrolled"
 *   batch has NO certificationExamTemplateId   (exam batches are not ours)
 *   window has ended    (cohort start + programDurationMonths < now)
 *   not already evaluated
 *
 * NOTE: the window is anchored on `batchSnapshot.internshipStartDate`, NOT the
 * enrollment's stored `endDate` — the stored value is derived from `enrolledAt`
 * today, which is the wrong anchor and is being corrected by this work.
 *
 * READ ONLY. Run from backend root:
 *   npx ts-node src/scripts/dry-run-internship-certificate-verdicts.ts
 *   npx ts-node src/scripts/dry-run-internship-certificate-verdicts.ts --csv > verdicts.csv
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { UserModel } from "../models";
import { computeInternshipEligibility } from "../services/internshipEligibility.services";
import { computeCertificationExamWindowUtc } from "../lib/certificationExamSchedule";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const CSV = process.argv.includes("--csv");

type Row = {
  enrollmentId: string;
  learner: string;
  email: string;
  internship: string;
  batch: string;
  startDate: string;
  months: number | null;
  windowEnd: string;
  verdict: "PASS" | "FAIL" | "SKIP";
  reason: string;
  earned: number;
  required: number;
  achievable: number;
  thresholdPct: number;
};

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("MONGODB_URI not defined");
  await mongoose.connect(uri);

  const now = new Date();

  // The certificate is decided by success points alone — every enrolled learner
  // is evaluated the same way, exam or no exam (the exam is just bonus points).
  const internships = await InternshipModel.find({})
    .select("title")
    .lean();
  const internshipTitleById = new Map<string, string>();
  for (const ins of internships as any[]) {
    internshipTitleById.set(String(ins._id), String(ins.title ?? ""));
  }

  const enrolled = await InternshipEnrollmentModel.find({
    status: "enrolled",
    certificateEvaluation: { $exists: false },
  })
    .select(
      "user internship internshipSnapshot batchSnapshot programDurationMonths " +
        "internshipSuccessPoints enrolledAt",
    )
    .lean();

  console.error(`Scanning ${enrolled.length} "enrolled" enrollment(s)...`);

  const userIds = [
    ...new Set((enrolled as any[]).map((e) => String(e.user))),
  ].map((id) => new mongoose.Types.ObjectId(id));
  const users = await UserModel.find({ _id: { $in: userIds } })
    .select("firstName lastName email")
    .lean();
  const userById = new Map(
    (users as any[]).map((u) => [String(u._id), u]),
  );

  const rows: Row[] = [];
  let skippedNotEnded = 0;
  let skippedNoDuration = 0;

  for (const e of enrolled as any[]) {
    const insId = String(e.internship);

    const months = e.programDurationMonths;
    const startRaw = e.batchSnapshot?.internshipStartDate;
    if (typeof months !== "number" || months < 1 || !startRaw) {
      skippedNoDuration += 1;
      continue;
    }

    let windowEnd: Date;
    try {
      windowEnd = computeCertificationExamWindowUtc(
        new Date(startRaw),
        months,
      ).examEndAt;
    } catch {
      skippedNoDuration += 1;
      continue;
    }

    if (windowEnd >= now) {
      skippedNotEnded += 1;
      continue;
    }

    const el = await computeInternshipEligibility(String(e._id));
    const u = userById.get(String(e.user));
    const verdict: Row["verdict"] = el.certificateEligible ? "PASS" : "FAIL";

    rows.push({
      enrollmentId: String(e._id),
      learner: `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || "(unknown)",
      email: String(u?.email ?? ""),
      internship:
        e.internshipSnapshot?.title ?? internshipTitleById.get(insId) ?? "?",
      batch: e.batchSnapshot?.name ?? "?",
      startDate: new Date(startRaw).toISOString().slice(0, 10),
      months,
      windowEnd: windowEnd.toISOString().slice(0, 10),
      verdict,
      reason: el.certificateEligible ? "passed" : "points_shortfall",
      earned: el.earned,
      required: el.requiredPoints,
      achievable: el.totalAchievable,
      thresholdPct: el.thresholdPct,
    });
  }

  if (CSV) {
    console.log(
      "enrollmentId,learner,email,internship,batch,startDate,months,windowEnd,verdict,reason,earned,required,achievable,thresholdPct",
    );
    for (const r of rows) {
      const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
      console.log(
        [
          r.enrollmentId, esc(r.learner), esc(r.email), esc(r.internship),
          esc(r.batch), r.startDate, r.months, r.windowEnd, r.verdict,
          r.reason, r.earned, r.required, r.achievable, r.thresholdPct,
        ].join(","),
      );
    }
    return;
  }

  const passes = rows.filter((r) => r.verdict === "PASS");
  const fails = rows.filter((r) => r.verdict === "FAIL");

  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`  FIRST SWEEP — what the worker would do RIGHT NOW`);
  console.log(`═══════════════════════════════════════════════════════════`);
  console.log(`  Would evaluate:   ${rows.length}`);
  console.log(`    -> PASS (certificate issued):  ${passes.length}`);
  console.log(`    -> FAIL (permanently denied):  ${fails.length}`);
  console.log(`\n  Skipped:`);
  console.log(`    window not ended yet:          ${skippedNotEnded}`);
  console.log(`    no usable duration/start:      ${skippedNoDuration}`);
  console.log(`═══════════════════════════════════════════════════════════\n`);

  if (fails.length > 0) {
    console.log(`FAILURES — these learners would be PERMANENTLY denied:\n`);
    for (const r of fails) {
      const pct =
        r.achievable > 0
          ? Math.round((r.earned / r.achievable) * 100)
          : 0;
      console.log(
        `  ${r.verdict}  ${r.learner} <${r.email}>`,
      );
      console.log(
        `        ${r.internship} / ${r.batch}  (${r.startDate} + ${r.months}mo -> ended ${r.windowEnd})`,
      );
      console.log(
        `        earned ${r.earned} of ${r.required} required ` +
          `(${r.thresholdPct}% of ${r.achievable} achievable; learner is at ${pct}%)`,
      );
      console.log(`        enrollment: ${r.enrollmentId}\n`);
    }
  }

  if (passes.length > 0) {
    console.log(`PASSES — these learners would receive a certificate:\n`);
    for (const r of passes) {
      console.log(
        `  PASS  ${r.learner} <${r.email}>  —  ${r.internship} / ${r.batch}` +
          `  (${r.earned}/${r.required} pts)`,
      );
    }
    console.log("");
  }

  if (rows.some((r) => r.achievable === 0)) {
    console.log(
      `WARNING: some rows have 0 achievable points — the batch has no tasks or\n` +
        `live meetings configured in the learner's window. With a threshold > 0\n` +
        `they pass trivially (0 >= 0); with the pool wrong they may fail unfairly.\n` +
        `Investigate these before enabling the cron.\n`,
    );
  }

  console.log(`Re-run with --csv to export the full table.\n`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
