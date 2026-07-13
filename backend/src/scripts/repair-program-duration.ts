/**
 * Make `programDurationMonths` present on every enrollment that needs it, so the
 * field can become `required: true` without breaking saves of legacy documents,
 * and re-anchor `endDate` on the cohort start.
 *
 *   Pipeline rows  (exam/payment/rejected/dropped/revoked) — never reach the
 *                  program, so no deadline is ever computed for them. DELETED.
 *   In-program rows (enrolled/paused/completed/docs/offer-letter) — hold KYC,
 *                  offer letters, submissions, points. NEVER deleted. Repaired:
 *                    1. from applicationAnswers.internshipDuration, else
 *                    2. 3 months IF the learner already holds an offer letter —
 *                       the generator defaults to 3 when the field is absent
 *                       (cron.services.ts:411), so the document already in their
 *                       hands says 3. Honour it.
 *                    3. otherwise reported for a manual decision; not touched.
 *
 * Then: recompute `endDate` for every enrollment from the COHORT start anchor
 * (the pre-save hook only fires on .save(), so existing rows keep a stale
 * `enrolledAt`-derived value until touched).
 *
 * DRY RUN by default. Run from backend root:
 *   npx ts-node src/scripts/repair-program-duration.ts
 *   npx ts-node src/scripts/repair-program-duration.ts --apply
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { parseProgramDurationMonthsFromAnswers } from "../lib/certificationExamSchedule";
import { computeProgramEndDate } from "../lib/internshipProgramWindow";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const APPLY = process.argv.includes("--apply");

/** Statuses that never reach the program — a missing duration cannot hurt them. */
const PIPELINE_STATUSES = [
  "exam_registered",
  "exam_attempted",
  "in_merit_pool",
  "admin_rejected",
  "payment_pending",
  "dropped",
  "revoked",
];

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("MONGODB_URI not defined");
  await mongoose.connect(uri);

  console.log(APPLY ? "MODE: APPLY (writing)\n" : "MODE: DRY RUN (no writes)\n");

  const missingFilter = {
    $or: [
      { programDurationMonths: { $exists: false } },
      { programDurationMonths: null },
    ],
  };

  // ── 1. Pipeline rows: delete ────────────────────────────────────────────────
  const deletable = await InternshipEnrollmentModel.find({
    ...missingFilter,
    status: { $in: PIPELINE_STATUSES },
  })
    .select("_id status")
    .lean();

  const byStatus = new Map<string, number>();
  for (const d of deletable as any[]) {
    const s = String(d.status);
    byStatus.set(s, (byStatus.get(s) ?? 0) + 1);
  }
  console.log(`Pipeline rows to DELETE: ${deletable.length}`);
  for (const [s, n] of [...byStatus.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${s.padEnd(20)} ${n}`);
  }
  if (APPLY && deletable.length > 0) {
    const res = await InternshipEnrollmentModel.deleteMany({
      _id: { $in: (deletable as any[]).map((d) => d._id) },
    });
    console.log(`  -> deleted ${res.deletedCount}`);
  }

  // ── 2. In-program rows: repair, never delete ────────────────────────────────
  const atRisk = await InternshipEnrollmentModel.find({
    ...missingFilter,
    status: { $nin: PIPELINE_STATUSES },
  })
    .select("_id status applicationAnswers offerLetterUrl internshipSnapshot")
    .lean();

  console.log(`\nIn-program rows to REPAIR: ${atRisk.length}`);

  let fromAnswers = 0;
  let fromOfferLetter = 0;
  const manual: string[] = [];

  for (const e of atRisk as any[]) {
    const parsed = parseProgramDurationMonthsFromAnswers(
      (e.applicationAnswers as Record<string, unknown>) ?? null,
    );
    let months: number | null = null;
    let source = "";

    if (parsed != null) {
      months = parsed;
      source = "applicationAnswers";
      fromAnswers += 1;
    } else if (e.offerLetterUrl) {
      months = 3;
      source = "offer letter (generator default of 3)";
      fromOfferLetter += 1;
    } else {
      manual.push(
        `${String(e._id)} [${e.status}] ${e.internshipSnapshot?.title ?? "?"}`,
      );
      continue;
    }

    console.log(`  ${String(e._id)} [${e.status}] -> ${months} months (${source})`);
    if (APPLY) {
      await InternshipEnrollmentModel.updateOne(
        { _id: e._id },
        { $set: { programDurationMonths: months } },
      );
    }
  }

  console.log(`\n─────────────────────────────────────────────`);
  console.log(`  repaired from answers:       ${fromAnswers}`);
  console.log(`  repaired from offer letter:  ${fromOfferLetter}`);
  console.log(`  NEED A MANUAL DECISION:      ${manual.length}`);
  console.log(`─────────────────────────────────────────────`);
  for (const m of manual) console.log(`  ${m}`);
  if (manual.length > 0) {
    console.log(
      `\nThese hold learner work but have no recoverable duration. Resolve them\n` +
        `before shipping the schema change — a required field breaks their saves.`,
    );
  }

  // ── 3. Re-anchor endDate on the cohort start for every enrollment ───────────
  const all = await InternshipEnrollmentModel.find({
    programDurationMonths: { $exists: true, $ne: null },
    "batchSnapshot.internshipStartDate": { $exists: true },
  })
    .select("_id programDurationMonths batchSnapshot.internshipStartDate endDate")
    .lean();

  let reanchored = 0;
  for (const e of all as any[]) {
    let want: Date;
    try {
      want = computeProgramEndDate(
        new Date(e.batchSnapshot.internshipStartDate),
        e.programDurationMonths,
      );
    } catch {
      continue;
    }
    const have = e.endDate ? new Date(e.endDate).getTime() : null;
    if (have === want.getTime()) continue;
    reanchored += 1;
    if (APPLY) {
      await InternshipEnrollmentModel.updateOne(
        { _id: e._id },
        { $set: { endDate: want } },
      );
    }
  }
  console.log(`\nendDate re-anchored to cohort start: ${reanchored} row(s)`);

  if (!APPLY) console.log(`\nRe-run with --apply to write.`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
