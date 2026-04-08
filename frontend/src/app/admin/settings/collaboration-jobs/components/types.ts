export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface CollaborationDomainSnapshot {
  title: string;
  domain: string;
}

export interface CollaborationUserSnapshot {
  name: string;
  email: string;
}

export interface CollaborationJobRow {
  _id?: string;
  jobId: string;
  userId?: string;
  collaborationDomainId?: string;
  status: JobStatus;
  error?: string | null;
  retryCount?: number;
  createdAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  updatedAt?: string;
  userName?: string;
  userEmail?: string;
  userSnapshot?: CollaborationUserSnapshot | null;
  domainTitle?: string;
  domainEmail?: string;
  collaborationDomainSnapshot?: CollaborationDomainSnapshot | null;
  domainRecordMissing?: boolean;
}

export interface JobsResponse {
  jobs: CollaborationJobRow[];
  total: number;
  page: number;
  limit: number;
}
