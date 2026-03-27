import type { Course } from "./course";
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
  title?: string;
  benefit?: CollaborationBenefit;
  enrollmentAccess?: CollaborationEnrollmentAccess;
}
