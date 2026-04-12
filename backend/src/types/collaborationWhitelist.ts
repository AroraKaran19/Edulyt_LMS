export type CollaborationWhitelistStatus =
  | "pending"
  | "queued"
  | "enrolled"
  | "benefit_applied"
  | "failed"
  | "expired";

export interface CollaborationWhitelistEntry {
  _id?: string;
  /** Standalone partnership import configuration (not CollaborationDomain). */
  partnershipImportConfigId: string;
  email: string;
  studentName?: string;
  studentId?: string;
  status: CollaborationWhitelistStatus;
  isActive: boolean;
  userId?: string;
  attempts: number;
  lastCheckedAt?: Date | null;
  nextCheckAt?: Date | null;
  lastError?: string | null;
  enrolledAt?: Date | null;
  jobId?: string | null;
  expiresAt?: Date | null;
  notes?: string | null;
  addedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CollaborationWhitelistImportRow {
  email: string;
  studentName?: string;
  studentId?: string;
}

export type CollaborationWhitelistImportMode = "append" | "replace";
