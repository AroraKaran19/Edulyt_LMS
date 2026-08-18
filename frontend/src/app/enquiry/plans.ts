export type PlanId = 1 | 2 | 3;

/**
 * What a plan does with a given perk.
 *
 * `note` carries the per-plan value where the plans differ by quantity or
 * wording, e.g. 6 live projects on Mentor-to-Placement vs 1 on Blended.
 */
export type PerkState =
  | { kind: "included"; note?: string }
  | { kind: "addon"; price: number; note?: string }
  | { kind: "excluded" };

export type Perk = {
  label: string;
  /** Set on rows that render their own controls, e.g. the certification picker. */
  id?: "mnc";
  by: Record<PlanId, PerkState>;
};

export type PerkGroup = {
  title: string;
  perks: Perk[];
};

export type Plan = {
  id: PlanId;
  no: string;
  name: string;
  price: number;
  tagline: string;
  /** Shown as the card's footer strapline. */
  bestFor: string;
  /** Only Mentor-to-Placement carries a badge. */
  badge?: string;
};

/** Listing prices only. The internal minimum selling price is not public. */
export const PLANS: Plan[] = [
  {
    id: 1,
    no: "01",
    name: "Blended",
    price: 5999,
    tagline:
      "Self-paced learning with weekly live doubt support to build strong foundations.",
    bestFor: "Best for flexible learners",
  },
  {
    id: 2,
    no: "02",
    name: "Mentor-Led",
    price: 11999,
    tagline:
      "Live guidance from experts to upskill, build projects and grow your confidence.",
    bestFor: "Best for guided learners",
  },
  {
    id: 3,
    no: "03",
    name: "Mentor-to-Placement",
    price: 18999,
    tagline:
      "Everything in Mentor-Led, plus a full placement pipeline into top MNCs.",
    bestFor: "Best for guaranteed placement support",
    badge: "Most chosen",
  },
];

export const MNC_ADDON_PRICE = 3999;

const all = (note?: string): Record<PlanId, PerkState> => ({
  1: { kind: "included", note },
  2: { kind: "included", note },
  3: { kind: "included", note },
});

/** Placement work is Mentor-to-Placement only. */
const placementOnly = (): Record<PlanId, PerkState> => ({
  1: { kind: "excluded" },
  2: { kind: "excluded" },
  3: { kind: "included" },
});

export const PERK_GROUPS: PerkGroup[] = [
  {
    title: "Learning",
    perks: [
      { label: "Recorded sessions", by: all() },
      {
        label: "Live doubt support",
        by: {
          1: { kind: "included", note: "Weekly live doubt sessions" },
          2: { kind: "included", note: "Live sessions + doubt support" },
          3: { kind: "included", note: "Live sessions + doubt support" },
        },
      },
      {
        label: "Live mentorship sessions",
        by: {
          1: { kind: "excluded" },
          2: { kind: "included", note: "15+ hours" },
          3: { kind: "included", note: "15+ hours" },
        },
      },
    ],
  },
  {
    title: "Projects",
    perks: [
      {
        label: "Live projects on real data",
        by: {
          1: { kind: "included", note: "1 project" },
          2: { kind: "included", note: "4 projects" },
          3: { kind: "included", note: "6 projects" },
        },
      },
      {
        label: "Capstone projects",
        by: {
          1: { kind: "included", note: "1 capstone" },
          2: { kind: "included", note: "2 capstones" },
          3: { kind: "included", note: "3 capstones" },
        },
      },
    ],
  },
  {
    title: "Certificates",
    perks: [
      { label: "Internship offer letter", by: all() },
      { label: "Internship certificate", by: all() },
      { label: "Training certificate", by: all() },
      {
        label: "Letter of Recommendation",
        by: {
          1: { kind: "excluded" },
          2: { kind: "excluded" },
          3: { kind: "included" },
        },
      },
    ],
  },
  {
    title: "MNC certification",
    perks: [
      {
        label: "MNC certification with exam",
        id: "mnc",
        by: {
          1: { kind: "addon", price: MNC_ADDON_PRICE },
          2: { kind: "addon", price: MNC_ADDON_PRICE },
          3: { kind: "included", note: "Any 1 free" },
        },
      },
    ],
  },
  {
    title: "Placement assistance",
    perks: [
      { label: "Mock interviews, HR and technical", by: placementOnly() },
      { label: "ATS-optimised resume", by: placementOnly() },
      { label: "Live session with the founder", by: placementOnly() },
      {
        label: "Live sessions with future managers at Tier-1 MNCs",
        by: placementOnly(),
      },
      {
        label: "LinkedIn networking and recommendations from industry leaders",
        by: placementOnly(),
      },
      {
        label:
          "Job alerts, referral support and personal reference at 5 top companies",
        by: placementOnly(),
      },
      {
        label: "Post-placement support, PPO opportunities for top performers",
        by: placementOnly(),
      },
    ],
  },
];

