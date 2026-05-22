import { Course, User, Plan } from "./index";
import { PartialAccessControl } from "./enrollment";

export type CollaborationEnrollmentAccessMode = "full" | "partial";

export interface CollaborationTopNSettings {
  contentsPerLesson: number;
}

export interface CollaborationEnrollmentAccess {
  mode: CollaborationEnrollmentAccessMode;
  partialAccess?: PartialAccessControl | null;
  topNSettings?: CollaborationTopNSettings | null;
  plan: Plan["type"];
  audience: Course["audience"];
  /**
   * Days of access after the user is enrolled. Stored as enrollment `validUntil`
   * (enrollment expiry).
   */
  durationDays: number;
}

export type CollaborationBenefitType = "percentage" | "fixed";

export interface CollaborationBenefit {
  type: CollaborationBenefitType;
  value: number;
}

export type CollaborationKind = "course_allot" | "discount";

/** Minimal college shape returned when `college` is populated on the API. */
export interface CollaborationDomainCollege {
  _id: string;
  name: string;
  location?: string;
}

export interface CollaborationDomain {
  _id?: string;
  /** Display name — a snapshot of the bound college's name. */
  title: string;
  /** Bound college (populated on read APIs). */
  college?: string | CollaborationDomainCollege;
  domain: string;
  isActive: boolean;
  collaborationKind: CollaborationKind;
  /** Course allot: enrolled courses. Discount: courses this checkout discount applies to. */
  courses: string[] | Course[];
  /** Course allot only — absent for discount. */
  enrollmentAccess?: CollaborationEnrollmentAccess;
  /** Discount only — absent for course allot. */
  benefit?: CollaborationBenefit;
  createdBy?: string | User;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateCollaborationDomainData {
  /** College id this collaboration is bound to. Drives the display name. */
  college: string;
  domain: string;
  isActive: boolean;
  collaborationKind: CollaborationKind;
  courses: string[];
  enrollmentAccess?: CollaborationEnrollmentAccess | null;
  benefit?: CollaborationBenefit | null;
}

export interface UpdateCollaborationDomainData extends Partial<CreateCollaborationDomainData> {}

export interface CollaborationDomainFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CollaborationDomainResponse {
  collaborationDomains: CollaborationDomain[];
  total: number;
  page: number;
  totalPages: number;
}

/** Result of POST /collaboration-domains/resolve */
export interface CollaborationCheckoutResolve {
  applies: boolean;
  collaborationDomainId?: string;
  /** Discount from CSV partnership import (not email-domain collaboration). */
  partnershipImportConfigId?: string;
  title?: string;
  benefit?: CollaborationBenefit;
  enrollmentAccess?: CollaborationEnrollmentAccess;
}
