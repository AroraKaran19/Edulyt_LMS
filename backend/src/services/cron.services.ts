import cron from "node-cron";
import { OrderModel, UserModel } from "../models";
import { reconcileOrder } from "./payments/orderFlow";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import ImageModule from "docxtemplater-image-module-free";
import QRCode from "qrcode";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { enqueueDueInternshipEvaluations } from "./internshipEvaluationJob.services";
import { uploadFileToS3 } from "./upload.services";
import {
  convertDocxToPdf,
  replacePlainTextPlaceholders,
} from "../utils/certificateGeneratorDocx";

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
 * Verify payment status for a single order. All gateway talk + settlement
 * lives in orderFlow now; the cron just drives it.
 */
const verifyOrderPayment = async (order: any) => {
  try {
    await reconcileOrder(order);
  } catch (error) {
    console.error(`❌ Error verifying payment for order ${order._id}:`, error);
  }
};

function formatOfferLetterDate(d: Date): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${String(d.getUTCDate()).padStart(2,"0")}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
}

// __dirname is backend/dist/services (or src/services); three segments reach repo root.
const OFFER_LETTER_TEMPLATE = path.resolve(
  __dirname,
  "../../../frontend/public/course-certificates/Airkrit Certificates/Airkrit India Offer Letter - Intern - AI-02453 - Template.docx",
);

export interface OfferLetterData {
  letterDate: string;
  name: string;
  internId: string;
  joiningDate: string;
  domain: string;
  duration: string;
}

/**
 * Render the offer-letter DOCX from the Airkrit template.
 *
 * The template mixes three kinds of placeholder, each handled by the mechanism
 * that can actually resolve it:
 *
 *  - Named bracket tags — `[Your Name]`, `[DD-MMM-YYYY]` (joining date), the
 *    long "[Your selected Domain ... Intern]" tag, and `[X]` (months). These are
 *    resolved by docxtemplater, which correctly merges tags split across runs.
 *    The descriptive tags have no natural data key, so a `nullGetter` maps them.
 *  - Plain split-run tokens in the header — the `DD-MM-YYYY` letter date and
 *    `AI-XXXX` intern ID. Word fragments these across runs, so the run-aware
 *    `replacePlainTextPlaceholders` pass fills them (preserving their bold run).
 *  - `[%qrImage]` — filled from the verification URL by the image module.
 *
 * An unmapped tag renders "" rather than docxtemplater's literal "undefined".
 */
export async function generateOfferLetterBuffer(
  data: OfferLetterData,
  options: { verificationUrl?: string } = {},
): Promise<Buffer> {
  const zip = new PizZip(fs.readFileSync(OFFER_LETTER_TEMPLATE));

  let qrPng: Buffer | null = null;
  if (options.verificationUrl) {
    try {
      qrPng = await QRCode.toBuffer(options.verificationUrl, {
        type: "png",
        width: 300,
        margin: 1,
        errorCorrectionLevel: "M",
      });
    } catch (err) {
      console.warn("[offer-letter] QR generation failed, shipping without QR:", err);
    }
  }

  const imageModule = new ImageModule({
    centered: false,
    getImage: (tagValue: string) =>
      tagValue === "qrImage" && qrPng ? qrPng : Buffer.from(""),
    // 96px @ 96 DPI = 1 inch square — same sizing as the certificate QR.
    getSize: () => [96, 96],
  });

  const doc = new Docxtemplater(zip, {
    delimiters: { start: "[", end: "]" },
    paragraphLoop: true,
    linebreaks: true,
    modules: [imageModule],
    nullGetter: (part: any): string => {
      if (part && part.module) return "";
      const tag = String(part?.value ?? "").trim();
      const lower = tag.toLowerCase();
      if (lower.includes("domain")) return data.domain;
      if (tag === "X") return data.duration;
      if (/dd\s*-\s*mmm/.test(lower)) return data.joiningDate; // [DD-MMM-YYYY]
      return "";
    },
  });

  doc.render({ "Your Name": data.name, qrImage: qrPng ? "qrImage" : "" });

  const outZip = doc.getZip();
  replacePlainTextPlaceholders(outZip, {
    "AI-XXXX": data.internId,
    "DD-MM-YYYY": data.letterDate,
  });

  return outZip.generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer;
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

  // internId is normally pre-stamped at the doc-verify step by the atomic
  // counter (services/internId.services.ts). Fall back to the same allocator
  // here only as a safety net for legacy rows / manual DB edits that
  // somehow reached `offer_letter_pending` without one.
  const existing = (doc as unknown as Record<string, unknown>).internId as
    | string
    | undefined;
  let internId = existing;
  if (!internId) {
    const { allocateNextInternId } = await import("./internId.services");
    internId = await allocateNextInternId();
  }

  const now = new Date();

  // TEMPORARY: letter date is hard-pinned to 07-May-2026 for the current
  // onboarding batch (admin wants every issued offer letter in this rollout
  // to carry this exact date regardless of enrolledAt). Revert to the
  // `enrolledAt ?? now` rule once the backfill is complete.
  const letterDate = "07-May-2026";

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

  // Certificate evaluation: enqueue learners whose program window has closed.
  // 01:00 IST — `endDate` is IST end-of-day, so this is the N+1 morning and the
  // learner had their whole final day to earn points.
  //
  // Gated: the verdict decides whether a real person receives a certificate, so
  // it stays off until the dry-run report has been reviewed and accepted.
  if (process.env.INTERNSHIP_EVALUATION_ENABLED === "true") {
    cron.schedule(
      "0 1 * * *",
      () => {
        console.log("⏰ Running internship certificate evaluation enqueue...");
        void enqueueDueInternshipEvaluations();
      },
      {
        timezone: "Asia/Kolkata",
      }
    );
    console.log("  - Internship certificate evaluation: Daily at 01:00 IST");
  } else {
    console.log(
      "  - Internship certificate evaluation: DISABLED (set INTERNSHIP_EVALUATION_ENABLED=true)"
    );
  }
};

/**
 * Manual trigger for payment verification (for testing)
 */
export const triggerPaymentVerification = async () => {
  console.log("🔧 Manual payment verification triggered");
  await checkPendingPayments();
};