/** Flat view, used for the per-plan counts on the selector. */
export const ALL_PERKS = PERK_GROUPS.flatMap((group) => group.perks);

export const countIncluded = (plan: PlanId) =>
  ALL_PERKS.filter((perk) => perk.by[plan].kind === "included").length;

/**
 * Certification partners. Logos are stored locally in public/enquiry/logos so the
 * page never depends on a third-party host. `height` is tuned per mark so they
 * carry equal optical weight in a row.
 */
export const ISSUERS = [
  { name: "Meta", src: "/enquiry/logos/meta.svg", ratio: 256 / 171, height: 22 },
  {
    name: "Microsoft",
    src: "/enquiry/logos/microsoft.svg",
    ratio: 1,
    height: 24,
  },
  { name: "Adobe", src: "/enquiry/logos/adobe.svg", ratio: 91 / 80, height: 26 },
  { name: "Cisco", src: "/enquiry/logos/cisco.svg", ratio: 52 / 28, height: 26 },
];

/** The three steps the programme is built around. A real sequence, so numbered. */
export const STEPS = [
  {
    no: "01",
    title: "Learn",
    body: "Recorded sessions, live doubt support and projects built on real data, not toy exercises.",
  },
  {
    no: "02",
    title: "Get mentored",
    body: "15+ hours of live mentorship from people doing the work, reviewing what you build.",
  },
  {
    no: "03",
    title: "Get placed",
    body: "Mock interviews, an ATS-ready resume, referrals into 5 top companies and PPO support after you land.",
  },
];

/**
 * The three ways a certificate can be earned. Shared by the certificate cards
 * and the summary above them, so the summary cannot claim something the list
 * contradicts.
 */
export const AVAILABILITY = {
  everyPlan: "Every plan, on completion",
  topPlan: "Plan 03, on completion",
  mnc: "Free on Plan 03, add-on elsewhere",
} as const;

export type Availability = (typeof AVAILABILITY)[keyof typeof AVAILABILITY];

/**
 * The documents a student walks away with.
 *
 * Each file holds one certificate, already cropped. The Meta/Microsoft and
 * Adobe/Cisco originals arrived two to a sheet, so they were cut as real files
 * rather than framed with CSS, which clipped at some viewport widths.
 */
export type Certificate = {
  title: string;
  issuer: string;
  blurb: string;
  src: string;
  /** Which plans this comes with. */
  availability: Availability;
};

export const CERTIFICATES: Certificate[] = [
  {
    title: "Digital Marketing Associate",
    issuer: "Meta",
    blurb:
      "Sat and passed with Certiport and Pearson VUE. Verifiable by certificate ID.",
    src: "/enquiry/certificates/mnc-meta.jpg",
    availability: AVAILABILITY.mnc,
  },
  {
    title: "Azure AI Fundamentals",
    issuer: "Microsoft",
    blurb:
      "Microsoft Certified credential, signed off by the exam body and listed on your transcript.",
    src: "/enquiry/certificates/mnc-microsoft.jpg",
    availability: AVAILABILITY.mnc,
  },
  {
    title: "Adobe Certified Professional",
    issuer: "Adobe",
    blurb:
      "Industry credential for creative and design tooling, verifiable through Certiport.",
    src: "/enquiry/certificates/mnc-adobe.jpg",
    availability: AVAILABILITY.mnc,
  },
  {
    title: "Support Technician, Cybersecurity",
    issuer: "Cisco",
    blurb:
      "CCST Cybersecurity, the entry credential recruiters look for in security roles.",
    src: "/enquiry/certificates/mnc-cisco.jpg",
    availability: AVAILABILITY.mnc,
  },
  {
    title: "Internship offer letter",
    issuer: "Airkrit India",
    blurb:
      "Issued on company letterhead with your intern ID, domain and duration.",
    src: "/enquiry/certificates/doc-offer-letter.jpg",
    availability: AVAILABILITY.everyPlan,
  },
  {
    title: "Internship certificate",
    issuer: "Airkrit India",
    blurb:
      "Confirms the domain you worked in, the period, and the live projects you shipped.",
    src: "/enquiry/certificates/doc-internship-certificate.jpg",
    availability: AVAILABILITY.everyPlan,
  },
  {
    title: "Training certificate",
    issuer: "Airkrit India",
    blurb:
      "Names the course and the skills covered, with a QR code for instant verification.",
    src: "/enquiry/certificates/doc-training-certificate.jpg",
    availability: AVAILABILITY.everyPlan,
  },
  {
    title: "Letter of Recommendation",
    issuer: "Airkrit India",
    blurb:
      "Written about your actual performance in sessions and project work, signed by HR.",
    src: "/enquiry/certificates/doc-recommendation.jpg",
    availability: AVAILABILITY.topPlan,
  },
];

