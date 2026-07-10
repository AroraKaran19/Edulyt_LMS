import * as fs from "fs";
import * as path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import ImageModule from "docxtemplater-image-module-free";
import QRCode from "qrcode";
import { convertDocxToPdf } from "../src/utils/certificateGeneratorDocx";

const TEMPLATE_PATH = path.resolve(
  __dirname,
  "../../frontend/public/course-certificates/Airkrit Certificates/Airkrit India Offer Letter - Intern - AI-02453 - Template.docx",
);

const OUTPUT_DOCX = path.resolve(__dirname, "sample-offer-letter.docx");
const OUTPUT_PDF = path.resolve(__dirname, "sample-offer-letter.pdf");

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

  xml = xml.replace("<w:t>AI-XXXX</w:t>", `<w:t>${e(data.internId)}</w:t>`);

  xml = xml.replace(
    /<w:t>DD<\/w:t>([\s\S]{1,300}?)<w:t>-<\/w:t>([\s\S]{1,300}?)<w:t>MM<\/w:t>([\s\S]{1,300}?)<w:t>-<\/w:t>([\s\S]{1,300}?)<w:t>YYYY<\/w:t>/,
    `<w:t>${e(data.letterDate)}</w:t>`,
  );

  let idx = 0;
  const values = [e(data.name), e(data.joiningDate), e(data.domain), e(data.duration)];
  xml = xml.replace(
    /<w:t>\[<\/w:t>[\s\S]*?<w:t>\]<\/w:t>/g,
    () => `<w:t>${values[idx++] ?? ""}</w:t>`,
  );

  return xml;
}

async function main(): Promise<void> {
  const now = new Date();
  const sample = {
    letterDate: formatOfferLetterDate(now),
    name: "Aarav Sharma",
    internId: "AI-09999",
    joiningDate: formatOfferLetterDate(now),
    domain: "Data Analytics Intern",
    duration: "3",
  };

  const templateBuffer = fs.readFileSync(TEMPLATE_PATH);
  const zip = new PizZip(templateBuffer);
  const docXml = zip.file("word/document.xml")!.asText();
  zip.file("word/document.xml", fillOfferLetterXml(docXml, sample));
  let out = zip.generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer;

  // QR pass — same flow as production
  const verificationUrl = `http://localhost:3000/verify/intern/${sample.internId}`;
  try {
    const qrPng = await QRCode.toBuffer(verificationUrl, {
      type: "png",
      width: 300,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    const innerZip = new PizZip(out);
    const imageModule = new ImageModule({
      centered: false,
      getImage: (tagValue: string) =>
        tagValue === "qrImage" ? qrPng : Buffer.from(""),
      getSize: () => [96, 96],
    });
    const doc = new Docxtemplater(innerZip, {
      delimiters: { start: "[", end: "]" },
      paragraphLoop: true,
      linebreaks: true,
      modules: [imageModule],
      nullGetter: () => "",
    });
    doc.render({ qrImage: "qrImage" });
    out = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    }) as Buffer;
    console.log(`QR encoded -> ${verificationUrl}`);
  } catch (err) {
    console.warn("QR render skipped (template missing [%qrImage]?):", err);
  }

  fs.writeFileSync(OUTPUT_DOCX, out);
  console.log(`Wrote DOCX -> ${OUTPUT_DOCX}`);

  await convertDocxToPdf(OUTPUT_DOCX, OUTPUT_PDF);
  console.log(`Wrote PDF  -> ${OUTPUT_PDF}`);
  console.log(`Data:`, sample);
}

void main();
