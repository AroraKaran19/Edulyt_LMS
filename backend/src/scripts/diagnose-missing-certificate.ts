/**
 * Diagnose why a user did NOT receive their course certificate.
 *
 * Walks the exact certificate-issuance decision chain used in production
 * (see enrollment.services.ts -> certificateJob.services.ts -> certificate.worker.ts
 * -> certificate.services.ts) and reports, per enrollment, the FIRST gate that
 * blocks certificate issuance — plus the certificate-job state.
 *
 * READ ONLY: this script never writes to the database.
 *
 * Run from backend root:
 *   npx ts-node src/scripts/diagnose-missing-certificate.ts <email> [courseSlugOrTitleSubstring]
 *
 * Examples:
 *   npx ts-node src/scripts/diagnose-missing-certificate.ts a2023ec9505@imsec.ac.in
 *   npx ts-node src/scripts/diagnose-missing-certificate.ts a2023ec9505@imsec.ac.in "python"
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import {
  UserModel,
  EnrollmentModel,
  CertificateModel,
  CourseModel,
} from "../models";
import { CertificateJobModel } from "../models/certificateJob.schema";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const DEFAULT_EMAIL = "a2023ec9505@imsec.ac.in";

const line = (c = "-") => c.repeat(72);
const yes = "✅";
const no = "❌";
const warn = "⚠️ ";

function fmtDate(d: unknown): string {
  if (!d) return "—";
  const date = new Date(d as string);
  return isNaN(date.getTime()) ? String(d) : date.toISOString();
}

async function diagnose() {
  const email = (process.argv[2] || DEFAULT_EMAIL).trim();
  const courseFilter = (process.argv[3] || "").trim().toLowerCase();

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not defined in environment variables");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected.\n");

  console.log(line("="));
  console.log(`CERTIFICATE DIAGNOSTIC for: ${email}`);
  if (courseFilter) console.log(`Course filter: "${courseFilter}"`);
  console.log(line("="));

  // ---- 1. Resolve the user (case-insensitive email match) -----------------
  const user = await UserModel.findOne({
    email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  }).lean();

  if (!user) {
    console.log(`${no} No user found with email "${email}".`);
    console.log("   -> Check the email is correct / the account exists.");
    return;
  }

  const u = user as any;
  const studentName = `${u.firstName || ""} ${u.lastName || ""}`.trim();
  console.log(`\n${yes} User found`);
  console.log(`   _id:        ${u._id}`);
  console.log(`   name:       "${studentName}"  (firstName="${u.firstName || ""}", lastName="${u.lastName || ""}")`);
  console.log(`   email:      ${u.email}`);
  console.log(`   role:       ${u.role ?? "—"}`);

  if (!studentName) {
    console.log(`   ${warn}Student name is EMPTY — certificate generation aborts on empty name (enrollment.services.ts).`);
  }

  // ---- 2. Find the user's enrollments -------------------------------------
  let enrollments = await EnrollmentModel.find({ userId: u._id })
    .populate("courseId", "title slug isCertified")
    .lean();

  if (courseFilter) {
    enrollments = enrollments.filter((e) => {
      const c = (e as any).courseId as any;
      const title = (c?.title || "").toLowerCase();
      const slug = (c?.slug || "").toLowerCase();
      return title.includes(courseFilter) || slug.includes(courseFilter);
    });
  }

  console.log(`\nEnrollments found${courseFilter ? " (after filter)" : ""}: ${enrollments.length}`);

  if (enrollments.length === 0) {
    console.log(`${no} This user has NO matching course enrollments.`);
    console.log("   -> Without an enrollment there is no certificate. Verify they actually enrolled / paid.");
    return;
  }

  // ---- 3. Walk the certificate decision chain for each enrollment ---------
  for (const enrollment of enrollments) {
    const e = enrollment as any;
    const course = e.courseId as any;
    const courseTitle = course?.title || "(unknown course)";

    console.log("\n" + line());
    console.log(`Enrollment ${e._id}`);
    console.log(`Course:     ${courseTitle}  (id=${course?._id ?? "—"}, slug=${course?.slug ?? "—"})`);
    console.log(line());

    const completion = e.progress?.overallCompletion ?? 0;
    const isCompleted = e.status === "completed" || completion >= 100;
    const hasFullAccess = !e.accessControl || e.accessControl.accessType === "full";

    console.log(`  status:                ${e.status}`);
    console.log(`  progress.completion:   ${completion}%`);
    console.log(`  completedAt:           ${fmtDate(e.completedAt)}`);
    console.log(`  isTrial:               ${e.isTrial ? "true" : "false"}`);
    console.log(`  accessControl:         ${e.accessControl ? e.accessControl.accessType : "none (full)"}`);
    console.log(`  certificateIssued:     ${e.certificateIssued ? "true" : "false"} (${fmtDate(e.certificateIssuedAt)})`);
    console.log(`  course.isCertified:    ${course ? (course.isCertified ? "true" : "false") : "course missing"}`);

    // Existing certificate?
    const cert = await CertificateModel.findOne({ enrollmentId: e._id })
      .sort({ version: -1 })
      .lean();
    const allCerts = await CertificateModel.countDocuments({ enrollmentId: e._id });

    // Certificate job?
    const job = await CertificateJobModel.findOne({ enrollmentId: e._id.toString() })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`  certificate doc:       ${cert ? `${yes} ${(cert as any).certificateId} (isLatest=${(cert as any).isLatest}, isActive=${(cert as any).isActive}, versions=${allCerts})` : `${no} none`}`);
    if (job) {
      const j = job as any;
      console.log(`  certificate JOB:       status=${j.status}, retries=${j.retryCount}, progress=${j.progress}%`);
      console.log(`                         jobId=${j.jobId}`);
      console.log(`                         created=${fmtDate(j.createdAt)}, started=${fmtDate(j.startedAt)}, completed=${fmtDate(j.completedAt)}`);
      if (j.error) console.log(`                         ${warn}error: ${j.error}`);
    } else {
      console.log(`  certificate JOB:       ${no} none ever created`);
    }

    // ---- Verdict: first blocking gate, in production order ----------------
    console.log(`\n  VERDICT:`);
    if (cert && (cert as any).isLatest && (cert as any).isActive) {
      console.log(`  ${yes} A valid certificate EXISTS (${(cert as any).certificateId}).`);
      console.log(`     If the user can't see it, investigate the frontend / fileUrl: ${(cert as any).fileUrl || "(no fileUrl!)"}`);
      continue;
    }
    if (cert && (!(cert as any).isLatest || !(cert as any).isActive)) {
      console.log(`  ${warn}Certificate exists but isLatest=${(cert as any).isLatest}, isActive=${(cert as any).isActive} — it was replaced/revoked, so it won't display.`);
      continue;
    }

    // No certificate doc — find why.
    if (!isCompleted) {
      console.log(`  ${no} BLOCKED: course not complete (status=${e.status}, completion=${completion}%).`);
      console.log(`     A certificate is only triggered at 100% completion.`);
      continue;
    }
    if (!e.completedAt) {
      console.log(`  ${no} BLOCKED: completedAt is not set, so the completion branch never ran. Data inconsistency — completion=${completion}% but completedAt empty.`);
      continue;
    }
    if (!hasFullAccess) {
      console.log(`  ${no} BLOCKED: partial access (accessControl.accessType="partial"). Partial-access users never get certificates by design.`);
      continue;
    }
    if (e.isTrial) {
      console.log(`  ${no} BLOCKED: this is a TRIAL enrollment. Certificates are not issued for trials.`);
      continue;
    }
    if (!course) {
      console.log(`  ${no} BLOCKED: the course referenced by this enrollment no longer exists.`);
      continue;
    }
    if (!course.isCertified) {
      console.log(`  ${no} BLOCKED: course.isCertified=false. This course does not issue certificates.`);
      continue;
    }
    if (!studentName) {
      console.log(`  ${no} BLOCKED: user has no first/last name; generation aborts on empty student name.`);
      continue;
    }

    // All gates pass -> a job should exist. Diagnose the job/worker.
    if (!job) {
      console.log(`  ${warn}All eligibility gates PASS but NO job was ever created.`);
      console.log(`     The completion likely happened before the auto-cert logic existed, or createCertificateJobService threw.`);
      console.log(`     FIX: re-trigger completion (recalculate progress) or enqueue a job manually.`);
      continue;
    }
    const j = job as any;
    if (j.status === "failed") {
      console.log(`  ${no} JOB FAILED after ${j.retryCount} retries.`);
      console.log(`     Root cause is the job error above${j.error ? `: "${j.error}"` : ""}.`);
      console.log(`     Common causes: certificate .docx template missing, DOCX->PDF (LibreOffice) conversion failure, or S3 upload failure.`);
      console.log(`     FIX: resolve the underlying error, then retry the job (admin "retry" / set status back to "pending").`);
      continue;
    }
    if (j.status === "pending" || j.status === "processing") {
      console.log(`  ${warn}JOB is still ${j.status.toUpperCase()} — eligibility is fine, generation just hasn't finished.`);
      console.log(`     The worker polls every CERTIFICATE_WORKER_POLL_MS (default 5 min). If it's been stuck for a long time,`);
      console.log(`     the certificate worker process is probably NOT running. Check the worker (certificate-worker / ecosystem.config.cjs).`);
      continue;
    }
    if (j.status === "completed") {
      console.log(`  ${warn}JOB reports COMPLETED (cert ${j.certificateId}) but no Certificate document was found.`);
      console.log(`     Inconsistent state — the cert may have been deleted/revoked after the job completed. Inspect manually.`);
      continue;
    }
    console.log(`  ${warn}Unhandled job status: ${j.status}.`);
  }

  console.log("\n" + line("="));
  console.log("Diagnostic complete.");
}

diagnose()
  .catch((err) => {
    console.error("\n❌ Diagnostic error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
    process.exit(process.exitCode ?? 0);
  });
