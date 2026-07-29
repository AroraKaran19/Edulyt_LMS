/**
 * Rewrite `completionDate` on every issued internship certificate.
 *
 * WHY THIS EXISTS
 * ---------------
 * Internship certificates were minted with `completionDate = enrolledAt` — the
 * moment an admin marked the learner enrolled. The public verification page
 * labels that field "Completion Date", so every internship certificate claimed
 * the intern finished on the day they started.
 *
 * The value is now the end of the learner's own programme: `enrolledAt` plus
 * the duration they chose at registration (see
 * `computeInternshipCompletionDate`). This script applies that same function to
 * certificates already in the database.
 *
 * SCOPE: this touches the CertificateModel row ONLY. The internship template
 * has no date placeholder — `completionDate` never appears on the PDF, only on
 * the verification page — so no PDF is re-rendered and nothing is written to
 * S3. certificateId, verificationCode and fileUrl are all untouched, so every
 * QR code and link already handed to a learner or an employer keeps resolving.
 *
 * Usage:
 *   npx ts-node src/scripts/backfill-internship-completion-dates.ts            # dry run
 *   npx ts-node src/scripts/backfill-internship-completion-dates.ts --apply    # write
 *   ... --only=AI-38337,AI-00019    # restrict to specific certificate IDs
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { CertificateModel } from "../models/certificate.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { computeInternshipCompletionDate } from "../services/certificate.services";

dotenv.config();

const APPLY = process.argv.includes("--apply");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) ?? "")
  .replace("--only=", "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const fmt = (d: Date | null | undefined): string =>
  d ? new Date(d).toISOString() : "(none)";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log(APPLY ? "MODE: APPLY (writing to MongoDB)" : "MODE: DRY RUN (no writes)");

  const certs = await CertificateModel.find({
    certificateType: "internship",
    ...(ONLY.length ? { certificateId: { $in: ONLY } } : {}),
  })
    .select("_id certificateId studentName enrollmentId completionDate")
    .sort({ createdAt: 1 })
    .lean();
  console.log(`found ${certs.length} internship certificates`);
  if (certs.length === 0) {
    await mongoose.disconnect();
    return;
  }

  // One indexed $in over _id instead of a findById per certificate. The window
  // math needs enrolledAt + duration, and the cohort fields for the fallback.
  const enrollmentIds = certs
    .map((c) => (c as any).enrollmentId)
    .filter(Boolean);
  const enrollments = await InternshipEnrollmentModel.find({
    _id: { $in: enrollmentIds },
  })
    .select("_id enrolledAt programDurationMonths endDate batchSnapshot.internshipStartDate")
    .lean();
  const byId = new Map(enrollments.map((e) => [String((e as any)._id), e]));
  console.log(`loaded ${enrollments.length} matching enrollments\n`);

  const ops: any[] = [];
  let unchanged = 0;
  let skipped = 0;

  for (const cert of certs) {
    const label = `${(cert as any).studentName} (${(cert as any).certificateId})`;
    const enrollment = byId.get(String((cert as any).enrollmentId));
    if (!enrollment) {
      console.log(`SKIP  ${label}: enrollment ${(cert as any).enrollmentId} not found`);
      skipped++;
      continue;
    }

    const next = computeInternshipCompletionDate(enrollment as Record<string, any>);
    if (!next) {
      // No enrolledAt AND no resolvable cohort window: leave the existing value
      // alone rather than writing null over a date the page already renders.
      console.log(
        `SKIP  ${label}: no resolvable program window ` +
          `(enrolledAt=${fmt((enrollment as any).enrolledAt)}, ` +
          `months=${(enrollment as any).programDurationMonths})`,
      );
      skipped++;
      continue;
    }

    const current = (cert as any).completionDate as Date | undefined;
    if (current && new Date(current).getTime() === next.getTime()) {
      unchanged++;
      continue;
    }

    console.log(`${APPLY ? "SET  " : "DRY  "} ${label}: ${fmt(current)} -> ${fmt(next)}`);
    ops.push({
      updateOne: {
        filter: { _id: (cert as any)._id },
        update: { $set: { completionDate: next } },
      },
    });
  }

  if (APPLY && ops.length) {
    const res = await CertificateModel.bulkWrite(ops, { ordered: false });
    console.log(`\nmodified: ${res.modifiedCount}`);
  }

  console.log(
    `\n${APPLY ? "updated" : "would update"}: ${ops.length}   ` +
      `already correct: ${unchanged}   skipped: ${skipped}`,
  );
  if (!APPLY) console.log("re-run with --apply to write.");
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
