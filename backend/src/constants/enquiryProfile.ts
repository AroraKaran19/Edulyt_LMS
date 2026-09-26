// Mirrors frontend/src/lib/constants/profileOptions.ts; keep both in step.
export const DEGREE_OPTIONS = [
  "BA",
  "BSc",
  "BCom",
  "BBA",
  "BCA",
  "BTech/BE",
  "BArch",
  "BDes",
  "BFA",
  "LLB",
  "MBBS",
  "BDS",
  "BPharm",
  "BPT",
  "BHMS",
  "BAMS",
  "BNYS",
  "BSc Nursing",
  "B.VSc & AH",
  "BSW",
  "BEd",
  "B.Lib.Sc",
  "BJMC",
  "BHM",
  "BFTech",
  "B.Sc. Agriculture",
  "BSc IT",
  "BSc Biotechnology",
  "BSc Animation",
  "BSc Fashion Designing",
  "B.Voc",
  "BSc Nursing (Post Basic)",
  "MA",
  "MSc",
  "MCom",
  "MBA",
  "MCA",
  "MTech/ME",
  "MArch",
  "MDes",
  "MFA",
  "LLM",
  "MS",
  "MDS",
  "MPharm",
  "MPT",
  "MPH",
  "M.Lib.Sc",
  "MJMC",
  "MEd",
  "M.Voc",
  "MD (Postgraduate Medical)",
  "PhD/DPhil",
  "DM",
  "MCh",
  "MD (Ayurveda)",
  "MDS (Ayurveda/Homeopathy)",
  "DPharm",
  "PGDM",
  "PGDBA",
  "DMLT",
  "DPT",
  "BTech + MTech (5-year integrated)",
  "BA + MA (5-year integrated)",
  "BBA + MBA (5-year integrated)",
] as const;

export const CAREER_STAGES = [
  "College Student - 1st Year",
  "College Student - 2nd Year",
  "College Student - 3rd Year",
  "College Student - 4th Year",
  "Passed Out & Unemployed",
  "Working Professional - Tech Domain",
  "Working Professional - Non Tech Domain",
] as const;
export type CareerStage = (typeof CAREER_STAGES)[number];

// The languages the /enquiry page advertises, not the wider CA-form list.
export const ENQUIRY_LANGUAGES = [
  "English",
  "Hindi",
  "Tamil",
  "Marathi",
  "Telugu",
  "Kannada",
] as const;
export type EnquiryLanguage = (typeof ENQUIRY_LANGUAGES)[number];

export const ENQUIRY_PLANS = [
  { id: 1, name: "Blended" },
  { id: 2, name: "Mentor-Led" },
  { id: 3, name: "Mentor-to-Placement" },
] as const;
export type EnquiryPlan = (typeof ENQUIRY_PLANS)[number];

/** The plan that includes one MNC certification at no extra cost. */
export const FREE_CERT_PLAN_ID = 3;

export const MNC_CERTIFICATIONS = ["Meta", "Microsoft", "Adobe", "Cisco"] as const;
export type MncCertification = (typeof MNC_CERTIFICATIONS)[number];
