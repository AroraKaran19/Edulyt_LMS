/**
 * Shared option lists for student profile fields, reused across the checkout
 * flow (CartForm), the profile page, and the onboarding completion gate so all
 * three present identical choices.
 *
 * `DEGREE_OPTIONS` and `EXPERIENCE_LEVELS` were previously duplicated inline in
 * `cart/CartForm.tsx` and `(account)/profile/page.tsx`; this is the single
 * source of truth.
 */

import { COUNTRY_CODES } from "@/constants/countryCodes";

export interface ProfileOption {
  value: string;
  label: string;
}

/** Course / degree names. Ends with "Other" → free-text fallback. */
export const DEGREE_OPTIONS: ProfileOption[] = [
  { value: "BA", label: "BA" },
  { value: "BSc", label: "BSc" },
  { value: "BCom", label: "BCom" },
  { value: "BBA", label: "BBA" },
  { value: "BCA", label: "BCA" },
  { value: "BTech/BE", label: "BTech/BE" },
  { value: "BArch", label: "BArch" },
  { value: "BDes", label: "BDes" },
  { value: "BFA", label: "BFA" },
  { value: "LLB", label: "LLB" },
  { value: "MBBS", label: "MBBS" },
  { value: "BDS", label: "BDS" },
  { value: "BPharm", label: "BPharm" },
  { value: "BPT", label: "BPT" },
  { value: "BHMS", label: "BHMS" },
  { value: "BAMS", label: "BAMS" },
  { value: "BNYS", label: "BNYS" },
  { value: "BSc Nursing", label: "BSc Nursing" },
  { value: "B.VSc & AH", label: "B.VSc & AH" },
  { value: "BSW", label: "BSW" },
  { value: "BEd", label: "BEd" },
  { value: "B.Lib.Sc", label: "B.Lib.Sc" },
  { value: "BJMC", label: "BJMC" },
  { value: "BHM", label: "BHM" },
  { value: "BFTech", label: "BFTech" },
  { value: "B.Sc. Agriculture", label: "B.Sc. Agriculture" },
  { value: "BSc IT", label: "BSc IT" },
  { value: "BSc Biotechnology", label: "BSc Biotechnology" },
  { value: "BSc Animation", label: "BSc Animation" },
  { value: "BSc Fashion Designing", label: "BSc Fashion Designing" },
  { value: "B.Voc", label: "B.Voc" },
  {
    value: "BSc Nursing (Post Basic)",
    label: "BSc Nursing (Post Basic) - For diploma holders advancing to degree",
  },
  { value: "MA", label: "MA" },
  { value: "MSc", label: "MSc" },
  { value: "MCom", label: "MCom" },
  { value: "MBA", label: "MBA" },
  { value: "MCA", label: "MCA" },
  { value: "MTech/ME", label: "MTech/ME" },
  { value: "MArch", label: "MArch" },
  { value: "MDes", label: "MDes" },
  { value: "MFA", label: "MFA" },
  { value: "LLM", label: "LLM" },
  { value: "MS", label: "MS" },
  { value: "MDS", label: "MDS" },
  { value: "MPharm", label: "MPharm" },
  { value: "MPT", label: "MPT" },
  { value: "MPH", label: "MPH" },
  { value: "M.Lib.Sc", label: "M.Lib.Sc" },
  { value: "MJMC", label: "MJMC" },
  { value: "MEd", label: "MEd" },
  { value: "M.Voc", label: "M.Voc" },
  { value: "MD (Postgraduate Medical)", label: "MD (Postgraduate Medical)" },
  { value: "PhD/DPhil", label: "PhD/DPhil" },
  { value: "DM", label: "DM" },
  { value: "MCh", label: "MCh" },
  { value: "MD (Ayurveda)", label: "MD (Ayurveda)" },
  {
    value: "MDS (Ayurveda/Homeopathy)",
    label: "MDS (Ayurveda/Homeopathy)",
  },
  { value: "DPharm", label: "DPharm" },
  { value: "PGDM", label: "PGDM (Post Graduate Diploma in Management)" },
  {
    value: "PGDBA",
    label: "PGDBA (Post Graduate Diploma in Business Administration)",
  },
  { value: "DMLT", label: "DMLT (Diploma in Medical Laboratory Technology)" },
  { value: "DPT", label: "DPT (Diploma in Physiotherapy)" },
  {
    value: "BTech + MTech (5-year integrated)",
    label: "BTech + MTech (5-year integrated)",
  },
  {
    value: "BA + MA (5-year integrated)",
    label: "BA + MA (5-year integrated)",
  },
  {
    value: "BBA + MBA (5-year integrated)",
    label: "BBA + MBA (5-year integrated)",
  },
  { value: "Other", label: "Other/Not Specified" },
];

