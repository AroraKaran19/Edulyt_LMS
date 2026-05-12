/**
 * Backfill `internshipSnapshot` (and optionally `programDurationMonths`) on
 * enrollments where it's missing — caused by the old voucher path that
 * never wrote the snapshot. Looks up the live internship doc by `internship`
 * ref and stamps title/slug/thumbnail onto the enrollment.
 *
 * Defaults `programDurationMonths` to 3 on rows that have no value AND no
 * applicationAnswers to derive from (typical voucher-path rows).
 *
 * Run from backend root:
 *   # preview every row that would be touched:
 *   npx ts-node src/scripts/backfill-missing-internship-snapshot.ts
 *   # apply to all matching rows:
 *   npx ts-node src/scripts/backfill-missing-internship-snapshot.ts --apply
 *   # apply to a single user (debug / surgical fix):
 *   npx ts-node src/scripts/backfill-missing-internship-snapshot.ts --apply --email=kaustubh779.ps@gmail.com
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { UserModel } from "../models/user.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const APPLY = process.argv.includes("--apply");
const emailArg = process.argv
  .find((a) => a.startsWith("--email="))
  ?.split("=")[1];
const DEFAULT_DURATION_MONTHS = 3;

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
  if (emailArg) console.log(`Scope: single user (${emailArg})`);
  console.log();

  const filter: Record<string, unknown> = {
    internship: { $exists: true, $ne: null },
    $or: [
      { internshipSnapshot: { $exists: false } },
      { internshipSnapshot: null },
      { "internshipSnapshot.title": { $in: [null, ""] } },
    ],
  };

  if (emailArg) {
    const user = await UserModel.findOne({ email: emailArg }).select("_id").lean();
    if (!user) {
      console.log(`No user with email ${emailArg}`);
      await mongoose.disconnect();
      return;
    }
    filter.user = user._id;
  }

  const rows = await InternshipEnrollmentModel.find(filter)
    .select(
      "_id user internship internshipSnapshot programDurationMonths applicationAnswers status",
    )
    .lean();
  console.log(`Enrollments missing internshipSnapshot: ${rows.length}`);
  if (rows.length === 0) {
    await mongoose.disconnect();
    return;
  }

  // Cache live internship lookups so we don't re-query for batches of rows
  // in the same cohort.
  const internshipCache = new Map<
    string,
    { title: string; slug: string; thumbnail?: string }
  >();

  let updated = 0;
  for (const r of rows) {
    const rr = r as Record<string, unknown>;
    const internshipId = String(rr.internship);
    let snap = internshipCache.get(internshipId);
    if (!snap) {
      const live = await InternshipModel.findById(internshipId)
        .select("title slug thumbnail")
        .lean();
      if (!live) {
        console.warn(`  ! ${rr._id}: live internship ${internshipId} not found, skipping`);
        continue;
      }
      snap = {
        title: String((live as { title?: unknown }).title ?? ""),
        slug: String((live as { slug?: unknown }).slug ?? ""),
        thumbnail:
          typeof (live as { thumbnail?: unknown }).thumbnail === "string"
            ? (live as { thumbnail: string }).thumbnail
            : undefined,
      };
      internshipCache.set(internshipId, snap);
    }

    const setOps: Record<string, unknown> = { internshipSnapshot: snap };
    const currentDuration = rr.programDurationMonths;
    if (typeof currentDuration !== "number") {
      setOps.programDurationMonths = DEFAULT_DURATION_MONTHS;
    }

    console.log(
      `  ${rr._id} | status=${rr.status} | → "${snap.title}"${
        typeof currentDuration !== "number"
          ? ` + duration=${DEFAULT_DURATION_MONTHS}`
          : ""
      }`,
    );

    if (APPLY) {
      await InternshipEnrollmentModel.updateOne(
        { _id: rr._id },
        { $set: setOps },
      );
      updated += 1;
    }
  }

  if (APPLY) {
    console.log(`\nUpdated: ${updated}`);
  } else {
    console.log("\nDry run complete. Re-run with --apply to write.");
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
