/**
 * Read-only diagnostic for a failing voucher redemption.
 *
 * Simulates every check inside redeemInternshipVoucher() and prints a
 * verdict for each gate — no writes, no mutations.
 *
 * Run from backend root:
 *   npx ts-node src/scripts/diagnose-voucher-redemption.ts <voucherCode> [userEmail]
 *
 * Examples:
 *   npx ts-node src/scripts/diagnose-voucher-redemption.ts INTV-7F271FED
 *   npx ts-node src/scripts/diagnose-voucher-redemption.ts INTV-7F271FED jainpari320@gmail.com
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { InternshipVoucherModel } from "../models/internshipVoucher.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { UserModel } from "../models";
import {
  isVoucherRedemptionWindowOpen,
  VOUCHER_POST_START_GRACE_DAYS,
} from "../utils/applicationWindow";

const VOUCHER_CODE = (process.argv[2] ?? "").trim().toUpperCase();
const USER_EMAIL = (process.argv[3] ?? "").trim().toLowerCase();

function ok(msg: string) {
  console.log(`  ✅  ${msg}`);
}
function fail(msg: string) {
  console.log(`  ❌  BLOCKED: ${msg}`);
}
function warn(msg: string) {
  console.log(`  ⚠️   ${msg}`);
}
function section(title: string) {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 60 - title.length))}`);
}
function fmtDate(d: unknown): string {
  if (!d) return "—";
  try {
    return new Date(d as string).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(d);
  }
}

async function main() {
  if (!VOUCHER_CODE) {
    console.error("Usage: npx ts-node src/scripts/diagnose-voucher-redemption.ts <VOUCHER_CODE> [userEmail]");
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set in .env");
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB (read-only mode)\n");

  // ── 1. Find voucher ───────────────────────────────────────────────────────
  section("1. Voucher lookup");
  const voucher = await InternshipVoucherModel.findOne({
    code: VOUCHER_CODE,
  }).lean();

  if (!voucher) {
    fail(`No voucher found with code "${VOUCHER_CODE}"`);
    process.exit(0);
  }

  console.log(`  code        : ${voucher.code}`);
  console.log(`  status      : ${voucher.status}`);
  console.log(`  userId      : ${voucher.userId}`);
  console.log(`  issuedAt    : ${fmtDate(voucher.createdAt)}`);
  console.log(`  expiresAt   : ${fmtDate(voucher.expiresAt)}`);
  console.log(`  redeemedAt  : ${fmtDate(voucher.redeemedAt)}`);
  console.log(`  sourceOrder : ${voucher.sourceOrderId}`);

  if (voucher.status !== "available") {
    fail(`Voucher status is "${voucher.status}" — must be "available" to redeem`);
    if (voucher.status === "redeemed") {
      console.log(`  Redeemed enrollment id: ${voucher.redeemedInternshipEnrollmentId ?? "—"}`);
    }
    process.exit(0);
  }
  ok("Voucher status is 'available'");

  if (voucher.expiresAt && new Date() > new Date(voucher.expiresAt)) {
    fail(`Voucher expired at ${fmtDate(voucher.expiresAt)}`);
    process.exit(0);
  }
  ok(voucher.expiresAt ? `Not yet expired (expires ${fmtDate(voucher.expiresAt)})` : "No wall-clock expiry set");

  // ── 2. User ownership ─────────────────────────────────────────────────────
  section("2. User ownership");

  // Try to find user either by supplied email or by the voucher's userId
  type UserLite = { _id: unknown; email?: string; name?: string };
  if (USER_EMAIL) {
    const user = (await UserModel.findOne({ email: USER_EMAIL })
      .select("email name")
      .lean()) as UserLite | null;
    if (!user) {
      warn(`No user found with email "${USER_EMAIL}"`);
    } else {
      console.log(`  User found   : ${user.email} (${user._id})`);
      if (String(user._id) !== String(voucher.userId)) {
        fail(`Voucher belongs to userId=${voucher.userId} but logged-in user is ${user._id} — wrong account`);
        process.exit(0);
      }
      ok("Voucher userId matches the supplied email's account");
    }
  } else {
    const owner = (await UserModel.findById(voucher.userId)
      .select("email name")
      .lean()) as UserLite | null;
    if (owner) {
      console.log(`  Voucher owner: ${owner.email} (${owner._id})`);
      warn("No userEmail argument supplied — skipping ownership cross-check");
    } else {
      fail(`Voucher owner userId ${voucher.userId} has no matching User document`);
    }
  }

  // ── 3. Find existing enrollment for this user in this internship ──────────
  section("3. Existing internship enrollments for voucher owner");

  const enrollments = await InternshipEnrollmentModel.find({
    user: voucher.userId,
  })
    .select("internship status enrollmentType examScore batchSnapshot createdAt")
    .lean();

  if (enrollments.length === 0) {
    warn("No internship enrollments found for this user at all");
  } else {
    for (const e of enrollments) {
      const score = typeof e.examScore === "number" ? e.examScore : "—";
      const batchId = (e.batchSnapshot as { batchId?: string } | undefined)?.batchId ?? "—";
      const batchName = (e.batchSnapshot as { name?: string } | undefined)?.name ?? "—";
      console.log(
        `  enrollment ${e._id}` +
        `\n    internship : ${e.internship}` +
        `\n    batch      : ${batchName} (${batchId})` +
        `\n    status     : ${e.status}` +
        `\n    type       : ${e.enrollmentType ?? "—"}` +
        `\n    examScore  : ${score}` +
        `\n    createdAt  : ${fmtDate(e.createdAt)}`,
      );

      // Flag the known .save() validator trap
      if (typeof e.examScore === "number" && e.examScore < 0) {
        warn(
          `examScore is ${e.examScore} (negative). If this enrollment is the "same batch" ` +
          `upgrade target, .save() will throw a Mongoose ValidationError unless the schema ` +
          `min:0 constraint has been removed. Check that the schema fix is deployed.`,
        );
      }
    }
  }

  // ── 4. Simulate the service-layer gates for every active enrollment ────────
  section("4. Redemption gate simulation (per enrollment)");

  const lockedStatuses = new Set([
    "enrolled",
    "completed",
    "paused",
    "payment_pending",
  ]);
  const upgradeableStatuses = new Set([
    "exam_registered",
    "exam_attempted",
    "in_merit_pool",
    "admin_rejected",
  ]);

  for (const e of enrollments) {
    const batchId = (e.batchSnapshot as { batchId?: string } | undefined)?.batchId ?? "";
    console.log(`\n  Enrollment ${e._id} (status=${e.status}, batch=${batchId})`);

    if (lockedStatuses.has(String(e.status))) {
      fail(`Status "${e.status}" is locked — cannot upgrade via voucher`);
      continue;
    }
    if (upgradeableStatuses.has(String(e.status))) {
      ok(`Status "${e.status}" is upgradeable — will upgrade in place`);

      if (typeof e.examScore === "number" && e.examScore < 0) {
        fail(
          `examScore=${e.examScore} will fail Mongoose min:0 validation on .save() ` +
          `UNLESS the schema fix (remove min:0) is deployed`,
        );
      } else {
        ok("examScore is acceptable for .save() validation");
      }
      continue;
    }
    // Other statuses (dropped, revoked, etc.)
    warn(`Status "${e.status}" — not locked, not upgradeable; service would create a fresh enrollment`);
  }

  // Check for an active enrollment in a DIFFERENT batch of the same internship
  // (the service blocks this)
  const internshipIds = [...new Set(enrollments.map((e) => String(e.internship)))];
  for (const intId of internshipIds) {
    const others = enrollments.filter(
      (e) =>
        String(e.internship) === intId &&
        !["dropped", "revoked", "admin_rejected"].includes(String(e.status)),
    );
    if (others.length > 1) {
      fail(
        `User has ${others.length} active-ish enrollments in internship ${intId} — ` +
        `service blocks redemption if batchIds differ`,
      );
      others.forEach((e) => {
        const bId = (e.batchSnapshot as { batchId?: string } | undefined)?.batchId;
        console.log(`    • ${e._id} batch=${bId} status=${e.status}`);
      });
    }
  }

  // ── 5. Batch application window check ────────────────────────────────────
  section("5. Batch application window (open / closed)");

  for (const e of enrollments) {
    const batchId = (e.batchSnapshot as { batchId?: string } | undefined)?.batchId;
    if (!batchId) continue;

    const internship = await InternshipModel.findById(e.internship)
      .select("batches title isActive")
      .lean();
    if (!internship) {
      warn(`Internship ${e.internship} not found`);
      continue;
    }
    if (!(internship as { isActive?: boolean }).isActive) {
      fail(`Internship "${(internship as { title?: string }).title}" is not active`);
      continue;
    }

    type BatchRaw = {
      _id?: unknown;
      name?: string;
      applicationLastDate?: Date;
      internshipStartDate?: Date;
      isActive?: boolean;
      status?: string;
    };
    const batch = ((internship as { batches?: BatchRaw[] }).batches ?? []).find(
      (b) => b._id != null && String(b._id) === batchId,
    );
    if (!batch) {
      fail(`Batch ${batchId} not found inside internship document`);
      continue;
    }

    console.log(`  Batch: ${batch.name ?? batchId}`);
    console.log(`    isActive            : ${batch.isActive}`);
    console.log(`    status              : ${batch.status}`);
    console.log(`    applicationLastDate : ${fmtDate(batch.applicationLastDate)}`);
    console.log(`    internshipStartDate : ${fmtDate(batch.internshipStartDate)}`);

    if (batch.isActive === false || batch.status !== "active") {
      fail(`Batch is not accepting enrollments (isActive=${batch.isActive}, status=${batch.status})`);
    } else {
      ok("Batch is active");
    }

    const windowOpen = isVoucherRedemptionWindowOpen(
      batch.applicationLastDate,
      batch.internshipStartDate,
    );
    if (!windowOpen) {
      const graceEnd = batch.internshipStartDate
        ? new Date(
            new Date(batch.internshipStartDate).getTime() +
              VOUCHER_POST_START_GRACE_DAYS * 24 * 60 * 60 * 1000,
          )
        : null;
      fail(
        `Voucher window is CLOSED. Application closed ${fmtDate(batch.applicationLastDate)} ` +
        `and the ${VOUCHER_POST_START_GRACE_DAYS}-day post-start grace ` +
        `${graceEnd ? `ended ${fmtDate(graceEnd)}` : "is unavailable (no start date)"}.`,
      );
    } else {
      ok(
        `Voucher window is OPEN (application until ${fmtDate(batch.applicationLastDate)}, ` +
        `or ${VOUCHER_POST_START_GRACE_DAYS} days after start ${fmtDate(batch.internshipStartDate)})`,
      );
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  section("Summary");
  console.log("  Scan complete. Review any ❌ lines above for the blocking condition.");
  console.log("  No data was written.\n");
}

main()
  .catch((err) => {
    console.error("Script error:", err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
