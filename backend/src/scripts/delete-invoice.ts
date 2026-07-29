/**
 * Delete one invoice completely: the job row, the number and URL stamped on its
 * order, and the PDF in S3.
 *
 * Intended for test invoices. A real tax invoice must not be deleted: GST
 * requires the sequence to be unique and consecutive, and a customer may
 * already hold the PDF.
 *
 * An invoice lives in four places, and leaving any one behind causes trouble
 * later, so this removes all of them:
 *   1. InvoiceJob        the queue row
 *   2. Order             invoiceNumber + invoiceUrl + invoicedAt
 *   3. S3                the rendered PDF under invoices/
 *   4. AppCounter        the financial-year sequence (only with --reset-counter)
 *
 * Leaving `invoiceNumber` on the order is the trap worth knowing about:
 * `ensureInvoiceNumber` short-circuits on it, so a re-run would reuse the old
 * number and never allocate a fresh one.
 *
 * Usage:
 *   npx ts-node src/scripts/delete-invoice.ts --job=<jobId>            # dry run
 *   npx ts-node src/scripts/delete-invoice.ts --job=<jobId> --apply
 *   ... --expect=2627-00001     # refuse unless the order carries this number
 *   ... --reset-counter         # also rewind the FY counter (last number only)
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { InvoiceJobModel } from "../models/invoiceJob.schema";
import { OrderModel } from "../models/order.schema";
import { AppCounterModel } from "../models/appCounter.schema";
import { getS3Client, getBucketName, getPublicUrlBase } from "../config/s3";
import { financialYearIst } from "../services/invoiceNumber.services";

dotenv.config();

const arg = (name: string): string =>
  (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? "").split("=")[1] ?? "";

const JOB_ID = arg("job");
const EXPECT = arg("expect");
const APPLY = process.argv.includes("--apply");
const RESET_COUNTER = process.argv.includes("--reset-counter");

/** "https://bucket.s3.amazonaws.com/invoices/x.pdf" -> "invoices/x.pdf" */
function s3KeyFromUrl(fileUrl: string): string {
  const base = getPublicUrlBase();
  if (fileUrl.startsWith(base)) return fileUrl.slice(base.length).replace(/^\//, "");
  return new URL(fileUrl).pathname.replace(/^\//, "");
}

async function main() {
  if (!JOB_ID) {
    console.error("Missing --job=<jobId>");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log(`database: ${mongoose.connection.name}`);
  console.log(APPLY ? "MODE: APPLY (deleting)" : "MODE: DRY RUN (no writes)\n");

  const job = await InvoiceJobModel.findOne({ jobId: JOB_ID }).lean();
  if (!job) {
    console.error(`No invoice job with jobId ${JOB_ID}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  // orderId is a String on InvoiceJob; findById casts it to ObjectId.
  const order = await OrderModel.findById((job as any).orderId)
    .select("_id invoiceNumber invoiceUrl invoicedAt paymentStatus amount userId createdAt")
    .lean();

  const invoiceNumber =
    (order as any)?.invoiceNumber ?? (job as any).invoiceNumber ?? null;
  const invoiceUrl = (order as any)?.invoiceUrl ?? (job as any).invoiceUrl ?? null;

  console.log("job");
  console.log(`  jobId          ${(job as any).jobId}`);
  console.log(`  orderId        ${(job as any).orderId}`);
  console.log(`  status         ${(job as any).status}`);
  console.log(`  invoiceNumber  ${(job as any).invoiceNumber ?? "(none)"}`);
  console.log("order");
  if (!order) {
    console.log(`  (order ${(job as any).orderId} not found)`);
  } else {
    console.log(`  _id            ${(order as any)._id}`);
    console.log(`  paymentStatus  ${(order as any).paymentStatus}`);
    console.log(`  amount         ${(order as any).amount}`);
    console.log(`  invoiceNumber  ${(order as any).invoiceNumber ?? "(none)"}`);
    console.log(`  invoiceUrl     ${(order as any).invoiceUrl ?? "(none)"}`);
    console.log(`  invoicedAt     ${(order as any).invoicedAt ?? "(none)"}`);
  }

  // Guard against deleting the wrong invoice when a job id is pasted by hand.
  if (EXPECT && invoiceNumber && invoiceNumber !== EXPECT) {
    console.error(
      `\nRefusing to delete: expected invoice ${EXPECT} but this job's order ` +
        `carries ${invoiceNumber}.`,
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  // The counter is keyed by financial year, and the number encodes both:
  // "2627-00001" is sequence 1 of FY 2026-27.
  const fyLabel = invoiceNumber
    ? (() => {
        const short = String(invoiceNumber).split("-")[0];
        return `20${short.slice(0, 2)}-${short.slice(2)}`;
      })()
    : financialYearIst().label;
  const seqOfThis = invoiceNumber
    ? Number(String(invoiceNumber).split("-")[1])
    : NaN;
  const counter = await AppCounterModel.findById(`invoice:${fyLabel}`).lean();
  console.log("counter");
  console.log(`  invoice:${fyLabel}   seq = ${(counter as any)?.seq ?? "(none)"}`);

  const counterIsAtThis =
    counter && Number.isFinite(seqOfThis) && (counter as any).seq === seqOfThis;
  if (RESET_COUNTER && !counterIsAtThis) {
    console.log(
      `  NOTE: not rewinding. seq is ${(counter as any)?.seq}, this invoice is ` +
        `${seqOfThis}. Rewinding would hand out a number already in use.`,
    );
  }

  const s3Key = invoiceUrl ? s3KeyFromUrl(invoiceUrl) : null;

  console.log("\nwill delete");
  console.log(`  invoice job    ${(job as any).jobId}`);
  if (order) console.log(`  order fields   invoiceNumber, invoiceUrl, invoicedAt`);
  console.log(`  s3 object      ${s3Key ?? "(no invoiceUrl, nothing in S3)"}`);
  if (RESET_COUNTER && counterIsAtThis) {
    console.log(`  counter        invoice:${fyLabel} ${seqOfThis} -> ${seqOfThis - 1}`);
  }

  if (!APPLY) {
    console.log("\nre-run with --apply to delete.");
    await mongoose.disconnect();
    return;
  }

  if (s3Key) {
    const s3 = await getS3Client();
    await s3.send(
      new DeleteObjectCommand({ Bucket: getBucketName(), Key: s3Key }),
    );
    console.log(`\ndeleted s3://${getBucketName()}/${s3Key}`);
  }

  if (order) {
    await OrderModel.updateOne(
      { _id: (order as any)._id },
      { $unset: { invoiceNumber: "", invoiceUrl: "", invoicedAt: "" } },
    );
    console.log(`cleared invoice fields on order ${(order as any)._id}`);
  }

  await InvoiceJobModel.deleteOne({ jobId: JOB_ID });
  console.log(`deleted invoice job ${JOB_ID}`);

  if (RESET_COUNTER && counterIsAtThis) {
    await AppCounterModel.updateOne(
      { _id: `invoice:${fyLabel}`, seq: seqOfThis },
      { $inc: { seq: -1 } },
    );
    console.log(`rewound counter invoice:${fyLabel} to ${seqOfThis - 1}`);
  }

  console.log("\ndone.");
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
