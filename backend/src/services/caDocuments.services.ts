import fs from "fs";
import os from "os";
import path from "path";
import { CertificateModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import { generateOfferLetterBuffer } from "./cron.services";
import {
  convertDocxToPdf,
  generateCertificateFromDocx,
  type CertificateData,
} from "../utils/certificateGeneratorDocx";
import { uploadFileToS3 } from "./upload.services";
import { verificationBaseUrl } from "../lib/verifyUrl";
import { CA_PROGRAMME_NAME, formatLetterDate, formatPeriodDate, toNameCase } from "../lib/caDocuments";
import type { CaApplication, CaDocumentRef } from "../types/caApplication";

// Rendering only ever happens once the offer-letter job (joiningDate/endDate)
// and the tenure (endDate) have been set, so both are narrowed to Date here.
export type CaRenderable = Pick<
  CaApplication,
  "_id" | "name" | "internId" | "kind" | "durationMonths" | "decidedAt" | "userId"
> & { joiningDate: Date; endDate: Date };

// backend/src/services (or dist/services) up three segments is the repo root.
const TEMPLATE_DIR = path.resolve(
  __dirname,
  "../../../frontend/public/course-certificates/Airkrit Certificates",
);
const TEMPLATES = {
  internship: path.join(TEMPLATE_DIR, "Airkrit India Certificate Internship - AI-01171 - Template.docx"),
  training: path.join(TEMPLATE_DIR, "Airkrit India Training Certificate - AI-01171 - Template.docx"),
  lor: path.join(TEMPLATE_DIR, "Airkrit India LOR - AI-01171 - Template.docx"),
};

const withTempDir = async <T>(fn: (dir: string) => Promise<T>): Promise<T> => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ca-doc-"));
  try {
    return await fn(dir);
  } finally {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // Temp cleanup is best effort; the OS reclaims tmpdir.
    }
  }
};

const requireInternId = (app: CaRenderable): string => {
  if (!app.internId) throw new AppError("This application has no intern ID yet", 409);
  return app.internId;
};

const safeName = (value: string): string =>
  value.replace(/[^a-zA-Z0-9\s-]/g, "").trim().replace(/\s+/g, "_").slice(0, 60);

export const renderCaOfferLetter = async (
  app: CaRenderable,
  designation: string,
): Promise<CaDocumentRef> => {
  const internId = requireInternId(app);
  const verificationUrl = `${verificationBaseUrl("airkrit")}/verify/intern/${encodeURIComponent(internId)}`;

  const docx = await generateOfferLetterBuffer(
    {
      letterDate: formatLetterDate(app.decidedAt ?? new Date()),
      name: toNameCase(app.name),
      internId,
      joiningDate: formatLetterDate(app.joiningDate),
      domain: designation,
      duration: String(app.durationMonths),
    },
    { verificationUrl },
  );

  const pdf = await withTempDir(async (dir) => {
    const docxPath = path.join(dir, "offer.docx");
    const pdfPath = path.join(dir, "offer.pdf");
    fs.writeFileSync(docxPath, docx);
    await convertDocxToPdf(docxPath, pdfPath);
    return fs.readFileSync(pdfPath);
  });

  const url = await uploadFileToS3(
    pdf,
    `offer-letter-${internId}-${safeName(app.name)}.pdf`,
    "offer-letters",
    "application/pdf",
  );
  return { url, generatedAt: new Date(), verificationUrl };
};

const renderCertificatePdf = (template: string, data: CertificateData): Promise<Buffer> =>
  withTempDir(async (dir) => {
    const docxPath = path.join(dir, "out.docx");
    const pdfPath = path.join(dir, "out.pdf");
    await generateCertificateFromDocx(template, docxPath, data);
    await convertDocxToPdf(docxPath, pdfPath);
    return fs.readFileSync(pdfPath);
  });

/**
 * The LOR, internship certificate and training certificate, recorded as
 * `Certificate` rows so the existing verify page and the student's certificate
 * list show them without any CA-specific code.
 */
export const renderCaCompletionDocuments = async (
  app: CaRenderable,
  designation: string,
): Promise<{
  lor: CaDocumentRef;
  internshipCertificate: CaDocumentRef;
  trainingCertificate: CaDocumentRef;
}> => {
  const internId = requireInternId(app);
  if (!app.userId) throw new AppError("Completion documents need an attached account", 409);

  const stamp = Date.now().toString(36).toUpperCase();
  const base = verificationBaseUrl("airkrit");
  const specs = [
    {
      key: "internshipCertificate" as const,
      type: "internship" as const,
      template: TEMPLATES.internship,
      code: `VER-${internId}-IN-${stamp}`,
      courseName: designation,
      extra: {
        internRole: designation,
        internDurationMonths: String(app.durationMonths),
        internPeriod: `(${formatPeriodDate(app.joiningDate)} to ${formatPeriodDate(app.endDate)})`,
      },
    },
    {
      key: "trainingCertificate" as const,
      type: "course" as const,
      template: TEMPLATES.training,
      code: `VER-${internId}-TR-${stamp}`,
      courseName: CA_PROGRAMME_NAME,
      extra: { keyTopics: "campus marketing, student outreach and communication" },
    },
    {
      key: "lor" as const,
      type: "lor" as const,
      template: TEMPLATES.lor,
      code: `VER-${internId}-LOR-${stamp}`,
      courseName: designation,
      extra: {},
    },
  ];

  const issuedAt = new Date();
  const rendered: { spec: (typeof specs)[number]; url: string; verificationUrl: string }[] = [];
  for (const spec of specs) {
    const verificationUrl = `${base}/verify-certificate/${spec.code}`;
    const pdf = await renderCertificatePdf(spec.template, {
      studentName: toNameCase(app.name),
      courseName: spec.courseName,
      completionDate: app.endDate.toISOString(),
      certificateId: internId,
      verificationUrl,
      ...spec.extra,
    });
    const url = await uploadFileToS3(
      pdf,
      `ca-${spec.type}-${internId}-${safeName(app.name)}.pdf`,
      "certificates",
      "application/pdf",
    );
    rendered.push({ spec, url, verificationUrl });
  }

  // Upsert per type so a retried job replaces its own rows instead of adding a second "latest" set.
  await CertificateModel.bulkWrite(
    rendered.map(({ spec, url, verificationUrl }) => ({
      updateOne: {
        filter: { enrollmentId: app._id, enrollmentModel: "CaApplication", certificateType: spec.type },
        update: {
          $set: {
            certificateType: spec.type,
            enrollmentModel: "CaApplication",
            enrollmentId: app._id,
            userId: app.userId,
            courseId: null,
            certificateId: internId,
            studentName: toNameCase(app.name),
            courseName: spec.courseName,
            completionDate: app.endDate,
            issuedAt,
            fileUrl: url,
            verificationCode: spec.code,
            verificationUrl,
            isLatest: true,
            version: 1,
            isActive: true,
            brand: "airkrit",
          },
        },
        upsert: true,
      },
    })),
  );

  const refs = Object.fromEntries(
    rendered.map(({ spec, url, verificationUrl }) => [
      spec.key,
      { url, generatedAt: issuedAt, verificationUrl },
    ]),
  ) as Record<(typeof specs)[number]["key"], CaDocumentRef>;
  return {
    lor: refs.lor,
    internshipCertificate: refs.internshipCertificate,
    trainingCertificate: refs.trainingCertificate,
  };
};
