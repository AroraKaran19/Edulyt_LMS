/**
 * Fully reverses a test order and every side effect its payment fanned out.
 *
 * Deleting the order document alone is NOT enough. One successful course order
 * writes to six places, and `createEnrollmentAfterPayment` fans a single
 * purchase out into many enrollments:
 *
 *  1. The paid course enrollment            → enrollments
 *  2. Category-sibling enrollments          → enrollments (often 5-10 extra!)
 *     Identified deterministically by `grantSource: "category-sibling"` +
 *     `grantedFromCourseId`, NOT by guessing on timestamps.
 *  3. The user's `enrollments` array        → users.$pull
 *  4. Redeemed success points               → users.successPoints  (credit back)
 *     plus the "redeemed" successPointsHistory entry.
 *     Granted purchase points, if any       → users.successPoints  (claw back)
 *  5. Free internship voucher               → internshipvouchers (by sourceOrderId)
 *  6. Course analytics counters             → courses.analytics.{total,active}Enrollments
 *     Instructor student counts             → users.totalStudents
 *     NB: the paid course bumps instructor totalStudents; siblings do NOT.
 *  7. Referral sale, if the order carried a code → referralsales
 *
 * Everything is scoped to the single order id you pass. Nothing else is touched.
 *
 * Dry run (default, writes nothing — prints the exact plan):
 *   npx ts-node src/scripts/revert-test-order.ts <orderId>
 * Apply:
 *   npx ts-node src/scripts/revert-test-order.ts <orderId> --apply
 *
 * Keep the order document but undo its effects (audit-friendly):
 *   npx ts-node src/scripts/revert-test-order.ts <orderId> --apply --keep-order
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const APPLY = process.argv.includes("--apply");
const KEEP_ORDER = process.argv.includes("--keep-order");
const ORDER_ID = process.argv.find((a) => /^[a-f0-9]{24}$/i.test(a));

const log = (s = "") => console.log(s);
const plan = (s: string) => console.log(`  ${APPLY ? "✔" : "·"} ${s}`);

async function main() {
  if (!ORDER_ID) {
    console.error(
      "Usage: npx ts-node src/scripts/revert-test-order.ts <orderId> [--apply] [--keep-order]",
    );
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error("no db handle");

  const { ObjectId } = mongoose.Types;
  const oid = new ObjectId(ORDER_ID);

  log(`\nDB: ${db.databaseName}`);
  log(APPLY ? "MODE: APPLY (writes will happen)" : "MODE: DRY RUN (no writes)");
  log("─".repeat(70));

  const orders = db.collection("orders");
  const enrollments = db.collection("enrollments");
  const users = db.collection("users");
  const courses = db.collection("courses");
  const vouchers = db.collection("internshipvouchers");
  const referralSales = db.collection("referralsales");

  /**
   * `orderId` is declared ObjectId in the schemas but assigned from a string in
   * the services, so Mongoose casts on write. Raw-driver queries must match
   * BOTH forms or they silently no-op — which is exactly how the wallet history
   * survived the first version of this script.
   */
  const bothForms = { $in: [oid, ORDER_ID] as any };

  /** Cleanup that only needs the orderId — safe to run with the order deleted. */
  async function residualCleanup() {
    const u = await users.findOne(
      { _id: order ? new ObjectId(String(order.userId)) : ({} as any) },
      { projection: { successPointsHistory: 1 } },
    );
    void u;

    const holders = await users
      .find(
        { "successPointsHistory.orderId": bothForms },
        { projection: { email: 1, successPoints: 1 } },
      )
      .toArray();
    const leftoverVouchers = await vouchers
      .find({ sourceOrderId: bothForms })
      .toArray();

    log(`  wallet history entries still referencing this order: ${holders.length} user(s)`);
    holders.forEach((h) => plan(`pull history from ${h.email}`));
    log(`  vouchers still referencing this order: ${leftoverVouchers.length}`);
    leftoverVouchers.forEach((v) => plan(`delete voucher ${v.code}`));

    if (!APPLY) {
      log("\nDRY RUN — nothing was written.");
      return;
    }
    if (holders.length) {
      const r = await users.updateMany(
        { "successPointsHistory.orderId": bothForms },
        { $pull: { successPointsHistory: { orderId: bothForms } } } as any,
      );
      log(`  pulled history from ${r.modifiedCount} user(s)`);
    }
    if (leftoverVouchers.length) {
      const r = await vouchers.deleteMany({ sourceOrderId: bothForms });
      log(`  deleted ${r.deletedCount} voucher(s)`);
    }

    // Verify, rather than assume the write matched.
    const stillThere = await users.countDocuments({
      "successPointsHistory.orderId": bothForms,
    });
    log(
      stillThere === 0
        ? "  ✔ verified: no wallet history references remain"
        : `  ✖ ${stillThere} user(s) STILL reference this order — investigate`,
    );
  }

  const order = await orders.findOne({ _id: oid });

  // The order may already be gone from an earlier run. Residual state keyed
  // only by orderId (wallet history, vouchers) can still be cleaned up, so
  // don't bail — just skip what genuinely needs the order's courseId.
  if (!order) {
    log(`\nOrder ${ORDER_ID} not found — residual cleanup only.`);
    await residualCleanup();
    await mongoose.disconnect();
    return;
  }

  const userId = new ObjectId(String(order.userId));
  const courseId = order.courseId ? new ObjectId(String(order.courseId)) : null;

  log(`ORDER   ${ORDER_ID}`);
  log(`  kind=${order.orderKind} status=${order.paymentStatus} gateway=${order.paymentMethod}`);
  log(`  amount=₹${order.amount} course="${order.courseName}" user=${order.userName}`);
  log(`  txnId=${order.txnId}`);

  if (order.orderKind !== "course") {
    console.error(
      `\n!! This script only handles orderKind="course". This order is "${order.orderKind}".`,
    );
    console.error("   Internship seat / success-point orders need different reversal. Aborting.");
    await mongoose.disconnect();
    process.exit(1);
  }

  // ── 1. Enrollments: the paid course + its category-sibling grants ──────────
  const paidEnrollment = courseId
    ? await enrollments.findOne({ userId, courseId })
    : null;

  // `grantedFromCourseId` is an ObjectId in the schema, but the service assigns
  // it from String(...) — match both so a cast difference can never silently
  // hide sibling grants (which would leave the learner holding free courses).
  const siblingEnrollments = courseId
    ? await enrollments
        .find({
          userId,
          grantSource: "category-sibling",
          grantedFromCourseId: { $in: [courseId, String(courseId)] as any },
        })
        .toArray()
    : [];

  const allEnrollments = [...(paidEnrollment ? [paidEnrollment] : []), ...siblingEnrollments];
  const enrollmentIds = allEnrollments.map((e) => e._id);
  const affectedCourseIds = allEnrollments.map((e) => e.courseId);

  log(`\nENROLLMENTS to delete: ${allEnrollments.length}`);
  for (const e of allEnrollments) {
    const tag = String(e.courseId) === String(courseId) ? "[paid]   " : "[sibling]";
    plan(`${tag} ${e._id}  "${e.courseName}"`);
  }

  // ── 2. Success points ─────────────────────────────────────────────────────
  const user = await users.findOne(
    { _id: userId },
    { projection: { successPoints: 1, successPointsHistory: 1, email: 1 } },
  );
  const balanceBefore = Number(user?.successPoints ?? 0);

  const redeemed = order.successPointsRedeemed === true
    ? Math.max(0, Math.floor(Number(order.successPointsApplied ?? 0)))
    : 0;

  // Purchase reward, if it was granted. Read the actual history entry rather
  // than recomputing the plan's rate — the rate may have changed since.
  const grantEntry = (user?.successPointsHistory ?? []).find(
    (h: any) => String(h.orderId) === ORDER_ID && h.type !== "redeemed",
  );
  const granted = order.successPointsPurchaseGranted === true
    ? Math.max(0, Math.floor(Number(grantEntry?.points ?? 0)))
    : 0;

  const netPointsDelta = redeemed - granted;
  const historyToRemove = (user?.successPointsHistory ?? []).filter(
    (h: any) => String(h.orderId) === ORDER_ID,
  );

  log(`\nSUCCESS POINTS  (user ${user?.email})`);
  plan(`credit back redeemed: +${redeemed}`);
  plan(`claw back granted:    -${granted}`);
  plan(`net delta:            ${netPointsDelta >= 0 ? "+" : ""}${netPointsDelta}`);
  plan(`balance ${balanceBefore} → ${balanceBefore + netPointsDelta}`);
  plan(`remove ${historyToRemove.length} successPointsHistory entr${historyToRemove.length === 1 ? "y" : "ies"}`);

  // ── 3. Voucher (linked by sourceOrderId, not orderId) ─────────────────────
  const orderVouchers = await vouchers.find({ sourceOrderId: oid }).toArray();
  log(`\nINTERNSHIP VOUCHERS: ${orderVouchers.length}`);
  for (const v of orderVouchers) {
    plan(`delete ${v.code} (status=${v.status})`);
    if (v.status !== "available") {
      log(`      ⚠ status is "${v.status}" — it may already have been spent. Review before applying.`);
    }
  }

  // ── 4. Referral sale ──────────────────────────────────────────────────────
  const sales = await referralSales.find({ orderId: { $in: [ORDER_ID, oid] } }).toArray();
  log(`\nREFERRAL SALES: ${sales.length}`);
  sales.forEach((s) => plan(`delete ${s._id} (code=${s.code})`));

  // ── 5. Analytics counters ─────────────────────────────────────────────────
  const instructorIds: string[] = [];
  if (courseId && paidEnrollment) {
    const c = await courses.findOne({ _id: courseId }, { projection: { instructor: 1 } });
    const raw = Array.isArray(c?.instructor) ? c!.instructor : c?.instructor ? [c.instructor] : [];
    for (const i of raw) instructorIds.push(String((i as any)?._id ?? i));
  }

  log(`\nANALYTICS`);
  plan(`courses: -1 totalEnrollments & -1 activeEnrollments on ${affectedCourseIds.length} course(s)`);
  plan(`instructors: -1 totalStudents on ${instructorIds.length} (paid course only)`);

  log(`\nORDER DOCUMENT`);
  plan(KEEP_ORDER ? "kept (--keep-order)" : "delete");

  log("\n" + "─".repeat(70));

  if (!APPLY) {
    log("DRY RUN — nothing was written.");
    log(`Re-run with --apply to execute:\n  npx ts-node src/scripts/revert-test-order.ts ${ORDER_ID} --apply`);
    await mongoose.disconnect();
    return;
  }

  // ── APPLY ─────────────────────────────────────────────────────────────────
  log("APPLYING…\n");

  if (enrollmentIds.length) {
    const r = await enrollments.deleteMany({ _id: { $in: enrollmentIds } });
    log(`  deleted ${r.deletedCount} enrollment(s)`);

    await users.updateOne({ _id: userId }, { $pull: { enrollments: { $in: enrollmentIds } } as any });
    log(`  pulled ${enrollmentIds.length} id(s) from user.enrollments`);

    for (const cid of affectedCourseIds) {
      await courses.updateOne(
        { _id: cid },
        { $inc: { "analytics.totalEnrollments": -1, "analytics.activeEnrollments": -1 } },
      );
    }
    log(`  decremented analytics on ${affectedCourseIds.length} course(s)`);
  }

  for (const iid of instructorIds) {
    await users.updateOne({ _id: new ObjectId(iid) }, { $inc: { totalStudents: -1 } });
  }
  if (instructorIds.length) log(`  decremented totalStudents on ${instructorIds.length} instructor(s)`);

  if (netPointsDelta !== 0 || historyToRemove.length) {
    await users.updateOne(
      { _id: userId },
      {
        ...(netPointsDelta !== 0 ? { $inc: { successPoints: netPointsDelta } } : {}),
        // Must match both string and ObjectId — see `bothForms` above.
        $pull: { successPointsHistory: { orderId: bothForms } },
      } as any,
    );

    const after = await users.findOne(
      { _id: userId },
      { projection: { successPoints: 1, successPointsHistory: 1 } },
    );
    const remaining = (after?.successPointsHistory ?? []).filter(
      (h: any) => String(h.orderId) === ORDER_ID,
    ).length;

    log(`  points ${balanceBefore} → ${after?.successPoints}`);
    log(
      remaining === 0
        ? `  ✔ removed ${historyToRemove.length} history entr${historyToRemove.length === 1 ? "y" : "ies"}`
        : `  ✖ ${remaining} history entr${remaining === 1 ? "y" : "ies"} SURVIVED the pull — investigate before trusting this run`,
    );
  }

  if (orderVouchers.length) {
    const r = await vouchers.deleteMany({ sourceOrderId: oid });
    log(`  deleted ${r.deletedCount} voucher(s)`);
  }

  if (sales.length) {
    const r = await referralSales.deleteMany({ orderId: { $in: [ORDER_ID, oid] } });
    log(`  deleted ${r.deletedCount} referral sale(s)`);
  }

  if (!KEEP_ORDER) {
    await orders.deleteOne({ _id: oid });
    log(`  deleted order ${ORDER_ID}`);
  }

  log("\nDone.");
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error("\nFAILED:", e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
