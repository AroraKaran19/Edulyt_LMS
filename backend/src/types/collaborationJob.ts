export type CollaborationJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface CollaborationJob {
  _id?: string;
  jobId: string;
  userId: string;
  collaborationDomainId: string;
  status: CollaborationJobStatus;
  error?: string | null;
  retryCount: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
