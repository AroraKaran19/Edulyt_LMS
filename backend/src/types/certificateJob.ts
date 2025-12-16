export type CertificateJobStatus = "pending" | "processing" | "completed" | "failed";

export interface CertificateJob {
  _id?: string;
  jobId: string; // Unique job identifier
  enrollmentId: string; // Reference to enrollment
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
  studentName: string;
  courseName: string;
  completionDate: Date;
  certificateId?: string;
  keyTopics?: string;
  instructorName?: string;
}

