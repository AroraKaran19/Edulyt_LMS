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

export interface PartnershipImportConfig {
  _id?: string;
  /** Display name, e.g. "MVC Uni" */
  title: string;
  isActive: boolean;
  kind: PartnershipImportKind;
  courses: Course["_id"][];
  enrollmentAccess?: PartnershipImportEnrollmentAccess;
  benefit?: PartnershipImportBenefit;
  createdBy?: User["_id"];
  createdAt?: Date;
  updatedAt?: Date;
}
