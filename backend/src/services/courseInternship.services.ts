import mongoose from "mongoose";
import { CourseInternshipModel } from "../models/courseInternship.schema";
import { AppError } from "../middlewares/error.middleware";

export type UpsertCourseInternshipBody = {
  title?: string;
  description?: string;
  thumbnail?: string;
  slug?: string;
  mentors?: string[];
  perks?: string[];
  whatYouWillDo?: string[];
  taskTemplateIds?: string[];
  documentationRequired?: boolean;
  documentationDueOffsetDays?: number;
  offerLetterDesignation?: string;
  whatsappGroupLink?: string;
  isActive?: boolean;
};

/** Kebab-cases a title and appends a counter until the slug is free. */
const buildUniqueSlug = async (
  title: string,
  excludeId?: string,
): Promise<string> => {
  const base =
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "program";

  let candidate = base;
  let suffix = 2;

  for (;;) {
    const clash = await CourseInternshipModel.findOne({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
      .select("_id")
      .lean();
    if (!clash) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
};

export const listCourseInternshipsService = async (
  page: number,
  limit: number,
  search?: string,
  status: "all" | "active" | "inactive" = "all",
) => {
  const filters: Record<string, unknown> = {};
  if (status !== "all") filters.isActive = status === "active";
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filters.title = { $regex: escaped, $options: "i" };
  }

  const skip = (page - 1) * limit;

  const [programs, total] = await Promise.all([
    CourseInternshipModel.find(filters)
      .select("title slug thumbnail isActive courses taskTemplateIds updatedAt")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CourseInternshipModel.countDocuments(filters),
  ]);

  return {
    programs: (programs ?? []).map((p: Record<string, any>) => ({
      ...p,
      courseCount: Array.isArray(p.courses) ? p.courses.length : 0,
      taskCount: Array.isArray(p.taskTemplateIds) ? p.taskTemplateIds.length : 0,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getCourseInternshipByIdService = async (programId: string) => {
  if (!mongoose.Types.ObjectId.isValid(programId)) {
    throw new AppError("Invalid program id", 400);
  }
  const program = await CourseInternshipModel.findById(programId)
    .populate("mentors", "firstName lastName email profilePicture")
    .populate("taskTemplateIds", "title totalScore unlockAfterDays dueDays")
    .lean();
  if (!program) throw new AppError("Program not found", 404);
  return program;
};

export const createCourseInternshipService = async (
  body: UpsertCourseInternshipBody,
  createdBy: string,
) => {
  const title = (body.title ?? "").trim();
  if (!title) throw new AppError("Title is required", 400);

  const slug = await buildUniqueSlug(body.slug?.trim() || title);

  return CourseInternshipModel.create({
    ...body,
    title,
    slug,
    courses: [],
    createdBy,
  });
};

export const updateCourseInternshipService = async (
  programId: string,
  body: UpsertCourseInternshipBody,
) => {
  if (!mongoose.Types.ObjectId.isValid(programId)) {
    throw new AppError("Invalid program id", 400);
  }

  const update: Record<string, unknown> = { ...body };
  // `courses` is a derived mirror maintained by the course save path.
  delete (update as { courses?: unknown }).courses;

  if (body.title !== undefined) {
    const title = body.title.trim();
    if (!title) throw new AppError("Title is required", 400);
    update.title = title;
  }
  if (body.slug !== undefined) {
    update.slug = await buildUniqueSlug(
      body.slug || String(body.title ?? ""),
      programId,
    );
  }

  const program = await CourseInternshipModel.findByIdAndUpdate(
    programId,
    { $set: update },
    { new: true, runValidators: true },
  );
  if (!program) throw new AppError("Program not found", 404);
  return program;
};

/**
 * Refuses to delete while any course still offers it — deleting would strand
 * the course's offer and, later, every enrollment's program reference.
 */
export const deleteCourseInternshipService = async (programId: string) => {
  if (!mongoose.Types.ObjectId.isValid(programId)) {
    throw new AppError("Invalid program id", 400);
  }
  const program =
    await CourseInternshipModel.findById(programId).select("courses");
  if (!program) throw new AppError("Program not found", 404);

  if (Array.isArray(program.courses) && program.courses.length > 0) {
    throw new AppError(
      `This program is offered by ${program.courses.length} course(s). Remove it from those courses first.`,
      409,
    );
  }

  await CourseInternshipModel.findByIdAndDelete(programId);
  return { deleted: true };
};
