import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import fs from "fs";
import path from "path";
import { replacePlainTextPlaceholders } from "./certificateGeneratorDocx";
import { ymdIst } from "./ist";

/**
 * Tax-invoice generator built on a brand's invoice template (see lib/invoiceIssuer).
 *
 * Same mechanics as the certificate generator: docxtemplater with `[]`
 * delimiters fills the bracketed tags, then a plain-text pass rewrites the
 * two literal option lists the template ships with ("Paid / Pending" and
 * "UPI / Card / Net Banking / Wallet"), which are not bracketed.
 *
 * Template tags, verbatim: [Your GST Number], [0001] (inside "INV-[0001]"),
 * [DD/MM/YYYY], [Order Number], [Customer Name], [Customer Email],
 * [Customer Phone], [Course Name], [Base Amount], [Line Amount], [Amount],
 * [GST Amount], [Final Amount], plus the [#hasDiscount] section wrapping
 * [Discount Label] / [Discount Amount]. The ₹ symbol is already in the
 * template, so every amount is rendered as a bare number.
 *
 * Every figure on the invoice is EX-GST except [Final Amount]: the line item
 * shows the pre-discount taxable value, the discount row reduces it, and GST
 * is charged on what remains. That ordering is what lets a pre-supply discount
 * reduce the taxable value rather than sit on top of the tax.
 */

/** GST rate applied to course and internship sales. */
export const GST_RATE_PERCENT = 18;

export interface InvoiceData {
  /** Sequence part of the invoice number, rendered as "INV-<invoiceNumber>". */
  invoiceNumber: string;
  /** Invoice date; formatted as DD/MM/YYYY in IST. */
  invoiceDate: Date | string;
  /** Our order identifier (txnId / order _id) shown as "Order ID". */
  orderId: string;
  /** Seller GSTIN, from the brand's invoice issuer. */
  gstin: string;

  customerName: string;
  customerEmail: string;
  customerPhone: string;

  /**
   * Line-item description: course title, internship title, etc. Every invoice
   * covers exactly one item, so anything countable (e.g. a success-points pack)
   * belongs in this string, not in a quantity column.
   */
  itemDescription: string;

  /** Taxable value AFTER discount (₹, ex-GST). */
  baseAmount: number;
  /** GST charged on `baseAmount` (₹). */
  gstAmount: number;
  /** Gross payable (₹). Must equal baseAmount + gstAmount. */
  totalAmount: number;

  /**
   * Discount ex-GST (₹). When > 0 the invoice grows a "Less: …" row and the
   * line item shows `baseAmount + discountAmount`, i.e. the pre-discount
   * taxable value. Omit or 0 to hide the row entirely.
   */
  discountAmount?: number;
  /** Row label, e.g. "Discount (500 Success Points)". Defaults to "Discount". */
  discountLabel?: string;

  paymentStatus: "Paid" | "Pending";
  /** Free text, e.g. "UPI", "Card", "Razorpay", "Success Points". */
  paymentMethod: string;
}

/** Amounts derived from a gross (tax-inclusive) figure. */
export interface InvoiceAmounts {
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
}

/** Round to 2 decimals without float drift (e.g. 1.005 → 1.01). */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Split a gross, tax-inclusive amount into base + GST.
 *
 * Order amounts are what the customer actually paid, and prices are displayed
 * inclusive of GST, so the tax is backed out, never added on top.
 * `gstAmount` is derived by subtraction so `base + gst` always reconciles to
 * the gross to the paisa.
 */
export function splitGstInclusiveAmount(
  grossAmount: number,
  gstRatePercent: number = GST_RATE_PERCENT,
): InvoiceAmounts {
  if (!Number.isFinite(grossAmount) || grossAmount < 0) {
    throw new Error(`Invalid gross amount for invoice: ${grossAmount}`);
  }
  const total = round2(grossAmount);
  const base = round2(total / (1 + gstRatePercent / 100));
  return { baseAmount: base, gstAmount: round2(total - base), totalAmount: total };
}

