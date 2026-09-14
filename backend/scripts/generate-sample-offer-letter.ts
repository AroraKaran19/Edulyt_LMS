/**
 * Render a one-off sample offer letter (DOCX + PDF) next to this script.
 *
 * Delegates to the same renderer production uses (cron.services), so the output
 * is byte-for-byte the shape a real intern receives.
 *
 * Run from backend root:
 *   npx ts-node scripts/generate-sample-offer-letter.ts
 */

import * as fs from "fs";
import * as path from "path";
import { convertDocxToPdf } from "../src/utils/certificateGeneratorDocx";
import { generateOfferLetterBuffer } from "../src/services/cron.services";

const OUTPUT_DOCX = path.resolve(__dirname, "sample-offer-letter.docx");
const OUTPUT_PDF = path.resolve(__dirname, "sample-offer-letter.pdf");

function formatOfferLetterDate(d: Date): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${String(d.getUTCDate()).padStart(2,"0")}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
}

async function main(): Promise<void> {
  const now = new Date();
  const sample = {
    letterDate: formatOfferLetterDate(now),
    name: "Sample Student",
    internId: "AI-09999",
    joiningDate: formatOfferLetterDate(now),
    domain: "Data Analytics Intern",
    duration: "3",
  };

  const verificationUrl = `${
    process.env.AIRKRIT_FRONTEND_URL || "http://localhost:3000"
  }/verify/intern/${sample.internId}`;

  const out = await generateOfferLetterBuffer(sample, { verificationUrl });
  fs.writeFileSync(OUTPUT_DOCX, out);
  console.log(`Wrote DOCX -> ${OUTPUT_DOCX}`);

  await convertDocxToPdf(OUTPUT_DOCX, OUTPUT_PDF);
  console.log(`Wrote PDF  -> ${OUTPUT_PDF}`);
  console.log(`QR encoded -> ${verificationUrl}`);
  console.log("Data:", sample);
}

void main();
