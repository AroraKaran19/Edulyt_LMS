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

export interface PartnershipImportConfig {
  _id?: string;
  title: string;
  isActive: boolean;
  kind: PartnershipImportKind;
  courses: string[] | Course[];
  enrollmentAccess?: PartnershipImportEnrollmentAccess;
  benefit?: PartnershipImportBenefit;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePartnershipImportConfigData {
  title: string;
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
