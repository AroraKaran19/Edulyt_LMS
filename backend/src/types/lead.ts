import { Document, Types } from "mongoose";

/** Other capture points reuse this collection rather than adding their own. */
export type LeadSource = "enquiry-form";

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

  status: LeadStatus;
  note?: string;

  /** Landing page query string, so campaign params survive. */
  pageQuery?: string;

  createdAt: Date;
  updatedAt: Date;
}
