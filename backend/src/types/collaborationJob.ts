export type CollaborationJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

/** Captured when the job is created so admin history survives domain deletion. */
export interface CollaborationDomainJobSnapshot {
  title: string;
  /** Email domain without @ (e.g. college.edu), normalized lowercase */
  domain: string;
}

/** Captured when the job is created so admin history survives user updates/deletion. */
export interface CollaborationUserJobSnapshot {
  name: string;
  email: string;
}

export interface CollaborationJob {
  _id?: string;
  jobId: string;
  userId: string;
  collaborationDomainId: string;
  status: CollaborationJobStatus;
  /** Point-in-time copy of the collaboration domain (title + email domain). */
  collaborationDomainSnapshot?: CollaborationDomainJobSnapshot | null;
  /** Point-in-time copy of the user (name + email). */
  userSnapshot?: CollaborationUserJobSnapshot | null;
  error?: string | null;
  retryCount: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
