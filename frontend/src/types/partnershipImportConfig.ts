import type { Course, Plan } from "./index";
import type { PartialAccessControl } from "./enrollment";

export type PartnershipImportKind = "course_allot" | "discount";

export interface PartnershipTopNSettings {
  contentsPerLesson: number;
}

export interface PartnershipImportEnrollmentAccess {
  mode: "full" | "partial";
  partialAccess?: PartialAccessControl | null;
  topNSettings?: PartnershipTopNSettings | null;
  plan: Plan["type"];
  audience: Course["audience"];
  durationDays: number;
}

export interface PartnershipImportBenefit {
  type: "percentage" | "fixed";
  value: number;
}

/** Minimal college shape returned when `college` is populated on the API. */
export interface PartnershipImportCollege {
  _id: string;
  name: string;
  location?: string;
}

export interface PartnershipImportConfig {
  _id?: string;
  /** Display name — a snapshot of the bound college's name. */
  title: string;
  /** Bound college (populated on read APIs). */
  college?: string | PartnershipImportCollege;
  isActive: boolean;
  kind: PartnershipImportKind;
  courses: string[] | Course[];
  enrollmentAccess?: PartnershipImportEnrollmentAccess;
  benefit?: PartnershipImportBenefit;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePartnershipImportConfigData {
  /** College id this partnership is bound to. Drives the display name. */
  college: string;
  isActive: boolean;
  kind: PartnershipImportKind;
  courses: string[];
  enrollmentAccess?: PartnershipImportEnrollmentAccess | null;
  benefit?: PartnershipImportBenefit | null;
}

export type UpdatePartnershipImportConfigData =
  Partial<CreatePartnershipImportConfigData>;

export interface PartnershipImportConfigListResponse {
  configs: PartnershipImportConfig[];
  total: number;
  page: number;
  totalPages: number;
}

export type CollaborationWhitelistStatus =
  | "pending"
  | "queued"
  | "enrolled"
  | "benefit_applied"
  | "failed"
  | "expired";

export interface PartnershipWhitelistEntry {
  _id?: string;
  partnershipImportConfigId: string;
  email: string;
  studentName?: string;
  studentId?: string;
  status: CollaborationWhitelistStatus;
  isActive: boolean;
  attempts?: number;
  lastError?: string | null;
  enrolledAt?: string | null;
  updatedAt?: string;
}

export interface PartnershipWhitelistListResponse {
  entries: PartnershipWhitelistEntry[];
  total: number;
  page: number;
  totalPages: number;
}
