/**
 * Diagnoses why a learner shows enrollmentType="paid" with no Order on file.
 *
 * Pulls every signal we have for one email:
 *   - User document
 *   - All InternshipEnrollment rows (with full timeline)
 *   - All Order rows for that user (any kind)
 *   - InternshipVoucher rows owned/redeemed by them
 *   - CollaborationWhitelist rows that match their email
 *
 * Then prints a per-enrollment verdict explaining the most likely path that
 * produced the current state — including the merit-to-paid "upgrade" branch
 * in `completePaidSeatRegistrationForExistingDoc`, which flips
 * `enrollmentType` to "paid" *without* requiring an order to exist.
 *
 * Run from backend root:
 *   npx ts-node src/scripts/diagnose-paid-without-order.ts <email>
 *   npx ts-node src/scripts/diagnose-paid-without-order.ts yashasvirohilla028@gmail.com
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import {
  UserModel,
  OrderModel,
} from "../models";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipVoucherModel } from "../models/internshipVoucher.schema";
import { CollaborationWhitelistModel } from "../models/collaborationWhitelist.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const TARGET_EMAIL = (process.argv[2] ?? "yashasvirohilla028@gmail.com")
  .trim()
  .toLowerCase();

function fmtDate(d: unknown): string {
  if (!d) return "—";
  try {
    return new Date(d as string | Date).toISOString();
  } catch {
    return String(d);
  }
}

function header(title: string) {
  console.log("\n" + "═".repeat(72));
  console.log(title);
  console.log("═".repeat(72));
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set in environment");

  console.log(`🔎 Target email: ${TARGET_EMAIL}\n`);
  console.log("Connecting to MongoDB…");
  await mongoose.connect(mongoUri);
  console.log(`Connected: ${mongoose.connection.name}\n`);

  // ── 1. User ────────────────────────────────────────────────────────────────
  const user = await UserModel.findOne({
    email: { $regex: `^${TARGET_EMAIL}$`, $options: "i" },
  })
    .select("_id email userType firstName lastName createdAt updatedAt")
    .lean();

  header("USER");
  if (!user) {
    console.log("❌ No user found for that email. Stopping.");
    await mongoose.disconnect();
    return;
  }
  console.log({
    _id: String(user._id),
    email: (user as any).email,
    name: `${(user as any).firstName ?? ""} ${(user as any).lastName ?? ""}`.trim(),
    userType: (user as any).userType,
    createdAt: fmtDate((user as any).createdAt),
  });

  const userId = new mongoose.Types.ObjectId(String(user._id));

  // ── 2. Enrollments ─────────────────────────────────────────────────────────
  const enrollments = await InternshipEnrollmentModel.find({ user: userId })
    .sort({ createdAt: 1 })
    .lean();

  header(`INTERNSHIP ENROLLMENTS (${enrollments.length})`);
  if (enrollments.length === 0) {
    console.log("(none)");
  }
  for (const e of enrollments) {
    console.log("─".repeat(72));
    console.log({
      _id: String(e._id),
      internshipTitle: (e as any).internshipSnapshot?.title,
      batchName: (e as any).batchSnapshot?.name,
      batchId: (e as any).batchSnapshot?.batchId,
      enrollmentType: (e as any).enrollmentType,
      status: (e as any).status,
      paymentAmount: (e as any).paymentAmount,
      paymentOrderId: (e as any).paymentOrderId,
      paymentConfirmedAt: fmtDate((e as any).paymentConfirmedAt),
      enrolledAt: fmtDate((e as any).enrolledAt),
      applicationSubmittedAt: fmtDate((e as any).applicationSubmittedAt),
      examAttemptedAt: fmtDate((e as any).examAttemptedAt),
      examScore: (e as any).examScore,
      adminActionBy: (e as any).adminActionBy ? String((e as any).adminActionBy) : null,
      adminActionAt: fmtDate((e as any).adminActionAt),
      adminRejectionNote: (e as any).adminRejectionNote ?? null,
      createdAt: fmtDate((e as any).createdAt),
      updatedAt: fmtDate((e as any).updatedAt),
    });
  }

  // ── 3. Orders ──────────────────────────────────────────────────────────────
  const ordersByUser = await OrderModel.find({ userId })
    .sort({ createdAt: 1 })
    .lean();

  const enrollmentIds = enrollments.map(
    (e) => new mongoose.Types.ObjectId(String(e._id)),
  );
  const ordersByEnrollment =
    enrollmentIds.length > 0
      ? await OrderModel.find({
          internshipEnrollmentId: { $in: enrollmentIds },
        })
          .sort({ createdAt: 1 })
          .lean()
      : [];

  // Merge unique
  const orderMap = new Map<string, any>();
  for (const o of [...ordersByUser, ...ordersByEnrollment]) {
    orderMap.set(String(o._id), o);
  }
  const orders = [...orderMap.values()].sort(
    (a, b) =>
      new Date(a.createdAt as any).getTime() -
      new Date(b.createdAt as any).getTime(),
  );

  header(`ORDERS (${orders.length})`);
  if (orders.length === 0) {
    console.log("(none — user has never created any payment order)");
  }
  for (const o of orders) {
    console.log("─".repeat(72));
    console.log({
      _id: String(o._id),
      orderKind: o.orderKind,
      amount: o.amount,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      paymentErrorReason: o.paymentErrorReason ?? null,
      internshipEnrollmentId: o.internshipEnrollmentId
        ? String(o.internshipEnrollmentId)
        : null,
      internshipTitle: o.internshipTitle,
      courseName: o.courseName,
      createdAt: fmtDate(o.createdAt),
      updatedAt: fmtDate(o.updatedAt),
    });
  }

  // ── 4. Vouchers ────────────────────────────────────────────────────────────
  const vouchers = await InternshipVoucherModel.find({ userId })
    .sort({ createdAt: 1 })
    .lean();

  header(`INTERNSHIP VOUCHERS (${vouchers.length})`);
  if (vouchers.length === 0) console.log("(none)");
  for (const v of vouchers) {
    console.log("─".repeat(72));
    console.log({
      _id: String(v._id),
      code: v.code,
      status: v.status,
      sourceOrderId: v.sourceOrderId ? String(v.sourceOrderId) : null,
      sourceEnrollmentId: v.sourceEnrollmentId
        ? String(v.sourceEnrollmentId)
        : null,
      redeemedAt: fmtDate(v.redeemedAt),
      redeemedInternshipEnrollmentId: v.redeemedInternshipEnrollmentId
        ? String(v.redeemedInternshipEnrollmentId)
        : null,
      expiresAt: fmtDate(v.expiresAt),
      createdAt: fmtDate(v.createdAt),
    });
  }

  // ── 5. Collaboration whitelist entries ────────────────────────────────────
  const whitelist = await CollaborationWhitelistModel.find({
    email: { $regex: `^${TARGET_EMAIL}$`, $options: "i" },
  }).lean();

  header(`COLLABORATION WHITELIST (${whitelist.length})`);
  if (whitelist.length === 0) console.log("(none)");
  for (const w of whitelist) {
    console.log("─".repeat(72));
    console.log({
      _id: String(w._id),
      email: w.email,
      status: w.status,
      isActive: w.isActive,
      enrolledAt: fmtDate((w as any).enrolledAt),
      createdAt: fmtDate(w.createdAt),
      updatedAt: fmtDate(w.updatedAt),
    });
  }

  // ── 6. Per-enrollment verdict ─────────────────────────────────────────────
  header("DIAGNOSIS");
  for (const e of enrollments) {
    const eId = String(e._id);
    const eType = (e as any).enrollmentType;
    const eStatus = (e as any).status;
    const tied = orders.filter(
      (o) => String(o.internshipEnrollmentId ?? "") === eId,
    );
    const successOrder = tied.find((o) => o.paymentStatus === "success");
    const pendingOrder = tied.find((o) => o.paymentStatus === "pending");
    const voucherUsed = vouchers.find(
      (v) => String(v.redeemedInternshipEnrollmentId ?? "") === eId,
    );
    const adminAction = !!(e as any).adminActionBy;

    console.log("─".repeat(72));
    console.log(`Enrollment ${eId}`);
    console.log(
      `  enrollmentType=${eType}  status=${eStatus}  ` +
        `paymentAmount=${(e as any).paymentAmount ?? "—"}  ` +
        `paymentConfirmedAt=${fmtDate((e as any).paymentConfirmedAt)}`,
    );
    console.log(
      `  Tied orders: ${tied.length} (success=${!!successOrder}, pending=${!!pendingOrder})`,
    );
    console.log(`  Voucher redeemed for this enrollment: ${!!voucherUsed}`);
    console.log(`  Admin action recorded: ${adminAction}`);

    // Verdict
    if (eType === "paid" && eStatus === "enrolled" && successOrder) {
      console.log("  → ✅ Normal paid flow: paid via Paytm, then enrolled.");
    } else if (eType === "paid" && eStatus === "enrolled" && voucherUsed) {
      console.log("  → ✅ Voucher redemption: free seat, no order expected.");
    } else if (eType === "paid" && eStatus === "payment_pending") {
      console.log(
        "  → ⏳ Fresh paid registration awaiting payment (registerForPaidSeat NEW path).",
      );
    } else if (
      eType === "paid" &&
      ["exam_registered", "exam_attempted", "in_merit_pool", "admin_rejected"].includes(
        eStatus,
      ) &&
      !successOrder &&
      !pendingOrder &&
      !voucherUsed
    ) {
      console.log(
        "  → 🐞 LIKELY BUG: hit the 'upgrade' branch of " +
          "completePaidSeatRegistrationForExistingDoc " +
          "(internshipEnrollment.services.ts:542-558).",
      );
      console.log(
        "     User originally registered as merit (status=" +
          eStatus +
          "), then re-submitted the apply form choosing the PAID path.",
      );
      console.log(
        "     The upgrade branch flips enrollmentType→'paid' WITHOUT " +
          "creating an order or moving status to 'payment_pending'. " +
          "Result: looks 'paid' in the admin table, but no payment ever happened.",
      );
    } else if (eType === "paid" && eStatus === "enrolled" && !successOrder && !voucherUsed) {
      console.log(
        "  → ⚠️ Enrolled & paid-type but no success order / voucher. " +
          "Could be admin-created enrollment or manual DB write. " +
          "Check adminActionBy / adminActionAt.",
      );
    } else if (eType === "merit") {
      console.log("  → ℹ️ Merit-path enrollment, no order expected.");
    } else {
      console.log("  → ❓ Unrecognized combination — inspect manually.");
    }
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch(async (err) => {
  console.error("Script failed:", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
