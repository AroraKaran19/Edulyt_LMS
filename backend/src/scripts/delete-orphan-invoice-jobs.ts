/**
 * Delete invoice jobs whose order no longer exists.
 *
 * These rows show a blank customer, item and amount in the admin list because
 * there is nothing left to join to, and unlike a normal job they cannot be
 * repaired by backfill-invoice-job-snapshots.ts. In practice they are leftovers
 * from test orders that were deleted after being invoiced.
 *
 * Removes the job row and the rendered PDF in S3. Two things it deliberately
 * does NOT do:
 *   - touch the order (there isn't one)
 *   - rewind the invoice counter, which would hand out a number already used.
 *     Use delete-invoice.ts --reset-counter if you truly want that, one at a
 *     time and only for the most recent number.
 *
 * A real tax invoice must not be deleted: GST requires the sequence to be
 * unique and consecutive, and the customer may already hold the PDF. Read the
 * dry run before applying.
 *
 * Run from backend root:
 *   npx ts-node src/scripts/delete-orphan-invoice-jobs.ts                 # dry run
 *   npx ts-node src/scripts/delete-orphan-invoice-jobs.ts --expect=2 --apply
 *
 * Options:
 *   --expect=<n>   refuse to run unless exactly n orphans are found
 *   --keep-pdf     leave the S3 object in place
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { InvoiceJobModel } from "../models/invoiceJob.schema";
import { OrderModel } from "../models/order.schema";
import { getS3Client, getBucketName, getPublicUrlBase } from "../config/s3";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "";
const APPLY = process.argv.includes("--apply");
const KEEP_PDF = process.argv.includes("--keep-pdf");
const EXPECT = (process.argv.find((a) => a.startsWith("--expect=")) ?? "").split("=")[1];

/** "https://bucket.s3.amazonaws.com/invoices/x.pdf" -> "invoices/x.pdf" */
function s3KeyFromUrl(fileUrl: string): string | null {
  try {
    const base = getPublicUrlBase();
    if (fileUrl.startsWith(base)) return fileUrl.slice(base.length).replace(/^\//, "");
    return new URL(fileUrl).pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

async function main() {
  if (!MONGO_URI) {
    console.error("No MONGODB_URI / MONGO_URI in env");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log(`database: ${mongoose.connection.name}`);
  console.log(APPLY ? "MODE: APPLY (deleting)\n" : "MODE: DRY RUN (no writes)\n");

  const jobs = await InvoiceJobModel.find({})
    .select("jobId orderId status invoiceNumber invoiceUrl snapshot createdAt")
    .sort({ createdAt: -1 })
    .lean();

  // One query for every referenced order rather than one per job.
  const orderIds = jobs
    .map((job) => job.orderId)
    .filter((id) => mongoose.isValidObjectId(id));
  const orders = await OrderModel.find({ _id: { $in: orderIds } })
    .select("_id")
    .lean();
  const live = new Set(orders.map((order) => String(order._id)));

  const orphans = jobs.filter((job) => !live.has(String(job.orderId)));

  console.log(`invoice jobs: ${jobs.length}`);
  console.log(`orphans (order missing): ${orphans.length}\n`);

  if (orphans.length === 0) {
    await mongoose.disconnect();
    return;
  }

  for (const job of orphans) {
    const key = job.invoiceUrl ? s3KeyFromUrl(job.invoiceUrl) : null;
    console.log(`  jobId          ${job.jobId}`);
    console.log(`  orderId        ${job.orderId}  (not found)`);
    console.log(`  status         ${job.status}`);
    console.log(`  invoiceNumber  INV-${job.invoiceNumber ?? "(none)"}`);
    console.log(`  customer       ${job.snapshot?.userName ?? "(none recorded)"}`);
    console.log(`  created        ${job.createdAt?.toISOString() ?? "(none)"}`);
    console.log(`  s3 object      ${key ?? "(no invoiceUrl)"}`);
    console.log("");
  }

  if (EXPECT !== undefined && orphans.length !== Number(EXPECT)) {
    console.error(
      `Refusing to run: --expect=${EXPECT} but found ${orphans.length} orphan(s).`,
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  if (!APPLY) {
    console.log("re-run with --apply to delete the rows listed above.");
    await mongoose.disconnect();
    return;
  }

  let pdfsDeleted = 0;
  if (!KEEP_PDF) {
    const s3 = await getS3Client();
    for (const job of orphans) {
      const key = job.invoiceUrl ? s3KeyFromUrl(job.invoiceUrl) : null;
      if (!key) continue;
      try {
        await s3.send(
          new DeleteObjectCommand({ Bucket: getBucketName(), Key: key }),
        );
        console.log(`deleted s3://${getBucketName()}/${key}`);
        pdfsDeleted++;
      } catch (error) {
        // Worth finishing the DB cleanup regardless: a stranded object is
        // tidier than a row that keeps reappearing in the admin list.
        console.warn(`could not delete ${key}:`, error);
      }
    }
  }

  const result = await InvoiceJobModel.deleteMany({
    jobId: { $in: orphans.map((job) => job.jobId) },
  });

  console.log(
    `\ndeleted ${result.deletedCount} invoice job row(s), ${pdfsDeleted} PDF(s).`,
  );
  console.log("invoice counter left untouched (numbers are not reissued).");

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
