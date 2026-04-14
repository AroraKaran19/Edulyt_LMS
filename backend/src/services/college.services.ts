import mongoose from "mongoose";
import { CollegeModel } from "../models/college.schema";
import { College } from "../types/college";

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
    isActive: Boolean(doc.isActive),
    createdAt: doc.createdAt as Date | undefined,
    updatedAt: doc.updatedAt as Date | undefined,
  };
};

/**
 * Each whitespace-separated word must match somewhere (name OR location OR legacy
 * city/state/country). Words are combined with AND so "Business Schoo" requires
 * both substrings — unlike fuzzySearch's global $or, which let "Schoo" match
 * "School" without "Business".
 */
const buildSearchFilter = (search?: string): mongoose.FilterQuery<College> => {
  if (!search?.trim()) return {};
  const words = search
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
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

const totalPages = (total: number, limit: number) =>
  Math.max(0, Math.ceil(total / limit));

export const listCollegesPublicService = async (
  page: number,
  limit: number,
  search?: string,
): Promise<ListCollegesResult> => {
  const skip = (page - 1) * limit;
  const searchFilter = buildSearchFilter(search);
  const filters: mongoose.FilterQuery<College> = {
    isActive: true,
    ...searchFilter,
  };

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
  const searchFilter = buildSearchFilter(search);
  const filters: mongoose.FilterQuery<College> = { ...searchFilter };
  if (typeof isActive === "boolean") {
    filters.isActive = isActive;
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
  website?: string;
  image?: string;
  isActive?: boolean;
}): Promise<College> => {
  const doc = await CollegeModel.create({
    name: data.name.trim(),
    location: data.location.trim(),
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

export const deleteCollegeService = async (id: string): Promise<boolean> => {
  if (!mongoose.Types.ObjectId.isValid(id)) return false;
  const res = await CollegeModel.findByIdAndDelete(id);
  return !!res;
};
