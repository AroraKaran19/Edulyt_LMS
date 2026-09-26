import type { LeadAnswer } from "../types/lead";
import type { Brand } from "../constants/brands";
import {
  CAREER_STAGES,
  DEGREE_OPTIONS,
  ENQUIRY_LANGUAGES,
  ENQUIRY_PLANS,
  FREE_CERT_PLAN_ID,
  MNC_CERTIFICATIONS,
  type CareerStage,
  type EnquiryLanguage,
  type EnquiryPlan,
  type MncCertification,
} from "../constants/enquiryProfile";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const BRAND_NAME: Record<Brand, string> = { airkrit: "Airkrit", edulyt: "Edulyt" };

/** The enquiry form's fields, shared by form leads and imported leads so both read the same. */
export interface EnquiryProfile {
  college: string;
  collegeEmail: string;
  languages: EnquiryLanguage[];
  degree: string;
  careerStage: CareerStage;
  plan: EnquiryPlan;
  certification: MncCertification | null;
}

export interface EnquiryProfileInput {
  college?: unknown;
  collegeEmail?: unknown;
  /** An array from the form, comma-separated text from a spreadsheet. */
  languages?: unknown;
  degree?: unknown;
  careerStage?: unknown;
  /** A plan id from the form, a plan name from a spreadsheet. */
  plan?: unknown;
  certification?: unknown;
}

export type ParsedEnquiryProfile =
  | { ok: true; profile: EnquiryProfile }
  | { ok: false; error: string };

const text = (value: unknown): string =>
  value === undefined || value === null ? "" : String(value).trim();

const canonical = <T extends string>(list: readonly T[], raw: string): T | undefined => {
  const needle = raw.toLowerCase();
  return list.find((value) => value.toLowerCase() === needle);
};

const findPlan = (raw: unknown): EnquiryPlan | undefined => {
  const value = text(raw);
  if (!value) return undefined;
  const byId = ENQUIRY_PLANS.find((plan) => String(plan.id) === value);
  return byId ?? ENQUIRY_PLANS.find((plan) => plan.name.toLowerCase() === value.toLowerCase());
};

const fail = (error: string): ParsedEnquiryProfile => ({ ok: false, error });

export const parseEnquiryProfile = (input: EnquiryProfileInput): ParsedEnquiryProfile => {
  const college = text(input.college);
  if (college.length < 2 || college.length > 240) return fail("College is required");

  const collegeEmail = text(input.collegeEmail).toLowerCase();
  if (collegeEmail.length > 160 || !EMAIL_RE.test(collegeEmail)) {
    return fail("A valid college email is required");
  }

  const rawLanguages = Array.isArray(input.languages)
    ? input.languages.map(text)
    : text(input.languages).split(",").map((part) => part.trim());
  const languages: EnquiryLanguage[] = [];
  for (const raw of rawLanguages.filter(Boolean)) {
    const language = canonical(ENQUIRY_LANGUAGES, raw);
    if (!language) return fail(`Unknown language: ${raw.slice(0, 40)}`);
    if (!languages.includes(language)) languages.push(language);
  }
  if (languages.length === 0) return fail("Pick at least one language");

  const degreeRaw = text(input.degree);
  if (!degreeRaw || degreeRaw.length > 120) return fail("Degree is required");
  // The form turns "Other" into a typed degree, so the bare word never reaches a lead.
  if (degreeRaw.toLowerCase() === "other") return fail("Type the degree instead of Other");
  const degree = canonical(DEGREE_OPTIONS, degreeRaw) ?? degreeRaw;

  const careerStage = canonical(CAREER_STAGES, text(input.careerStage));
  if (!careerStage) return fail("Choose a career stage from the list");

  const plan = findPlan(input.plan);
  if (!plan) return fail(`plan must be one of: ${ENQUIRY_PLANS.map((p) => p.name).join(", ")}`);

  const certificationRaw = text(input.certification);
  const certification = certificationRaw
    ? canonical(MNC_CERTIFICATIONS, certificationRaw)
    : null;
  if (certification === undefined) {
    return fail(`certification must be blank or one of: ${MNC_CERTIFICATIONS.join(", ")}`);
  }

  return {
    ok: true,
    profile: { college, collegeEmail, languages, degree, careerStage, plan, certification },
  };
};

const CORE_KEYS = new Set([
  "college",
  "college-email",
  "languages",
  "degree",
  "career-stage",
  "plan",
  "certification",
  "total",
]);

/**
 * The answer rows a sales person reads, in one fixed order and wording.
 * `extra` holds referral-link questions or spreadsheet extras; they cannot
 * overwrite a core row.
 */
export const buildEnquiryAnswers = (
  profile: EnquiryProfile,
  brand: Brand,
  extra: LeadAnswer[] = [],
  total?: number,
): LeadAnswer[] => [
  { key: "college", label: "College", value: profile.college },
  { key: "college-email", label: "College email", value: profile.collegeEmail },
  { key: "languages", label: "Languages", value: profile.languages.join(", ") },
  { key: "degree", label: "Degree", value: profile.degree },
  { key: "career-stage", label: "Career stage", value: profile.careerStage },
  ...extra.filter((answer) => answer.value && !CORE_KEYS.has(answer.key)),
  {
    key: "plan",
    label: "Plan you are interested in",
    value: `${profile.plan.name} (Plan 0${profile.plan.id})`,
  },
  {
    key: "certification",
    label: "MNC certification",
    value: profile.certification
      ? profile.plan.id === FREE_CERT_PLAN_ID
        ? `${profile.certification} (included free)`
        : `${profile.certification} (add-on)`
      : `${BRAND_NAME[brand]} certificates only (no MNC exam)`,
  },
  ...(total !== undefined
    ? [{ key: "total", label: "Quoted total", value: `₹${total.toLocaleString("en-IN")}` }]
    : []),
];
