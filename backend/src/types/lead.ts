import { Document, Types } from "mongoose";
import { Brand } from "../constants/brands";

export type LeadSourceKind = "enquiry" | "scholarship";

/** Object rather than a string so a scholarship lead carries its campaign. */
export interface LeadSource {
  kind: LeadSourceKind;
  /** Which site the lead came from. Absent on rows predating two brands. */
  brand?: Brand;
  /** Nulled when the campaign is deleted; title and slug survive as history. */
  testId?: Types.ObjectId | null;
  title?: string;
  slug?: string;
  /**
   * The campaign's author, snapshotted at capture. Distinct from `creator`,
   * which is whoever's `?ref=` code brought this particular person in.
   */
  campaignOwnerName?: string;
}

/** Frozen at capture. `userId` is nulled if that user is later deleted. */
export interface LeadCreator {
  userId: Types.ObjectId | null;
  code: string;
  name: string;
  role:
    | "marketer"
    | "sales"
    | "marketing-intern"
    | "sales-intern"
    | "ambassador";
}

export interface LeadParent {
  userId: Types.ObjectId | null;
  name: string;
}

export interface LeadActor {
  userId: Types.ObjectId | null;
  name: string;
}

export interface LeadStatusChange {
  from: LeadStatus | null;
  to: LeadStatus;
  changedByUserId: Types.ObjectId | null;
  changedByName: string;
  changedAt: Date;
  note?: string;
}

export interface LeadAssignmentChange {
  toUserId: Types.ObjectId | null;
  toName: string;
  byUserId: Types.ObjectId | null;
  byName: string;
  at: Date;
}

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "converted"
  | "lost";

/** Flat so a source can ask anything without a migration. */
export interface LeadAnswer {
  key: string;
  label: string;
  value: string;
}

export interface Lead extends Document {
  source: LeadSource;

  name: string;
  email: string;
  phone: string;

  answers: LeadAnswer[];

  /** `null` means not resolved yet, which is distinct from `false`. */
  emailOnPlatform: boolean | null;
  emailCheckedAt?: Date;
  platformUserId?: Types.ObjectId;

  submittedByUserId?: Types.ObjectId;

  creator?: LeadCreator;
  parent?: LeadParent;

  collegeId?: Types.ObjectId;
  collegeName?: string;
  state?: string;

  assignedTo?: LeadActor;
  assignedBy?: LeadActor;
  assignedAt?: Date;
  assignmentHistory: LeadAssignmentChange[];
  statusHistory: LeadStatusChange[];
  convertedAt?: Date | null;
  convertedBy?: LeadActor | null;

  status: LeadStatus;
  note?: string;

  /** Landing page query string, so campaign params survive. */
  pageQuery?: string;

  createdAt: Date;
  updatedAt: Date;
}
