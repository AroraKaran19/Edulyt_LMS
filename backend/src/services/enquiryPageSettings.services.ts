import { EnquiryPageSettingsModel } from "../models/enquiryPageSettings.schema";
import { AppError } from "../middlewares/error.middleware";

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
  "hero",
  "certificates",
  "badges",
  "resumes",
  "languages",
  "plans",
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
export const updateEnquiryPageSection = async (body: {
  section?: unknown;
  value?: unknown;
}): Promise<Record<string, unknown>> => {
  const { section, value } = body;

  if (!isValidSectionKey(section)) {
    throw new AppError("Unknown enquiry page section", 400);
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError("Section value must be an object", 400);
  }

  const updated = await EnquiryPageSettingsModel.findOneAndUpdate(
    { key: GLOBAL_KEY },
    { $set: { [section]: value } },
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
