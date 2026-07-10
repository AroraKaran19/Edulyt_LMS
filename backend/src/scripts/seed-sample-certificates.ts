/**
 * Seed SAMPLE certificate/offer-letter documents that you can share as
 * "sample versions" with users.
 *
 * Produces three shareable PDFs using the SAME generators production uses, so
 * they look identical to real output (fonts, layout, QR code):
 *
 *   1. Training Certificate (course)   -> CertificateModel record + working QR/verify
 *   2. Internship Certificate          -> CertificateModel record + working QR/verify
 *   3. Offer Letter (intern)           -> PDF only (no DB record; its verify path
 *                                          needs a real internship enrollment)
 *
 * The two certificate rows use fake-but-valid ObjectIds for enrollment/user and
 * distinctive certificateIds (AI-990xx) so they never collide with real data and
 * are trivial to remove (see remove-sample-certificates.ts).
 *
 * Each PDF is uploaded to S3 (shareable URL) AND saved locally under
 * backend/sample-certificates-output/.
 *
 * WRITES to the database that backend/.env -> MONGODB_URI points to.
 *
 * Run from backend root:
 *   npx ts-node src/scripts/seed-sample-certificates.ts
 *   # or: npm run scripts:seed-sample-certs
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import os from "os";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import ImageModule from "docxtemplater-image-module-free";
import QRCode from "qrcode";

import {
  generateCertificateFromDocx,
  convertDocxToPdf,
} from "../utils/certificateGeneratorDocx";
import { uploadFileToS3 } from "../services/upload.services";
import { CertificateModel } from "../models/certificate.schema";
import { UserModel } from "../models/user.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { getInternshipVerification } from "../services/internshipEnrollment.services";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const TEMPLATE_DIR = path.resolve(
  __dirname,
  "../../../frontend/public/course-certificates/Airkrit Certificates",
);

const TRAINING_TEMPLATE = path.join(
  TEMPLATE_DIR,
  "Airkrit India Training Certificate - AI-01171 - Template.docx",
);
const INTERNSHIP_TEMPLATE = path.join(
  TEMPLATE_DIR,
  "Airkrit India Certificate Internship - AI-01171 - Template.docx",
);
const OFFER_LETTER_TEMPLATE = path.join(
  TEMPLATE_DIR,
  "Airkrit India Offer Letter - Intern - AI-02453 - Template.docx",
);

// Distinctive IDs so samples never clash with real certs and are easy to purge.
const SAMPLE_TRAINING_ID = "AI-99001";
const SAMPLE_INTERNSHIP_ID = "AI-99002";
export const SAMPLE_OFFER_INTERN_ID = "AI-99003";

// Backing user for the offer-letter verify lookup (so it shows a learner name).
export const SAMPLE_USER_EMAIL = "sample.student@airkrit-sample.local";

// Exported so the cleanup script stays in sync.
export const SAMPLE_CERTIFICATE_IDS = [
  SAMPLE_TRAINING_ID,
  SAMPLE_INTERNSHIP_ID,
];

const OUTPUT_DIR = path.resolve(__dirname, "../../sample-certificates-output");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeForFilename(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 100);
}

/** Render a template DOCX -> PDF buffer, saving nothing permanent on disk. */
async function docxTemplateToPdfBuffer(
  templatePath: string,
  certData: Parameters<typeof generateCertificateFromDocx>[2],
): Promise<Buffer> {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sample-cert-"));
  const docxPath = path.join(tempDir, "out.docx");
  const pdfPath = path.join(tempDir, "out.pdf");
  try {
    await generateCertificateFromDocx(templatePath, docxPath, certData);
    await convertDocxToPdf(docxPath, pdfPath);
    return fs.readFileSync(pdfPath);
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
}

function saveLocal(fileName: string, buffer: Buffer): string {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const localPath = path.join(OUTPUT_DIR, fileName);
  fs.writeFileSync(localPath, buffer);
  return localPath;
}

// --- Offer-letter–specific rendering (mirrors cron.services.ts pipeline) -----

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
  return `${String(d.getUTCDate()).padStart(2, "0")}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
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

async function generateOfferLetterPdfBuffer(data: {
  letterDate: string;
  name: string;
  internId: string;
  joiningDate: string;
  domain: string;
  duration: string;
  verificationUrl: string;
}): Promise<Buffer> {
  if (!fs.existsSync(OFFER_LETTER_TEMPLATE)) {
    throw new Error(`Template not found: ${OFFER_LETTER_TEMPLATE}`);
  }
  const zip = new PizZip(fs.readFileSync(OFFER_LETTER_TEMPLATE));
  const docXml = zip.file("word/document.xml")!.asText();
  zip.file("word/document.xml", fillOfferLetterXml(docXml, data));
  let out = zip.generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer;

  // QR pass (same as production offer-letter worker).
  try {
    const qrPng = await QRCode.toBuffer(data.verificationUrl, {
      type: "png",
      width: 300,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    const imageModule = new ImageModule({
      centered: false,
      getImage: (tagValue: string) =>
        tagValue === "qrImage" ? qrPng : Buffer.from(""),
      getSize: () => [96, 96],
    });
    const doc = new Docxtemplater(new PizZip(out), {
      delimiters: { start: "[", end: "]" },
      paragraphLoop: true,
      linebreaks: true,
      modules: [imageModule],
      nullGetter: () => "",
    });
    doc.render({ qrImage: "qrImage" });
    out = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer;
  } catch (err) {
    console.warn("[offer-letter] QR render skipped:", err);
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sample-offer-"));
  const docxPath = path.join(tempDir, "offer.docx");
  const pdfPath = path.join(tempDir, "offer.pdf");
  try {
    fs.writeFileSync(docxPath, out);
    await convertDocxToPdf(docxPath, pdfPath);
    return fs.readFileSync(pdfPath);
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface ResultRow {
  doc: string;
  certificateId: string;
  verifyUrl: string;
  s3Url: string;
  localPath: string;
}

async function main(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not defined in .env");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected.\n");

  const results: ResultRow[] = [];
  const completionDate = new Date();

  try {
    // Remove any prior sample rows so re-runs stay idempotent.
    const del = await CertificateModel.deleteMany({
      certificateId: { $in: SAMPLE_CERTIFICATE_IDS },
    });
    if (del.deletedCount) {
      console.log(`Removed ${del.deletedCount} existing sample certificate row(s).`);
    }
    await InternshipEnrollmentModel.collection.deleteMany({ internId: SAMPLE_OFFER_INTERN_ID });
    await UserModel.collection.deleteMany({ email: SAMPLE_USER_EMAIL });
    console.log("");

    // ---- 1. Training Certificate (course) --------------------------------
    {
      const studentName = "Sample Student";
      const courseName = "Full Stack Web Development";
      const verificationCode = `VER-${SAMPLE_TRAINING_ID}-SAMPLE`;
      const verificationUrl = `${FRONTEND_URL}/verify-certificate/${verificationCode}`;

      console.log(`Generating Training Certificate (${SAMPLE_TRAINING_ID})...`);
      const pdf = await docxTemplateToPdfBuffer(TRAINING_TEMPLATE, {
        studentName,
        courseName,
        completionDate: completionDate.toISOString(),
        certificateId: SAMPLE_TRAINING_ID,
        keyTopics: "React, Node.js, Express, MongoDB & REST APIs",
        instructorName: "Rahul Verma",
        verificationUrl,
      });

      const fileName = `Airkrit_${sanitizeForFilename(courseName)}_${sanitizeForFilename(studentName)}.pdf`;
      const localPath = saveLocal(fileName, pdf);
      const s3Url = await uploadFileToS3(pdf, fileName, "certificates", "application/pdf");

      await CertificateModel.create({
        certificateType: "course",
        enrollmentModel: "Enrollment",
        enrollmentId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        courseId: null,
        certificateId: SAMPLE_TRAINING_ID,
        studentName,
        courseName,
        completionDate,
        issuedAt: new Date(),
        keyTopics: "React, Node.js, Express, MongoDB & REST APIs",
        instructorName: "Rahul Verma",
        fileUrl: s3Url,
        verificationCode,
        verificationUrl,
        isLatest: true,
        version: 1,
        isActive: true,
      });

      results.push({
        doc: "Training Certificate",
        certificateId: SAMPLE_TRAINING_ID,
        verifyUrl: verificationUrl,
        s3Url,
        localPath,
      });
    }

    // ---- 2. Internship Certificate ---------------------------------------
    {
      const studentName = "Sample Student";
      const internshipTitle = "Data Analytics Internship";
      const verificationCode = `VER-${SAMPLE_INTERNSHIP_ID}-SAMPLE`;
      const verificationUrl = `${FRONTEND_URL}/verify-certificate/${verificationCode}`;

      console.log(`Generating Internship Certificate (${SAMPLE_INTERNSHIP_ID})...`);
      const pdf = await docxTemplateToPdfBuffer(INTERNSHIP_TEMPLATE, {
        studentName,
        courseName: internshipTitle,
        completionDate: completionDate.toISOString(),
        certificateId: SAMPLE_INTERNSHIP_ID,
        verificationUrl,
      });

      const fileName = `Airkrit_Internship_${sanitizeForFilename(internshipTitle)}_${sanitizeForFilename(studentName)}.pdf`;
      const localPath = saveLocal(fileName, pdf);
      const s3Url = await uploadFileToS3(pdf, fileName, "certificates", "application/pdf");

      await CertificateModel.create({
        certificateType: "internship",
        enrollmentModel: "InternshipEnrollment",
        enrollmentId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        courseId: null,
        certificateId: SAMPLE_INTERNSHIP_ID,
        studentName,
        courseName: internshipTitle,
        completionDate,
        issuedAt: new Date(),
        fileUrl: s3Url,
        verificationCode,
        verificationUrl,
        isLatest: true,
        version: 1,
        isActive: true,
      });

      results.push({
        doc: "Internship Certificate",
        certificateId: SAMPLE_INTERNSHIP_ID,
        verifyUrl: verificationUrl,
        s3Url,
        localPath,
      });
    }

    // ---- 3. Offer Letter (PDF + backing records so the QR/verify works) --
    {
      const name = "Sample Student";
      const now = new Date();
      // Frontend page scanned from the letter's QR. It resolves via
      // GET /api/internship-enrollments/verify/:internId, which looks up an
      // InternshipEnrollment by internId — seeded below so the link works.
      const verificationUrl = `${FRONTEND_URL}/verify/intern/${encodeURIComponent(SAMPLE_OFFER_INTERN_ID)}`;

      console.log(`Generating Offer Letter (${SAMPLE_OFFER_INTERN_ID})...`);
      const pdf = await generateOfferLetterPdfBuffer({
        letterDate: formatOfferLetterDate(now),
        name,
        internId: SAMPLE_OFFER_INTERN_ID,
        joiningDate: formatOfferLetterDate(now),
        domain: "Data Analytics Intern",
        duration: "3",
        verificationUrl,
      });

      const fileName = `Sample_Offer_Letter_${sanitizeForFilename(name)}.pdf`;
      const localPath = saveLocal(fileName, pdf);
      const s3Url = await uploadFileToS3(pdf, fileName, "certificates", "application/pdf");

      // Seed a minimal sample user + internship enrollment so the verify
      // endpoint resolves this internId and shows the learner name. Raw
      // inserts bypass schema validation — we only need the handful of fields
      // getInternshipVerification() reads.
      const sampleUserId = new mongoose.Types.ObjectId();
      await UserModel.collection.insertOne({
        _id: sampleUserId,
        firstName: "Sample",
        lastName: "Student",
        name: "Sample Student",
        email: SAMPLE_USER_EMAIL,
        isSampleRecord: true,
        createdAt: now,
        updatedAt: now,
      });
      await InternshipEnrollmentModel.collection.insertOne({
        internship: new mongoose.Types.ObjectId(),
        internshipSnapshot: {
          title: "Data Analytics Internship",
          slug: "data-analytics-internship",
        },
        batchSnapshot: {
          batchId: "sample-batch",
          name: "Sample Batch",
          internshipStartDate: now,
        },
        user: sampleUserId,
        status: "enrolled",
        enrolledAt: now,
        offerLetterGeneratedAt: now,
        offerLetterUrl: s3Url,
        internId: SAMPLE_OFFER_INTERN_ID,
        isSampleRecord: true,
        createdAt: now,
        updatedAt: now,
      });

      results.push({
        doc: "Offer Letter",
        certificateId: SAMPLE_OFFER_INTERN_ID,
        verifyUrl: verificationUrl,
        s3Url,
        localPath,
      });
    }

    // Sanity-check the offer-letter verify lookup actually resolves.
    try {
      const v = await getInternshipVerification(SAMPLE_OFFER_INTERN_ID);
      console.log(
        `\nOffer-letter verify OK: ${v.internId} -> ${v.learnerName}, ` +
          `"${v.internshipTitle}", status=${v.status}`,
      );
    } catch (e) {
      console.error("\nOffer-letter verify FAILED:", e);
    }

    // ---- Summary ----------------------------------------------------------
    console.log(`\n${"=".repeat(70)}`);
    console.log("SAMPLE DOCUMENTS CREATED");
    console.log("=".repeat(70));
    for (const r of results) {
      console.log(`\n${r.doc}  (${r.certificateId})`);
      console.log(`  Share URL (S3): ${r.s3Url}`);
      console.log(`  Verify page   : ${r.verifyUrl}`);
      console.log(`  Local copy    : ${r.localPath}`);
    }
    console.log(`\nLocal folder: ${OUTPUT_DIR}`);
    console.log(
      `\nTo remove the DB sample rows later: npm run scripts:remove-sample-certs`,
    );
  } finally {
    await mongoose.connection.close();
  }
}

// Only run when executed directly (not when imported by the cleanup script).
if (require.main === module) {
  void main().catch((err) => {
    console.error("\nSeed failed:", err);
    process.exitCode = 1;
  });
}
