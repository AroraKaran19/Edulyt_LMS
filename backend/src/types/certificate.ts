import { User } from "./user";
import { Course } from "./course";
import { Enrollment } from "./enrollment";

export interface Certificate {
  _id?: string;
  certificateType: "course" | "internship" | "lor";
  enrollmentModel: "Enrollment" | "InternshipEnrollment";
  enrollmentId: Enrollment["_id"]; // ObjectId — ref resolved via enrollmentModel (refPath)
  userId: User["_id"]; // Reference to user (for easier querying)
  courseId?: Course["_id"]; // Reference to course — null for internship certificates

  // Certificate details
  certificateId: string; // Unique certificate ID (e.g., "AI-12345")
  studentName: string; // Name at time of certificate generation
  courseName: string; // Course name at time of certificate generation
  completionDate: Date; // Date course was completed
  issuedAt: Date; // Date certificate was issued/generated

  // Certificate metadata
  keyTopics?: string; // Key topics/technologies covered
  instructorName?: string; // Instructor name

  // File information (if stored on server)
  filePath?: string; // Path to certificate file (if stored)
  fileUrl?: string; // URL to certificate file (if stored in cloud)

  // Verification
  verificationCode?: string; // Unique code for verification
  verificationUrl?: string; // URL for certificate verification

  // Analytics
  downloadCount?: number; // Number of times downloaded
  lastDownloadedAt?: Date; // Last download timestamp

  // Status
  isActive: boolean; // Whether certificate is active (can be revoked)
  revokedAt?: Date; // If certificate was revoked
  revokedReason?: string; // Reason for revocation

  // Version tracking (for name changes/regeneration)
  isLatest: boolean; // Whether this is the latest version of the certificate
  version: number; // Certificate version number (increments on regeneration)
  replacedAt?: Date; // When this certificate was replaced by a newer version
  replacedBy?: string; // ID of the certificate that replaced this one
  regenerationReason?: string; // Reason for regeneration (e.g., "name_change")

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CertificateGenerationData {
  enrollmentId: string;
  studentName: string;
  courseName: string;
  completionDate: Date;
  certificateId?: string; // Optional - will be generated if not provided
  keyTopics?: string;
  instructorName?: string;
}
