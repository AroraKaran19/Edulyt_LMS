import { Document, Types } from "mongoose";
import { Brand } from "../constants/brands";

export type LeadSourceKind = "enquiry" | "scholarship" | "import";

/** Every kind a lead's `source.kind` may hold, for filters that must reject the rest. */
export const LEAD_SOURCE_KINDS: readonly LeadSourceKind[] = [
  "enquiry",
  "scholarship",
  "import",
];

export type LeadProgramKind = "course" | "internship";

/** Titled at capture, so the name survives a rename or a deletion. */
export interface LeadProgram {
  kind: LeadProgramKind;
  /** The Course or Internship id. Absent when the slug matched nothing. */
  refId?: Types.ObjectId;
  title: string;
  slug: string;
}

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
  /** Set when the enquiry came from a course or internship page. */
  program?: LeadProgram;
  /** Set for `kind: "import"`: the Excel file this row came from. */
  fileName?: string;
  /** Set for `kind: "import"`: the admin who ran the import. */
  importedBy?: { userId: Types.ObjectId | null; name: string };
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
    | "social-media-intern"
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
  /** Entries predating the stage split carry the old flat vocabulary. */
  from: string | null;
  fromSubStatus: string | null;
  to: string;
  toSubStatus: string | null;
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

  /** A stage `key` from `LeadPipelineSettings`, which the admin edits. */
  status: string;
  subStatus: string;
  note?: string;

  /** Landing page query string, so campaign params survive. */
  pageQuery?: string;

  createdAt: Date;
  updatedAt: Date;
}
