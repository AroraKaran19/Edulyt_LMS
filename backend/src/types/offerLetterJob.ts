export type OfferLetterJobStatus = "pending" | "processing" | "completed" | "failed";

export interface OfferLetterJob {
  _id?: string;
  jobId: string;
  internshipEnrollmentId: string;
  status: OfferLetterJobStatus;
  internId?: string;
  offerLetterUrl?: string;
  error?: string;
  retryCount?: number;
  progress?: number;
  createdAt?: Date;
  updatedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface OfferLetterJobData {
  internshipEnrollmentId: string;
}

export interface OfferLetterJobListRow {
  jobId: string;
  /** Internship enrollment document id */
  enrollmentId: string;
  status: OfferLetterJobStatus;
  internshipTitle: string;
  userName: string;
  userEmail: string;
  internId?: string;
  offerLetterUrl?: string;
  error?: string;
  progress?: number;
  createdAt?: string;
  completedAt?: string;
}
