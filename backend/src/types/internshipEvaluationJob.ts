export type InternshipEvaluationJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface InternshipEvaluationJob {
  _id?: string;
  jobId: string;
  internshipEnrollmentId: string;
  status: InternshipEvaluationJobStatus;
  /** The verdict this job wrote, mirrored here for admin visibility. */
  verdict?: "pass" | "fail";
  error?: string;
  retryCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface InternshipEvaluationJobData {
  internshipEnrollmentId: string;
}
