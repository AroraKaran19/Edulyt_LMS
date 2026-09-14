/**
 * Renders sample tax invoices from a brand's invoice template so the layout and
 * figures can be eyeballed without touching the database.
 *
 * Run from backend root:
 *   npx ts-node src/scripts/generate-test-invoice.ts --brand=airkrit
 *
 * Options:
 *   --brand=<brand> whose issuer to render as (airkrit | edulyt), required
 *   --out=<dir>   output directory (default ./scripts-output/invoices)
 *   --docx-only   skip the LibreOffice PDF conversion
 *   --case=<name> render only one case (plain | points | pointsonly | pack)
 */

import path from "path";
import fs from "fs";
import { convertDocxToPdf } from "../utils/certificateGeneratorDocx";
import {
  generateInvoiceDocx,
  getInvoiceTemplatePath,
  buildInvoiceAmounts,
  formatInr,
  InvoiceData,
} from "../utils/invoiceGeneratorDocx";
import { isBrand } from "../constants/brands";
import { invoiceIssuerFor } from "../lib/invoiceIssuer";

function getArg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : undefined;
}

const BUYER = {
  customerName: "Jane Doe",
  customerEmail: "jane.doe@example.com",
  customerPhone: "+91 90000 00000",
};

/** name → invoice, built from the gross paid + gross discount. */
function buildCases(gstin: string): Array<{ name: string; data: InvoiceData }> {
  const common = {
    invoiceDate: new Date(),
    gstin,
    paymentStatus: "Paid" as const,
    ...BUYER,
  };

  // 1. No discount, the ordinary case.
  const plain = buildInvoiceAmounts(4999);

  // 2. ₹5,000 course, 500 success points redeemed at ₹2/point = ₹1,000 off.
  const points = buildInvoiceAmounts(4000, 1000);

  // 3. Points cover the whole thing. `beginGatewayCheckout` settles these
  //    below the ₹1 threshold without ever calling a gateway, so there is a
  //    paid order at ₹0 with no payment method.
  const pointsOnly = buildInvoiceAmounts(0, 5000);

  // 4. Success-points purchase. The count lives in the description, since the
  //    invoice has no quantity column.
  const pack = buildInvoiceAmounts(2000);

  return [
    {
      name: "plain",
      data: {
        ...common,
        invoiceNumber: "0001",
        orderId: "ORD-TEST-PLAIN-0001",
        itemDescription: "Data Analytics with Python (Elite Plan)",
        baseAmount: plain.baseAmount,
        gstAmount: plain.gstAmount,
        totalAmount: plain.totalAmount,
        paymentMethod: "UPI",
      },
    },
    {
      name: "points",
      data: {
        ...common,
        invoiceNumber: "0002",
        orderId: "ORD-TEST-POINTS-0002",
        itemDescription: "Data Analytics with Python (Elite Plan)",
        baseAmount: points.baseAmount,
        gstAmount: points.gstAmount,
        totalAmount: points.totalAmount,
        discountAmount: points.discountAmount,
        discountLabel: "Discount (500 Success Points)",
        paymentMethod: "UPI",
      },
    },
    {
      name: "pointsonly",
      data: {
        ...common,
        invoiceNumber: "0003",
        orderId: "ORD-TEST-POINTSONLY-0003",
        itemDescription: "Data Analytics with Python (Elite Plan)",
        baseAmount: pointsOnly.baseAmount,
        gstAmount: pointsOnly.gstAmount,
        totalAmount: pointsOnly.totalAmount,
        discountAmount: pointsOnly.discountAmount,
        discountLabel: "Discount (2,500 Success Points)",
        paymentMethod: "Success Points",
      },
    },
    {
      name: "pack",
      data: {
        ...common,
        invoiceNumber: "0004",
        orderId: "ORD-TEST-PACK-0004",
        itemDescription:
          "20 x Internship Success Points (Data Analytics Internship)",
        baseAmount: pack.baseAmount,
        gstAmount: pack.gstAmount,
        totalAmount: pack.totalAmount,
        paymentMethod: "Card",
      },
    },
  ];
}

async function main() {
  const outDir = path.resolve(
    process.cwd(),
    getArg("out") ?? "./scripts-output/invoices",
  );
  const docxOnly = process.argv.includes("--docx-only");
  const only = getArg("case");
  const brand = getArg("brand");
  if (!isBrand(brand)) throw new Error("Pass --brand=airkrit or --brand=edulyt");
  const issuer = invoiceIssuerFor(brand);

  const templatePath = getInvoiceTemplatePath(issuer.template);
  console.log(`Template: ${templatePath}\n`);

  const cases = buildCases(issuer.gstin).filter((c) => !only || c.name === only);
  if (cases.length === 0) throw new Error(`No case matched --case=${only}`);

  for (const { name, data } of cases) {
    const docxPath = path.join(outDir, `invoice-${name}.docx`);
    const pdfPath = path.join(outDir, `invoice-${name}.pdf`);

    generateInvoiceDocx(templatePath, docxPath, data);

    const discount = data.discountAmount ?? 0;
    console.log(`[${name}]`);
    console.log(`  line       ₹${formatInr(data.baseAmount + discount)}`);
    if (discount > 0) console.log(`  discount  -₹${formatInr(discount)}`);
    console.log(`  taxable    ₹${formatInr(data.baseAmount)}`);
    console.log(`  GST @18%   ₹${formatInr(data.gstAmount)}`);
    console.log(`  total      ₹${formatInr(data.totalAmount)}`);

    if (!docxOnly) {
      await convertDocxToPdf(docxPath, pdfPath);
      console.log(`  pdf        ${pdfPath}`);
    } else {
      console.log(`  docx       ${docxPath}`);
    }
    console.log();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
