import { AppError } from "../middlewares/error.middleware";
import { CertificateModel } from "../models/certificate.schema";
import { EnrollmentModel } from "../models/enrollment.schema";
import { UserModel } from "../models/user.schema";
import { CourseModel } from "../models/course.schema";
import { Certificate, CertificateGenerationData } from "../types/certificate";
import { generateCertificateFromDocx } from "../utils/certificateGeneratorDocx";
import { convertDocxToPdf } from "../utils/certificateGeneratorDocx";
import { uploadFileToS3 } from "./upload.services";
import path from "path";
import fs from "fs";
import os from "os";

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

    // Generate certificate DOCX file
    const templatePath = path.join(
      process.cwd(),
      "../frontend/public/course-certificates/Certificates",
      "Airkrit India Course Certificate - AI-01171 - Template.docx"
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
      // Generate DOCX certificate
      await generateCertificateFromDocx(templatePath, docxPath, {
        studentName: data.studentName,
        courseName: data.courseName,
        completionDate: data.completionDate.toISOString(),
        certificateId,
        keyTopics: data.keyTopics,
        instructorName: data.instructorName || instructorName,
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

      // Create certificate document
      const certificate = new CertificateModel({
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

    // Generate certificate DOCX file
    const templatePath = path.join(
      process.cwd(),
      "../frontend/public/course-certificates/Certificates",
      "Airkrit India Course Certificate - AI-01171 - Template.docx"
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
      // Generate DOCX certificate
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

      // Create new certificate
      const newCertificate = new CertificateModel({
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
 * Get all certificates for a user (including old versions)
 */
export const getUserCertificatesService = async (
  userId: string,
  includeOldVersions: boolean = false
): Promise<Certificate[]> => {
  try {
    const query: any = { userId, isActive: true };
    if (!includeOldVersions) {
      query.isLatest = true;
    }

    const certificates = await CertificateModel.find(query)
      .populate("courseId", "title thumbnail slug")
      .populate("userId", "firstName lastName email")
      .sort({ issuedAt: -1 })
      .lean();

    return certificates as Certificate[];
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
