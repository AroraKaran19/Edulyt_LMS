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
