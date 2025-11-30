import { Course } from "./course";
import { User } from "./user";

/**
 * Certificate interface for frontend
 * Matches backend Certificate type but with populated fields
 */
export interface Certificate {
  _id: string;
  enrollmentId: string;
  userId: string | User;
  courseId:
    | Course["_id"]
    | {
        _id: string;
        title: string;
        thumbnail?: string;
        slug?: string;
      };

  // Certificate details
  certificateId: string; // Unique certificate ID (e.g., "AI-12345")
  studentName: string; // Name at time of certificate generation
  courseName: string; // Course name at time of certificate generation
  completionDate: Date | string; // Date course was completed
  issuedAt: Date | string; // Date certificate was issued/generated

  // Certificate metadata
  keyTopics?: string; // Key topics/technologies covered
  instructorName?: string; // Instructor name

  // File information
  filePath?: string; // Path to certificate file (if stored)
  fileUrl?: string; // URL to certificate file (if stored in cloud)

  // Verification
  verificationCode?: string; // Unique code for verification
  verificationUrl?: string; // URL for certificate verification

  // Analytics
  downloadCount?: number; // Number of times downloaded
  lastDownloadedAt?: Date | string; // Last download timestamp

  // Status
  isActive: boolean; // Whether certificate is active (can be revoked)
  revokedAt?: Date | string; // If certificate was revoked
  revokedReason?: string; // Reason for revocation

  // Version tracking (for name changes/regeneration)
  isLatest: boolean; // Whether this is the latest version of the certificate
  version: number; // Certificate version number (increments on regeneration)
  replacedAt?: Date | string; // When this certificate was replaced by a newer version
  replacedBy?: string; // ID of the certificate that replaced this one
  regenerationReason?: string; // Reason for regeneration (e.g., "name_change")

  // Timestamps
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Certificate data for verification page (public endpoint)
 * Similar to Certificate but with minimal fields for public verification
 */
export interface CertificateVerificationData {
  _id: string;
  certificateId: string;
  studentName: string;
  courseName: string;
  completionDate: string | Date;
  issuedAt: string | Date;
  courseId?: {
    _id: string;
    title: string;
    thumbnail?: string;
  };
  fileUrl?: string;
  verificationCode: string;
  verificationUrl?: string;
  keyTopics?: string;
  instructorName?: string;
}

/**
 * Certificate generation data (for creating new certificates)
 */
export interface CertificateGenerationData {
  enrollmentId: string;
  studentName: string;
  courseName: string;
  completionDate: Date | string;
  certificateId?: string; // Optional - will be generated if not provided
  keyTopics?: string;
  instructorName?: string;
}
