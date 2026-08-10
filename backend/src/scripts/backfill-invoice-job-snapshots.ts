/**
 * Backfill `snapshot` on InvoiceJob rows created before the field existed.
 *
 * Those rows rendered their customer / item / amount by joining to the order at
 * read time, so deleting an order blanked the columns on an invoice that had
 * really been issued. Copying the order's values onto the job now means the
 * history survives whatever happens to the order later.
 *
 * A job whose order is already gone cannot be repaired: there is nothing left to
 * copy from. Those are reported at the end so they can be dealt with separately
 * (see delete-orphan-invoice-jobs.ts).
 *
 * Safe to re-run: only rows with no snapshotted amount are touched.
 *
 * Run from backend root:
 *   npx ts-node src/scripts/backfill-invoice-job-snapshots.ts           # dry run
 *   npx ts-node src/scripts/backfill-invoice-job-snapshots.ts --apply
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { InvoiceJobModel } from "../models/invoiceJob.schema";
import { OrderModel } from "../models/order.schema";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "";
const APPLY = process.argv.includes("--apply");

/** Rows to pull per round trip. */
const BATCH = 500;

/**
 * `amount` is required on every order, so a job with no snapshotted amount was
 * written before snapshots existed. Using it as the marker avoids re-copying
 * rows whose order legitimately carries no course name or user name.
 */
const NEEDS_BACKFILL = { "snapshot.amount": { $exists: false } };

async function main() {
  if (!MONGO_URI) {
    console.error("No MONGODB_URI / MONGO_URI in env");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log(`database: ${mongoose.connection.name}`);
  console.log(APPLY ? "MODE: APPLY\n" : "MODE: DRY RUN (no writes)\n");

  const total = await InvoiceJobModel.countDocuments(NEEDS_BACKFILL);
  console.log(`invoice jobs without a snapshot: ${total}`);
  if (total === 0) {
    await mongoose.disconnect();
    return;
  }

  let scanned = 0;
  let updated = 0;
  const orphans: Array<{ jobId: string; orderId: string; invoiceNumber: string }> = [];

  // Paging by _id rather than skip: with --apply the rows drop out of the
  // filter as they are written, which would make a skip cursor step over
  // untouched rows.
  let lastId: mongoose.Types.ObjectId | null = null;

  for (;;) {
    const filter: Record<string, unknown> = { ...NEEDS_BACKFILL };
    if (lastId) filter._id = { $gt: lastId };

    const jobs = await InvoiceJobModel.find(filter)
      .select("_id jobId orderId invoiceNumber")
      .sort({ _id: 1 })
      .limit(BATCH)
      .lean();

    if (jobs.length === 0) break;
    lastId = jobs[jobs.length - 1]._id as unknown as mongoose.Types.ObjectId;
    scanned += jobs.length;

    // One query for the whole batch. Mongoose casts the string ids to
    // ObjectId, and _id is indexed, so this is a single covered fetch.
    const orderIds = jobs
      .map((job) => job.orderId)
      .filter((id) => mongoose.isValidObjectId(id));

    const orders = await OrderModel.find({ _id: { $in: orderIds } })
      .select("userName courseName internshipTitle amount orderKind paymentMethod")
      .lean();

    const byId = new Map(orders.map((order) => [String(order._id), order]));

    const ops: mongoose.AnyBulkWriteOperation[] = [];

    for (const job of jobs) {
      const order = byId.get(String(job.orderId));
      if (!order) {
        orphans.push({
          jobId: job.jobId,
          orderId: job.orderId,
          invoiceNumber: job.invoiceNumber ?? "(none)",
        });
        continue;
      }

      const fields: Record<string, unknown> = {
        "snapshot.userName": order.userName,
        "snapshot.itemName": order.courseName ?? order.internshipTitle,
        "snapshot.amount": order.amount,
        "snapshot.orderKind": order.orderKind,
        "snapshot.paymentMethod": order.paymentMethod,
      };
      for (const [key, value] of Object.entries(fields)) {
        if (value === undefined || value === null || value === "") delete fields[key];
      }
      if (Object.keys(fields).length === 0) continue;

      ops.push({
        updateOne: { filter: { _id: job._id }, update: { $set: fields } },
      });
    }

    if (ops.length > 0) {
      if (APPLY) {
        const result = await InvoiceJobModel.bulkWrite(ops, { ordered: false });
        updated += result.modifiedCount ?? 0;
      } else {
        updated += ops.length;
      }
    }

    console.log(`  scanned ${scanned}/${total} … ${updated} snapshotted`);

    // Without --apply the rows never leave the filter, so _id paging is what
    // terminates the dry run.
    if (jobs.length < BATCH) break;
  }

  console.log(
    APPLY
      ? `\nsnapshotted ${updated} job(s)`
      : `\nwould snapshot ${updated} job(s). Re-run with --apply`,
  );

  if (orphans.length > 0) {
    console.log(
      `\n${orphans.length} job(s) have no order left and cannot be repaired:`,
    );
    for (const orphan of orphans) {
      console.log(
        `  job ${orphan.jobId}  order ${orphan.orderId}  invoice ${orphan.invoiceNumber}`,
      );
    }
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
