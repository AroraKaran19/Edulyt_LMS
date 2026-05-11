import cron from "node-cron";
import {
  OrderModel,
  CourseModel,
  UserModel,
  StudentModel,
} from "../models";
import { generatePaytmChecksum } from "../utils/lib/generatePaytmChecksum";
import axios from "axios";
import { AppError } from "../middlewares/error.middleware";
import { createEnrollmentAfterPayment } from "./order.services";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import ImageModule from "docxtemplater-image-module-free";
import QRCode from "qrcode";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { uploadFileToS3 } from "./upload.services";
import { convertDocxToPdf } from "../utils/certificateGeneratorDocx";

/**
 * Update pending payments for a user
 */
const updatePendingPayments = async (userId: string, updateOperation: any) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  if (user.userType === "student") {
    await StudentModel.findByIdAndUpdate(userId, updateOperation);
  }
};


const PENDING_ORDER_AGE_HOURS = 24;

/**
 * Delete abandoned pending orders older than the threshold
 */
const deleteOldPendingOrders = async () => {
  const cutoff = new Date(Date.now() - PENDING_ORDER_AGE_HOURS * 60 * 60 * 1000);
  const oldPendingOrders = await OrderModel.find({
    paymentStatus: "pending",
    createdAt: { $lt: cutoff },
  }).lean();

  if (oldPendingOrders.length === 0) return;

  const orderIds = oldPendingOrders.map((o) => o._id.toString());
  const userIdToOrderIds = new Map<string, string[]>();
  for (const o of oldPendingOrders) {
    const uid = o.userId?.toString();
    if (uid) {
      const list = userIdToOrderIds.get(uid) ?? [];
      list.push(o._id.toString());
      userIdToOrderIds.set(uid, list);
    }
  }

  for (const [userId, ids] of userIdToOrderIds) {
    try {
      await UserModel.findByIdAndUpdate(userId, {
        $pull: { pendingPayments: { $in: ids } },
      });
    } catch {
      // User may not exist
    }
  }

  const deleteResult = await OrderModel.deleteMany({
    _id: { $in: orderIds },
    paymentStatus: "pending",
  });
  console.log(`🗑️ Deleted ${deleteResult.deletedCount} abandoned pending order(s)`);
};

/**
 * Check payment status for all pending orders
 */
const checkPendingPayments = async () => {
  try {
    console.log("🔄 Starting payment verification cron job...");

    // 1. Verify recent pending orders (last 24 hours)
    const pendingOrders = await OrderModel.find({
      paymentStatus: "pending",
      createdAt: { $gte: new Date(Date.now() - PENDING_ORDER_AGE_HOURS * 60 * 60 * 1000) },
    }).limit(50);

    if (pendingOrders.length === 0) {
      console.log("✅ No pending payments to verify");
    } else {
      console.log(`🔍 Found ${pendingOrders.length} pending orders to verify`);
      for (const order of pendingOrders) {
        try {
          await verifyOrderPayment(order);
        } catch (error) {
          console.error(`❌ Error verifying order ${order._id}:`, error);
        }
      }
    }

    // 2. Delete abandoned pending orders older than 24 hours
    await deleteOldPendingOrders();

    console.log("✅ Payment verification cron job completed");
  } catch (error) {
    console.error("❌ Payment verification cron job failed:", error);
  }
};

/**
 * Verify payment status for a single order
 */
