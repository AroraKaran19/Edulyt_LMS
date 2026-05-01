/**
 * One-off fix for the upgrade-branch bug in
 * `completePaidSeatRegistrationForExistingDoc` (now patched).
 *
 * Scope: rows where `enrollmentType="paid"` but the row was never actually
 * paid for — i.e. status is one of the merit-track values, no success order
 * is tied to the row, and no voucher was redeemed for it. These rows were
 * silently produced when a merit learner re-submitted the apply form choosing
 * the paid path; the form flipped enrollmentType to "paid" without creating
 * an order. They should have stayed on merit until payment landed.
 *
 * What this script does to each affected row:
 *   $set: { enrollmentType: "merit" }
 * Status, application answers, exam progress — all preserved.
 *
 * Run from backend root:
 *   # preview only, no writes:
 *   npx ts-node src/scripts/fix-paid-without-order.ts
 *   # actually apply the fix:
 *   npx ts-node src/scripts/fix-paid-without-order.ts --apply
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { OrderModel } from "../models";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipVoucherModel } from "../models/internshipVoucher.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const APPLY = process.argv.includes("--apply");

const SUSPECT_STATUSES = [
  "exam_registered",
  "exam_attempted",
  "in_merit_pool",
  "admin_rejected",
] as const;

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set");

  console.log(`Mode: ${APPLY ? "APPLY (writes enabled)" : "DRY RUN (no writes)"}`);
  console.log("Connecting to MongoDB…");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  // Candidates: paid type but on a merit-track status — should not exist post-fix.
  const candidates = await InternshipEnrollmentModel.find({
    enrollmentType: "paid",
    status: { $in: SUSPECT_STATUSES as unknown as string[] },
  })
    .select("_id user status enrollmentType paymentAmount paymentOrderId paymentConfirmedAt createdAt updatedAt internshipSnapshot batchSnapshot")
    .lean();

  console.log(`Candidates (enrollmentType=paid + merit-track status): ${candidates.length}\n`);

  if (candidates.length === 0) {
    await mongoose.disconnect();
    return;
  }

  const candidateIds = candidates.map(
    (c) => new mongoose.Types.ObjectId(String(c._id)),
  );

  // Anything tied to a SUCCESS order? Those are NOT bugs — leave alone.
  const successOrders = await OrderModel.find({
    internshipEnrollmentId: { $in: candidateIds },
    paymentStatus: "success",
  })
    .select("internshipEnrollmentId")
    .lean();
  const paidEnrollmentIds = new Set(
    successOrders.map((o) => String(o.internshipEnrollmentId)),
  );

  // Voucher-redeemed? Those are also legitimate (free seat).
  const vouchers = await InternshipVoucherModel.find({
    redeemedInternshipEnrollmentId: { $in: candidateIds },
  })
    .select("redeemedInternshipEnrollmentId")
    .lean();
  const voucherEnrollmentIds = new Set(
    vouchers.map((v) => String(v.redeemedInternshipEnrollmentId)),
  );

  const toFix = candidates.filter((c) => {
    const id = String(c._id);
    return !paidEnrollmentIds.has(id) && !voucherEnrollmentIds.has(id);
  });

  console.log(`To fix (no success order + no voucher): ${toFix.length}\n`);
  for (const row of toFix) {
    console.log(
      `  ${String(row._id)}  user=${String(row.user)}  status=${row.status}  ` +
        `internship=${(row as any).internshipSnapshot?.title ?? "?"}  ` +
        `batch=${(row as any).batchSnapshot?.name ?? "?"}  ` +
        `createdAt=${(row as any).createdAt?.toISOString?.() ?? "?"}`,
    );
  }

  if (toFix.length === 0) {
    await mongoose.disconnect();
    return;
  }

  if (!APPLY) {
    console.log(
      "\nDry run — no changes written. Re-run with --apply to revert these rows to enrollmentType=merit.",
    );
    await mongoose.disconnect();
    return;
  }

  const idsToFix = toFix.map((r) => new mongoose.Types.ObjectId(String(r._id)));
  const res = await InternshipEnrollmentModel.updateMany(
    { _id: { $in: idsToFix } },
    { $set: { enrollmentType: "merit" } },
  );
  console.log(
    `\nUpdated ${res.modifiedCount} of ${idsToFix.length} candidates back to enrollmentType="merit".`,
  );

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Script failed:", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
