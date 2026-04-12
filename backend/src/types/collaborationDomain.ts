import type { Course, Plan } from "./course";
import type { User } from "./user";
import type { PartialAccessControl } from "./enrollment";

export type CollaborationEnrollmentAccessMode = "full" | "partial";

export interface CollaborationTopNSettings {
  contentsPerLesson: number;
}

export interface CollaborationEnrollmentAccess {
  mode: CollaborationEnrollmentAccessMode;
  partialAccess?: PartialAccessControl | null;
  topNSettings?: CollaborationTopNSettings | null;
  /** Which plan this collaboration enrollment uses. */
  plan: Plan["type"];
  /** Target audience for this collaboration. */
  audience: Course["audience"];
  /**
   * Days of access after the user is enrolled. Becomes `Enrollment.validUntil`
   * (enrollment expiry); access checks use that date.
   */
  durationDays: number;
}

export type CollaborationBenefitType = "percentage" | "fixed";

export interface CollaborationBenefit {
  type: CollaborationBenefitType;
  value: number;
}

/** Exactly one partnership model per domain document. */
export type CollaborationKind = "course_allot" | "discount";

export interface CollaborationDomain {
  _id?: string;
  title: string;
  domain: string;
  isActive: boolean;
  collaborationKind: CollaborationKind;
  courses: Course["_id"][];
  /** Course allot only: full / partial / top-N content rules. */
  enrollmentAccess?: CollaborationEnrollmentAccess;
  /** Discount only: global checkout discount (percentage or fixed). */
  benefit?: CollaborationBenefit;
  createdBy?: User["_id"];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CollaborationCheckoutResolve {
  applies: boolean;
  collaborationDomainId?: string;
  /** When discount comes from partnership import (CSV), not email domain. */
  partnershipImportConfigId?: string;
  title?: string;
  benefit?: CollaborationBenefit;
  enrollmentAccess?: CollaborationEnrollmentAccess;
}
