import type { Brand } from "../constants/brands";

export type CertificateJobStatus = "pending" | "processing" | "completed" | "failed";
export type CertificateJobType = "course" | "internship";

export interface CertificateJob {
  _id?: string;
  jobId: string;
  enrollmentId: string;
  certificateType: CertificateJobType;
  /** The enrollment's brand. */
  brand?: Brand;
  status: CertificateJobStatus;
  certificateId?: string; // Certificate ID once generated
  certificateUrl?: string; // URL to certificate file once generated
  error?: string; // Error message if job failed
  retryCount?: number; // Number of retry attempts
  progress?: number; // Progress percentage (0-100)
  createdAt?: Date;
  updatedAt?: Date;
  startedAt?: Date; // When processing started
  completedAt?: Date; // When job completed
}

export interface CertificateJobData {
  enrollmentId: string;
  certificateType?: CertificateJobType;
  brand: Brand;
  studentName: string;
  courseName: string;
  completionDate: Date;
  certificateId?: string;
  keyTopics?: string;
  instructorName?: string;
}

