export type LeadStage =
  | "new"
  | "contact-attempt"
  | "connected"
  | "follow-up"
  | "closed";

export const LEAD_STAGES: readonly LeadStage[] = [
  "new",
  "contact-attempt",
  "connected",
  "follow-up",
  "closed",
];

export const LEAD_STAGE_LABEL: Record<LeadStage, string> = {
  new: "New",
  "contact-attempt": "Contact Attempt",
  connected: "Connected",
  "follow-up": "Follow-up",
  closed: "Closed",
};

export interface LeadSubStatusOption {
  value: string;
  label: string;
}

/**
 * Sub-statuses belong to a stage, not to the pipeline: "declined" and
 * "future-lead" each appear under two stages and mean different things there,
 * so a pair is only ever valid as a pair.
 */
export const LEAD_SUB_STATUSES: Record<LeadStage, readonly LeadSubStatusOption[]> = {
  new: [{ value: "new-lead", label: "New Lead" }],
  "contact-attempt": [
    { value: "dnp-1", label: "DNP 1" },
    { value: "dnp-2", label: "DNP 2" },
    { value: "switched-off", label: "Switched Off" },
    { value: "voicemail", label: "Voicemail" },
    { value: "wrong-number", label: "Wrong Number" },
    { value: "declined", label: "Declined" },
  ],
  connected: [
    { value: "connected", label: "Connected" },
    { value: "not-interested", label: "Not Interested" },
    { value: "already-doing-internship", label: "Already Doing Internship" },
    { value: "future-lead", label: "Future Lead" },
    { value: "interested", label: "Interested" },
    { value: "forced-to-fill", label: "Forced To Fill" },
    { value: "financial-issues", label: "Financial Issues" },
  ],
  "follow-up": [
    { value: "callback-requested", label: "Callback Requested" },
    { value: "call-back-later", label: "Call Back Later" },
    { value: "discussion-with-family", label: "Discussion with Family" },
    { value: "fees-problem", label: "Fees Problem" },
    { value: "interested-decision-pending", label: "Interested - Decision Pending" },
    { value: "program-details-shared", label: "Program Details Shared" },
    { value: "demo-attended", label: "Demo Attended" },
    { value: "payment-link-shared", label: "Payment Link Shared" },
  ],
  closed: [
    { value: "won", label: "Won" },
    { value: "declined", label: "Declined" },
    { value: "future-lead", label: "Future Lead" },
  ],
};

export const DEFAULT_LEAD_STAGE: LeadStage = "new";
export const DEFAULT_LEAD_SUB_STATUS = "new-lead";

/** The one pair that stamps `convertedAt` and feeds the CRM leaderboards. */
export const CONVERTED_STAGE: LeadStage = "closed";
export const CONVERTED_SUB_STATUS = "won";

/** Flat union for a schema enum, which cannot express the pairing. */
export const LEAD_SUB_STATUS_VALUES: readonly string[] = [
  ...new Set(
    LEAD_STAGES.flatMap((stage) =>
      LEAD_SUB_STATUSES[stage].map((option) => option.value),
    ),
  ),
];

export const isLeadStage = (value: unknown): value is LeadStage =>
  typeof value === "string" && LEAD_STAGES.includes(value as LeadStage);

export const isLeadSubStatus = (stage: LeadStage, value: unknown): boolean =>
  LEAD_SUB_STATUSES[stage].some((option) => option.value === value);

export const leadSubStatusLabel = (stage: unknown, value: unknown): string => {
  if (!isLeadStage(stage)) return "";
  return LEAD_SUB_STATUSES[stage].find((o) => o.value === value)?.label ?? "";
};

export const isConverted = (stage: unknown, subStatus: unknown): boolean =>
  stage === CONVERTED_STAGE && subStatus === CONVERTED_SUB_STATUS;