/** Student experience levels. Values are also used to gate working-professional
 *  fields on the profile page — do not change the strings without updating that
 *  conditional. */
export const EXPERIENCE_LEVELS: ProfileOption[] = [
  { value: "College Student - 1st Year", label: "College Student - 1st Year" },
  { value: "College Student - 2nd Year", label: "College Student - 2nd Year" },
  { value: "College Student - 3rd Year", label: "College Student - 3rd Year" },
  { value: "College Student - 4th Year", label: "College Student - 4th Year" },
  { value: "Passed Out & Unemployed", label: "Passed Out & Unemployed" },
  {
    value: "Working Professional - Tech Domain",
    label: "Working Professional - Tech Domain",
  },
  {
    value: "Working Professional - Non Tech Domain",
    label: "Working Professional - Non Tech Domain",
  },
];

/** Father's occupation categories. Ends with "Other" → free-text fallback.
 *  Shared by the checkout flow (CartForm) and the profile page. */
export const FATHER_OCCUPATION_OPTIONS: ProfileOption[] = [
  {
    value: "Professional",
    label: "Professional (Doctors, Engineers, Teachers, Lawyers, Accountants)",
  },
  { value: "Managerial/Executive", label: "Managerial/Executive" },
  {
    value: "Skilled Worker/Technician",
    label: "Skilled Worker/Technician (Electricians, Mechanics, Technicians)",
  },
  {
    value: "Service Worker",
    label: "Service Worker (Sales, Food Service, Protective Services)",
  },
  { value: "Agriculture/Farming", label: "Agriculture/Farming" },
  { value: "Homemaker", label: "Homemaker" },
  { value: "Unemployed/Retired", label: "Unemployed/Retired" },
  { value: "Other", label: "Other/Not Specified" },
];

/** Indian states and union territories. Ends with "Other" → free-text
 *  fallback so users outside this list can still type their state. */
