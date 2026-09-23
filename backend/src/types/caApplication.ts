import mongoose from "mongoose";
import type { FieldCiphertext } from "../utils/lib/fieldCrypto";
import type { AmbassadorKind } from "./crm";

export type CaApplicationStatus = "pending" | "approved" | "attached";

/** Why an approved application could not be put on a roster yet. */
export type CaAttachIssue = "not-student" | "other-owner";

export interface CaAddress {
  line: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface CaReferrer {
  userId: mongoose.Types.ObjectId;
  code: string;
  name: string;
}

export interface CaActorSnapshot {
  userId: mongoose.Types.ObjectId | null;
  name: string;
}

export interface CaPayoutCiphertext extends FieldCiphertext {
  method: "upi" | "details";
}

export interface CaDocumentRef {
  url: string;
  generatedAt: Date;
  verificationUrl?: string;
}

export interface CaDocuments {
  offerLetter?: CaDocumentRef | null;
  lor?: CaDocumentRef | null;
  internshipCertificate?: CaDocumentRef | null;
  trainingCertificate?: CaDocumentRef | null;
}

export interface CaCompletion {
  hold: boolean;
  heldBy?: CaActorSnapshot | null;
  heldAt?: Date | null;
  /** Set when the completion job is queued; cleared when a hold is lifted so the sweep can queue again. */
  queuedAt?: Date | null;
  /** Set when the end date passed but they were no longer on a roster. */
  skippedAt?: Date | null;
  issuedAt?: Date | null;
  /** Set by the sweep once it decides; "not-eligible" until a force-pass flips it. */
  outcome?: "eligible" | "not-eligible" | null;
  /** Admin override: makes the CA eligible regardless of caPoints. */
  forcePassed?: boolean;
}

export interface CaEmailMarkers {
  approvedAt?: Date | null;
  completionAt?: Date | null;
  notEligibleAt?: Date | null;
}

export interface CaApplication {
  _id: mongoose.Types.ObjectId;
  brand?: "airkrit";
  name: string;
  email: string;
  phone: string;
  submittedByUserId?: mongoose.Types.ObjectId | null;
  userId?: mongoose.Types.ObjectId | null;
  collegeId?: mongoose.Types.ObjectId | null;
  collegeName: string;
  careerStage: string;
  degree: string;
  collegeEmail: string;
  languages: string[];
  whatsappJoined: boolean;
  payout?: CaPayoutCiphertext | null;
  address?: CaAddress | null;
  joiningDate: Date | null;
  durationMonths: number;
  endDate: Date | null;
  caPoints?: number;
  referrer?: CaReferrer | null;
  status: CaApplicationStatus;
  /** True while pending or approved; unset on attach. Backs the one-open-per-person indexes. */
  open?: boolean;
  ownerUserId?: mongoose.Types.ObjectId | null;
  ownerName: string;
  kind?: AmbassadorKind | null;
  decidedBy?: CaActorSnapshot | null;
  decidedAt?: Date | null;
  attachedAt?: Date | null;
  migrated?: boolean;
  attachIssue?: CaAttachIssue | null;
  /** When the attach sweep last looked at it without attaching; orders the sweep. */
  attachCheckedAt?: Date | null;
  internId?: string | null;
  documents?: CaDocuments;
  completion?: CaCompletion;
  emails?: CaEmailMarkers;
  createdAt: Date;
  updatedAt: Date;
}
