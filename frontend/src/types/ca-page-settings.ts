export type CaOptionalField =
  | "college"
  | "collegeEmail"
  | "course"
  | "careerStage"
  | "languages"
  | "payout"
  | "address"
  | "whatsapp";

export interface CaFieldConfig {
  enabled: boolean;
  required: boolean;
  label: string;
  help: string;
}

/** Mirrors `IconName` in campus-ambassador/components/Icon.tsx, plus "none" for the quiet style. */
export type CaStatementIcon =
  | "file"
  | "doc"
  | "award"
  | "gift"
  | "box"
  | "key"
  | "book"
  | "case"
  | "lock"
  | "check"
  | "plus"
  | "down"
  | "left"
  | "play"
  | "chat"
  | "rupee"
  | "trend"
  | "none";

export interface CaStatementGet {
  icon: CaStatementIcon;
  title: string;
  note: string;
}

export interface CaStatementRow {
  when: string;
  what: string;
  gets: CaStatementGet[];
  credit: { amount: string; prefix: string } | null;
}

export interface CaStatement {
  rows: CaStatementRow[];
  footerLabel: string;
  footerAmount: string;
}

export interface CaMoney {
  stipend: number | null;
  incentiveCap: number | null;
  joiningBonus: number | null;
  kitValue: number | null;
  lmsValue: number | null;
  ppoPackageLpa: number | null;
}

export interface CaVideo {
  url: string;
  role: string;
  college: string;
  duration: string;
}

export interface CaFaq {
  question: string;
  answer: string;
}

export interface CaSamples {
  offerLetter: string;
  lor: string;
  internshipCertificate: string;
  trainingCertificate: string;
}

export interface CaEnrollment {
  acceptingApplications: boolean;
  durations: number[];
  /** 0 to 100. A CA needs this share of the points available in their own tenure. 0 = no gate. */
  certificationThresholdPct: number;
}

/** Public payload of `GET /api/ca-page/settings`. Dates are IST `YYYY-MM-DD`. */
export interface CaPageSettings {
  enrollment: CaEnrollment;
  form: {
    fields: Record<CaOptionalField, CaFieldConfig>;
    languages: string[];
    whatsappLink: string;
  };
  money: CaMoney;
  statement: CaStatement;
  hero: { headline: string; lede: string; jdUrl: string };
  kit: { photoUrl: string; items: string[] };
  videos: { items: CaVideo[] };
  faqs: { items: CaFaq[] };
  samples: CaSamples;
}