export const STATE_OPTIONS: ProfileOption[] = [
  { value: "Andhra Pradesh", label: "Andhra Pradesh" },
  { value: "Arunachal Pradesh", label: "Arunachal Pradesh" },
  { value: "Assam", label: "Assam" },
  { value: "Bihar", label: "Bihar" },
  { value: "Chhattisgarh", label: "Chhattisgarh" },
  { value: "Goa", label: "Goa" },
  { value: "Gujarat", label: "Gujarat" },
  { value: "Haryana", label: "Haryana" },
  { value: "Himachal Pradesh", label: "Himachal Pradesh" },
  { value: "Jharkhand", label: "Jharkhand" },
  { value: "Karnataka", label: "Karnataka" },
  { value: "Kerala", label: "Kerala" },
  { value: "Madhya Pradesh", label: "Madhya Pradesh" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Manipur", label: "Manipur" },
  { value: "Meghalaya", label: "Meghalaya" },
  { value: "Mizoram", label: "Mizoram" },
  { value: "Nagaland", label: "Nagaland" },
  { value: "Odisha", label: "Odisha" },
  { value: "Punjab", label: "Punjab" },
  { value: "Rajasthan", label: "Rajasthan" },
  { value: "Sikkim", label: "Sikkim" },
  { value: "Tamil Nadu", label: "Tamil Nadu" },
  { value: "Telangana", label: "Telangana" },
  { value: "Tripura", label: "Tripura" },
  { value: "Uttar Pradesh", label: "Uttar Pradesh" },
  { value: "Uttarakhand", label: "Uttarakhand" },
  { value: "West Bengal", label: "West Bengal" },
  { value: "Andaman and Nicobar Islands", label: "Andaman and Nicobar Islands" },
  { value: "Chandigarh", label: "Chandigarh" },
  {
    value: "Dadra and Nagar Haveli and Daman and Diu",
    label: "Dadra and Nagar Haveli and Daman and Diu",
  },
  {
    value: "Delhi (National Capital Territory)",
    label: "Delhi (National Capital Territory)",
  },
  { value: "Jammu and Kashmir", label: "Jammu and Kashmir" },
  { value: "Ladakh", label: "Ladakh" },
  { value: "Lakshadweep", label: "Lakshadweep" },
  { value: "Puducherry", label: "Puducherry" },
  { value: "Other", label: "Other" },
];

/** Every country from the phone dial-code list, alphabetical. Ends with
 *  "Other" → free-text fallback. */
export const COUNTRY_OPTIONS: ProfileOption[] = [
  ...COUNTRY_CODES.map(({ name }) => ({ value: name, label: name })),
  { value: "Other", label: "Other" },
];

/** Student areas of interest (analytics/AI tracks). Ends with "Other" →
 *  free-text fallback so users can enter their own. */
export const AREA_OF_INTEREST_OPTIONS: ProfileOption[] = [
  {
    value: "Basic Analytics Skill",
    label: "Basic Analytics Skill - Excel, SQL, Python",
  },
  {
    value: "Analysis & Visualization",
    label:
      "Analysis & Visualization – Data exploration, dashboards, reporting (Excel, Tableau, Power BI)",
  },
  {
    value: "Programming & Databases",
    label: "Programming & Databases – Python, R, SQL, database management",
  },
  {
    value: "Machine Learning & AI",
    label:
      "Machine Learning & AI – Supervised & unsupervised learning, predictive modeling",
  },
  {
    value: "Deep Learning & NLP",
    label:
      "Deep Learning & NLP – Neural networks, computer vision, natural language processing",
  },
  {
    value: "Big Data & Cloud Analytics",
    label: "Big Data & Cloud Analytics – Hadoop, Spark, AWS, Azure, GCP",
  },
  {
    value: "Business & Financial Analytics",
    label:
      "Business & Financial Analytics – Marketing, HR, finance, retail analytics",
  },
  {
    value: "Operations & Supply Chain Analytics",
    label:
      "Operations & Supply Chain Analytics – Process optimization, logistics, operations data",
  },
  {
    value: "Data Engineering",
    label: "Data Engineering – ETL pipelines, data warehousing, data modeling",
  },
  {
    value: "AI Ethics & Responsible AI",
    label: "AI Ethics & Responsible AI – Fairness, bias mitigation, AI governance",
  },
  {
    value: "Automation & RPA",
    label: "Automation & RPA – Workflow automation, AI-powered automation tools",
  },
  {
    value: "Career & Skill Development",
    label:
      "Career & Skill Development – Data scientist, ML engineer, analytics consultant roles",
  },
  {
    value: "Emerging Technologies & Trends",
    label:
      "Emerging Technologies & Trends – IoT analytics, edge AI, advanced predictive modeling",
  },
  { value: "Other", label: "Other" },
];

/** Working-professional domains/industries. Ends with "Other" → free-text
 *  fallback so users can enter their own. Shown on the profile page only when
 *  the experience level is a Working Professional variant. */
export const DOMAIN_OPTIONS: ProfileOption[] = [
  {
    value: "Analytics / Data Science",
    label:
      "Analytics / Data Science – General analytics, business intelligence, predictive modeling",
  },
  {
    value: "Consulting",
    label:
      "Consulting – Management consulting, strategy, operations, analytics consulting",
  },
  {
    value: "Banking & Finance",
    label:
      "Banking & Finance – Investment banking, retail banking, FinTech, risk analytics",
  },
  {
    value: "Pharmaceuticals / Healthcare",
    label:
      "Pharmaceuticals / Healthcare – Drug development, clinical analytics, hospital/healthcare analytics",
  },
  {
    value: "Retail & E-commerce",
    label:
      "Retail & E-commerce – Customer analytics, inventory optimization, sales forecasting",
  },
  {
    value: "Telecom / IT",
    label:
      "Telecom / IT – Network analytics, IT operations, software & services analytics",
  },
  {
    value: "FMCG / Consumer Goods",
    label:
      "FMCG / Consumer Goods – Market analytics, consumer behavior, supply chain analytics",
  },
  {
    value: "Manufacturing & Operations",
    label:
      "Manufacturing & Operations – Production analytics, quality control, process optimization",
  },
  {
    value: "Energy & Utilities",
    label:
      "Energy & Utilities – Smart grid, resource analytics, renewable energy analytics",
  },
  {
    value: "Education / EdTech",
    label:
      "Education / EdTech – Learning analytics, student performance, course recommendation",
  },
  {
    value: "Logistics & Supply Chain",
    label:
      "Logistics & Supply Chain – Transportation optimization, warehouse analytics, demand forecasting",
  },
  {
    value: "Government / Public Policy",
    label:
      "Government / Public Policy – Policy analytics, census data, urban planning analytics",
  },
  { value: "Other", label: "Other" },
];
