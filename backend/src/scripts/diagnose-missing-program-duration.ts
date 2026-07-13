/**
 * Report internship enrollments missing `programDurationMonths`.
 *
 * The field is about to become required — it anchors the program deadline
 * (`endDate`) and therefore the certificate verdict. This tells us what is
 * actually in the database before we decide to delete, backfill, or repair.
 *
 * Rows are split into two buckets:
 *   DELETABLE — never entered the program (exam/payment pipeline, rejected,
 *               dropped, revoked). No deadline is ever computed for these, so
 *               a missing duration is harmless. Safe to remove.
 *   AT RISK   — in or past the program (enrolled / paused / completed /
 *               docs / offer-letter states). These have real learner work
 *               attached. Deleting one destroys a live program. For each we
 *               report what would be lost, and whether
 *               `applicationAnswers.internshipDuration` can supply the value.
 *
 * READ ONLY. Run from backend root:
 *   npx ts-node src/scripts/diagnose-missing-program-duration.ts
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipSubmissionModel } from "../models/internshipSubmission.schema";
import { CertificateModel } from "../models/certificate.schema";
import { parseProgramDurationMonthsFromAnswers } from "../lib/certificationExamSchedule";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

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

  const total = await InternshipEnrollmentModel.countDocuments({});
  const missing = await InternshipEnrollmentModel.find({
    $or: [
      { programDurationMonths: { $exists: false } },
      { programDurationMonths: null },
    ],
  })
    .select(
      "status enrollmentType internshipSnapshot batchSnapshot enrolledAt endDate " +
        "internshipSuccessPoints offerLetterUrl internId documentation " +
        "applicationAnswers user",
    )
    .lean();

  console.log(`\nTotal internship enrollments: ${total}`);
  console.log(`Missing programDurationMonths: ${missing.length}\n`);

  if (missing.length === 0) {
    console.log("Nothing to do — every enrollment has a duration.");
    return;
  }

  // ── Breakdown by status ────────────────────────────────────────────────────
  const byStatus = new Map<string, number>();
  for (const e of missing as any[]) {
    const s = String(e.status ?? "(none)");
    byStatus.set(s, (byStatus.get(s) ?? 0) + 1);
  }
  console.log("By status:");
  for (const [status, count] of [...byStatus.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    const bucket = PIPELINE_STATUSES.includes(status) ? "DELETABLE" : "AT RISK";
    console.log(`  ${status.padEnd(26)} ${String(count).padStart(5)}   ${bucket}`);
  }

  const deletable = (missing as any[]).filter((e) =>
    PIPELINE_STATUSES.includes(String(e.status)),
  );
  const atRisk = (missing as any[]).filter(
    (e) => !PIPELINE_STATUSES.includes(String(e.status)),
  );

  console.log(`\n─────────────────────────────────────────────────────────────`);
  console.log(`DELETABLE (never entered the program): ${deletable.length}`);
  console.log(`AT RISK   (live / past program rows):  ${atRisk.length}`);
  console.log(`─────────────────────────────────────────────────────────────\n`);

  if (atRisk.length === 0) {
    console.log("No at-risk rows. Deleting the pipeline rows is safe.");
    return;
  }

  // ── Detail every at-risk row: what would be destroyed, and can we recover
  //    the duration from the application answers the learner submitted?
  const ids = atRisk.map((e) => new mongoose.Types.ObjectId(String(e._id)));

  const [subCounts, certs] = await Promise.all([
    InternshipSubmissionModel.aggregate([
      { $match: { enrollmentId: { $in: ids } } },
      { $group: { _id: "$enrollmentId", count: { $sum: 1 } } },
    ]),
    CertificateModel.find({
      enrollmentId: { $in: ids },
      certificateType: "internship",
    })
      .select("enrollmentId")
      .lean(),
  ]);

  const subsById = new Map<string, number>(
    (subCounts as any[]).map((r) => [String(r._id), r.count as number]),
  );
  const certIds = new Set(
    (certs as any[]).map((c) => String(c.enrollmentId)),
  );

  let recoverable = 0;
  let unrecoverable = 0;

  console.log("AT-RISK ROWS — deleting any of these destroys learner work:\n");
  for (const e of atRisk) {
    const id = String(e._id);
    const answers = e.applicationAnswers as Record<string, unknown> | undefined;
    const parsed = parseProgramDurationMonthsFromAnswers(answers ?? null);
    if (parsed != null) recoverable += 1;
    else unrecoverable += 1;

    const subs = subsById.get(id) ?? 0;
    const flags = [
      e.offerLetterUrl ? `offerLetter(${e.internId ?? "?"})` : null,
      e.documentation ? "KYC" : null,
      subs > 0 ? `${subs} submission(s)` : null,
      (e.internshipSuccessPoints ?? 0) > 0
        ? `${e.internshipSuccessPoints} pts`
        : null,
      certIds.has(id) ? "CERTIFICATE ISSUED" : null,
    ].filter(Boolean);

    console.log(`  ${id}  [${e.status}]  ${e.internshipSnapshot?.title ?? "?"}`);
    console.log(
      `     batch: ${e.batchSnapshot?.name ?? "?"}  ` +
        `start: ${
          e.batchSnapshot?.internshipStartDate
            ? new Date(e.batchSnapshot.internshipStartDate)
                .toISOString()
                .slice(0, 10)
            : "?"
        }`,
    );
    console.log(`     holds: ${flags.length ? flags.join(", ") : "nothing yet"}`);
    console.log(
      `     answers.internshipDuration: ${
        answers?.internshipDuration !== undefined
          ? `"${String(answers.internshipDuration)}"` +
            (parsed != null ? ` -> ${parsed} months (RECOVERABLE)` : " -> UNPARSEABLE")
          : "absent -> NOT RECOVERABLE from answers"
      }`,
    );
    console.log("");
  }

  console.log(`─────────────────────────────────────────────────────────────`);
  console.log(`At-risk rows recoverable from applicationAnswers: ${recoverable}`);
  console.log(`At-risk rows needing a manual decision:           ${unrecoverable}`);
  console.log(`─────────────────────────────────────────────────────────────`);
  console.log(
    `\nNote: any at-risk row holding an offer letter was issued a document` +
      `\nstating a duration (the generator defaults to 3 months when the field` +
      `\nis absent), so 3 is the contractually-correct value for those.\n`,
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
