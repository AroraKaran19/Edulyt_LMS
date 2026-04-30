import mongoose from "mongoose";
import { HomePageSettingsModel } from "../models/homePageSettings.schema";
import { AppError } from "../middlewares/error.middleware";

const GLOBAL_KEY = "global";

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

  return (doc ?? {}) as Record<string, unknown>;
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

  return getHomePageSettings();
}