const verifyOrderPayment = async (order: any) => {
  try {
    // Generate checksum for Paytm API
    const signature = await generatePaytmChecksum({
      mid: process.env.PAYTM_MID,
      orderId: order._id.toString(),
    });

    if (!signature) {
      console.error(`❌ Failed to generate checksum for order ${order._id}`);
      return;
    }

    // Call Paytm API to check payment status
    const statusResponse = await axios.post(
      `https://secure.paytmpayments.com/v3/order/status`,
      {
        body: {
          mid: process.env.PAYTM_MID,
          orderId: order._id.toString(),
        },
        head: { signature: signature },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    if (statusResponse.status !== 200) {
      console.log(
        `⚠️ Paytm API returned non-200 status for order ${order._id}`
      );
      return;
    }

    const resultStatus = statusResponse.data.body.resultInfo.resultStatus;

    if (resultStatus === "TXN_SUCCESS") {
      // Payment successful
      await handleSuccessfulPayment(order, statusResponse.data.body);
    } else if (resultStatus === "TXN_FAILURE") {
      // Payment failed
      const errorReason =
        statusResponse.data.body.resultInfo?.resultMsg || "Payment declined";
      order.paymentErrorReason = errorReason;
      await handleFailedPayment(order);
      console.log(`❌ Payment failed for order ${order._id}: ${errorReason}`);
    } else {
      // Still pending
      console.log(`⏳ Payment still pending for order ${order._id}`);
    }
  } catch (error) {
    console.error(`❌ Error verifying payment for order ${order._id}:`, error);
  }
};

/**
 * Handle successful payment
 */
const handleSuccessfulPayment = async (order: any, paytmResponse: any) => {
  try {
    
    // Update order status
    order.paymentStatus = "success";
    order.paymentMode = paytmResponse.paymentMode;
    order.txnId = paytmResponse.txnId;
    await order.save();

    // Remove from pending payments
    await updatePendingPayments(order.userId?.toString() || "", {
      $pull: { pendingPayments: order._id.toString() },
    });

    // Create enrollment after successful payment (this will update analytics)
    try {
      await createEnrollmentAfterPayment(order);
    } catch (enrollmentError) {
      console.error(`Failed to create enrollment for order ${order._id}:`, enrollmentError);
      // Don't throw here as payment is already successful
      // The enrollment can be created manually later if needed
    }

  } catch (error) {
    console.error(
      `Error processing successful payment for order ${order._id}:`,
      error
    );
  }
};

/**
 * Handle failed payment
 */
const handleFailedPayment = async (order: any) => {
  try {
    // Update order status
    order.paymentStatus = "failed";
    await order.save();

    // Remove from pending payments
    await updatePendingPayments(order.userId?.toString() || "", {
      $pull: { pendingPayments: order._id.toString() },
    });

  } catch (error) {
    console.error(
      `Error processing failed payment for order ${order._id}:`,
      error
    );
  }
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatOfferLetterDate(d: Date): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${String(d.getUTCDate()).padStart(2,"0")}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
}

async function generateInternId(): Promise<string> {
  const count = await InternshipEnrollmentModel.countDocuments({
    internId: { $exists: true, $ne: null },
  });
  return `AI-${String(count + 1).padStart(5, "0")}`;
}

function fillOfferLetterXml(
  xml: string,
  data: {
    letterDate: string;
    name: string;
    internId: string;
    joiningDate: string;
    domain: string;
    duration: string;
  },
): string {
  const e = escapeXml;

  // 1. Intern ID — single <w:t> node in template
  xml = xml.replace("<w:t>AI-XXXX</w:t>", `<w:t>${e(data.internId)}</w:t>`);

  // 2. Letter date header "DD - MM - YYYY" — 5 split runs
  xml = xml.replace(
    /<w:t>DD<\/w:t>([\s\S]{1,300}?)<w:t>-<\/w:t>([\s\S]{1,300}?)<w:t>MM<\/w:t>([\s\S]{1,300}?)<w:t>-<\/w:t>([\s\S]{1,300}?)<w:t>YYYY<\/w:t>/,
    `<w:t>${e(data.letterDate)}</w:t>`,
  );

  // 3–6. Four bracketed placeholders in order: [name], [joiningDate], [domain], [duration]
  let idx = 0;
  const values = [e(data.name), e(data.joiningDate), e(data.domain), e(data.duration)];
  xml = xml.replace(
    /<w:t>\[<\/w:t>[\s\S]*?<w:t>\]<\/w:t>/g,
    () => `<w:t>${values[idx++] ?? ""}</w:t>`,
  );

  return xml;
}

// __dirname is backend/dist/services (or src/services); three segments reach repo root.
const OFFER_LETTER_TEMPLATE = path.resolve(
  __dirname,
  "../../../frontend/public/course-certificates/Certificates/Airkrit India Offer Letter - Intern - AI-02453 - Template.docx",
);

/**
 * Inject the QR PNG at the `[%qrImage]` placeholder via docxtemplater's
 * ImageModule. The raw-XML pass above has already substituted every other
 * placeholder, so docxtemplater only ever sees the image tag. If the template
 * hasn't yet been edited to include `[%qrImage]`, render is a no-op and the
 * letter goes out without a QR rather than failing.
 */
function injectQrIntoDocx(docxBuffer: Buffer, qrPng: Buffer): Buffer {
  const zip = new PizZip(docxBuffer);
  const imageModule = new ImageModule({
    centered: false,
    getImage: (tagValue: string) =>
      tagValue === "qrImage" ? qrPng : Buffer.from(""),
    // 96px @ 96 DPI = 1 inch square — same sizing as the certificate QR.
    getSize: () => [96, 96],
  });
  const doc = new Docxtemplater(zip, {
    delimiters: { start: "[", end: "]" },
    paragraphLoop: true,
    linebreaks: true,
    modules: [imageModule],
    nullGetter: () => "",
  });
  try {
    doc.render({ qrImage: "qrImage" });
  } catch (err) {
    console.warn(
      "[offer-letter] QR render skipped (template may be missing [%qrImage]):",
      err,
    );
    return docxBuffer;
  }
  return doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  }) as Buffer;
}

