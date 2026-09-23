
export interface LeadAnswer {
  key: string;
  label: string;
  value: string;
}

export interface LeadPlatformUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  userType?: string;
  createdAt?: string;
}



export interface LeadActor {
  userId: string | null;
  name: string;
}

export interface LeadStatusChange {
  /** Entries predating the stage split carry the old flat vocabulary. */
  from: string | null;
  fromSubStatus?: string | null;
  to: string;
  toSubStatus?: string | null;
  changedByName: string;
  changedAt: string;
  note?: string;
}

export type ScholarshipAttemptStatus = "in_progress" | "submitted" | "expired";

export type ScholarshipCouponState =
  | "revoked"
  | "redeemed"
  | "expired"
  | "issued";

/**
 * Joined onto the lead on read, never stored on it: every field here moves
 * after the lead is captured. `null` where the lead is not a scholarship lead,
 * or where its campaign has since been deleted.
 */
export interface LeadScholarship {
  attempt: {
    status: ScholarshipAttemptStatus;
    attemptNumber: number;
    correctCount: number;
    totalQuestions: number;
    startedAt: string;
    submittedAt: string | null;
  } | null;
  coupon: {
    state: ScholarshipCouponState;
    expiresAt: string;
    redeemedAt: string | null;
  } | null;
  discountPercent: number | null;
}

export type LeadProgramKind = "course" | "internship";

export const PROGRAM_KIND_LABELS: Record<LeadProgramKind, string> = {
  course: "Course",
  internship: "Internship",
};

export interface LeadCampaignOption {
  testId: string;
  title: string;
  leads: number;
}

export interface Lead {
  _id: string;
  source: {
    kind: "enquiry" | "scholarship" | "import";
    /** Which site it came from. Absent on rows predating two brands, which are all Airkrit. */
    brand?: "airkrit" | "edulyt";
    testId?: string | null;
    title?: string;
    slug?: string;
    /** The campaign's author, not the `?ref=` code that brought them in. */
    campaignOwnerName?: string;
    /** The Excel file this lead came from, for a `source.kind === "import"` lead. */
    fileName?: string;
    /** The course or internship page an enquiry came from. */
    program?: {
      kind: LeadProgramKind;
      refId?: string;
      title: string;
      slug: string;
    };
  };
  scholarship?: LeadScholarship | null;
  creator?: { userId: string | null; code: string; name: string; role: string };
  parent?: LeadActor;
  collegeName?: string;
  state?: string;
  assignedTo?: LeadActor | null;
  assignedAt?: string;
  statusHistory?: LeadStatusChange[];
  convertedAt?: string | null;
  convertedBy?: LeadActor | null;
  duplicateEmailCount?: number;
  duplicatePhoneCount?: number;
  name: string;
  email: string;
  phone: string;
  answers: LeadAnswer[];
  /** `null` means the platform check has not resolved yet. */
  emailOnPlatform: boolean | null;
  emailCheckedAt?: string;
  platformUserId?: LeadPlatformUser | string | null;
  submittedByUserId?: string | null;
  /** A stage `key` from the configured pipeline, not a fixed value. */
  status: string;
  subStatus: string;
  note?: string;
  pageQuery?: string;
  createdAt: string;
  updatedAt: string;
}


export const LEAD_SOURCE_LABELS: Record<string, string> = {
  enquiry: "Enquiry form",
  scholarship: "Scholarship test",
  import: "Imported",
};

export const LEAD_SOURCE_OPTIONS = [
  { value: "", label: "All sources" },
  { value: "enquiry", label: "Enquiry form" },
  { value: "scholarship", label: "Scholarship test" },
  { value: "import", label: "Import" },
];

export const ATTEMPT_LABELS: Record<ScholarshipAttemptStatus, string> = {
  in_progress: "In progress",
  submitted: "Submitted",
  expired: "Ran out of time",
};

export const ATTEMPT_STYLES: Record<ScholarshipAttemptStatus, string> = {
  in_progress: "bg-amber-50 text-amber-700 ring-amber-600/20",
  submitted: "bg-green-50 text-green-700 ring-green-600/20",
  expired: "bg-gray-100 text-gray-600 ring-gray-500/20",
};

export const COUPON_LABELS: Record<ScholarshipCouponState, string> = {
  issued: "unused",
  redeemed: "redeemed",
  expired: "expired unused",
  revoked: "revoked",
};

export const COUPON_STYLES: Record<ScholarshipCouponState, string> = {
  issued: "bg-blue-50 text-blue-700 ring-blue-600/20",
  redeemed: "bg-green-50 text-green-700 ring-green-600/20",
  expired: "bg-gray-100 text-gray-600 ring-gray-500/20",
  revoked: "bg-red-50 text-red-700 ring-red-600/20",
};

/** "Submitted 7/10", or just the status where there is no score to show. */
export const attemptSummary = (
  attempt: NonNullable<LeadScholarship["attempt"]>
): string => {
  const label = ATTEMPT_LABELS[attempt.status];
  if (attempt.status !== "submitted") return label;
  return `${label} ${attempt.correctCount}/${attempt.totalQuestions}`;
};

/** "30% redeemed", or "Coupon redeemed" for a campaign whose attempt is gone. */
export const couponSummary = (scholarship: LeadScholarship): string => {
  const state = scholarship.coupon?.state;
  if (!state) return "";
  const label = COUPON_LABELS[state];
  return scholarship.discountPercent
    ? `${scholarship.discountPercent}% ${label}`
    : `Coupon ${label}`;
};


