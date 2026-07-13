import { AppError } from "../middlewares/error.middleware";
import { CertificateModel } from "../models/certificate.schema";
import { EnrollmentModel } from "../models/enrollment.schema";
import { UserModel } from "../models/user.schema";
import { CourseModel } from "../models/course.schema";
import { InternshipEnrollmentModel } from "../models/internshipEnrollment.schema";
import { InternshipModel } from "../models/internship.schema";
import { Certificate, CertificateGenerationData } from "../types/certificate";
import { generateCertificateFromDocx } from "../utils/certificateGeneratorDocx";
import { convertDocxToPdf } from "../utils/certificateGeneratorDocx";
import { uploadFileToS3 } from "./upload.services";
import { tryAwardCompletionSuccessPoints } from "./successPoints.services";
import { computeInternshipEligibility } from "./internshipEligibility.services";
import { computeProgramEndDate } from "../lib/internshipProgramWindow";
import path from "path";
import fs from "fs";
import os from "os";

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "01 - Jul - 2026" — matches the internship template's period format. */
function formatPeriodDate(d: Date): string {
  return `${String(d.getUTCDate()).padStart(2, "0")} - ${
    MONTHS_SHORT[d.getUTCMonth()]
  } - ${d.getUTCFullYear()}`;
}

/**
 * Generate a unique certificate ID based on user ID and enrollment ID
 * Format: AI-XXXXX (e.g., AI-12345)
 * Uses a deterministic hash of userId and enrollmentId to ensure uniqueness
 */
export function generateCertificateId(userId: string, enrollmentId: string): string {
  // Create a simple hash from both IDs
  // Convert ObjectIds to numbers and combine them
  const userIdNum = parseInt(userId.slice(-8), 16); // Last 8 hex chars of userId
  const enrollmentIdNum = parseInt(enrollmentId.slice(-8), 16); // Last 8 hex chars of enrollmentId
  
  // Combine and take modulo to get a 5-digit number
  const combined = (userIdNum + enrollmentIdNum) % 100000;
  
  return `AI-${combined.toString().padStart(5, "0")}`;
}

/**
 * Get the latest certificate for an enrollment
 */
export const getLatestCertificateService = async (
  enrollmentId: string
): Promise<Certificate | null> => {
  try {
    const certificate = await CertificateModel.findOne({
      enrollmentId,
      isLatest: true,
      isActive: true,
    })
      .populate("userId", "firstName lastName")
      .populate("courseId", "title")
      .lean();

    return certificate as Certificate | null;
  } catch (error) {
    console.error("Error getting latest certificate:", error);
    throw new AppError("Failed to get certificate", 500);
  }
};

/**
 * Create a new certificate
 */