/** Indian-grouped money string with 2 decimals, e.g. 149999.5 → "1,49,999.50". */
export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** DD/MM/YYYY for the IST calendar day of `value`. */
function formatDateDDMMYYYY(value: Date | string): string {
  const ymd = ymdIst(value);
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

/** Absolute path to a shipped invoice template. */
export function getInvoiceTemplatePath(template: string): string {
  return path.join(process.cwd(), "public", "doc", template);
}

/**
 * Turn what the customer was actually charged into the figures the invoice
 * needs, given how much of the pre-discount price was waived.
 *
 * Both inputs are gross (tax-inclusive) rupees: `grossPaid` is `order.amount`,
 * already net of the whole discount stack, and `grossDiscount` is the part of
 * the list price that was discounted away. GST is derived from `grossPaid`
 * alone, so the discount reduces the taxable value rather than the tax.
 */
export function buildInvoiceAmounts(
  grossPaid: number,
  grossDiscount = 0,
  gstRatePercent: number = GST_RATE_PERCENT,
): InvoiceAmounts & { discountAmount: number } {
  const amounts = splitGstInclusiveAmount(grossPaid, gstRatePercent);
  const discount = round2(
    Math.max(0, grossDiscount) / (1 + gstRatePercent / 100),
  );
  return { ...amounts, discountAmount: discount };
}

/**
 * Fill the invoice template and write the resulting DOCX to `outputPath`.
 * Returns the DOCX buffer.
 */
export function generateInvoiceDocx(
  templatePath: string,
  outputPath: string,
  data: InvoiceData,
): Buffer {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Invoice template not found: ${templatePath}`);
  }

  const expectedTotal = round2(data.baseAmount + data.gstAmount);
  if (expectedTotal !== round2(data.totalAmount)) {
    throw new Error(
      `Invoice amounts do not reconcile: base ${data.baseAmount} + GST ` +
        `${data.gstAmount} = ${expectedTotal}, but total is ${data.totalAmount}`,
    );
  }

  const zip = new PizZip(fs.readFileSync(templatePath, "binary"));

  const doc = new Docxtemplater(zip, {
    delimiters: { start: "[", end: "]" },
    paragraphLoop: true,
    linebreaks: true,
    // Never render docxtemplater's default "undefined" for an unmapped tag.
    nullGetter: () => "",
  });

  const discount = round2(Math.max(0, data.discountAmount ?? 0));

  // The line item carries the PRE-discount taxable value; the discount row
  // below it brings the figure down to `baseAmount`, which GST is charged on.
  // Price and Amount are the same figure; there is no quantity column.
  const lineTotal = round2(data.baseAmount + discount);

  doc.render({
    "Your GST Number": data.gstin,
    // Tag inside the literal "INV-[0001]" prefix.
    "0001": data.invoiceNumber,
    "DD/MM/YYYY": formatDateDDMMYYYY(data.invoiceDate),
    "Order Number": data.orderId,

    "Customer Name": data.customerName,
    "Customer Email": data.customerEmail,
    "Customer Phone": data.customerPhone,

    "Course Name": data.itemDescription,
    "Base Amount": formatInr(lineTotal),
    "Line Amount": formatInr(lineTotal),

    hasDiscount: discount > 0,
    "Discount Label": data.discountLabel ?? "Discount",
    "Discount Amount": formatInr(discount),

    Amount: formatInr(data.baseAmount),
    "GST Amount": formatInr(data.gstAmount),
    "Final Amount": formatInr(data.totalAmount),
  });

  // The template's status/method lines are literal option lists, not tags.
  replacePlainTextPlaceholders(doc.getZip(), {
    "Paid / Pending": data.paymentStatus,
    "UPI / Card / Net Banking / Wallet": data.paymentMethod,
  });

  const buffer: Buffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);

  return Buffer.from(buffer);
}
