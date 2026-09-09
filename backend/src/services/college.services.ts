import mongoose from "mongoose";
import { CollegeModel } from "../models/college.schema";
import { UserModel } from "../models";
import { College } from "../types/college";
import { normalizeState } from "../constants/indianStates";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export interface ListCollegesResult {
  colleges: College[];
  total: number;
  page: number;
  totalPages: number;
}

/** Normalize lean doc: prefer `location`, else legacy city/state/country if present */
const toCollege = (doc: Record<string, unknown>): College => {
  const loc =
    (typeof doc.location === "string" && doc.location.trim()) ||
    [doc.city, doc.state, doc.country]
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean)
      .join(", ")
      .trim() ||
    undefined;

  return {
    _id: doc._id != null ? String(doc._id) : undefined,
    name: String(doc.name ?? ""),
    location: loc ?? "",
    website:
      typeof doc.website === "string" ? doc.website.trim() : undefined,
    image: typeof doc.image === "string" ? doc.image.trim() : undefined,
    state: normalizeState(doc.state) ?? undefined,
    isActive: Boolean(doc.isActive),
    createdAt: doc.createdAt as Date | undefined,
    updatedAt: doc.updatedAt as Date | undefined,
  };
};

/** "  Parul   University " -> ["Parul", "University"] */
const searchWords = (search?: string): string[] => {
  if (!search?.trim()) return [];
  return search.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
};

/**
 * Each whitespace-separated word must match somewhere (name OR location OR legacy
 * city/state/country). Words are combined with AND so "Business Schoo" requires
 * both substrings — unlike fuzzySearch's global $or, which let "Schoo" match
 * "School" without "Business".
 */
const buildSearchFilter = (words: string[]): mongoose.FilterQuery<College> => {
  if (words.length === 0) return {};

  const fields = [
    "name",
    "location",
    "website",
    "city",
    "state",
    "country",
  ] as const;

  const perWord = words.map((word) => {
    const rx = escapeRegex(word);
    return {
      $or: fields.map((field) => ({
        [field]: { $regex: rx, $options: "i" as const },
      })),
    };
  });

  if (perWord.length === 1) {
    return perWord[0] as mongoose.FilterQuery<College>;
  }
  return { $and: perWord } as mongoose.FilterQuery<College>;
};

/** A match that begins a word: "parul" hits "Parul University" and "Godavari
 *  Parulekar" but not "Kasturba". Plain \b is avoided so a query starting with
 *  punctuation can't invert the assertion. */
const wordStart = (term: string) => `(^|[^A-Za-z0-9])${escapeRegex(term)}`;

const rxMatch = (field: string, regex: string) => ({
  $regexMatch: {
    input: { $ifNull: [`$${field}`, ""] },
    regex,
    options: "i",
  },
});

const NAME_LOWER = { $toLower: { $ifNull: ["$name", ""] } };

/**
 * Relevance tiers, best first. The filter above is a bare substring test, so
 * without a score the tie-break sort decides everything: searching "parul"
 * put "…Godavari Shamrao Parulekar College" above "Parul University" purely
 * because A sorts before P. Tiers rank *where* and *how* the query landed.
 */
const buildRelevanceStage = (words: string[]): mongoose.PipelineStage => {
  const phrase = words.join(" ");
  const phraseRx = escapeRegex(phrase);

  const branches: { case: Record<string, unknown>; then: number }[] = [
    { case: rxMatch("name", `^${phraseRx}`), then: 0 },
    { case: rxMatch("name", wordStart(phrase)), then: 1 },
    { case: rxMatch("name", phraseRx), then: 2 },
  ];

  // Only meaningful for multi-word queries — for one word these repeat tiers 1
  // and 2, and $switch takes the first hit anyway.
  if (words.length > 1) {
    branches.push({
      case: { $and: words.map((w) => rxMatch("name", wordStart(w))) },
      then: 3,
    });
    branches.push({
      case: { $and: words.map((w) => rxMatch("name", escapeRegex(w))) },
      then: 4,
    });
  }

  return {
    $addFields: {
      _tier: { $switch: { branches, default: 5 } },
      // Earlier hit wins inside a tier ("Parul Institute" over "Shri Parul
      // Institute"). Rows that matched on location only have no position.
      _pos: {
        $let: {
          vars: { at: { $indexOfCP: [NAME_LOWER, phrase.toLowerCase()] } },
          in: { $cond: [{ $lt: ["$$at", 0] }, 9999, "$$at"] },
        },
      },
    },
  };
};

/** Ranked page + total in a single pass over the matched set. */
const runRankedSearch = async (
  filters: mongoose.FilterQuery<College>,
  words: string[],
  skip: number,
  limit: number,
  tieBreak: Record<string, 1 | -1>,
): Promise<{ rows: Record<string, unknown>[]; total: number }> => {
  const [result] = await CollegeModel.aggregate<{
    rows: Record<string, unknown>[];
    meta: { total: number }[];
  }>([
    { $match: filters },
    buildRelevanceStage(words),
    { $sort: { _tier: 1, _pos: 1, ...tieBreak } },
    {
      $facet: {
        rows: [{ $skip: skip }, { $limit: limit }],
        meta: [{ $count: "total" }],
      },
    },
  ]);

  return {
    rows: result?.rows ?? [],
    total: result?.meta?.[0]?.total ?? 0,
  };
};

const totalPages = (total: number, limit: number) =>
  Math.max(0, Math.ceil(total / limit));

