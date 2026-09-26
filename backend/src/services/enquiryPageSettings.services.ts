import mongoose from "mongoose";
import { EnquiryPageSettingsModel } from "../models/enquiryPageSettings.schema";
import { ScholarshipTestModel } from "../models/scholarshipTest.schema";
import { resolveAttachableCampaignId } from "./scholarshipAttach.services";
import { AppError } from "../middlewares/error.middleware";
import { cleanQuestionList, MAX_EXTRA_QUESTIONS } from "../lib/extraQuestions";
import type { CrmExtraQuestion } from "../types/crm";

const GLOBAL_KEY = "global";

/**
 * Writes clear this cache, so an edit shows immediately on the instance that
 * made it; the TTL bounds staleness across instances, which cannot clear each
 * other's memory. The Next data cache in front is the real defence.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;
let settingsCache: { data: Record<string, unknown>; expiresAt: number } | null =
  null;

export function invalidateEnquiryPageSettingsCache(): void {
  settingsCache = null;
}

/** Mirrors `ENQUIRY_SECTION_KEYS` on the frontend. */
export const ENQUIRY_PAGE_SECTION_KEYS = [
  "offer",
  "scholarship",
  "hero",
  "certificates",
  "badges",
  "resumes",
  "languages",
  "plans",
  "controls",
  "questions",
  "howItRuns",
  "trackRecord",
  "closing",
] as const;

export type EnquiryPageSectionKey =
  (typeof ENQUIRY_PAGE_SECTION_KEYS)[number];

function isValidSectionKey(value: unknown): value is EnquiryPageSectionKey {
  return (
    typeof value === "string" &&
    (ENQUIRY_PAGE_SECTION_KEYS as readonly string[]).includes(value)
  );
}

/** Creates the singleton on first access, so the editor has a doc to patch. */
export const getEnquiryPageSettings = async (): Promise<
  Record<string, unknown>
