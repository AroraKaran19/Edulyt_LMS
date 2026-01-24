import { AppError } from "../middlewares/error.middleware";
import { CourseModel, InstructorModel } from "../models";
import { Course, Instructor } from "../types";
import mongoose from "mongoose";

export interface GetInstructorsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetInstructorsResult {
  instructors: Instructor[];
  total: number;
  page: number;
  totalPages: number;
}

export const getAllInstructorsService = async (
  params: GetInstructorsParams = {}
): Promise<GetInstructorsResult> => {
  const { page = 1, limit = 10, search = "" } = params;
  const skip = (page - 1) * limit;

  let filters: any = {
    userType: "instructor",
    status: "active", // Only fetch active instructors
  };

  if (search) {
    filters.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { currentPosition: { $regex: search, $options: "i" } },
      { currentCompany: { $regex: search, $options: "i" } },
    ];
  }

  try {
    const instructors = await InstructorModel.find(filters)
      .select("-password -refreshTokens -permissions") // Exclude sensitive data
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await InstructorModel.countDocuments(filters);
    const totalPages = Math.ceil(total / limit);

    return {
      instructors: instructors as Instructor[],
      total,
      page,
      totalPages,
    };
  } catch (error) {
    console.error("Database error in getAllInstructorsService:", error);
    throw new AppError(
      `Failed to fetch instructors: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

export const getInstructorByIdService = async (
  instructorId: string
): Promise<Instructor | null> => {
  try {
    const instructor = await InstructorModel.findOne({
      _id: instructorId,
      userType: "instructor",
      status: "active",
    })
      .select("-password -refreshTokens -permissions") // Exclude sensitive data
      .lean();

    return instructor as Instructor | null;
  } catch (error) {
    console.error("Database error in getInstructorByIdService:", error);
    throw new AppError(
      `Failed to fetch instructor: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

export const getInstructorsByIdsService = async (
  instructorIds: string[]
): Promise<Instructor[]> => {
  try {
    const instructors = await InstructorModel.find({
      _id: { $in: instructorIds },
      userType: "instructor",
      status: "active",
    })
      .select("-password -refreshTokens -permissions") // Exclude sensitive data
      .lean();

    return instructors as Instructor[];
  } catch (error) {
    console.error("Database error in getInstructorsByIdsService:", error);
    throw new AppError(
      `Failed to fetch instructors: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

export type PublicInstructorBySlugResult = {
  instructor: Instructor;
  stats: {
    totalCourses: number;
    totalStudents: number;
  };
};

const slugify = (value: string) => {
  return (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getInstructorDisplayName = (instructor: Pick<
  Instructor,
  "firstName" | "lastName" | "email"
>) => {
  const full = [instructor.firstName, instructor.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (full) return full;
  if (instructor.email) return instructor.email.split("@")[0] || instructor.email;
  return "instructor";
};

const ensureUniqueInstructorSlug = async (baseSlug: string, instructorId?: string) => {
  const base = slugify(baseSlug) || "instructor";
  let candidate = base;
  let suffix = 2;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await InstructorModel.findOne({
      userType: "instructor",
      slug: candidate,
      ...(instructorId ? { _id: { $ne: instructorId } } : {}),
    })
      .select("_id")
      .lean();

    if (!existing) return candidate;

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
};

const resolvePublicInstructorBySlug = async (
  slug: string
): Promise<Instructor | null> => {
  const requestedSlug = slugify(slug);
  if (!requestedSlug) return null;

  // First try direct lookup by stored slug
  let instructor = await InstructorModel.findOne({
    userType: "instructor",
    status: "active",
    slug: requestedSlug,
  })
    .select("-password -refreshTokens -permissions")
    .lean();

  // Fallback: if slug isn't stored yet, try to resolve by computed slug from name/email.
  if (!instructor) {
    const baseRequested = requestedSlug.replace(/-\d+$/, "") || requestedSlug;
    const firstToken = baseRequested.split("-")[0] || baseRequested;
    const tokenRegex = new RegExp(`^${escapeRegex(firstToken)}`, "i");

    const candidates = await InstructorModel.find({
      userType: "instructor",
      status: "active",
      $or: [
        { firstName: { $regex: tokenRegex } },
        { lastName: { $regex: tokenRegex } },
        { email: { $regex: new RegExp(escapeRegex(firstToken), "i") } },
      ],
    })
      .select("-password -refreshTokens -permissions")
      .lean();

    // 1) If any candidate already has the slug set, trust it.
    const matchedByStoredSlug = candidates.find(
      (c: any) => slugify(c?.slug || "") === requestedSlug
    );
    if (matchedByStoredSlug) {
      instructor = matchedByStoredSlug;
    } else {
      // 2) Deterministic collision handling for missing slugs:
      //    compute base slug from display name, then assign -2, -3... by stable ordering.
      const sameBase = candidates
        .filter((c) => {
          const computedBase = slugify(getInstructorDisplayName(c as Instructor));
          return computedBase === baseRequested;
        })
        .sort((a: any, b: any) => {
          const aId = a?._id?.toString?.() || "";
          const bId = b?._id?.toString?.() || "";
          return aId.localeCompare(bId);
        });

      const assignments = sameBase.map((c: any, idx: number) => ({
        instructor: c,
        slug: idx === 0 ? baseRequested : `${baseRequested}-${idx + 1}`,
      }));

      const matchedAssignment = assignments.find((a) => a.slug === requestedSlug);

      if (matchedAssignment) {
        instructor = matchedAssignment.instructor;
      } else if (baseRequested === requestedSlug && assignments.length > 0) {
        // If user requested the base slug, default to the first match.
        instructor = assignments[0].instructor;
      }

      // Best-effort persist any missing slugs we can assign deterministically.
      for (const a of assignments) {
        if (a.instructor?.slug) continue;
        try {
          const unique = await ensureUniqueInstructorSlug(
            a.slug,
            a.instructor?._id?.toString?.()
          );
          await InstructorModel.updateOne(
            { _id: a.instructor?._id },
            { $set: { slug: unique } }
          );
          if (
            instructor &&
            (instructor as any)?._id?.toString?.() ===
              a.instructor?._id?.toString?.()
          ) {
            (instructor as any).slug = unique;
          }
        } catch {
          // ignore races / uniqueness conflicts
        }
      }
    }
  }

  if (!instructor) return null;

  // Backfill slug if missing (and persist best-effort)
  if (!(instructor as Instructor).slug) {
    const base = getInstructorDisplayName(instructor as Instructor);
    const unique = await ensureUniqueInstructorSlug(
      base,
      (instructor as any)?._id?.toString?.()
    );

    try {
      await InstructorModel.updateOne(
        { _id: (instructor as any)?._id },
        { $set: { slug: unique } }
      );
      (instructor as any).slug = unique;
    } catch {
      // ignore persistence errors (race / unique conflicts)
      (instructor as any).slug = unique;
    }
  }

  return instructor as Instructor;
};

const buildInstructorCourseFilter = (instructor: Instructor) => {
  const toObjectId = (value: any): mongoose.Types.ObjectId | null => {
    try {
      if (!value) return null;
      if (value instanceof mongoose.Types.ObjectId) return value;
      const asString = value?.toString?.() ?? value;
      if (typeof asString === "string" && mongoose.Types.ObjectId.isValid(asString)) {
        return new mongoose.Types.ObjectId(asString);
      }
      return null;
    } catch {
      return null;
    }
  };

  const instructorObjectId = toObjectId((instructor as any)?._id);
  const ownedCourses = Array.isArray((instructor as any)?.ownedCourses)
    ? (instructor as any).ownedCourses
    : [];

  const courseFilter: any = { isActive: true };
  if (ownedCourses.length > 0) {
    const ownedCourseIds = ownedCourses.map(toObjectId).filter(Boolean);
    courseFilter._id = { $in: ownedCourseIds };
  } else if (instructorObjectId) {
    // `instructor` field on Course is an array of ObjectIds
    courseFilter.instructor = { $in: [instructorObjectId] };
  }

  return courseFilter;
};

export const getPublicInstructorBySlugService = async (
  slug: string
): Promise<PublicInstructorBySlugResult | null> => {
  try {
    const instructor = await resolvePublicInstructorBySlug(slug);
    if (!instructor) return null;

    const courseFilter = buildInstructorCourseFilter(instructor);
    const totalCourses = await CourseModel.countDocuments(courseFilter);

    const studentsAgg = await CourseModel.aggregate([
      { $match: courseFilter },
      {
        $group: {
          _id: null,
          totalStudents: {
            $sum: { $ifNull: ["$analytics.totalEnrollments", 0] },
          },
        },
      },
    ]);

    const totalStudents =
      typeof studentsAgg?.[0]?.totalStudents === "number"
        ? studentsAgg[0].totalStudents
        : (instructor as any)?.totalStudents || 0;

    return {
      instructor,
      stats: {
        totalCourses,
        totalStudents,
      },
    };
  } catch (error) {
    console.error("Database error in getPublicInstructorBySlugService:", error);
    throw new AppError(
      `Failed to fetch instructor: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

export const getPublicInstructorCoursesBySlugService = async (
  slug: string,
  page: number,
  limit: number
): Promise<
  | {
      courses: Partial<Course>[];
      total: number;
      page: number;
      totalPages: number;
    }
  | null
> => {
  try {
    const instructor = await resolvePublicInstructorBySlug(slug);
    if (!instructor) return null;

    const courseFilter = buildInstructorCourseFilter(instructor);
    const total = await CourseModel.countDocuments(courseFilter);
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;

    const courses = await CourseModel.find(courseFilter)
      .select("title slug thumbnail plans discount isFeatured analytics instructor")
      .populate(
        "instructor",
        "firstName lastName email profilePicture slug userType rating totalStudents"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      courses: courses as Partial<Course>[],
      total,
      page,
      totalPages,
    };
  } catch (error) {
    console.error(
      "Database error in getPublicInstructorCoursesBySlugService:",
      error
    );
    throw new AppError(
      `Failed to fetch instructor courses: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};
