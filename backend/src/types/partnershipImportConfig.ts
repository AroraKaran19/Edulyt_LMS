import type { Course, Plan } from "./course";
import type { User } from "./user";
import type { PartialAccessControl } from "./enrollment";

export type PartnershipImportKind = "course_allot" | "discount";

export type PartnershipEnrollmentAccessMode = "full" | "partial";

export interface PartnershipTopNSettings {
  contentsPerLesson: number;
}

export interface PartnershipImportEnrollmentAccess {
  mode: PartnershipEnrollmentAccessMode;
  partialAccess?: PartialAccessControl | null;
  topNSettings?: PartnershipTopNSettings | null;
  plan: Plan["type"];
  audience: Course["audience"];
  durationDays: number;
}

export type PartnershipImportBenefitType = "percentage" | "fixed";

export interface PartnershipImportBenefit {
  type: PartnershipImportBenefitType;
  value: number;
}

/** Minimal college shape returned when `college` is populated on the API. */
export interface PartnershipImportCollegeRef {
  _id?: string;
  name?: string;
  location?: string;
}

export interface PartnershipImportConfig {
  _id?: string;
  /**
   * Display name — a snapshot of the bound college's name. Auto-derived from
   * `college` by the service; not entered by hand.
   */
  title: string;
  /**
   * College this partnership is bound to. Course-allot jobs stamp this college
   * onto every student they enroll. Stored as an ObjectId; populated to a
   * `PartnershipImportCollegeRef` on read APIs.
   */
  college?: string | PartnershipImportCollegeRef;
  isActive: boolean;
  kind: PartnershipImportKind;
  courses: Course["_id"][];
  enrollmentAccess?: PartnershipImportEnrollmentAccess;
  benefit?: PartnershipImportBenefit;
  createdBy?: User["_id"];
  createdAt?: Date;
  updatedAt?: Date;
}
