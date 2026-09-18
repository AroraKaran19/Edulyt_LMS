export type LeadStage =
  | "new"
  | "contact-attempt"
  | "connected"
  | "follow-up"
  | "closed";

export interface LeadStageOption {
  value: LeadStage;
  label: string;
}

/** Numbered because the admin grid is read as a funnel, in this order. */
export const LEAD_STAGES: LeadStageOption[] = [
  { value: "new", label: "1. New" },
  { value: "contact-attempt", label: "2. Contact Attempt" },
  { value: "connected", label: "3. Connected" },
  { value: "follow-up", label: "4. Follow-up" },
  { value: "closed", label: "5. Closed" },
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
export const LEAD_SUB_STATUSES: Record<LeadStage, LeadSubStatusOption[]> = {
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

export const isLeadStage = (value: unknown): value is LeadStage =>
  LEAD_STAGES.some((stage) => stage.value === value);

export const subStatusesFor = (stage: unknown): LeadSubStatusOption[] =>
  isLeadStage(stage) ? LEAD_SUB_STATUSES[stage] : [];

/**
 * The sub-status a stage lands on when the stage changes. A stage with one
 * option fills itself in, so New never needs a second click.
 */
export const defaultSubStatusFor = (stage: unknown): string =>
  subStatusesFor(stage)[0]?.value ?? "";

export const leadSubStatusLabel = (stage: unknown, value: unknown): string =>
  subStatusesFor(stage).find((option) => option.value === value)?.label ?? "";

/** "3. Connected / Interested", for a row that shows the pair in one cell. */
export const leadPipelineLabel = (stage: unknown, subStatus: unknown): string => {
  if (!isLeadStage(stage)) return "";
  const sub = leadSubStatusLabel(stage, subStatus);
  return sub ? `${LEAD_STAGE_LABEL[stage]} / ${sub}` : LEAD_STAGE_LABEL[stage];
};

export const STAGE_STYLES: Record<LeadStage, string> = {
  new: "bg-blue-50 text-blue-700 ring-blue-600/20",
  "contact-attempt": "bg-amber-50 text-amber-700 ring-amber-600/20",
  connected: "bg-purple-50 text-purple-700 ring-purple-600/20",
  "follow-up": "bg-orange-50 text-orange-700 ring-orange-600/20",
  closed: "bg-green-50 text-green-700 ring-green-600/20",
};
