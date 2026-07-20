/**
 * Re-render every issued internship certificate PDF in place.
 *
 * WHY THIS EXISTS
 * ---------------
 * The certificate templates are authored in Calibri and every text box is sized
 * exactly to its Calibri text. When the PDF host lost its Calibri-metric font,
 * LibreOffice silently substituted DejaVu Sans (~40% wider); the text reflowed,
 * overflowed, and each fixed-size box CLIPPED the overflow away. The visible
 * result was `Intern ID : AI-` with no number — while the database, the API and
 * the PDF's own text layer all still contained the correct ID, so nothing
 * looked broken from the backend's point of view. 28 certificates shipped that
 * way in July 2026.
 *
 * This script re-renders those PDFs and overwrites them AT THEIR EXISTING S3
 * KEY, keeping each certificate's certificateId and verificationCode. Any QR
 * code or link already handed to a learner or an employer keeps resolving, and
 * no new CertificateModel rows are created.
 *
 * PREREQUISITE: run this on a host with the fonts installed, or it will simply
 * mint the same broken PDFs again. The script refuses to upload any PDF that
 * embeds DejaVu, so it fails loudly rather than silently re-shipping the bug:
 *
 *   sudo apt-get install -y fonts-crosextra-carlito fonts-liberation && sudo fc-cache -f
 *   fc-match Calibri     # must say Carlito, not DejaVu Sans
 *
 * Usage:
 *   npx ts-node src/scripts/regenerate-internship-certificates.ts            # dry run
 *   npx ts-node src/scripts/regenerate-internship-certificates.ts --apply    # write
 *   ... --only=AI-00050,AI-00019    # restrict to specific intern IDs
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { CertificateModel } from "../models/certificate.schema";
import { getS3Client, getBucketName, getPublicUrlBase } from "../config/s3";
import {
  loadInternshipCertificateContext,
  renderInternshipCertificatePdf,
  internshipCertificateFileName,
} from "../services/certificate.services";

dotenv.config();

const APPLY = process.argv.includes("--apply");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) ?? "")
  .replace("--only=", "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * A correctly-rendered certificate embeds Carlito (or Calibri). DejaVu means
 * the host is missing the font and the box contents have been clipped — the
 * exact defect we are repairing, so never upload one.
 */
function assertFontsHealthy(pdf: Buffer, who: string): void {
  if (pdf.includes(Buffer.from("DejaVu"))) {
    throw new Error(
      `Refusing to upload ${who}: the rendered PDF embeds DejaVu, which means ` +
        `this host has no Calibri-metric font and the certificate text is ` +
        `clipped. Install fonts-crosextra-carlito, verify with 'fc-match ` +
        `Calibri', and re-run. See backend/DEPLOYMENT.md.`,
    );
  }
}

/** "https://bucket.s3.amazonaws.com/certificates/x.pdf" -> "certificates/x.pdf" */
function s3KeyFromUrl(fileUrl: string): string {
  const base = getPublicUrlBase();
  if (fileUrl.startsWith(base)) return fileUrl.slice(base.length).replace(/^\//, "");
  return new URL(fileUrl).pathname.replace(/^\//, ""); // custom domain / legacy host
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log(APPLY ? "MODE: APPLY (writing to S3)" : "MODE: DRY RUN (no writes)");

  const certs = await CertificateModel.find({ certificateType: "internship" })
    .select("certificateId enrollmentId studentName fileUrl verificationUrl verificationCode")
    .sort({ createdAt: 1 })
    .lean();
  console.log(`found ${certs.length} internship certificates\n`);

  let fixed = 0, skipped = 0, failed = 0;

  for (const cert of certs) {
    const label = `${cert.studentName} (${cert.certificateId})`;
    try {
      if (!cert.fileUrl) {
        console.log(`SKIP  ${label}: no fileUrl on the certificate record`);
        skipped++;
        continue;
      }

      const ctx = await loadInternshipCertificateContext(String(cert.enrollmentId));
      if (ONLY.length && !ONLY.includes(ctx.internId)) {
        skipped++;
        continue;
      }

      const verificationUrl =
        cert.verificationUrl ||
        `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-certificate/${cert.verificationCode}`;

      const pdf = await renderInternshipCertificatePdf(ctx, cert.certificateId, verificationUrl);
      assertFontsHealthy(pdf, label);

      const key = s3KeyFromUrl(cert.fileUrl);
      if (!APPLY) {
        console.log(`DRY   ${label}: internId=${ctx.internId} -> would overwrite ${key} (${pdf.length} bytes)`);
        fixed++;
        continue;
      }

      const s3 = await getS3Client();
      await s3.send(
        new PutObjectCommand({
          Bucket: getBucketName(),
          Key: key,                       // same key => existing links/QRs keep working
          Body: pdf,
          ContentType: "application/pdf",
          Metadata: {
            originalName: internshipCertificateFileName(ctx.internshipTitle, ctx.studentName),
            folderName: "certificates",
          },
        }),
      );
      console.log(`FIXED ${label}: internId=${ctx.internId} -> ${key}`);
      fixed++;
    } catch (err: any) {
      // A font-unhealthy host is not a per-certificate problem — stop rather
      // than grind through the whole batch re-shipping the same defect.
      if (String(err?.message).includes("embeds DejaVu")) {
        console.error(`\n${err.message}\n`);
        await mongoose.disconnect();
        process.exit(1);
      }
      console.error(`FAIL  ${label}: ${err?.message ?? err}`);
      failed++;
    }
  }

  console.log(`\n${APPLY ? "regenerated" : "would regenerate"}: ${fixed}   skipped: ${skipped}   failed: ${failed}`);
  if (!APPLY) console.log("re-run with --apply to write.");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