> => {
  if (settingsCache && settingsCache.expiresAt > Date.now()) {
    return settingsCache.data;
  }

  const doc = await EnquiryPageSettingsModel.findOneAndUpdate(
    { key: GLOBAL_KEY },
    { $setOnInsert: { key: GLOBAL_KEY } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();

  const data = (doc ?? {}) as Record<string, unknown>;
  settingsCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
};

/**
 * Replaces a section wholesale rather than merging: a merge makes deleting a
 * list item impossible, since the shorter array merges back over the longer one.
 */
export const updateEnquiryPageSection = async (
  body: {
    section?: unknown;
    value?: unknown;
  },
  actorId: string,
): Promise<Record<string, unknown>> => {
  const { section, value } = body;

  if (!isValidSectionKey(section)) {
    throw new AppError("Unknown enquiry page section", 400);
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError("Section value must be an object", 400);
  }

  const raw = value as Record<string, unknown>;
  // Sections that cannot be stored as sent: a pointer into another collection,
  // questions that must pass the same checks as a link owner's, and strict flags.
  let next: Record<string, unknown> = raw;
  if (section === "scholarship") {
    next = { testId: await resolveAttachableCampaignId(raw.testId, actorId) };
  } else if (section === "questions") {
    next = { items: cleanQuestionList(raw.items) };
  } else if (section === "controls") {
    next = {
      pricesOff: raw.pricesOff === true,
      linkQuestionsOff: raw.linkQuestionsOff === true,
    };
  }

  const updated = await EnquiryPageSettingsModel.findOneAndUpdate(
    { key: GLOBAL_KEY },
    { $set: { [section]: next } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  ).lean();

  invalidateEnquiryPageSettingsCache();
  return (updated ?? {}) as Record<string, unknown>;
};

/**
 * The settings document with everything that is decided per visit removed.
 *
 * The public response is cache-headered, so it cannot vary per referral link.
 * Leaving these in is exactly what made a marketer's per-link price hiding
 * cosmetic: the numbers arrived anyway and the client merely declined to draw
 * them. They come instead from `getEnquiryPricing` and `getEnquiryScholarship`,
 * which are per-request and uncached.
 */
export const stripPerVisitFields = (
  data: Record<string, unknown>,
): Record<string, unknown> => {
  // The bare page's campaign and questions, which a referred visit may not get.
  const { scholarship, questions, controls, ...rest } = data;
  void scholarship;
  void questions;
  void controls;

  const plans = rest.plans as Record<string, unknown> | undefined;
  if (!plans) return rest;

  const list = Array.isArray(plans.plans) ? plans.plans : [];
  return {
    ...rest,
    plans: {
      ...plans,
      mncAddonPrice: undefined,
      plans: list.map((p) => {
        const { price, ...rest } = (p ?? {}) as Record<string, unknown>;
        void price;
        return rest;
      }),
      perkGroups: (Array.isArray(plans.perkGroups) ? plans.perkGroups : []).map(
        (g) => {
          const group = (g ?? {}) as Record<string, unknown>;
          const perks = Array.isArray(group.perks) ? group.perks : [];
          return {
            ...group,
            // A perk's add-on price is the MNC price restated, so it leaks the
            // same number by another route.
            perks: perks.map((perk) => {
              const row = (perk ?? {}) as Record<string, unknown>;
              const by = (row.by ?? {}) as Record<string, unknown>;
              const scrubbed: Record<string, unknown> = {};
              for (const [planId, state] of Object.entries(by)) {
                const st = (state ?? {}) as Record<string, unknown>;
                const { price, ...restState } = st;
                void price;
                scrubbed[planId] = restState;
              }
              return { ...row, by: scrubbed };
            }),
          };
        },
      ),
    },
  };
};

export interface EnquiryPricing {
  /** Empty when prices are withheld, so there is nothing to render or read. */
  plans: { id: number; price: number }[];
  mncAddonPrice: number | null;
}

/**
 * Prices for one visit, or nothing.
 *
 * Exactly one authority decides, never both:
 *  - a visit carrying a referral link that resolves is governed by that link's
 *    owner, so a marketer's choice is not overridden by a site setting;
 *  - every other visit, including one whose code is unknown or retired, is
 *    governed by the admin switch on the bare `/enquiry` page.
 *
 * Uncached and per-request, because the answer depends on the link.
 */
export const getEnquiryPricing = async (
  ref?: string,
): Promise<EnquiryPricing> => {
  const settings = await getEnquiryPageSettings();
  const section = (settings.plans ?? {}) as Record<string, unknown>;
  const empty: EnquiryPricing = { plans: [], mncAddonPrice: null };

  // Checked first: the global switch outranks both authorities below.
  if (controlsOf(settings).pricesOff === true) return empty;

  if (ref?.trim()) {
    // Imported lazily: crmProfile.services pulls in the user models, and this
    // module is loaded by the public settings route on every cold start.
    const { resolveCrmCode } = await import("./crmProfile.services");
    const resolved = await resolveCrmCode(ref);
    if (resolved) {
      return resolved.hidePlanPrices ? empty : pricesFrom(section);
    }
    // Fell through: an unknown code is not a referral, so the bare-page rule
    // applies rather than silently showing prices a link might have hidden.
  }

  if (section.showPrices === false) return empty;
  return pricesFrom(section);
};

const controlsOf = (settings: Record<string, unknown>) =>
  (settings.controls ?? {}) as { pricesOff?: unknown; linkQuestionsOff?: unknown };

export const linkQuestionsTurnedOff = async (): Promise<boolean> =>
  controlsOf(await getEnquiryPageSettings()).linkQuestionsOff === true;

/**
 * The extra questions one visit asks. The page's own questions apply to every
 * visit while link questions are off; otherwise a working link asks its
 * owner's, and every other visit the page's own.
 */
export const getEnquiryQuestions = async (
  ref?: string,
): Promise<CrmExtraQuestion[]> => {
  const settings = await getEnquiryPageSettings();
  const own = (((settings.questions ?? {}) as { items?: CrmExtraQuestion[] }).items ?? [])
    .filter((q) => q?.enabled !== false)
    .slice(0, MAX_EXTRA_QUESTIONS);

  if (controlsOf(settings).linkQuestionsOff === true || !ref?.trim()) return own;

  const { resolveCrmCode } = await import("./crmProfile.services");
  const resolved = await resolveCrmCode(ref);
  // An unknown code is not a referral, so it gets the plain page's questions.
  return resolved ? resolved.questions : own;
};

/** All the public page needs to draw the line and link it somewhere. */
export interface EnquiryScholarship {
  slug: string;
}

/**
 * The scholarship campaign advertised on one visit, or none.
 *
 * The same single-authority rule as `getEnquiryPricing`, and deliberately not
 * folded into it: a failure to read a campaign must not withhold prices, nor
 * the reverse. A referred visit carries its link owner's campaign or nothing at
 * all; it never falls back to the admin's, which belongs to the bare page.
 *
 * Resolved live rather than snapshotted, so pausing or deleting a campaign
 * pulls the line off every page at once.
 */
export const getEnquiryScholarship = async (
  ref?: string,
): Promise<EnquiryScholarship | null> => {
  if (ref?.trim()) {
    // Lazy, for the same reason `getEnquiryPricing` is: crmProfile.services
    // pulls in the user models, and this module loads on every cold start.
    const { resolveCrmCode } = await import("./crmProfile.services");
    const resolved = await resolveCrmCode(ref);
    // An unknown code is not a referral, so it falls through to the bare-page
    // rule rather than suppressing a campaign the admin is running.
    if (resolved) return liveCampaign(resolved.scholarshipTestId);
  }

  const settings = await getEnquiryPageSettings();
  const section = (settings.scholarship ?? {}) as Record<string, unknown>;
  return liveCampaign(section.testId);
};

const liveCampaign = async (
  testId: unknown,
): Promise<EnquiryScholarship | null> => {
  const id = testId ? String(testId) : "";
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  const test = await ScholarshipTestModel.findOne(
    { _id: new mongoose.Types.ObjectId(id), isActive: true },
    { slug: 1 },
  ).lean();
  return test?.slug ? { slug: test.slug } : null;
};

const pricesFrom = (section: Record<string, unknown>): EnquiryPricing => {
  const list = Array.isArray(section.plans) ? section.plans : [];
  return {
    plans: list
      .map((p) => (p ?? {}) as Record<string, unknown>)
      .filter((p) => typeof p.id === "number")
      .map((p) => ({ id: Number(p.id), price: Number(p.price ?? 0) })),
    mncAddonPrice: Number(section.mncAddonPrice ?? 0),
  };
};
