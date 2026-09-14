import fs from "fs";
import os from "os";
import path from "path";
import { OrderModel } from "../models/order.schema";
import { UserModel } from "../models/user.schema";
import { asBrand } from "../constants/brands";
import { invoiceIssuerFor } from "../lib/invoiceIssuer";
import { AppError } from "../middlewares/error.middleware";
import { uploadFileToS3 } from "./upload.services";
import { isInvoiceableOrder } from "../lib/invoiceEligibility";
import { allocateNextInvoiceNumber } from "./invoiceNumber.services";
import { convertDocxToPdf } from "../utils/certificateGeneratorDocx";
import {
  buildInvoiceAmounts,
  generateInvoiceDocx,
  getInvoiceTemplatePath,
  InvoiceData,
} from "../utils/invoiceGeneratorDocx";

/** S3 folder for generated invoices. */
const INVOICE_S3_FOLDER = "invoices";

export interface InvoiceResult {
  invoiceNumber: string;
  invoiceUrl: string;
  /** True when the order already had an invoice and nothing was regenerated. */
  alreadyExisted: boolean;
}

type OrderDoc = Record<string, any>;

/** Safe for an S3 key / filename. */
function sanitizeForFilename(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 80);
}

/**
 * What the customer bought, as one line of text. The invoice has no quantity
 * column, so anything countable is folded into this string.
 */
function buildItemDescription(order: OrderDoc): string {
  if (order.orderKind === "internship_seat") {
    return order.internshipTitle
      ? `Internship Seat (${order.internshipTitle})`
      : "Internship Seat";
  }

  if (order.orderKind === "internship_success_points") {
    const qty = Number(order.internshipSuccessPointsQuantity) || 0;
    const program = order.internshipTitle
      ? ` (${order.internshipTitle})`
      : "";
    return qty > 0
      ? `${qty} x Internship Success Points${program}`
      : `Internship Success Points${program}`;
  }

  const name = order.courseName || "Course";
  return order.planType
    ? `${name} (${order.planType === "elite" ? "Elite" : "Essential"} Plan)`
    : name;
}

/**
 * Total gross discount and the row label for it.
 *
 * `order.amount` is already net of coupon, collaboration, referral and success
 * points, so these figures exist only to reconstruct the pre-discount line and
 * to record the reduction on the invoice. A single combined row is used; when
 * exactly one kind of discount applied, the label names it.
 */
function buildDiscount(order: OrderDoc): { gross: number; label: string } {
  const parts: Array<{ amount: number; label: string }> = [
    {
      amount: Number(order.couponDiscount) || 0,
      label: order.couponCode ? `Discount (Coupon ${order.couponCode})` : "Discount (Coupon)",
    },
    {
      amount: Number(order.collaborationDiscount) || 0,
      label: "Discount (Partnership)",
    },
    {
      amount: Number(order.referralDiscount) || 0,
      label: order.referralCode
        ? `Discount (Referral ${order.referralCode})`
        : "Discount (Referral)",
    },
    {
      amount: Number(order.successPointsDiscount) || 0,
      label: `Discount (${Number(order.successPointsApplied) || 0} Success Points)`,
    },
  ];

  const applied = parts.filter((p) => p.amount > 0);
  const gross = applied.reduce((sum, p) => sum + p.amount, 0);

  return {
    gross,
    label: applied.length === 1 ? applied[0].label : "Discount",
  };
}

/**
 * How the customer paid. A points-only order settles below the free-order
 * threshold without ever reaching a gateway, so `paymentMethod` (which always
 * holds a gateway name) would be misleading there.
 */
function buildPaymentMethod(order: OrderDoc): string {
  if (Number(order.amount) <= 0) return "Success Points";
  const method = String(order.paymentMethod || "").toLowerCase();
  if (method === "paytm") return "Paytm";
  if (method === "razorpay") return "Razorpay";
  return order.paymentMethod || "Online";
}

/**
 * Allocate this order's invoice number, or return the one it already holds.
 *
 * The conditional update is what makes retries safe: only an order with no
 * number yet gets written, so two workers racing the same order cannot both
 * stamp it. The loser discards its allocation (leaving a gap in the sequence)
 * and re-reads the winner's number.
 */
