import mongoose from "mongoose";
import { HomePageSettingsModel } from "../models/homePageSettings.schema";
import { AppError } from "../middlewares/error.middleware";

const GLOBAL_KEY = "global";

/**
 * The home page settings are a singleton CMS document read on every public
 * homepage visit but written only when an admin edits a section. We serve a
 * cached copy to avoid the `findOne` + 3 `.populate()` lookups on each read.
 *
 * Correctness: admin writes call `invalidateHomePageSettingsCache()` so edits
 * show immediately on the instance that made them. The TTL is a safety net that
 * bounds staleness when the API runs on multiple instances (an edit on one
 * can't clear another's in-memory cache).
 */
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let settingsCache: { data: Record<string, unknown>; expiresAt: number } | null =
  null;

/** Drop the cached settings so the next read rebuilds from the database. */
export function invalidateHomePageSettingsCache(): void {
  settingsCache = null;
}

/**
 * Allowed section keys (mirrors `keyof HomePageSettings` on the frontend).
 * Update this list if a new section is added to the schema.
 */
export const HOME_PAGE_SECTION_KEYS = [
  "hero",
  "student",
  "industry",
  "coursePathStudents",
  "internshipPath",
  "testimonial",
  "institutions",
  "training",
  "support",
  "prepare",
  "futureManagers",
  "professional",
  "coursePathProfessionals",
  "dreamJob",
  "pathSelection",
  "faq",
] as const;

export type HomePageSectionKey = (typeof HOME_PAGE_SECTION_KEYS)[number];

/** Sections whose value contains an array of ObjectId references that must be normalized. */
const REF_LIST_PATHS: Partial<Record<HomePageSectionKey, string>> = {
  testimonial: "testimonials",
  futureManagers: "instructors",
  faq: "faqs",
};

function isValidSectionKey(value: unknown): value is HomePageSectionKey {
  return (
    typeof value === "string" &&
    (HOME_PAGE_SECTION_KEYS as readonly string[]).includes(value)
  );
}

/**
 * Normalize a list of incoming testimonial / instructor / FAQ items into a clean
 * array of ObjectIds. Accepts either raw id strings or hydrated objects with `_id`.
 */
function toObjectIdArray(input: unknown, label: string): mongoose.Types.ObjectId[] {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) {
    throw new AppError(`${label} must be an array`, 400);
  }
  const ids: mongoose.Types.ObjectId[] = [];
  for (const item of input) {
    let raw: unknown = item;
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const obj = item as Record<string, unknown>;
      if (obj._id !== undefined) raw = obj._id;
      else if (obj.id !== undefined) raw = obj.id;
    }
    if (typeof raw !== "string" || !mongoose.isValidObjectId(raw)) {
      throw new AppError(`${label} contains an invalid id`, 400);
    }
    ids.push(new mongoose.Types.ObjectId(raw));
  }
  return ids;
}

/**
 * Replace any ObjectId-array fields inside a section value with a normalized id array.
 * Returns a shallow-cloned plain object suitable for `$set`.
 */
function normalizeSectionValue(
  section: HomePageSectionKey,
  value: unknown,
): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(`Section value must be an object`, 400);
  }
  const next: Record<string, unknown> = { ...(value as Record<string, unknown>) };
  const refPath = REF_LIST_PATHS[section];
  if (refPath && refPath in next) {
    next[refPath] = toObjectIdArray(next[refPath], `${section}.${refPath}`);
  }
  return next;
}

/** Populate refs in a single query so the response always contains hydrated entities. */
function populateAll<T extends mongoose.Query<unknown, unknown>>(query: T): T {
  return query
    .populate("testimonial.testimonials")
    .populate("futureManagers.instructors")
    .populate("faq.faqs") as T;
}

export async function getHomePageSettings(): Promise<Record<string, unknown>> {
  if (settingsCache && settingsCache.expiresAt > Date.now()) {
    return settingsCache.data;
  }

  let doc = await populateAll(
    HomePageSettingsModel.findOne({ key: GLOBAL_KEY }),
  ).lean();

  if (!doc) {
    // Lazy-create the singleton on first read so subsequent PATCHes always have a row.
    await HomePageSettingsModel.findOneAndUpdate(
      { key: GLOBAL_KEY },
      { $setOnInsert: { key: GLOBAL_KEY } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    doc = await populateAll(
      HomePageSettingsModel.findOne({ key: GLOBAL_KEY }),
    ).lean();
  }

  const data = (doc ?? {}) as Record<string, unknown>;
  settingsCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

interface UpdateSectionInput {
  section: unknown;
  value: unknown;
}

/**
 * Replace one section of the singleton document. Validates the section key and
 * normalizes any ObjectId reference arrays before writing.
 */
export async function updateHomePageSection(
  body: UpdateSectionInput,
): Promise<Record<string, unknown>> {
  const { section, value } = body;
  if (!isValidSectionKey(section)) {
    throw new AppError(
      `Unknown section. Allowed: ${HOME_PAGE_SECTION_KEYS.join(", ")}`,
      400,
    );
  }
  if (value === undefined || value === null) {
    throw new AppError("Missing section value", 400);
  }

  const normalized = normalizeSectionValue(section, value);

  await HomePageSettingsModel.findOneAndUpdate(
    { key: GLOBAL_KEY },
    {
      $set: { [section]: normalized },
      $setOnInsert: { key: GLOBAL_KEY },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  // Edit landed — clear the cache so this (and the public read) rebuild fresh.
  invalidateHomePageSettingsCache();
  return getHomePageSettings();
}
