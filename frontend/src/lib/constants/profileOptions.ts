/**
 * Shared option lists for student profile fields, reused across the checkout
 * flow (CartForm), the profile page, and the onboarding completion gate so all
 * three present identical choices.
 *
 * `DEGREE_OPTIONS` and `EXPERIENCE_LEVELS` were previously duplicated inline in
 * `cart/CartForm.tsx` and `(account)/profile/page.tsx`; this is the single
 * source of truth.
 */

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
  {
    value: "Working Professional - Tech Domain",
    label: "Working Professional - Tech Domain",
  },
  {
    value: "Working Professional - Non Tech Domain",
    label: "Working Professional - Non Tech Domain",
  },
];
