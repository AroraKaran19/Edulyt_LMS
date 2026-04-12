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

export interface PartnershipImportConfigJobSnapshot {
  title: string;
}

export interface CollaborationJob {
  _id?: string;
  jobId: string;
  userId: string;
  /** Set when job is for email-domain collaboration. */
  collaborationDomainId?: string | null;
  /** Set when job is for standalone partnership import config (CSV). */
  partnershipImportConfigId?: string | null;
  status: CollaborationJobStatus;
  /** Point-in-time copy of the collaboration domain (title + email domain). */
  collaborationDomainSnapshot?: CollaborationDomainJobSnapshot | null;
  partnershipImportConfigSnapshot?: PartnershipImportConfigJobSnapshot | null;
  /** Point-in-time copy of the user (name + email). */
  userSnapshot?: CollaborationUserJobSnapshot | null;
  error?: string | null;
  retryCount: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
