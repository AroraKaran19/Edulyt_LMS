import { CaPageSettingsModel } from "../models";
import { AppError } from "../middlewares/error.middleware";
import {
  DEFAULT_CA_LANGUAGES,
  isValidDurationMonths,
  resolveCaFields,
  type CaFieldConfigMap,
} from "../lib/caApplication";
import type { AmbassadorKind } from "../types/crm";

const SETTINGS_KEY = "airkrit";
const CACHE_TTL_MS = 5 * 60 * 1000;
const WHATSAPP_LINK = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/;

export const CA_PAGE_SECTION_KEYS = [
  "enrollment",
  "form",
  "documents",
  "money",
  "statement",
  "hero",
  "kit",
  "videos",
  "faqs",
  "samples",
] as const;
export type CaPageSectionKey = (typeof CA_PAGE_SECTION_KEYS)[number];

export interface CaEnrollment {
  acceptingApplications: boolean;
  durations: number[];
  /** 0 to 100. A CA needs this share of the points available in their own tenure. 0 = no gate. */
  certificationThresholdPct: number;
}

export interface CaMoney {
  stipend: number | null;
  incentiveCap: number | null;
  joiningBonus: number | null;
  kitValue: number | null;
  lmsValue: number | null;
  ppoPackageLpa: number | null;
}
export interface CaVideo { url: string; role: string; college: string; duration: string }
export interface CaFaq { question: string; answer: string }
export interface CaSamples { offerLetter: string; lor: string; internshipCertificate: string; trainingCertificate: string }

/** Mirrors `IconName` in frontend/src/app/digital-marketing-internship/components/Icon.tsx. */
export const STATEMENT_ICONS = [
  "file", "doc", "award", "gift", "box", "key", "book", "case",
  "lock", "check", "plus", "down", "left", "play", "chat", "rupee", "trend",
] as const;
/** "none" renders the old quiet style: muted text, no icon. */
export const STATEMENT_GET_ICONS = [...STATEMENT_ICONS, "none"] as const;
export type StatementIcon = (typeof STATEMENT_GET_ICONS)[number];

export interface CaStatementGet { icon: StatementIcon; title: string; note: string }
export interface CaStatementRow {
  when: string;
  what: string;
  gets: CaStatementGet[];
  credit: { amount: string; prefix: string } | null;
}
export interface CaStatement { rows: CaStatementRow[]; footerLabel: string; footerAmount: string }

export interface CaPageSettings {
  enrollment: CaEnrollment;
  form: { fields: CaFieldConfigMap; languages: string[]; whatsappLink: string };
  documents: { designations: Record<AmbassadorKind, string> };
  money: CaMoney;
  statement: CaStatement;
  hero: { headline: string; lede: string; jdUrl: string };
  kit: { photoUrl: string; items: string[] };
  videos: { items: CaVideo[] };
  faqs: { items: CaFaq[] };
  samples: CaSamples;
}

let cache: { data: CaPageSettings; expiresAt: number } | null = null;

export function invalidateCaPageSettingsCache(): void {
  cache = null;
}

const MONEY_KEYS = ["stipend", "incentiveCap", "joiningBonus", "kitValue", "lmsValue", "ppoPackageLpa"] as const;
const SAMPLE_KEYS = ["offerLetter", "lor", "internshipCertificate", "trainingCertificate"] as const;
const HTTPS = /^https:\/\/[^\s]+$/i;
// The public page renders `<video src>` directly, so only a direct file link
// can play; YouTube/Vimeo/embed pages cannot.
const VIDEO_URL = /^https:\/\/\S+\.(mp4|webm)(\?\S*)?$/i;

const str = (value: unknown, max: number): string => String(value ?? "").trim().slice(0, max);

/** Empty means "use the page default"; anything else must be an https link. */
const link = (value: unknown, label: string): string => {
  const v = str(value, 1000);
  if (v && !HTTPS.test(v)) throw new AppError(`${label} must be an https link`, 400);
  return v;
};

