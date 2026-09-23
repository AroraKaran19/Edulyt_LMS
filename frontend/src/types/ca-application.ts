import type { AmbassadorKind } from "@/hooks/useCrm";

export type CaApplicationStatus = "pending" | "approved" | "attached";
export type CaAttachIssue = "not-student" | "other-owner";
export type CaAttachOutcome = "attached" | "no-account" | "not-student" | "other-owner" | "retry-later";

export interface CaAddress {
  line: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

/** Mirrors `CaApplicationRow` in `backend/src/services/caApplicationReview.services.ts`. */
export interface CaApplicationRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  collegeName: string;
  degree: string;
  careerStage: string;
  collegeEmail: string;
  languages: string[];
  whatsappJoined: boolean;
  /** Only an admin's detail carries it. */
  address: CaAddress | null;
  joiningDate: string | null;
  durationMonths: number;
  endDate: string | null;
  caPoints: number;
  referrer: { userId: string; name: string } | null;
  status: CaApplicationStatus;
  kind: AmbassadorKind | null;
  owner: { userId: string; name: string } | null;
  decidedBy: string;
  decidedAt: string | null;
  attachedAt: string | null;
  attachIssue: CaAttachIssue | null;
  hasAccount: boolean;
  createdAt: string;
  internId: string | null;
  documents: {
    offerLetter: string | null;
    lor: string | null;
    internshipCertificate: string | null;
    trainingCertificate: string | null;
  };
  completion: {
    hold: boolean;
    issuedAt: string | null;
    outcome: "eligible" | "not-eligible" | null;
    certificateOverride: "pass" | "fail" | null;
  };
  /** Admin detail only: document jobs that used up their automatic retries. */
  failedDocumentJobs?: { kind: "offer-letter" | "completion"; error: string | null }[];
}

export interface CaOwner {
  userId: string;
  name: string;
  userType: string;
}

export interface CaApplicationsPage {
  applications: CaApplicationRow[];
  total: number;
  page: number;
  totalPages: number;
}

export type CaDirectoryState = "active" | "ended" | "all";

export type CaDirectoryOutcome =
  | "active"
  | "upcoming"
  | "issued"
  | "not-eligible"
  | "on-hold"
  | "awaiting-review";

/** Mirrors `CaDirectoryRow` in `backend/src/services/caApplicationReview.services.ts`. */
export interface CaDirectoryRow {
  id: string;
  name: string;
  email: string;
  internId: string | null;
  kind: AmbassadorKind | null;
  ownerName: string;
  joiningDate: string | null;
  endDate: string | null;
  durationMonths: number;
  caPoints: number;
  migrated: boolean;
  outcome: CaDirectoryOutcome;
  certificateOverride: "pass" | "fail" | null;
}

export interface CaDirectoryPage {
  rows: CaDirectoryRow[];
  total: number;
  page: number;
  totalPages: number;
  counts: { active: number; ended: number };
}

/** Mirrors `CampusAmbassadorSummary` in `backend/src/services/admin.services.ts`. */
export interface CampusAmbassadorSummary {
  kind: AmbassadorKind | null;
  ownerName: string;
  internId: string | null;
  joiningDate: string | null;
  endDate: string | null;
  active: boolean;
}
