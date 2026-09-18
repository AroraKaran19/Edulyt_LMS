/**
 * The pipeline a fresh environment starts with. It is a seed, not the truth:
 * once written, `LeadPipelineSettings` owns the stages and the admin edits them
 * at /admin/settings/lead-pipeline. Nothing outside the seeding path should
 * read this.
 *
 * `key` is what a lead stores, so these values are effectively permanent for
 * any environment that has already run.
 */
export interface SeedSubStatus {
  key: string;
  label: string;
  order: number;
  active: boolean;
  isConversion: boolean;
}

export interface SeedStage {
  key: string;
  label: string;
  order: number;
  active: boolean;
  isDefault: boolean;
  subStatuses: SeedSubStatus[];
}

const sub = (
  key: string,
  label: string,
  order: number,
  isConversion = false,
): SeedSubStatus => ({ key, label, order, active: true, isConversion });

export const SEED_LEAD_PIPELINE: SeedStage[] = [
  {
    key: "new",
    label: "New",
    order: 0,
    active: true,
    isDefault: true,
    subStatuses: [sub("new-lead", "New Lead", 0)],
  },
  {
    key: "contact-attempt",
    label: "Contact Attempt",
    order: 1,
    active: true,
    isDefault: false,
    subStatuses: [
      sub("dnp-1", "DNP 1", 0),
      sub("dnp-2", "DNP 2", 1),
      sub("switched-off", "Switched Off", 2),
      sub("voicemail", "Voicemail", 3),
      sub("wrong-number", "Wrong Number", 4),
      sub("declined", "Declined", 5),
    ],
  },
  {
    key: "connected",
    label: "Connected",
    order: 2,
    active: true,
    isDefault: false,
    subStatuses: [
      sub("connected", "Connected", 0),
      sub("not-interested", "Not Interested", 1),
      sub("already-doing-internship", "Already Doing Internship", 2),
      sub("future-lead", "Future Lead", 3),
      sub("interested", "Interested", 4),
      sub("forced-to-fill", "Forced To Fill", 5),
      sub("financial-issues", "Financial Issues", 6),
    ],
  },
  {
    key: "follow-up",
    label: "Follow-up",
    order: 3,
    active: true,
    isDefault: false,
    subStatuses: [
      sub("callback-requested", "Callback Requested", 0),
      sub("call-back-later", "Call Back Later", 1),
      sub("discussion-with-family", "Discussion with Family", 2),
      sub("fees-problem", "Fees Problem", 3),
      sub("interested-decision-pending", "Interested - Decision Pending", 4),
      sub("program-details-shared", "Program Details Shared", 5),
      sub("demo-attended", "Demo Attended", 6),
      sub("payment-link-shared", "Payment Link Shared", 7),
    ],
  },
  {
    key: "closed",
    label: "Closed",
    order: 4,
    active: true,
    isDefault: false,
    subStatuses: [
      sub("won", "Won", 0, true),
      sub("declined", "Declined", 1),
      sub("future-lead", "Future Lead", 2),
    ],
  },
];
