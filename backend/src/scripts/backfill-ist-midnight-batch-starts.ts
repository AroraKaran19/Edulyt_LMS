/**
 * Legacy batches stored their cohort start as UTC midnight, because a bare
 * "YYYY-MM-DD" from the admin form was cast by `new Date()`. A cohort dated
 * 03 Aug therefore began at 05:30 IST, not midnight: the dashboard unhid five
 * and a half hours late and every task offset was measured from 05:30.
 *
 * Saving is now IST wall-clock (see `withIstBatchDates` in internship.services),
 * so only rows written before that change need moving. This shifts exactly those
 * rows, identified by a start instant sitting at 00:00:00.000 UTC, back to IST
 * midnight of the SAME IST calendar day. The calendar day is unchanged, so
 * `endDate` (derived from the IST day) never moves.
 *
 * Enrollment `batchSnapshot.internshipStartDate` copies are shifted too, since
 * the learner's task calendar reads the snapshot, not the batch.
 *
 *   npx ts-node src/scripts/backfill-ist-midnight-batch-starts.ts          # dry run
 *   npx ts-node src/scripts/backfill-ist-midnight-batch-starts.ts --apply  # write
 *
 * Run once per environment.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InternshipModel } from "../models/internship.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { ymdIst, istWallClockToUtc } from "../utils/ist";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const apply = process.argv.includes("--apply");

const MS_PER_DAY = 86_400_000;

function ist(d?: Date | null) {
  return d
    ? new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    : "—";
}

/** True when the instant is exactly UTC midnight — the legacy date-only cast. */
function isUtcMidnight(d: Date): boolean {
  return d.getTime() % MS_PER_DAY === 0;
}

/** IST midnight of the instant's own IST calendar day. */
function toIstMidnight(d: Date): Date | null {
  const ymd = ymdIst(d);
  if (!ymd) return null;
  const [y, m, day] = ymd.split("-").map(Number);
  return istWallClockToUtc(y, m, day, 0, 0, 0, 0);
}

type Fix = {
  internshipId: string;
  title: string;
  batchId: string;
  batchName: string;
  from: Date;
  to: Date;
};

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}`);
  console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}\n`);

  const internships = await InternshipModel.find({})
    .select("title batches._id batches.name batches.internshipStartDate")
    .lean();

  const fixes: Fix[] = [];
  for (const ins of internships as unknown as {
    _id: unknown;
    title?: string;
    batches?: { _id: unknown; name?: string; internshipStartDate?: Date }[];
  }[]) {
    for (const b of ins.batches ?? []) {
      const raw = b.internshipStartDate;
      if (!raw) continue;
      const from = new Date(raw);
      if (Number.isNaN(from.getTime()) || !isUtcMidnight(from)) continue;
      const to = toIstMidnight(from);
      if (!to || to.getTime() === from.getTime()) continue;
      fixes.push({
        internshipId: String(ins._id),
        title: String(ins.title ?? ""),
        batchId: String(b._id),
        batchName: String(b.name ?? ""),
        from,
        to,
      });
    }
  }

  if (fixes.length === 0) {
    console.log("Nothing to do — no batch starts sitting at UTC midnight.");
    await mongoose.disconnect();
    return;
  }

  console.log(`${fixes.length} batch start(s) to move to IST midnight:\n`);
  for (const f of fixes) {
    console.log(
      `  ${f.title} / ${f.batchName} (${f.batchId})\n` +
        `      ${ist(f.from)}  ->  ${ist(f.to)}`,
    );
  }

  if (!apply) {
    console.log("\nDRY RUN — re-run with --apply to write.");
    await mongoose.disconnect();
    return;
  }

  let batchesUpdated = 0;
  let snapshotsUpdated = 0;
  for (const f of fixes) {
    const res = await InternshipModel.updateOne(
      { _id: f.internshipId, "batches._id": f.batchId },
      { $set: { "batches.$.internshipStartDate": f.to } },
    );
    batchesUpdated += res.modifiedCount;

    // Snapshots are matched on the same instant so a row already corrected by
    // hand (or by a later admin save) is left alone.
    const snapRes = await InternshipEnrollmentModel.updateMany(
      {
        "batchSnapshot.batchId": f.batchId,
        "batchSnapshot.internshipStartDate": f.from,
      },
      { $set: { "batchSnapshot.internshipStartDate": f.to } },
    );
    snapshotsUpdated += snapRes.modifiedCount;
  }

  console.log(
    `\nUpdated: ${batchesUpdated} batch(es), ${snapshotsUpdated} enrollment snapshot(s).`,
  );
  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
