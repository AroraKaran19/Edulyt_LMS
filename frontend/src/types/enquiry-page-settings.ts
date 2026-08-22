/**
 * CMS singleton for `/enquiry`. Every field is optional: anything missing
 * falls back to the constants in `src/app/enquiry/plans.ts`.
 */

export interface EnquiryCta {
  label?: string;
  /** An uploaded document's URL, or any link the admin pasted. */
  href?: string;
  /** Which tab produced `href`, so the editor reopens on the right one. */
  source?: "upload" | "url";
  /** Present for an upload, so removing it also deletes the S3 object. */
  s3Key?: string;
}

export interface EnquiryInstructor {
  name?: string;
  /** Optional line under the name, e.g. "Lead mentor, Data Science". */
  title?: string;
  src?: string;
  source?: "upload" | "url";
  s3Key?: string;
}

export interface EnquiryOfferSettings {
  enabled?: boolean;
  label?: string;
  headline?: string;
  body?: string;
}

export interface EnquiryPartnerLogo {
  name?: string;
  src?: string;
  /** Optical-weight tuning per mark. */
  height?: number;
  ratio?: number;
}

export interface EnquiryHeroSettings {
  eyebrow?: string;
  headingLine1?: string;
  headingLine2?: string;
  /** Rich text: partner names are emphasised mid-sentence. */
  introHtml?: string;
  primaryCta?: EnquiryCta;
  secondaryCta?: EnquiryCta;
  ratingScore?: number;
  ratingCount?: number;
  ratingSource?: string;
  ratingLabel?: string;
  partnersHeading?: string;
  partners?: EnquiryPartnerLogo[];
  marquee?: string[];
}

/** The certificates summary groups by this exact value, so never free text. */
export type EnquiryAvailability =
  | "Every plan, on completion"
  | "Plan 03, on completion"
  | "Free on Plan 03, add-on elsewhere";

export interface EnquiryCertificate {
  title?: string;
  issuer?: string;
  blurb?: string;
  src?: string;
  availability?: EnquiryAvailability;
}

export interface EnquiryCertificatesSettings {
  eyebrow?: string;
  heading?: string;
  headingHighlight?: string;
  lead?: string;
  items?: EnquiryCertificate[];
}

export interface EnquiryBadge {
  name?: string;
  issuer?: string;
  level?: string;
  src?: string;
}

export interface EnquiryBadgesSettings {
  eyebrow?: string;
  heading?: string;
  headingHighlight?: string;
  lead?: string;
  items?: EnquiryBadge[];
}

export interface EnquiryResume {
  partner?: string;
  credential?: string;
  src?: string;
}

export interface EnquiryResumesSettings {
  eyebrow?: string;
  heading?: string;
  headingHighlight?: string;
  lead?: string;
  items?: EnquiryResume[];
}

export interface EnquiryLanguage {
  label?: string;
  native?: string;
  /** BCP-47; lands on a `lang` attribute, so it must be a real tag. */
  code?: string;
}

export interface EnquiryLanguagesSettings {
  heading?: string;
  headingHighlight?: string;
  lead?: string;
  items?: EnquiryLanguage[];
}

/** Fixed: the lead proxy validates against exactly these three. */
export type EnquiryPlanId = 1 | 2 | 3;

export interface EnquiryPlan {
  id?: EnquiryPlanId;
  no?: string;
  name?: string;
  price?: number;
  tagline?: string;
  bestFor?: string;
  badge?: string;
}

export type EnquiryPerkKind = "included" | "addon" | "excluded";

export interface EnquiryPerkState {
  kind?: EnquiryPerkKind;
  note?: string;
  price?: number;
}

export interface EnquiryPerk {
  label?: string;
  id?: string;
  by?: Partial<Record<"1" | "2" | "3", EnquiryPerkState>>;
}

export interface EnquiryPerkGroup {
  title?: string;
  perks?: EnquiryPerk[];
}

export interface EnquiryPlansSettings {
  eyebrow?: string;
  heading?: string;
  headingHighlight?: string;
  lead?: string;
  /** Header on the availability summary card, which renders in this section. */
  summaryHeader?: string;
  mncAddonPrice?: number;
  plans?: EnquiryPlan[];
  perkGroups?: EnquiryPerkGroup[];
  /** Label above the instructor picker. */
  instructorsHeading?: string;
  /** Sits at the foot of the perk columns. Empty renders nothing at all. */
  instructors?: EnquiryInstructor[];
}

export interface EnquiryStep {
  no?: string;
  title?: string;
  body?: string;
}

export interface EnquiryHowItRunsSettings {
  eyebrow?: string;
  heading?: string;
  headingHighlight?: string;
  lead?: string;
  steps?: EnquiryStep[];
}

export interface EnquiryTrackRecordSettings {
  heading?: string;
  headingHighlight?: string;
  lead?: string;
}

export interface EnquiryClosingSettings {
  heading?: string;
  body?: string;
  ctaLabel?: string;
}

export interface EnquiryPageSettings {
  offer?: EnquiryOfferSettings;
  hero?: EnquiryHeroSettings;
  certificates?: EnquiryCertificatesSettings;
  badges?: EnquiryBadgesSettings;
  resumes?: EnquiryResumesSettings;
  languages?: EnquiryLanguagesSettings;
  plans?: EnquiryPlansSettings;
  howItRuns?: EnquiryHowItRunsSettings;
  trackRecord?: EnquiryTrackRecordSettings;
  closing?: EnquiryClosingSettings;
}

/** Mirrors the backend allowlist. */
export const ENQUIRY_SECTION_KEYS = [
  "offer",
  "hero",
  "certificates",
  "badges",
  "resumes",
  "languages",
  "plans",
  "howItRuns",
  "trackRecord",
  "closing",
] as const satisfies ReadonlyArray<keyof EnquiryPageSettings>;

export type EnquirySectionKey = (typeof ENQUIRY_SECTION_KEYS)[number];