const amount = (value: unknown, key: string): number | null => {
  if (value === "" || value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new AppError(`${key} must be a number`, 400);
  if (n < 0) throw new AppError(`${key} cannot be negative`, 400);
  return key === "ppoPackageLpa" ? Math.round(n * 10) / 10 : Math.floor(n);
};

const readMoney = (raw: any): CaMoney =>
  Object.fromEntries(
    MONEY_KEYS.map((k) => [k, typeof raw?.[k] === "number" ? raw[k] : null]),
  ) as unknown as CaMoney;

const readStatement = (raw: any): CaStatement => ({
  rows: Array.isArray(raw?.rows)
    ? raw.rows.map((r: any) => ({
        when: String(r?.when ?? ""),
        what: String(r?.what ?? ""),
        gets: Array.isArray(r?.gets)
          ? r.gets.map((g: any) => ({
              icon: String(g?.icon ?? "") as StatementIcon,
              title: String(g?.title ?? ""),
              note: String(g?.note ?? ""),
            }))
          : [],
        credit:
          r?.credit && typeof r.credit === "object"
            ? { amount: String(r.credit.amount ?? ""), prefix: String(r.credit.prefix ?? "") }
            : null,
      }))
    : [],
  footerLabel: String(raw?.footerLabel ?? ""),
  footerAmount: String(raw?.footerAmount ?? ""),
});

const toSettings = (doc: Record<string, any> | null): CaPageSettings => {
  const rawDurations: unknown[] = Array.isArray(doc?.enrollment?.durations) ? doc.enrollment.durations : [];
  const durations = [...new Set(rawDurations.filter(isValidDurationMonths))].sort((a: number, b: number) => a - b);
  const thresholdRaw = doc?.enrollment?.certificationThresholdPct;
  const languages: string[] =
    Array.isArray(doc?.form?.languages) && doc?.form?.languages.length
      ? doc.form.languages
      : DEFAULT_CA_LANGUAGES;
  return {
    enrollment: {
      acceptingApplications: Boolean(doc?.enrollment?.acceptingApplications),
      durations,
      certificationThresholdPct:
        Number.isInteger(thresholdRaw) && thresholdRaw >= 0 && thresholdRaw <= 100 ? thresholdRaw : 0,
    },
    form: {
      fields: resolveCaFields(doc?.form?.fields),
      languages,
      whatsappLink: String(doc?.form?.whatsappLink ?? ""),
    },
    documents: {
      designations: {
        marketing: String(doc?.documents?.designations?.marketing ?? ""),
        "social-media": String(doc?.documents?.designations?.["social-media"] ?? ""),
      },
    },
    money: readMoney(doc?.money),
    statement: readStatement(doc?.statement),
    hero: {
      headline: String(doc?.hero?.headline ?? ""),
      lede: String(doc?.hero?.lede ?? ""),
      jdUrl: String(doc?.hero?.jdUrl ?? ""),
    },
    kit: {
      photoUrl: String(doc?.kit?.photoUrl ?? ""),
      items: Array.isArray(doc?.kit?.items) ? doc.kit.items.map(String) : [],
    },
    videos: { items: Array.isArray(doc?.videos?.items) ? doc.videos.items : [] },
    faqs: { items: Array.isArray(doc?.faqs?.items) ? doc.faqs.items : [] },
    samples: Object.fromEntries(
      SAMPLE_KEYS.map((k) => [k, String(doc?.samples?.[k] ?? "")]),
    ) as unknown as CaSamples,
  };
};

/** `fresh` skips the cache read, for callers that must see a batch change on every instance. */
export const getCaPageSettings = async (
  { fresh = false }: { fresh?: boolean } = {},
): Promise<CaPageSettings> => {
  if (!fresh && cache && cache.expiresAt > Date.now()) return cache.data;
  const doc = await CaPageSettingsModel.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $setOnInsert: { key: SETTINGS_KEY } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  const data = toSettings(doc as Record<string, any> | null);
  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
};

const sanitizeSection = (
  section: CaPageSectionKey,
  value: Record<string, unknown>,
): Record<string, unknown> => {
  if (section === "enrollment") {
    const acceptingApplications = value.acceptingApplications === true;
    const rawDurations = Array.isArray(value.durations) ? value.durations : [];
    const durations = [...new Set(rawDurations.map(Number).filter(isValidDurationMonths))].sort((a, b) => a - b);
    if (acceptingApplications && durations.length === 0) {
      throw new AppError("Choose at least one duration to accept applications", 400);
    }
    const certificationThresholdPct = Number(value.certificationThresholdPct ?? 0);
    if (
      !Number.isInteger(certificationThresholdPct) ||
      certificationThresholdPct < 0 ||
      certificationThresholdPct > 100
    ) {
      throw new AppError("Minimum percentage must be a whole number from 0 to 100", 400);
    }
    return { acceptingApplications, durations, certificationThresholdPct };
  }

  if (section === "form") {
    const fields = resolveCaFields(value.fields);
    const languages = Array.isArray(value.languages)
      ? [
          ...new Set(
            value.languages
              .map((l) => String(l ?? "").trim().slice(0, 40))
              .filter(Boolean),
          ),
        ].slice(0, 40)
      : [];
    if (fields.languages.enabled && languages.length === 0) {
      throw new AppError("Add at least one language, or turn the languages field off", 400);
    }
    const whatsappLink = String(value.whatsappLink ?? "").trim();
    if (fields.whatsapp.enabled && !whatsappLink) {
      throw new AppError("Add the WhatsApp group link, or turn that field off", 400);
    }
    if (whatsappLink && !WHATSAPP_LINK.test(whatsappLink)) {
      throw new AppError("Use a WhatsApp group invite link from chat.whatsapp.com", 400);
    }
    return { fields, languages, whatsappLink };
  }

  if (section === "money") {
    return Object.fromEntries(MONEY_KEYS.map((k) => [k, amount(value[k], k)]));
  }
  if (section === "hero") {
    return {
      headline: str(value.headline, 120),
      lede: str(value.lede, 400),
      jdUrl: link(value.jdUrl, "Job description link"),
    };
  }
  if (section === "kit") {
    const items = Array.isArray(value.items)
      ? value.items.map((i) => str(i, 60)).filter(Boolean).slice(0, 12)
      : [];
    return { photoUrl: link(value.photoUrl, "Kit photo"), items };
  }
  if (section === "videos") {
    const rows = Array.isArray(value.items) ? value.items : [];
    const items = rows
      .map((r: any) => ({
        url: str(r?.url, 1000),
        role: str(r?.role, 60),
        college: str(r?.college, 120),
        duration: str(r?.duration, 8),
      }))
      .filter((r) => VIDEO_URL.test(r.url))
      .slice(0, 12);
    return { items };
  }
  if (section === "faqs") {
    const rows = Array.isArray(value.items) ? value.items : [];
    const items = rows
      .map((r: any) => ({ question: str(r?.question, 200), answer: str(r?.answer, 1200) }))
      .filter((r) => r.question && r.answer)
      .slice(0, 20);
    return { items };
  }
  if (section === "samples") {
    return Object.fromEntries(SAMPLE_KEYS.map((k) => [k, link(value[k], "Sample image")]));
  }
  if (section === "statement") {
    const rawRows = Array.isArray(value.rows) ? value.rows : [];
    const rows = rawRows
      .map((r: any) => {
        const gets = (Array.isArray(r?.gets) ? r.gets : [])
          .map((g: any) => ({
            icon: String(g?.icon ?? ""),
            title: str(g?.title, 80),
            note: str(g?.note, 120),
          }))
          .filter((g) => g.title && (STATEMENT_GET_ICONS as readonly string[]).includes(g.icon))
          .slice(0, 4);
        const creditAmount = str(r?.credit?.amount, 40);
        const credit = creditAmount ? { amount: creditAmount, prefix: str(r?.credit?.prefix, 20) } : null;
        return { when: str(r?.when, 40), what: str(r?.what, 300), gets, credit };
      })
      .filter((r) => r.when && r.what)
      .slice(0, 12);
    return { rows, footerLabel: str(value.footerLabel, 40), footerAmount: str(value.footerAmount, 40) };
  }

  const d = (
    value.designations && typeof value.designations === "object" ? value.designations : {}
  ) as Record<string, unknown>;
  return {
    designations: {
      marketing: String(d.marketing ?? "").trim().slice(0, 120),
      "social-media": String(d["social-media"] ?? "").trim().slice(0, 120),
    },
  };
};

/** Replaces one section wholesale, so removing a list item actually removes it. */
export const updateCaPageSection = async (body: {
  section?: unknown;
  value?: unknown;
}): Promise<CaPageSettings> => {
  const { section, value } = body;
  if (
    typeof section !== "string" ||
    !(CA_PAGE_SECTION_KEYS as readonly string[]).includes(section)
  ) {
    throw new AppError("Unknown CA page section", 400);
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError("Section value must be an object", 400);
  }
  const next = sanitizeSection(
    section as CaPageSectionKey,
    value as Record<string, unknown>,
  );
  const doc = await CaPageSettingsModel.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $set: { [section]: next } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
  ).lean();
  invalidateCaPageSettingsCache();
  return toSettings(doc as Record<string, any> | null);
};

export const serializeCaPageSettings = (s: CaPageSettings) => ({
  enrollment: s.enrollment,
  form: s.form,
  documents: s.documents,
  money: s.money,
  statement: s.statement,
  hero: s.hero,
  kit: s.kit,
  videos: s.videos,
  faqs: s.faqs,
  samples: s.samples,
});