async function generateOfferLetterBuffer(
  data: Parameters<typeof fillOfferLetterXml>[1],
  options: { verificationUrl?: string } = {},
): Promise<Buffer> {
  const templateBuffer = fs.readFileSync(OFFER_LETTER_TEMPLATE);
  const zip = new PizZip(templateBuffer);
  const docXml = zip.file("word/document.xml")!.asText();
  zip.file("word/document.xml", fillOfferLetterXml(docXml, data));
  const textFilled = zip.generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  }) as Buffer;

  if (!options.verificationUrl) return textFilled;

  try {
    const qrPng = await QRCode.toBuffer(options.verificationUrl, {
      type: "png",
      width: 300,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    return injectQrIntoDocx(textFilled, qrPng);
  } catch (err) {
    console.warn("[offer-letter] QR generation failed, shipping without QR:", err);
    return textFilled;
  }
}

/**
 * Generate the offer letter DOCX for a single `offer_letter_pending` enrollment,
 * upload it to S3, and transition the enrollment to `enrolled`. Returns the
 * generated `internId` and `offerLetterUrl`. Throws if the enrollment is missing
 * or not in the expected status.
 */
export async function processOfferLetterForEnrollment(
  enrollmentId: string,
): Promise<{ internId: string; offerLetterUrl: string }> {
  const doc = await InternshipEnrollmentModel.findById(enrollmentId);
  if (!doc) throw new Error("Internship enrollment not found");
  if (String(doc.status) !== "offer_letter_pending") {
    throw new Error(
      `Enrollment must be "offer_letter_pending" (got "${doc.status}")`,
    );
  }

  const userDoc = await UserModel.findById(doc.user)
    .select("firstName lastName name")
    .lean();
  const name = userDoc
    ? (
        [
          (userDoc as { firstName?: string }).firstName,
          (userDoc as { lastName?: string }).lastName,
        ]
          .filter(Boolean)
          .join(" ") || (userDoc as { name?: string }).name || "Intern"
      )
    : "Intern";

  const existing = (doc as unknown as Record<string, unknown>).internId as
    | string
    | undefined;
  const internId = existing ?? (await generateInternId());

  const now = new Date();

  // Letter date (top of doc): the date the offer is *issued*. For backfill
  // enrollments (already had `enrolledAt` before the offer-letter cron rolled
  // out) this naturally back-dates the letter to the original enrollment day.
  // For fresh enrollments going forward, the cron sets `enrolledAt` to `now`
  // below, so the letter date == generation date.
  const letterDateSrc = doc.enrolledAt instanceof Date ? doc.enrolledAt : now;
  const letterDate = formatOfferLetterDate(letterDateSrc);

  // Joining date (in-letter): the cohort's actual program start date, as set
  // by the admin when publishing the internship. Falls back to enrolledAt /
  // now only if the snapshot is missing.
  const batchStart = doc.batchSnapshot?.internshipStartDate;
  const joiningDateSrc =
    batchStart instanceof Date
      ? batchStart
      : batchStart
        ? new Date(batchStart as unknown as string)
        : doc.enrolledAt instanceof Date
          ? doc.enrolledAt
          : now;
  const joiningDate = formatOfferLetterDate(joiningDateSrc);

  // Domain / designation: admin-configured `offerLetterDesignation` on the
  // internship (live-read so admins can fix typos before late backfills go
  // out). Falls back to "{title} Intern" then "Intern".
  const insLive = await InternshipModel.findById(doc.internship)
    .select("offerLetterDesignation title")
    .lean();
  const designation = String(
    (insLive as { offerLetterDesignation?: string } | null)?.offerLetterDesignation ?? "",
  ).trim();
  const liveTitle = String((insLive as { title?: string } | null)?.title ?? "").trim();
  const snapshotTitle = String(doc.internshipSnapshot?.title ?? "").trim();
  const fallbackTitle = liveTitle || snapshotTitle;
  const domain =
    designation || (fallbackTitle ? `${fallbackTitle} Intern` : "Intern");

  const programMonths = (doc as unknown as Record<string, unknown>)
    .programDurationMonths;
  const duration = String(typeof programMonths === "number" ? programMonths : 3);

  const frontendBase = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");
  const verificationUrl = `${frontendBase}/verify/intern/${encodeURIComponent(internId)}`;

  const docxBuffer = await generateOfferLetterBuffer(
    {
      letterDate,
      name,
      internId,
      joiningDate,
      domain,
      duration,
    },
    { verificationUrl },
  );

  const tempDir = path.join(os.tmpdir(), `offer-letters-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  const docxPath = path.join(tempDir, `offer-letter-${internId}.docx`);
  const pdfPath = path.join(tempDir, `offer-letter-${internId}.pdf`);

  let offerLetterUrl: string;
  try {
    fs.writeFileSync(docxPath, docxBuffer);
    await convertDocxToPdf(docxPath, pdfPath);
    const pdfBuffer = fs.readFileSync(pdfPath);
    offerLetterUrl = await uploadFileToS3(
      pdfBuffer,
      `offer-letter-${internId}.pdf`,
      "offer-letters",
      "application/pdf",
    );
  } finally {
    try {
      if (fs.existsSync(docxPath)) fs.unlinkSync(docxPath);
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
    } catch (cleanupError) {
      console.warn("[offer-letter] Temp cleanup failed:", cleanupError);
    }
  }

  (doc as unknown as Record<string, unknown>).internId = internId;
  (doc as unknown as Record<string, unknown>).offerLetterGeneratedAt = now;
  (doc as unknown as Record<string, unknown>).offerLetterUrl = offerLetterUrl;
  if (!(doc.enrolledAt instanceof Date)) {
    doc.enrolledAt = now;
  }
  doc.status = "enrolled" as typeof doc.status;
  await doc.save();

  return { internId, offerLetterUrl };
}

/**
 * Initialize cron jobs.
 *
 * Note: offer-letter generation is handled by `startOfferLetterWorker`
 * (queue + retry + stuck-job reclaim), not from here. This file is for true
 * time-based jobs only.
 */
export const initializeCronJobs = () => {
  console.log("🕐 Initializing cron jobs...");

  // Run payment verification every 10 minutes
  cron.schedule(
    "*/10 * * * *",
    () => {
      console.log("⏰ Running payment verification cron job...");
      checkPendingPayments();
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log("✅ Cron jobs initialized:");
  console.log("  - Payment verification: Every 10 minutes");
};

/**
 * Manual trigger for payment verification (for testing)
 */
export const triggerPaymentVerification = async () => {
  console.log("🔧 Manual payment verification triggered");
  await checkPendingPayments();
};