async function ensureInvoiceNumber(
  order: OrderDoc,
  series: string,
): Promise<string> {
  if (order.invoiceNumber) return order.invoiceNumber;

  const candidate = await allocateNextInvoiceNumber(
    series,
    order.createdAt ?? new Date(),
  );
  const claimed = await OrderModel.findOneAndUpdate(
    { _id: order._id, invoiceNumber: { $in: [null, ""] } },
    { $set: { invoiceNumber: candidate } },
    { new: true },
  ).lean();

  if (claimed?.invoiceNumber) return claimed.invoiceNumber;

  const current = await OrderModel.findById(order._id).select("invoiceNumber").lean();
  if (current?.invoiceNumber) return current.invoiceNumber;

  throw new Error(`Could not allocate an invoice number for order ${order._id}`);
}

/**
 * Render the invoice for a paid order, upload the PDF to S3, and record the
 * URL on the order.
 *
 * Idempotent: an order that already carries `invoiceUrl` is returned untouched,
 * so worker retries and duplicate gateway callbacks cannot produce a second
 * document or a second number.
 */
export const generateInvoiceForOrderService = async (
  orderId: string,
  onProgress?: (percent: number) => Promise<void> | void,
): Promise<InvoiceResult> => {
  const order = (await OrderModel.findById(orderId).lean()) as OrderDoc | null;
  if (!order) throw new AppError("Order not found", 404);

  // Provenance gate. Amount is irrelevant here: a checkout order discounted to
  // ₹0 is invoiced, a free grant is not (and never reaches this point, since
  // grants create no Order). See lib/invoiceEligibility for the full rule.
  if (!isInvoiceableOrder(order)) {
    throw new AppError(
      `Refusing to invoice order ${orderId}: not a settled checkout purchase ` +
        `(status ${order.paymentStatus}, method ${order.paymentMethod}).`,
      400,
    );
  }

  if (order.invoiceUrl && order.invoiceNumber) {
    return {
      invoiceNumber: order.invoiceNumber,
      invoiceUrl: order.invoiceUrl,
      alreadyExisted: true,
    };
  }

  // The seller is the brand the order was placed on, not the product's.
  const issuer = invoiceIssuerFor(asBrand(order.brand));

  await onProgress?.(20);

  const user = (await UserModel.findById(order.userId)
    .select("firstName lastName email phone")
    .lean()) as OrderDoc | null;

  const customerName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    order.userName ||
    "Customer";

  const invoiceNumber = await ensureInvoiceNumber(order, issuer.series);
  await onProgress?.(40);

  const discount = buildDiscount(order);
  const amounts = buildInvoiceAmounts(Number(order.amount) || 0, discount.gross);

  const data: InvoiceData = {
    invoiceNumber,
    gstin: issuer.gstin,
    // The supply happened when the payment settled, not when this job runs.
    invoiceDate: order.updatedAt ?? order.createdAt ?? new Date(),
    orderId: String(order._id),
    customerName,
    customerEmail: user?.email ?? "",
    customerPhone: user?.phone ?? "",
    itemDescription: buildItemDescription(order),
    baseAmount: amounts.baseAmount,
    gstAmount: amounts.gstAmount,
    totalAmount: amounts.totalAmount,
    discountAmount: amounts.discountAmount,
    discountLabel: discount.label,
    paymentStatus: "Paid",
    paymentMethod: buildPaymentMethod(order),
  };

  const templatePath = getInvoiceTemplatePath(issuer.template);
  const tempDir = path.join(os.tmpdir(), `invoice-${invoiceNumber}-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const docxPath = path.join(tempDir, `invoice-${invoiceNumber}.docx`);
  const pdfPath = path.join(tempDir, `invoice-${invoiceNumber}.pdf`);

  try {
    generateInvoiceDocx(templatePath, docxPath, data);
    await onProgress?.(60);

    await convertDocxToPdf(docxPath, pdfPath);
    await onProgress?.(80);

    const pdfBuffer = fs.readFileSync(pdfPath);
    const fileName = `${issuer.filePrefix}_${invoiceNumber}_${sanitizeForFilename(customerName)}.pdf`;

    const invoiceUrl = await uploadFileToS3(
      pdfBuffer,
      fileName,
      INVOICE_S3_FOLDER,
      "application/pdf",
    );

    await OrderModel.updateOne(
      { _id: order._id },
      { $set: { invoiceUrl, invoicedAt: new Date() } },
    );

    return { invoiceNumber, invoiceUrl, alreadyExisted: false };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.warn(`[Invoice] Could not remove temp dir ${tempDir}:`, cleanupError);
    }
  }
};