export type Badge = {
  /** What the badge certifies. The artwork already spells this out. */
  name: string;
  issuer: "Microsoft" | "Pearson";
  /** Microsoft Office Specialist tier. The Pearson badges carry no tier. */
  level?: "Associate" | "Expert";
  src: string;
};

/**
 * `.webp` rather than the `.svg` masters beside them: the source files are
 * traced vectors totalling 3MB, one of them 2MB alone, against 53KB for the set
 * at display size.
 *
 * Two badges in `/public/badges` are deliberately absent:
 * `instructor-cybersecurity.svg` is an Authorized Instructor credential, which
 * belongs to a trainer rather than a student, and `mos-expert-generic.svg`
 * names no application.
 */
export const BADGES: Badge[] = [
  {
    name: "Python",
    issuer: "Pearson",
    src: "/badges/it-specialist-python.webp",
  },
  {
    name: "Data Analytics",
    issuer: "Pearson",
    src: "/badges/it-specialist-data-analytics.webp",
  },
  {
    name: "Excel",
    issuer: "Microsoft",
    level: "Expert",
    src: "/badges/mos-excel-expert.webp",
  },
  {
    name: "Excel",
    issuer: "Microsoft",
    level: "Associate",
    src: "/badges/mos-excel-associate.webp",
  },
  {
    name: "Word",
    issuer: "Microsoft",
    level: "Associate",
    src: "/badges/mos-word-associate.webp",
  },
  {
    name: "PowerPoint",
    issuer: "Microsoft",
    level: "Associate",
    src: "/badges/mos-powerpoint-associate.webp",
  },
];

/**
 * The offer strip above the hero.
 *
 * Deliberately no countdown and no figure. A clock that restarts each visit is
 * false urgency, and a number here would contradict the counsellor, who is the
 * one who settles the price.
 */
export const OFFER = {
  label: "Admissions open",
  headline: "Talk to a counsellor before this intake closes",
  body: "Plan pricing and any discount that applies are confirmed on the call, usually within one working day.",
};

/**
 * The same mock CV with a different partner badge on each, which is why the
 * copy says so rather than implying four different students.
 */
export const SAMPLE_RESUMES = [
  {
    partner: "Meta",
    credential: "Digital Marketing Associate",
    src: "/sample_resumes/resume-meta-digital-marketing.webp",
  },
  {
    partner: "Microsoft",
    credential: "Office Specialist, PowerPoint",
    src: "/sample_resumes/resume-microsoft-powerpoint.webp",
  },
  {
    partner: "Cisco",
    credential: "CCST Cybersecurity",
    src: "/sample_resumes/resume-cisco-cybersecurity.webp",
  },
  {
    partner: "Adobe",
    credential: "Certified Professional",
    src: "/sample_resumes/resume-adobe-professional.webp",
  },
];

/**
 * English is the only language the whole catalogue is taught in. Every other
 * language here, Hindi included, covers select courses only, which is what the
 * section copy has to say rather than the list implying parity.
 *
 * Nothing on a course record marks which of these a given course is available
 * in, so the copy cannot name a count or point at specific courses.
 */
export const COURSE_LANGUAGES = [
  { label: "English", native: "English", code: "en" },
  { label: "Hindi", native: "हिन्दी", code: "hi" },
  { label: "Tamil", native: "தமிழ்", code: "ta" },
  { label: "Marathi", native: "मराठी", code: "mr" },
  { label: "Telugu", native: "తెలుగు", code: "te" },
  { label: "Kannada", native: "ಕನ್ನಡ", code: "kn" },
];

/** Google Business rating, shown as social proof in the hero. */
export const RATING = {
  score: 4.7,
  count: 116,
  source: "Google reviews",
};