export const createCertificateService = async (
  data: CertificateGenerationData
): Promise<Certificate> => {
  try {
    // Verify enrollment exists and is completed
    const enrollment = await EnrollmentModel.findById(data.enrollmentId);
    if (!enrollment) {
      throw new AppError("Enrollment not found", 404);
    }

    if (enrollment.status !== "completed") {
      throw new AppError(
        "Enrollment must be completed to issue certificate",
        400
      );
    }

    // Prevent certificate generation for trial enrollments
    if (enrollment.isTrial) {
      throw new AppError(
        "Certificates cannot be issued for trial enrollments",
        400
      );
    }

    // Get user and course details
    const user = await UserModel.findById(enrollment.userId);
    const course = await CourseModel.findById(enrollment.courseId);

    if (!user || !course) {
      throw new AppError("User or course not found", 404);
    }

    // Generate certificate ID if not provided
    // Use userId and enrollmentId to create a deterministic, unique ID
    let certificateId = data.certificateId;
    if (!certificateId) {
      certificateId = generateCertificateId(
        user._id.toString(),
        enrollment._id.toString()
      );
      
      // Check for uniqueness (should be rare, but handle edge cases)
      const exists = await CertificateModel.findOne({ certificateId });
      if (exists) {
        // If collision occurs (very rare), append a suffix
        // This should only happen if same user/enrollment combination generates same hash
        const timestamp = Date.now().toString().slice(-3); // Last 3 digits of timestamp
        certificateId = `AI-${certificateId.replace("AI-", "").slice(0, 2)}${timestamp}`;
      }
    }

    // Get course instructors for instructor name
    const instructorName =
      course.instructor &&
      Array.isArray(course.instructor) &&
      course.instructor.length > 0
        ? `${(course.instructor[0] as any).firstName || ""} ${
            (course.instructor[0] as any).lastName || ""
          }`.trim()
        : undefined;

    // Generate verification code and URL before creating certificate
    // This matches the format used in the pre-save hook: VER-${certificateId}-${timestamp}
    const verificationCode = `VER-${certificateId}-${Date.now()
      .toString(36)
      .toUpperCase()}`;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const verificationUrl = `${frontendUrl}/verify-certificate/${verificationCode}`;

    // Generate certificate DOCX file
    const templatePath = path.join(
      process.cwd(),
      "../frontend/public/course-certificates/Airkrit Certificates",
      "Airkrit India Training Certificate - AI-01171 - Template.docx"
    );

    if (!fs.existsSync(templatePath)) {
      throw new AppError("Certificate template not found", 404);
    }

    // Create temporary directory for certificate generation
    const tempDir = path.join(os.tmpdir(), `certificates-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const docxPath = path.join(tempDir, `certificate-${certificateId}.docx`);
    const pdfPath = path.join(tempDir, `certificate-${certificateId}.pdf`);

    try {
      // Generate DOCX certificate with QR code
      await generateCertificateFromDocx(templatePath, docxPath, {
        studentName: data.studentName,
        courseName: data.courseName,
        completionDate: data.completionDate.toISOString(),
        certificateId,
        keyTopics: data.keyTopics,
        instructorName: data.instructorName || instructorName,
        verificationUrl, // Pass verification URL for QR code generation
      });

      // Convert DOCX to PDF
      await convertDocxToPdf(docxPath, pdfPath);

      // Read PDF file
      const pdfBuffer = fs.readFileSync(pdfPath);

      // Generate filename: Airkrit_{course_name}_{studentName}.pdf
      // Sanitize course name and student name for filename (remove special characters, replace spaces with underscores)
      const sanitizeForFilename = (str: string): string => {
        return str
          .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove special characters
          .replace(/\s+/g, "_") // Replace spaces with underscores
          .replace(/_+/g, "_") // Replace multiple underscores with single
          .replace(/^_|_$/g, "") // Remove leading/trailing underscores
          .substring(0, 100); // Limit length
      };

      const sanitizedCourseName = sanitizeForFilename(data.courseName);
      const sanitizedStudentName = sanitizeForFilename(data.studentName);
      const pdfFileName = `Airkrit_${sanitizedCourseName}_${sanitizedStudentName}.pdf`;

      // Upload PDF to S3
      const s3Url = await uploadFileToS3(
        pdfBuffer,
        pdfFileName,
        "certificates",
        "application/pdf"
      );

      // Create certificate document with verification code and URL
      const certificate = new CertificateModel({
        certificateType: "course",
        enrollmentModel: "Enrollment",
        enrollmentId: data.enrollmentId,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        certificateId,
        studentName: data.studentName,
        courseName: data.courseName,
        completionDate: data.completionDate,
        issuedAt: new Date(),
        keyTopics: data.keyTopics,
        instructorName: data.instructorName || instructorName,
        fileUrl: s3Url,
        verificationCode, // Set verification code (pre-save hook will use this if not set)
        verificationUrl, // Set verification URL
        isLatest: true,
        version: 1, // Will be updated by pre-save hook
        isActive: true,
      });

      await certificate.save();

      // Update enrollment to mark certificate as issued
      await EnrollmentModel.findByIdAndUpdate(data.enrollmentId, {
        certificateIssued: true,
        certificateIssuedAt: new Date(),
      });

      // Grant the course's completion success points now that the
      // certificate exists. Idempotent (guarded by an enrollment flag) and
      // best-effort — a points failure must not fail certificate creation.
      try {
        await tryAwardCompletionSuccessPoints(data.enrollmentId.toString());
      } catch (e) {
        console.error("Completion success points award failed:", e);
      }

      // Clean up temporary files
      try {
        fs.unlinkSync(docxPath);
        fs.unlinkSync(pdfPath);
        fs.rmdirSync(tempDir);
      } catch (cleanupError) {
        console.error("Error cleaning up temporary files:", cleanupError);
        // Don't throw - cleanup errors shouldn't fail the operation
      }

      return certificate.toObject() as Certificate;
    } catch (error) {
      // Clean up temporary files on error
      try {
        if (fs.existsSync(docxPath)) fs.unlinkSync(docxPath);
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
        if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
      } catch (cleanupError) {
        console.error("Error cleaning up temporary files:", cleanupError);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error creating certificate:", error);
    throw new AppError("Failed to create certificate", 500);
  }
};

/**
 * Generate an internship certificate PDF, upload to S3, save a CertificateModel
 * record (so the QR code verify endpoint works), and return the result.
 */
export const createInternshipCertificateService = async (
  enrollmentId: string
): Promise<{ certificateId: string; fileUrl: string }> => {
  const enrollment = await InternshipEnrollmentModel.findById(enrollmentId).lean();
  if (!enrollment) throw new AppError("Internship enrollment not found", 404);

  // Percentage-threshold gate: the certificate is only issued when the
  // learner's earned `internshipSuccessPoints` clears the configured percent
  // of total achievable (tasks + meetings + cert exam in their window).
  // `certificateEligible` is the FULLY-RESOLVED verdict: the points threshold,
  // the certification-exam gate when one is configured, and any admin override.
  // Gating on the raw `meetsThreshold` (points only) meant this generator would
  // happily certify an exam-configured learner who failed or skipped the exam,
  // and a learner an admin had marked `certificateOverride: "fail"` whose job
  // was already queued — setting the override does not cancel in-flight jobs.
  // This is the last line of defence before a PDF is minted; it must enforce
  // the whole rule rather than trusting every caller to remember it.
  const eligibility = await computeInternshipEligibility(enrollmentId);
  if (!eligibility.certificateEligible) {
    const examNote =
      eligibility.examConfigured && !eligibility.examPassed
        ? ` Certification exam not passed (${eligibility.examScore}/${eligibility.examThreshold}).`
        : "";
    const overrideNote =
      eligibility.certificateOverride === "fail"
        ? " An admin has marked this learner as not certified."
        : "";
    throw new AppError(
      `Learner is not eligible for a certificate ` +
        `(${eligibility.earned} / ${eligibility.requiredPoints} points; ` +
        `${eligibility.thresholdPct}% of ${eligibility.totalAchievable}).` +
        examNote +
        overrideNote,
      400,
    );
  }

  const [user, internship] = await Promise.all([
    UserModel.findById((enrollment as any).user).select("firstName lastName").lean(),
    InternshipModel.findById((enrollment as any).internship)
      .select("title offerLetterDesignation thumbnail")
      .lean(),
  ]);
  if (!user || !internship) throw new AppError("User or internship not found", 404);

  const studentName = `${(user as any).firstName || ""} ${(user as any).lastName || ""}`.trim();
  const internshipTitle = (internship as any).title || "Internship";
  // Prefer the live internship thumbnail; fall back to the enrollment snapshot.
  const thumbnailUrl =
    (typeof (internship as any).thumbnail === "string" &&
      (internship as any).thumbnail) ||
    (enrollment as any).internshipSnapshot?.thumbnail ||
    null;

  // The internship-certificate template carries a role, a month count, and a
  // period range. Mirror the offer-letter's sourcing: admin-configured
  // designation, else "{title} Intern"; duration from the enrollment.
  const designation = String(
    (internship as any).offerLetterDesignation ?? "",
  ).trim();
  const internRole = designation || `${internshipTitle} Intern`;

  // The period PRINTED ON THE CERTIFICATE must be the same window the verdict
  // was computed against — cohort start + the learner's chosen duration. This
  // was previously re-derived here with a `?? 3` fallback and UTC month math,
  // a fourth independent copy of the window calculation, so the dates on the
  // document could disagree with the decision behind it.
  const durationMonths = (enrollment as any).programDurationMonths as number;
  const startDate = new Date(
    (enrollment as any).batchSnapshot?.internshipStartDate ??
      (enrollment as any).enrolledAt,
  );
  const endDate =
    (enrollment as any).endDate != null
      ? new Date((enrollment as any).endDate)
      : computeProgramEndDate(startDate, durationMonths);
  const internPeriod = `(${formatPeriodDate(startDate)} to ${formatPeriodDate(endDate)})`;

  const certificateId = generateCertificateId(
    (user as any)._id.toString(),
    enrollmentId.toString()
  );

  const verificationCode = `VER-${certificateId}-${Date.now().toString(36).toUpperCase()}`;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const verificationUrl = `${frontendUrl}/verify-certificate/${verificationCode}`;

  const templatePath = path.join(
    process.cwd(),
    "../frontend/public/course-certificates/Airkrit Certificates",
    "Airkrit India Certificate Internship - AI-01171 - Template.docx"
  );

  if (!fs.existsSync(templatePath)) {
    throw new AppError("Internship certificate template not found", 404);
  }

  const tempDir = path.join(os.tmpdir(), `intern-cert-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  const docxPath = path.join(tempDir, `cert-${certificateId}.docx`);
  const pdfPath = path.join(tempDir, `cert-${certificateId}.pdf`);

  const cleanup = () => {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  };

  try {
    await generateCertificateFromDocx(templatePath, docxPath, {
      studentName,
      courseName: internshipTitle,
      completionDate: ((enrollment as any).enrolledAt || new Date()).toISOString(),
      certificateId,
      verificationUrl,
      internRole,
      internDurationMonths: String(durationMonths),
      internPeriod,
    });

    await convertDocxToPdf(docxPath, pdfPath);
    const pdfBuffer = fs.readFileSync(pdfPath);

    const sanitize = (s: string) =>
      s.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "_").substring(0, 100);
    const pdfFileName = `Airkrit_Internship_${sanitize(internshipTitle)}_${sanitize(studentName)}.pdf`;

    const fileUrl = await uploadFileToS3(pdfBuffer, pdfFileName, "certificates", "application/pdf");
    cleanup();

    // Save CertificateModel record so the QR verify endpoint can find it.
    // enrollmentModel drives refPath so .populate("enrollmentId") resolves correctly.
    await CertificateModel.create({
      certificateType: "internship",
      enrollmentModel: "InternshipEnrollment",
      enrollmentId,
      userId: (user as any)._id,
      courseId: null,
      certificateId,
      studentName,
      courseName: internshipTitle,
      thumbnailUrl,
      completionDate: (enrollment as any).enrolledAt || new Date(),
      issuedAt: new Date(),
      fileUrl,
      verificationCode,
      verificationUrl,
      isLatest: true,
      version: 1,
      isActive: true,
    });

    return { certificateId, fileUrl };
  } catch (error) {
    cleanup();
    if (error instanceof AppError) throw error;
    console.error("Error creating internship certificate:", error);
    throw new AppError("Failed to create internship certificate", 500);
  }
};

/**
 * Regenerate certificate with updated student name
 * This is called when user changes their name
 */
export const regenerateCertificateService = async (
  enrollmentId: string,
  newStudentName: string,
  reason: string = "name_change"
): Promise<Certificate> => {
  try {
    // Get the latest certificate
    const oldCertificate = await CertificateModel.findOne({
      enrollmentId,
      isLatest: true,
    });

    if (!oldCertificate) {
      throw new AppError("Certificate not found", 404);
    }

    // Get enrollment to verify it's still completed
    const enrollment = await EnrollmentModel.findById(enrollmentId);
    if (!enrollment || enrollment.status !== "completed") {
      throw new AppError("Enrollment not found or not completed", 404);
    }

    // Get course details
    const course = await CourseModel.findById(enrollment.courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Get instructor name
    const instructorName =
      course.instructor &&
      Array.isArray(course.instructor) &&
      course.instructor.length > 0
        ? `${(course.instructor[0] as any).firstName || ""} ${
            (course.instructor[0] as any).lastName || ""
          }`.trim()
        : oldCertificate.instructorName || undefined;

    // Generate new certificate ID based on user and enrollment IDs
    if (!oldCertificate.userId || !oldCertificate.enrollmentId) {
      throw new AppError("Certificate missing user or enrollment ID", 500);
    }
    
    let newCertificateId = generateCertificateId(
      oldCertificate.userId.toString(),
      oldCertificate.enrollmentId.toString()
    );
    
    // Check for uniqueness (exclude the old certificate itself)
    const exists = await CertificateModel.findOne({
      certificateId: newCertificateId,
      _id: { $ne: oldCertificate._id }, // Exclude the old certificate
    });
    if (exists) {
      // If collision occurs (very rare), append a suffix with version number
      // This ensures regenerated certificates get a slightly different ID
      const versionSuffix = (oldCertificate.version || 1).toString().padStart(2, "0");
      newCertificateId = `AI-${newCertificateId.replace("AI-", "").slice(0, 3)}${versionSuffix}`;
    }

    // Mark old certificate as replaced
    oldCertificate.isLatest = false;
    oldCertificate.replacedAt = new Date();
    oldCertificate.regenerationReason = reason;
    await oldCertificate.save();

    // Generate new verification code and URL for the regenerated certificate
    const newVerificationCode = `VER-${newCertificateId}-${Date.now()
      .toString(36)
      .toUpperCase()}`;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const newVerificationUrl = `${frontendUrl}/verify-certificate/${newVerificationCode}`;

    // Generate certificate DOCX file
    const templatePath = path.join(
      process.cwd(),
      "../frontend/public/course-certificates/Airkrit Certificates",
      "Airkrit India Training Certificate - AI-01171 - Template.docx"
    );

    if (!fs.existsSync(templatePath)) {
      throw new AppError("Certificate template not found", 404);
    }

    // Create temporary directory for certificate generation
    const tempDir = path.join(os.tmpdir(), `certificates-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const docxPath = path.join(tempDir, `certificate-${newCertificateId}.docx`);
    const pdfPath = path.join(tempDir, `certificate-${newCertificateId}.pdf`);

    try {
      // Generate DOCX certificate with QR code
      await generateCertificateFromDocx(templatePath, docxPath, {
        studentName: newStudentName,
        courseName: oldCertificate.courseName,
        completionDate:
          oldCertificate.completionDate instanceof Date
            ? oldCertificate.completionDate.toISOString()
            : new Date(oldCertificate.completionDate).toISOString(),
        certificateId: newCertificateId,
        keyTopics: oldCertificate.keyTopics || undefined,
        instructorName: instructorName,
        verificationUrl: newVerificationUrl, // Pass verification URL for QR code generation
      });

      // Convert DOCX to PDF
      await convertDocxToPdf(docxPath, pdfPath);

      // Read PDF file
      const pdfBuffer = fs.readFileSync(pdfPath);

      // Generate filename: Airkrit_{course_name}_{studentName}.pdf
      // Sanitize course name and student name for filename (remove special characters, replace spaces with underscores)
      const sanitizeForFilename = (str: string): string => {
        return str
          .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove special characters
          .replace(/\s+/g, "_") // Replace spaces with underscores
          .replace(/_+/g, "_") // Replace multiple underscores with single
          .replace(/^_|_$/g, "") // Remove leading/trailing underscores
          .substring(0, 100); // Limit length
      };

      const sanitizedCourseName = sanitizeForFilename(
        oldCertificate.courseName
      );
      const sanitizedStudentName = sanitizeForFilename(newStudentName);
      const pdfFileName = `Airkrit_${sanitizedCourseName}_${sanitizedStudentName}.pdf`;

      // Upload PDF to S3
      const s3Url = await uploadFileToS3(
        pdfBuffer,
        pdfFileName,
        "certificates",
        "application/pdf"
      );

      // Create new certificate with verification code and URL
      const newCertificate = new CertificateModel({
        certificateType: oldCertificate.certificateType ?? "course",
        enrollmentModel: oldCertificate.enrollmentModel ?? "Enrollment",
        enrollmentId: oldCertificate.enrollmentId,
        userId: oldCertificate.userId,
        courseId: oldCertificate.courseId,
        certificateId: newCertificateId,
        studentName: newStudentName,
        courseName: oldCertificate.courseName,
        completionDate: oldCertificate.completionDate,
        issuedAt: new Date(),
        keyTopics: oldCertificate.keyTopics,
        instructorName: instructorName,
        fileUrl: s3Url,
        verificationCode: newVerificationCode, // Set new verification code
        verificationUrl: newVerificationUrl, // Set new verification URL
        isLatest: true,
        version: oldCertificate.version + 1,
        isActive: true,
        regenerationReason: reason,
      });

      // Set replacedBy reference
      oldCertificate.replacedBy = newCertificate._id;
      await oldCertificate.save();

      await newCertificate.save();

      // Clean up temporary files
      try {
        fs.unlinkSync(docxPath);
        fs.unlinkSync(pdfPath);
        fs.rmdirSync(tempDir);
      } catch (cleanupError) {
        console.error("Error cleaning up temporary files:", cleanupError);
        // Don't throw - cleanup errors shouldn't fail the operation
      }

      return newCertificate.toObject() as Certificate;
    } catch (error) {
      // Clean up temporary files on error
      try {
        if (fs.existsSync(docxPath)) fs.unlinkSync(docxPath);
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
        if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
      } catch (cleanupError) {
        console.error("Error cleaning up temporary files:", cleanupError);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error regenerating certificate:", error);
    throw new AppError("Failed to regenerate certificate", 500);
  }
};

/**
 * Get certificates for a user with optional pagination (including old versions)
 * When page/limit are provided, returns paginated format. Otherwise returns all as array (backward compat).
 */
export const getUserCertificatesService = async (
  userId: string,
  options: {
    includeOldVersions?: boolean;
    page?: number;
    limit?: number;
    search?: string;
    recentOnly?: boolean;
  } = {}
): Promise<
  | Certificate[]
  | { certificates: Certificate[]; total: number; totalPages: number; page: number }
> => {
  try {
    const {
      includeOldVersions = false,
      page,
      limit = 12,
      search,
      recentOnly = false,
    } = options;

    const query: any = { userId, isActive: true };
    if (!includeOldVersions) {
      query.isLatest = true;
    }

    if (recentOnly) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.issuedAt = { $gte: thirtyDaysAgo };
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { courseName: searchRegex },
        { studentName: searchRegex },
        { certificateId: searchRegex },
      ];
    }

    // Backward compat: when page not provided, return all as array (for useCourseCompletion etc.)
    if (page === undefined) {
      const certificates = await CertificateModel.find(query)
        .populate("courseId", "title thumbnail slug")
        .populate("userId", "firstName lastName email")
        .sort({ issuedAt: -1 })
        .lean();
      return certificates as Certificate[];
    }

    const total = await CertificateModel.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const skip = (page - 1) * limit;

    const certificates = await CertificateModel.find(query)
      .populate("courseId", "title thumbnail slug")
      .populate("userId", "firstName lastName email")
      .sort({ issuedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      certificates: certificates as Certificate[],
      total,
      totalPages,
      page,
    };
  } catch (error) {
    console.error("Error getting user certificates:", error);
    throw new AppError("Failed to get certificates", 500);
  }
};

/**
 * Get certificate by verification code
 */
export const getCertificateByVerificationCodeService = async (
  verificationCode: string
): Promise<Certificate | null> => {
  try {
    const certificate = await CertificateModel.findOne({
      verificationCode,
      isActive: true,
      isLatest: true,
    })
      .populate("userId", "firstName lastName email")
      .populate("courseId", "title")
      .lean();

    return certificate as Certificate | null;
  } catch (error) {
    console.error("Error getting certificate by verification code:", error);
    throw new AppError("Failed to get certificate", 500);
  }
};