export const listCollegesPublicService = async (
  page: number,
  limit: number,
  search?: string,
): Promise<ListCollegesResult> => {
  const skip = (page - 1) * limit;
  const words = searchWords(search);
  const filters: mongoose.FilterQuery<College> = {
    isActive: true,
    ...buildSearchFilter(words),
  };

  if (words.length > 0) {
    const { rows, total } = await runRankedSearch(filters, words, skip, limit, {
      name: 1,
    });
    return {
      colleges: rows.map(toCollege),
      total,
      page,
      totalPages: totalPages(total, limit),
    };
  }

  // Unsearched browse stays on the plain indexed find — nothing to rank by.
  const total = await CollegeModel.countDocuments(filters);
  const raw = await CollegeModel.find(filters)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    colleges: (raw as Record<string, unknown>[]).map(toCollege),
    total,
    page,
    totalPages: totalPages(total, limit),
  };
};

export const listCollegesAdminService = async (
  page: number,
  limit: number,
  search?: string,
  isActive?: boolean,
): Promise<ListCollegesResult> => {
  const skip = (page - 1) * limit;
  const words = searchWords(search);
  const filters: mongoose.FilterQuery<College> = { ...buildSearchFilter(words) };
  if (typeof isActive === "boolean") {
    filters.isActive = isActive;
  }

  if (words.length > 0) {
    const { rows, total } = await runRankedSearch(filters, words, skip, limit, {
      updatedAt: -1,
    });
    return {
      colleges: rows.map(toCollege),
      total,
      page,
      totalPages: totalPages(total, limit),
    };
  }

  const total = await CollegeModel.countDocuments(filters);
  const raw = await CollegeModel.find(filters)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return {
    colleges: (raw as Record<string, unknown>[]).map(toCollege),
    total,
    page,
    totalPages: totalPages(total, limit),
  };
};

export const getCollegeByIdService = async (
  id: string,
): Promise<College | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const doc = await CollegeModel.findById(id).lean();
  if (!doc) return null;
  return toCollege(doc as unknown as Record<string, unknown>);
};

export const createCollegeService = async (data: {
  name: string;
  location: string;
  state?: string;
  website?: string;
  image?: string;
  isActive?: boolean;
}): Promise<College> => {
  const doc = await CollegeModel.create({
    name: data.name.trim(),
    location: data.location.trim(),
    state: normalizeState(data.state) ?? undefined,
    website: data.website?.trim() ?? "",
    image: data.image?.trim() ?? "",
    isActive: data.isActive !== false,
  });
  return toCollege(doc.toObject() as unknown as Record<string, unknown>);
};

export const updateCollegeService = async (
  id: string,
  data: Partial<{
    name: string;
    location: string;
    state: string;
    website: string;
    image: string;
    isActive: boolean;
  }>,
): Promise<College | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = String(data.name).trim();
  if (data.location !== undefined)
    update.location = String(data.location).trim();
  // An unrecognised state is rejected by the controller; a blank one here means
  // a legacy row the admin left alone, which must not overwrite what is stored.
  if (data.state !== undefined) {
    const state = normalizeState(data.state);
    if (state) update.state = state;
  }
  if (data.website !== undefined) update.website = String(data.website).trim();
  if (data.image !== undefined) update.image = String(data.image).trim();
  if (data.isActive !== undefined) update.isActive = Boolean(data.isActive);

  const doc = await CollegeModel.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();
  if (!doc) return null;
  return toCollege(doc as unknown as Record<string, unknown>);
};

/**
 * Best-effort background sweep run after a college delete:
 *   - Unset `college` on every student linked to the deleted college so the
 *     dangling ObjectId doesn't accumulate. Leaves `collegeName` snapshot
 *     intact so the student's profile still shows their historical school.
 *   - Deactivate every partner user linked to this college. Their portal
 *     access depended on the link; without it they can't log in legitimately.
 *     Status `inactive` (not delete) preserves the audit trail and lets an
 *     admin reactivate if the link is rebuilt later.
 * Detached from the delete request — admins don't wait on it; errors are
 * logged but never thrown.
 */
function cascadeCollegeDeleteInBackground(collegeId: string): void {
  setImmediate(async () => {
    const objId = new mongoose.Types.ObjectId(collegeId);
    try {
      const studentRes = await UserModel.updateMany(
        { userType: "student", college: objId },
        { $unset: { college: "" } },
      );
      if (studentRes.modifiedCount > 0) {
        console.log(
          `[College] Unset college ref on ${studentRes.modifiedCount} student(s) ` +
            `after deletion of college ${collegeId}`,
        );
      }
    } catch (e) {
      console.error(
        `[College] Background student-cascade failed for ${collegeId}:`,
        e,
      );
    }

    try {
      const partnerRes = await UserModel.updateMany(
        {
          userType: "partner",
          partnerCollege: objId,
          status: { $ne: "inactive" },
        },
        { $set: { status: "inactive" } },
      );
      if (partnerRes.modifiedCount > 0) {
        console.log(
          `[College] Deactivated ${partnerRes.modifiedCount} partner user(s) ` +
            `after deletion of college ${collegeId}`,
        );
      }
    } catch (e) {
      console.error(
        `[College] Background partner-cascade failed for ${collegeId}:`,
        e,
      );
    }
  });
}

export const deleteCollegeService = async (id: string): Promise<boolean> => {
  if (!mongoose.Types.ObjectId.isValid(id)) return false;
  const res = await CollegeModel.findByIdAndDelete(id);
  if (!res) return false;

  // Cascade student.college unset + partner deactivate off the request thread
  // so a delete that touches many rows still returns fast.
  cascadeCollegeDeleteInBackground(id);
  return true;
};
