import { AppError } from "../middlewares/error.middleware";
import {
  ContentModel,
  CourseLessonModel,
  CourseModel,
  CourseModuleModel,
  UserModel,
  CategoryModel,
  VideoContentModel,
  QuizContentModel,
  DocumentContentModel,
  VideoNoteModel,
  QnAModel,
  LiveClassModel,
  LiveClassAttendanceModel,
} from "../models";
import { Content, Course, CourseLesson, CourseModule } from "../types";
import mongoose from "mongoose";
import { createFuzzySearchOrFilter } from "../utils/lib/fuzzySearch";
import {
  normalizeInternshipOffer,
  planMirrorSync,
} from "../lib/courseInternshipOffer";
import { CourseInternshipModel } from "../models/courseInternship.schema";
import {
  deleteFilesFromS3,
  extractS3KeyFromUrl,
} from "./upload.services";

export const getAllCoursesService = async (
  page: number,
  limit: number,
  search: string,
  categories?: string,
  audience?: string,
  isAdmin?: boolean,
  sortBy: string = "updatedAt",
  sortOrder: string = "desc",
  instructors?: string,
  isActive?: boolean,
  searchTitleOnly?: boolean
): Promise<{
  courses: Course[];
  total: number;
  page: number;
  totalPages: number;
  isAdmin?: boolean;
}> => {
  const skip = (page - 1) * limit;

  let filters: any = {};
  let hasCategoryFilter = false;
  let categoryObjectIds: mongoose.Types.ObjectId[] = [];

  // Active filter - only show active courses for non-admin users
  if (!isAdmin) {
    filters.isActive = true;
  } else if (isActive !== undefined) {
    // Admin can filter by isActive explicitly
    filters.isActive = isActive;
  }

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const phraseRegex = { $regex: escapedSearch, $options: "i" };

    if (isAdmin) {
      // Admin panel: simple phrase matching only (no fuzzy)
      filters.$and = filters.$and ? [...filters.$and] : [];
      if (searchTitleOnly) {
        filters.$and.push({ title: phraseRegex });
      } else {
        filters.$and.push({
          $or: [
            { title: phraseRegex },
            { description: phraseRegex },
            { shortDescription: phraseRegex },
          ],
        });
      }
    } else {
      // Public: use fuzzy search for discoverability
      const searchFields = searchTitleOnly
        ? ["title"]
        : ["title", "description", "shortDescription"];
      const fuzzySearchFilter = createFuzzySearchOrFilter(search, searchFields);
      if (fuzzySearchFilter?.$or) {
        filters.$or = fuzzySearchFilter.$or;
      } else {
        filters.$or = searchTitleOnly
          ? [{ title: phraseRegex }]
          : [
              { title: phraseRegex },
              { description: phraseRegex },
              { shortDescription: phraseRegex },
            ];
      }
    }
  }
  if (categories) {
    const categoryList = categories
      .split(",")
      .map((cat) => cat.trim())
      .filter((cat) => mongoose.Types.ObjectId.isValid(cat));
    if (categoryList.length > 0) {
      categoryObjectIds = categoryList.map(
        (cat) => new mongoose.Types.ObjectId(cat)
      );
      filters.category = { $in: categoryObjectIds };
      hasCategoryFilter = true;
    }
  }
  if (audience) {
    filters.audience = isAdmin ? audience : { $regex: audience, $options: "i" };
  }
  if (instructors) {
    const instructorList = instructors
      .split(",")
      .map((id) => id.trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (instructorList.length > 0) {
      const instructorObjectIds = instructorList.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
      filters.instructor = { $in: instructorObjectIds };
    }
  }

  // Build aggregation pipeline
  const pipeline: any[] = [{ $match: filters }];

  // Sorting:
  // - For regular users with a single category filter, use categoryOrders (per-category screenshot order)
  // - For other regular users, keep random sorting (discovery)
  // - For admin, sort by updatedAt
  if (!isAdmin) {
    if (hasCategoryFilter && categoryObjectIds.length === 1) {
      const singleCategoryId = categoryObjectIds[0];
      pipeline.push({
        $addFields: {
          _categorySortKey: {
            $let: {
              vars: {
                entry: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: { $ifNull: ["$categoryOrders", []] },
                        as: "e",
                        cond: { $eq: ["$$e.categoryId", singleCategoryId] },
                      },
                    },
                    0,
                  ],
                },
              },
              in: { $ifNull: ["$$entry.order", 999999] },
            },
          },
        },
      });
      pipeline.push({
        $sort: { _categorySortKey: 1, title: 1, createdAt: 1 },
      });
    } else if (hasCategoryFilter) {
      pipeline.push({
        $sort: { createdAt: 1 },
      });
    } else {
      // Add a random field for sorting
      pipeline.push({
        $addFields: {
          _randomSort: { $rand: {} },
        },
      });
      // Sort by random value
      pipeline.push({
        $sort: { _randomSort: 1 },
      });
    }
  } else {
    // For admin, sort by the specified field (sortBy parameter)
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    pipeline.push({
      $sort: { [sortBy]: sortDirection },
    });
  }

  // Use aggregation pipeline with proper sorting
  const courses = await CourseModel.aggregate([
    ...pipeline,
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "instructor",
        foreignField: "_id",
        as: "instructor",
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              profilePicture: 1,
              _id: 1,
            },
          },
        ],
      },
    },
    {
      $project: isAdmin
        ? {
            _id: 1,
            title: 1,
            shortDescription: 1,
            description: 1,
            category: 1,
            thumbnail: 1,
            isActive: 1,
            isFeatured: 1,
            audience: 1,
            slug: 1,
            plans: 1,
            analytics: {
              totalRatings: 1,
              totalReviews: 1,
            },
            updatedAt: 1,
            createdAt: 1,
          }
        : {
            title: 1,
            description: 1,
            category: 1,
            thumbnail: 1,
            instructor: 1,
            analytics: 1,
            staticRating: 1,
            staticReviewCount: 1,
            "plans.elite.price": 1,
            "plans.elite.discount": 1,
            "plans.essential.price": 1,
            "plans.essential.discount": 1,
            discount: 1,
            isFeatured: 1,
            slug: 1,
          },
    },
  ]);

  const total = await CourseModel.countDocuments(filters);
  const totalPages = Math.ceil(total / limit);

  return { courses, total, totalPages, page };
};

type AdminCourseListSortBy = "createdAt" | "updatedAt" | "title";

function buildAdminCourseListFilters(options: {
  search?: string;
  searchTitleOnly?: boolean;
  categories?: string;
  audience?: string;
  instructors?: string;
  isActive?: boolean;
}): Record<string, unknown> {
  const {
    search,
    searchTitleOnly,
    categories,
    audience,
    instructors,
    isActive,
  } = options;

  const filters: Record<string, unknown> = {};

  if (isActive !== undefined) {
    filters.isActive = isActive;
  }

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const phraseRegex = { $regex: escapedSearch, $options: "i" };
    const and = (filters.$and as unknown[]) ?? [];
    and.push(
      searchTitleOnly
        ? { title: phraseRegex }
        : {
            $or: [
              { title: phraseRegex },
              { description: phraseRegex },
              { shortDescription: phraseRegex },
            ],
          }
    );
    filters.$and = and;
  }

  if (categories) {
    const categoryList = categories
      .split(",")
      .map((cat) => cat.trim())
      .filter((cat) => mongoose.Types.ObjectId.isValid(cat));
    if (categoryList.length > 0) {
      const categoryObjectIds = categoryList.map(
        (cat) => new mongoose.Types.ObjectId(cat)
      );
      filters.category = { $in: categoryObjectIds };
    }
  }

  if (audience) {
    filters.audience = audience;
  }

  if (instructors) {
    const instructorList = instructors
      .split(",")
      .map((id) => id.trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (instructorList.length > 0) {
      const instructorObjectIds = instructorList.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
      filters.instructor = { $in: instructorObjectIds };
    }
  }

  return filters;
}

export const getAdminCourseOptionsService = async (options: {
  page: number;
  limit: number;
  search?: string;
  categories?: string;
  audience?: string;
  instructors?: string;
  isActive?: boolean;
  sortBy?: AdminCourseListSortBy;
  sortOrder?: "asc" | "desc";
  searchTitleOnly?: boolean;
}): Promise<{
  courses: Array<{
    _id: string;
    title: string;
    plans?: Course["plans"];
  }>;
  total: number;
  page: number;
  totalPages: number;
}> => {
  const {
    page,
    limit,
    search,
    categories,
    audience,
    instructors,
    isActive,
    sortBy = "updatedAt",
    sortOrder = "desc",
    searchTitleOnly,
  } = options;

  const skip = (page - 1) * limit;
  const filters = buildAdminCourseListFilters({
    search,
    categories,
    audience,
    instructors,
    isActive,
    searchTitleOnly,
  });

  const total = await CourseModel.countDocuments(filters);
  const dir = sortOrder === "asc" ? 1 : -1;

  const raw = await CourseModel.find(filters)
    .select({ _id: 1, title: 1, plans: 1 })
    .sort({ [sortBy]: dir })
    .skip(skip)
    .limit(limit)
    .lean();

  const courses = (raw ?? []).map((c) => {
    const doc = c as {
      _id: unknown;
      title: unknown;
      plans?: Course["plans"];
    };
    return {
      _id: String(doc._id),
      title: String(doc.title ?? ""),
      ...(doc.plans !== undefined && doc.plans !== null
        ? { plans: doc.plans }
        : {}),
    };
  });

  return {
    courses,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const getFeaturedCoursesService = async (
  page: number,
  limit: number,
  search: string,
  isAdmin?: boolean
): Promise<{
  courses: Course[];
  total: number;
  page: number;
  totalPages: number;
  isAdmin?: boolean;
}> => {
  const skip = (page - 1) * limit;

  let filters: any = { isFeatured: true };
  if (!isAdmin) {
    filters.isActive = true;
  }
  if (search) {
    // Use fuzzy search for better matching
    const fuzzySearchFilter = createFuzzySearchOrFilter(search, [
      "title",
      "description",
      "shortDescription",
    ]);

    if (fuzzySearchFilter && fuzzySearchFilter.$or) {
      filters.$or = fuzzySearchFilter.$or;
    } else {
      // Fallback to simple regex if fuzzy search fails
      filters.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
      ];
    }
  }

  // Use aggregation pipeline for random sorting
  const courses = await CourseModel.aggregate([
    { $match: filters },
    { $addFields: { randomSort: { $rand: {} } } },
    { $sort: { randomSort: 1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "instructor",
        foreignField: "_id",
        as: "instructor",
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              profilePicture: 1,
              _id: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $project: isAdmin
        ? { __v: 0 }
        : {
            title: 1,
            description: 1,
            category: 1,
            thumbnail: 1,
            instructor: 1,
            analytics: 1,
            staticRating: 1,
            staticReviewCount: 1,
            "plans.elite.price": 1,
            "plans.elite.discount": 1,
            "plans.essential.price": 1,
            "plans.essential.discount": 1,
            discount: 1,
            slug: 1,
          },
    },
  ]);

  const total = await CourseModel.countDocuments(filters);
  const totalPages = Math.ceil(total / limit);

  return { courses, total, totalPages, page };
};

export const getCourseByIdService = async (
  courseId: string,
  isAdmin?: boolean
): Promise<Course | null> => {
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return null;
  }

  // Fetch course WITHOUT populating category to avoid CastError with invalid values
  const course = await CourseModel.findById(courseId)
    .where(isAdmin ? {} : { isActive: true })
    .select("-__v")
    .populate("instructor", "-__v")
    .populate("testimonials", "-__v")
    .populate("faqs", isAdmin ? "-__v" : "-__v -_id -createdAt -updatedAt")
    .populate({
      path: "modules",
      select: isAdmin ? "-__v" : "-__v -courseId -createdAt -updatedAt",
      options: { sort: { order: 1 } },
      populate: {
        path: "lessons",
        select: isAdmin ? "-__v" : "-__v -moduleId -createdAt -updatedAt",
        options: { sort: { order: 1 } },
        populate: {
          path: "contents",
          select: isAdmin
            ? "-__v"
            : "-__v -moduleId -lessonId -createdAt -updatedAt",
          options: { sort: { order: 1 } },
        },
      },
    })
    .lean();

  if (!course) {
    return null;
  }

  // Manually handle category population to avoid CastError
  if (course.category) {
    const categoryArray = Array.isArray(course.category)
      ? course.category
      : [course.category];

    // Separate valid ObjectIds and string names
    const validCategoryIds: string[] = [];
    const categoryNames: string[] = [];

    categoryArray.forEach((cat: any) => {
      // If it's already a populated object, use its _id
      if (typeof cat === "object" && cat !== null && cat._id) {
        validCategoryIds.push(cat._id.toString());
      }
      // If it's a string, check if it's a valid ObjectId
      else if (typeof cat === "string") {
        if (mongoose.Types.ObjectId.isValid(cat)) {
          validCategoryIds.push(cat);
        } else {
          // It's a category name (old format), try to find it
          categoryNames.push(cat);
        }
      }
    });

    // Try to find categories by name for old string-based categories
    if (categoryNames.length > 0) {
      try {
        const categoriesByName = await CategoryModel.find({
          name: { $in: categoryNames },
          isActive: true,
        })
          .select("-__v")
          .lean();

        // Add the found category IDs
        categoriesByName.forEach((cat) => {
          if (cat._id) {
            validCategoryIds.push(cat._id.toString());
          }
        });
      } catch (error) {
        console.error("Error finding categories by name:", error);
      }
    }

    // Manually populate categories if we have valid IDs
    if (validCategoryIds.length > 0) {
      try {
        const categoryObjectIds = validCategoryIds.map(
          (id) => new mongoose.Types.ObjectId(id)
        );
        const categories = await CategoryModel.find({
          _id: { $in: categoryObjectIds },
        })
          .select("-__v")
          .lean();
        (course as any).category = categories;
      } catch (error) {
        // If population fails, just use the IDs
        (course as any).category = validCategoryIds;
      }
    } else {
      // No valid categories, set to empty array
      (course as any).category = [];
    }
  } else {
    (course as any).category = [];
  }

  return course as Course;
};

export const getCourseBySlugService = async (
  slug: string,
  isAdmin?: boolean
): Promise<Course | null> => {
  // Fetch course WITHOUT populating category to avoid CastError with invalid values
  const course = await CourseModel.findOne({ slug, isActive: true })
    .where(isAdmin ? {} : { isActive: true })
    .select("-__v")
    .populate("instructor", "-__v")
    .populate("testimonials", "-__v")
    .populate("faqs", isAdmin ? "-__v" : "-__v -_id -createdAt -updatedAt")
    .populate({
      path: "modules",
      select: isAdmin ? "-__v" : "-__v -courseId -createdAt -updatedAt",
      options: { sort: { order: 1 } },
      populate: {
        path: "lessons",
        select: isAdmin ? "-__v" : "-__v -moduleId -createdAt -updatedAt",
        options: { sort: { order: 1 } },
        populate: {
          path: "contents",
          select: isAdmin
            ? "-__v"
            : "-__v -moduleId -lessonId -createdAt -updatedAt",
          options: { sort: { order: 1 } },
        },
      },
    })
    .lean();

  if (!course) {
    return null;
  }

  // Manually handle category population to avoid CastError
  if (course.category) {
    const categoryArray = Array.isArray(course.category)
      ? course.category
      : [course.category];

    // Separate valid ObjectIds and string names
    const validCategoryIds: string[] = [];
    const categoryNames: string[] = [];

    categoryArray.forEach((cat: any) => {
      // If it's already a populated object, use its _id
      if (typeof cat === "object" && cat !== null && cat._id) {
        validCategoryIds.push(cat._id.toString());
      }
      // If it's a string, check if it's a valid ObjectId
      else if (typeof cat === "string") {
        if (mongoose.Types.ObjectId.isValid(cat)) {
          validCategoryIds.push(cat);
        } else {
          // It's a category name (old format), try to find it
          categoryNames.push(cat);
        }
      }
    });

    // Try to find categories by name for old string-based categories
    if (categoryNames.length > 0) {
      try {
        const categoriesByName = await CategoryModel.find({
          name: { $in: categoryNames },
          isActive: true,
        })
          .select("-__v")
          .lean();

        // Add the found category IDs
        categoriesByName.forEach((cat) => {
          if (cat._id) {
            validCategoryIds.push(cat._id.toString());
          }
        });
      } catch (error) {
        console.error("Error finding categories by name:", error);
      }
    }

    // Manually populate categories if we have valid IDs
    if (validCategoryIds.length > 0) {
      try {
        const categoryObjectIds = validCategoryIds.map(
          (id) => new mongoose.Types.ObjectId(id)
        );
        const categories = await CategoryModel.find({
          _id: { $in: categoryObjectIds },
        })
          .select("-__v")
          .lean();
        (course as any).category = categories;
      } catch (error) {
        // If population fails, just use the IDs
        (course as any).category = validCategoryIds;
      }
    } else {
      // No valid categories, set to empty array
      (course as any).category = [];
    }
  } else {
    (course as any).category = [];
  }

  return course as Course;
};

/**
 * Validates a course's internship offer and reconciles the program-side mirror
 * (`courseInternships.courses[]`).
 *
 * The course field is the source of truth; the mirror exists only so the admin
 * program list can show "used by N courses" without a second query. It is
 * maintained here, and only here, so an admin never edits the link twice.
 *
 * Returns the value to persist on the course — `undefined` clears the offer.
 */
const applyInternshipOffer = async (
  courseId: string,
  rawOffer: unknown,
  previousProgramId: string | null
): Promise<
  { programId: string; price: number; durations: number[] } | undefined
> => {
  const { offer, error } = normalizeInternshipOffer(rawOffer);
  if (error) throw new AppError(error, 400);

  if (offer) {
    const program = await CourseInternshipModel.findById(offer.programId)
      .select("_id")
      .lean();
    if (!program) throw new AppError("Internship program not found", 404);
  }

  const { pullFrom, addTo } = planMirrorSync(
    previousProgramId,
    offer?.programId ?? null
  );

  // $pull / $addToSet keep the mirror idempotent if a save is retried.
  if (pullFrom) {
    await CourseInternshipModel.updateOne(
      { _id: pullFrom },
      { $pull: { courses: courseId } }
    );
  }
  if (addTo) {
    await CourseInternshipModel.updateOne(
      { _id: addTo },
      { $addToSet: { courses: courseId } }
    );
  }

  return offer ?? undefined;
};

export const CreateCourseMetadataService = async (
  courseData: any
): Promise<Course | null> => {
  try {
    const cleanedCourseData = { ...courseData, modules: [] };
    // Validated and mirrored after save — the mirror needs the course's _id.
    delete cleanedCourseData.internshipOffer;

    const course = new CourseModel(cleanedCourseData);

    const savedCourse = await course.save();

    if (courseData.internshipOffer) {
      const offer = await applyInternshipOffer(
        String(savedCourse._id),
        courseData.internshipOffer,
        null
      );
      if (offer) {
        await CourseModel.updateOne(
          { _id: savedCourse._id },
          { $set: { internshipOffer: offer } }
        );
        (savedCourse as any).internshipOffer = offer;
      }
    }

    return savedCourse as Course;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in CreateCourseMetadataService:", error);
    throw new AppError(
      `Failed to create course: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

export const CreateCourseModuleService = async (
  courseId: string,
  moduleData: any
): Promise<CourseModule | null> => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  // Get the count of existing modules to set the order
  const moduleCount = await CourseModuleModel.countDocuments({ courseId });

  const cleanedModuleData = {
    ...moduleData,
    courseId: course._id,
    lessons: [],
    order: moduleData.order !== undefined ? moduleData.order : moduleCount,
  };
  const module = new CourseModuleModel(cleanedModuleData);
  const savedModule = await module.save();

  if (!savedModule) {
    return null;
  }

  // Add module ID to course's modules array
  await CourseModel.findByIdAndUpdate(courseId, {
    $push: { modules: savedModule._id },
    updatedAt: new Date(),
  });

  return savedModule as CourseModule;
};

export const UpdateCourseModuleService = async (
  courseId: string,
  moduleId: string,
  moduleData: any
): Promise<CourseModule | null> => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  // Verify the module is referenced in this course's modules array
  const moduleIdStr = moduleId.toString();
  const isModuleInCourse = course.modules?.some(
    (m: any) => m.toString() === moduleIdStr
  );
  
  if (!isModuleInCourse) {
    throw new AppError("Module is not part of this course", 400);
  }

  const module = await CourseModuleModel.findOneAndUpdate(
    {
      _id: moduleId,
    },
    {
      ...moduleData,
      updatedAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!module) {
    return null;
  }

  return module as CourseModule;
};

export const DeleteCourseModuleService = async (
  courseId: string,
  moduleId: string
): Promise<boolean> => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  const module = await CourseModuleModel.findOneAndDelete({
    _id: moduleId,
    courseId: course._id,
  });

  if (!module) {
    return false;
  }

  await CourseModel.findByIdAndUpdate(courseId, {
    $pull: { modules: moduleId },
    updatedAt: new Date(),
  });

  return true;
};

export const CreateCourseLessonService = async (
  courseId: string,
  moduleId: string,
  lessonData: any
): Promise<CourseLesson | null> => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  const module = await CourseModuleModel.findById(moduleId);
  if (!module) {
    throw new AppError("Module not found", 404);
  }

  // Note: We don't strictly validate that module.courseId === courseId
  // because modules can be shared between courses (e.g., duplicated courses)

  // Get the count of existing lessons in this module to set the order
  const lessonCount = await CourseLessonModel.countDocuments({ moduleId });

  const cleanedLessonData = {
    ...lessonData,
    moduleId: module._id,
    contents: [],
    order: lessonData.order !== undefined ? lessonData.order : lessonCount,
  };
  
  const lesson = new CourseLessonModel(cleanedLessonData);

  const savedLesson = await lesson.save();

  if (!savedLesson) {
    return null;
  }

  // Update the module to add the lesson
  // Note: We don't check courseId here because modules can be shared between courses
  await CourseModuleModel.findByIdAndUpdate(
    moduleId,
    {
      $push: { lessons: savedLesson._id },
      updatedAt: new Date(),
    },
    { new: true }
  );
  
  return savedLesson as CourseLesson;
};

export const UpdateCourseLessonService = async (
  courseId: string,
  moduleId: string,
  lessonId: string,
  lessonData: any
): Promise<CourseLesson | null> => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  const module = await CourseModuleModel.findById(moduleId);
  if (!module) {
    throw new AppError("Module not found", 404);
  }

  const lesson = await CourseLessonModel.findOneAndUpdate(
    {
      _id: lessonId,
      moduleId: module._id,
    },
    {
      ...lessonData,
      updatedAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!lesson) {
    return null;
  }

  return lesson as CourseLesson;
};

export const DeleteCourseLessonService = async (
  courseId: string,
  moduleId: string,
  lessonId: string
): Promise<boolean> => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  const module = await CourseModuleModel.findById(moduleId);
  if (!module) {
    throw new AppError("Module not found", 404);
  }

  const lesson = await CourseLessonModel.findOneAndDelete({
    _id: lessonId,
    moduleId: module._id,
  });

  if (!lesson) {
    return false;
  }

  await CourseModuleModel.findOneAndUpdate(
    {
      _id: moduleId,
      courseId: course._id,
    },
    {
      $pull: { lessons: lessonId },
      updatedAt: new Date(),
    }
  );

  return true;
};

export const CreateCourseLessonContentService = async (
  courseId: string,
  moduleId: string,
  lessonId: string,
  contentData: any
): Promise<Content | null> => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  const module = await CourseModuleModel.findById(moduleId);
  if (!module) {
    throw new AppError("Module not found", 404);
  }

  const lesson = await CourseLessonModel.findById(lessonId);
  if (!lesson) {
    throw new AppError("Lesson not found", 404);
  }

  // Get the count of existing content in this lesson to set the order
  const contentCount = await ContentModel.countDocuments({ lessonId });

  const cleanedContentData = {
    ...contentData,
    lessonId: lesson._id,
    moduleId: module._id,
    order: contentData.order !== undefined ? contentData.order : contentCount,
  };
  const content = new ContentModel(cleanedContentData);
  if (!content) {
    return null;
  }

  const savedContent = await content.save();
  if (!savedContent) {
    return null;
  }

  await CourseLessonModel.findOneAndUpdate(
    {
      _id: lessonId,
      moduleId: module._id,
    },
    { $push: { contents: savedContent._id }, updatedAt: new Date() }
  );
  return savedContent as Content;
};

export const UpdateCourseLessonContentService = async (
  courseId: string,
  moduleId: string,
  lessonId: string,
  contentId: string,
  contentData: any
): Promise<Content | null> => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  const module = await CourseModuleModel.findById(moduleId);
  if (!module) {
    throw new AppError("Module not found", 404);
  }

  const lesson = await CourseLessonModel.findById(lessonId);
  if (!lesson) {
    throw new AppError("Lesson not found", 404);
  }

  const content = await ContentModel.findOneAndUpdate(
    {
      _id: contentId,
      lessonId: lesson._id,
      moduleId: module._id,
    },
    { ...contentData, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  if (!content) {
    return null;
  }

  return content as Content;
};

export const DeleteCourseLessonContentService = async (
  courseId: string,
  moduleId: string,
  lessonId: string,
  contentId: string
): Promise<boolean> => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  const module = await CourseModuleModel.findById(moduleId);
  if (!module) {
    throw new AppError("Module not found", 404);
  }

  const lesson = await CourseLessonModel.findById(lessonId);
  if (!lesson) {
    throw new AppError("Lesson not found", 404);
  }

  const content = await ContentModel.findOneAndDelete({
    _id: contentId,
    lessonId: lesson._id,
    moduleId: module._id,
  });

  if (!content) {
    return false;
  }

  await CourseLessonModel.findOneAndUpdate(
    {
      _id: lessonId,
      moduleId: module._id,
    },
    { $pull: { contents: contentId }, updatedAt: new Date() }
  );
  return true;
};

/**
 * Generate a slug from a title (similar to frontend sanitizeSlug)
 */
const generateSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

/**
 * Generate a unique slug by checking if it exists and appending a number if needed
 */
const generateUniqueSlug = async (baseSlug: string): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingCourse = await CourseModel.findOne({ slug }).select("_id");
    if (!existingCourse) {
      return slug;
    }
    // If slug exists, append counter
    slug = `${baseSlug}-${counter}`;
    counter++;
    // Safety check to prevent infinite loop
    if (counter > 1000) {
      // Fallback to timestamp-based slug
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
};

export const DuplicateCourseService = async (
  courseId: string
): Promise<Course | null> => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  const cleanedCourseData = { ...course.toObject() };

  delete (cleanedCourseData as any)._id;
  delete (cleanedCourseData as any).createdAt;
  delete (cleanedCourseData as any).updatedAt;
  delete (cleanedCourseData as any).slug; // Will be regenerated based on new title
  delete (cleanedCourseData as any).metaTitle; // SEO metadata - should be regenerated
  delete (cleanedCourseData as any).metaDescription; // SEO metadata - should be regenerated
  delete (cleanedCourseData as any).keywords; // SEO metadata - should be regenerated

  cleanedCourseData.title = `${cleanedCourseData.title} (Copy)`;
  cleanedCourseData.isActive = false;
  cleanedCourseData.isFeatured = false;
  cleanedCourseData.createdBy = undefined;

  // Generate unique slug and save with retry loop to handle race conditions
  const baseSlug = generateSlugFromTitle(cleanedCourseData.title);
  let savedCourse: any = null;
  let attempts = 0;
  const maxAttempts = 5;

  while (!savedCourse && attempts < maxAttempts) {
    try {
      // Generate a unique slug for this attempt
      cleanedCourseData.slug = await generateUniqueSlug(
        attempts === 0 ? baseSlug : `${baseSlug}-${Date.now()}-${attempts}`
      );

      const duplicatedCourse = new CourseModel(cleanedCourseData);
      savedCourse = await duplicatedCourse.save();

      if (!savedCourse) {
        throw new AppError("Failed to duplicate course", 500);
      }
    } catch (error: any) {
      // Check if error is due to duplicate slug (unique constraint violation)
      if (
        error.code === 11000 ||
        error.name === "MongoServerError" ||
        (error.message && error.message.includes("duplicate key"))
      ) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new AppError(
            "Failed to generate unique slug after multiple attempts",
            500
          );
        }
        // Continue loop to retry with new slug
        continue;
      }
      // For other errors, throw immediately
      throw error;
    }
  }

  if (!savedCourse) {
    throw new AppError("Failed to duplicate course", 500);
  }

  return savedCourse as Course;
};

export const DuplicateCourseMetadataService = async (
  courseId: string
): Promise<Course | null> => {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  const courseData = course.toObject();

  // Fields to exclude (bound relationships and system fields)
  const excludedFields = [
    "_id",
    "createdAt",
    "updatedAt",
    "modules", // Bound relationship
    "instructor", // Bound relationship
    "reviews", // Bound relationship (excluded)
    "testimonials", // Bound relationship
    "faqs", // Bound relationship (Q&A excluded)
    "scholarshipRef", // Bound relationship
    "createdBy", // System field
    "analytics", // Should be reset for new course
    "slug", // Will be generated based on title
    "metaTitle", // SEO metadata - should be regenerated
    "metaDescription", // SEO metadata - should be regenerated
    "keywords", // SEO metadata - should be regenerated
  ];

  // Create metadata-only copy
  const metadataOnly: any = {};

  // Copy only metadata fields
  Object.keys(courseData).forEach((key) => {
    if (!excludedFields.includes(key)) {
      metadataOnly[key] = courseData[key];
    }
  });

  // Modify specific fields for the duplicate
  metadataOnly.title = `${metadataOnly.title} (Copy)`;
  metadataOnly.isActive = false;
  metadataOnly.isFeatured = false;
  metadataOnly.isCertified = false;
  metadataOnly.scholarship = false;

  // Reset analytics to default values
  metadataOnly.analytics = {
    totalRatings: 0,
    totalReviews: 0,
    totalEnrollments: 0,
    activeEnrollments: 0,
    completionRate: 0,
    averageRating: 0,
    averageCompletionTime: 0,
    dropoffPoints: [],
  };

  // Initialize empty arrays for bound relationships
  metadataOnly.modules = [];
  metadataOnly.instructor = [];
  metadataOnly.testimonials = [];

  // Generate unique slug and save with retry loop to handle race conditions
  const baseSlug = generateSlugFromTitle(metadataOnly.title);
  let savedCourse: any = null;
  let attempts = 0;
  const maxAttempts = 5;

  while (!savedCourse && attempts < maxAttempts) {
    try {
      // Generate a unique slug for this attempt
      metadataOnly.slug = await generateUniqueSlug(
        attempts === 0 ? baseSlug : `${baseSlug}-${Date.now()}-${attempts}`
      );

      const duplicatedCourse = new CourseModel(metadataOnly);
      savedCourse = await duplicatedCourse.save();

      if (!savedCourse) {
        throw new AppError("Failed to duplicate course metadata", 500);
      }
    } catch (error: any) {
      // Check if error is due to duplicate slug (unique constraint violation)
      if (
        error.code === 11000 ||
        error.name === "MongoServerError" ||
        (error.message && error.message.includes("duplicate key"))
      ) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new AppError(
            "Failed to generate unique slug after multiple attempts",
            500
          );
        }
        // Continue loop to retry with new slug
        continue;
      }
      // For other errors, throw immediately
      throw error;
    }
  }

  if (!savedCourse) {
    throw new AppError("Failed to duplicate course metadata", 500);
  }

  return savedCourse as Course;
};

export const DuplicateCourseWithModulesService = async (
  courseId: string
): Promise<Course | null> => {
  // Find the original course (no need to populate - we'll share the module references)
  const course = await CourseModel.findById(courseId).lean();

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  const courseData = course as any;

  // Prepare course data (excluding system fields)
  const cleanedCourseData: any = { ...courseData };
  delete cleanedCourseData._id;
  delete cleanedCourseData.createdAt;
  delete cleanedCourseData.updatedAt;
  delete cleanedCourseData.slug;
  delete cleanedCourseData.metaTitle;
  delete cleanedCourseData.metaDescription;
  delete cleanedCourseData.keywords;
  // Keep modules array - share the same module references
  // Keep faqs - share the same FAQs as original
  delete cleanedCourseData.reviews;
  delete cleanedCourseData.testimonials;
  delete cleanedCourseData.scholarshipRef;
  delete cleanedCourseData.createdBy;
  delete cleanedCourseData.analytics;

  // Modify title and status
  cleanedCourseData.title = `${cleanedCourseData.title} (Copy)`;
  cleanedCourseData.isActive = false;
  cleanedCourseData.isFeatured = false;
  cleanedCourseData.isCertified = false;
  cleanedCourseData.scholarship = false;

  // Reset analytics
  cleanedCourseData.analytics = {
    totalRatings: 0,
    totalReviews: 0,
    totalEnrollments: 0,
    activeEnrollments: 0,
    completionRate: 0,
    averageRating: 0,
    averageCompletionTime: 0,
    dropoffPoints: [],
  };

  // Generate unique slug
  const baseSlug = generateSlugFromTitle(cleanedCourseData.title);
  let savedCourse: any = null;
  let attempts = 0;
  const maxAttempts = 5;

  while (!savedCourse && attempts < maxAttempts) {
    try {
      cleanedCourseData.slug = await generateUniqueSlug(
        attempts === 0 ? baseSlug : `${baseSlug}-${Date.now()}-${attempts}`
      );

      // Create the new course
      const duplicatedCourse = new CourseModel(cleanedCourseData);
      savedCourse = await duplicatedCourse.save();

      if (!savedCourse) {
        throw new AppError("Failed to duplicate course", 500);
      }

      // Fetch and return the fully populated course
      const populatedCourse = await CourseModel.findById(savedCourse._id)
        .populate({
          path: "modules",
          options: { sort: { order: 1 } },
          populate: {
            path: "lessons",
            options: { sort: { order: 1 } },
            populate: {
              path: "contents",
              options: { sort: { order: 1 } },
            },
          },
        })
        .populate("instructor")
        .lean();

      return populatedCourse as Course;
    } catch (error: any) {
      // Check if error is due to duplicate slug
      if (
        error.code === 11000 ||
        error.name === "MongoServerError" ||
        (error.message && error.message.includes("duplicate key"))
      ) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new AppError(
            "Failed to generate unique slug after multiple attempts",
            500
          );
        }
        continue;
      }
      // For other errors, throw immediately
      throw error;
    }
  }

  if (!savedCourse) {
    throw new AppError("Failed to duplicate course", 500);
  }

  return savedCourse as Course;
};

export const UpdateCourseStatusService = async (
  courseId: string,
  status: boolean
): Promise<Course | null> => {
  const updatedCourse = await CourseModel.findOneAndUpdate(
    { _id: courseId },
    { isActive: status, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  if (!updatedCourse) {
    throw new AppError("Course not found", 404);
  }

  return updatedCourse as Course;
};

// Toggle module/lesson/content active status for a specific course
export const ToggleCourseContentStatusService = async (
  courseId: string,
  contentType: "module" | "lesson" | "content",
  contentId: string
): Promise<Course | null> => {
  const course = await CourseModel.findById(courseId);
  
  if (!course) {
    throw new AppError("Course not found", 404);
  }

  let fieldName: string;
  let deactivatedList: string[];

  switch (contentType) {
    case "module":
      fieldName = "deactivatedModules";
      deactivatedList = course.deactivatedModules || [];
      break;
    case "lesson":
      fieldName = "deactivatedLessons";
      deactivatedList = course.deactivatedLessons || [];
      break;
    case "content":
      fieldName = "deactivatedContents";
      deactivatedList = course.deactivatedContents || [];
      break;
    default:
      throw new AppError("Invalid content type", 400);
  }

  // Toggle: if exists, remove it (activate); if not exists, add it (deactivate)
  const index = deactivatedList.indexOf(contentId);
  if (index > -1) {
    // Remove from deactivated list (activate)
    deactivatedList.splice(index, 1);
  } else {
    // Add to deactivated list (deactivate)
    deactivatedList.push(contentId);
  }

  // Update the course
  const updatedCourse = await CourseModel.findByIdAndUpdate(
    courseId,
    { [fieldName]: deactivatedList },
    { new: true }
  ).lean();

  return updatedCourse as Course;
};

export const UpdateCourseMetadataService = async (
  courseId: string,
  courseData: any
): Promise<Course | null> => {
  // Filter out undefined and null values to prevent overwriting existing data
  // Also explicitly exclude modules from metadata updates to preserve existing modules
  const cleanedData: any = { updatedAt: new Date() };

  // Fields that should never be updated via metadata endpoint
  const excludedFields = [
    "modules",
    "_id",
    // Per-course activation state should ONLY be managed via
    // ToggleCourseContentStatusService to avoid being overwritten
    // by stale form data coming from the admin metadata screens.
    "deactivatedModules",
    "deactivatedLessons",
    "deactivatedContents",
    // Handled explicitly below: the generic loop drops null/undefined, which
    // would silently ignore "remove this course's internship offer".
    "internshipOffer",
  ];

  Object.keys(courseData).forEach((key) => {
    // Skip excluded fields (like modules) - metadata updates shouldn't touch these
    if (excludedFields.includes(key)) {
      return;
    }

    // Only include fields that are explicitly provided and not null/undefined
    if (courseData[key] !== undefined && courseData[key] !== null) {
      cleanedData[key] = courseData[key];
    }
  });

  // The internship offer is set or cleared explicitly, so that clearing it
  // survives the null-stripping above.
  let clearInternshipOffer = false;
  if ("internshipOffer" in courseData) {
    const existing = await CourseModel.findById(courseId)
      .select("internshipOffer")
      .lean<{ internshipOffer?: { programId?: unknown } } | null>();
    const previousProgramId = existing?.internshipOffer?.programId
      ? String(existing.internshipOffer.programId)
      : null;

    const offer = await applyInternshipOffer(
      String(courseId),
      courseData.internshipOffer,
      previousProgramId
    );

    if (offer) {
      cleanedData.internshipOffer = offer;
    } else {
      clearInternshipOffer = true;
    }
  }

  const updatedCourse = await CourseModel.findOneAndUpdate(
    { _id: courseId },
    {
      $set: cleanedData,
      ...(clearInternshipOffer ? { $unset: { internshipOffer: "" } } : {}),
    },
    { new: true, runValidators: true }
  );

  if (!updatedCourse) {
    throw new AppError("Course not found", 404);
  }

  // Update instructor ownedCourses if instructors are being updated
  if (courseData.instructor && Array.isArray(courseData.instructor)) {
    // Get the old course data to compare
    const oldCourse = await CourseModel.findById(courseId);

    if (oldCourse) {
      const oldInstructorIds = (oldCourse.instructor || []).map((inst: any) => {
        return typeof inst === "object" && inst._id
          ? inst._id.toString()
          : inst.toString();
      });

      const newInstructorIds = courseData.instructor.map((inst: any) => {
        return typeof inst === "object" && inst._id
          ? inst._id.toString()
          : inst.toString();
      });

      // Find instructors that are being added
      const instructorsToAdd = newInstructorIds.filter(
        (id) => !oldInstructorIds.includes(id)
      );

      // Add course to newly added instructors' ownedCourses
      for (const instructorId of instructorsToAdd) {
        await UserModel.findByIdAndUpdate(
          instructorId,
          { $addToSet: { ownedCourses: courseId } },
          { new: true }
        );
      }

      // Find instructors that are being removed
      const instructorsToRemove = oldInstructorIds.filter(
        (id) => !newInstructorIds.includes(id)
      );

      // Remove course from removed instructors' ownedCourses
      for (const instructorId of instructorsToRemove) {
        await UserModel.findByIdAndUpdate(
          instructorId,
          { $pull: { ownedCourses: courseId } },
          { new: true }
        );
      }
    }
  }

  return updatedCourse as Course;
};

/**
 * Collect S3 keys from course, modules, contents, and live classes, then delete from S3.
 * Call before deleting DB records so we have the URL data.
 */
const deleteCourseFilesFromS3 = async (
  course: any,
  modules: any[],
  contents: any[],
  liveClasses: any[] = []
): Promise<void> => {
  const urls: string[] = [];
  if (course?.thumbnail) urls.push(course.thumbnail);
  if (course?.previewVideoUrl) urls.push(course.previewVideoUrl);
  for (const m of modules || []) {
    if (m?.thumbnailUrl) urls.push(m.thumbnailUrl);
  }
  for (const lc of liveClasses || []) {
    if (lc?.imageUrl) urls.push(lc.imageUrl);
  }
  for (const c of contents || []) {
    if (c?.sources?.length) {
      for (const s of c.sources) if (s?.videoUrl) urls.push(s.videoUrl);
    }
    if (c?.thumbnailUrl) urls.push(c.thumbnailUrl);
    if (c?.documentUrl) urls.push(c.documentUrl);
    if (c?.readingMaterials?.length) {
      for (const rm of c.readingMaterials) {
        if (rm?.downloadUrl) urls.push(rm.downloadUrl);
      }
    }
  }
  const keys = urls
    .map((u) => extractS3KeyFromUrl(u))
    .filter((k): k is string => k != null);
  if (keys.length > 0) {
    await deleteFilesFromS3([...new Set(keys)]);
  }
};

export const DeleteCourseService = async (
  courseId: string
): Promise<boolean> => {
  // First check if course exists
  const course = await CourseModel.findById(courseId);
  if (!course) {
    return false;
  }

  // Get all module IDs before deleting
  const modules = await CourseModuleModel.find({ courseId: courseId });
  const moduleIds = modules.map((module) => module._id);

  // Get all lesson IDs before deleting
  const lessons = await CourseLessonModel.find({
    moduleId: { $in: moduleIds },
  });
  const lessonIds = lessons.map((lesson) => lesson._id);

  // Fetch contents and live classes before deletion (needed for S3 URLs)
  const contents =
    lessonIds.length > 0
      ? await ContentModel.find({ lessonId: { $in: lessonIds } }).lean()
      : [];
  const liveClasses = await LiveClassModel.find({ course: courseId })
    .select("imageUrl")
    .lean();

  // Delete videos/images from S3 in background (non-blocking)
  deleteCourseFilesFromS3(course, modules, contents, liveClasses).catch((err) =>
    console.error("[DeleteCourseService] S3 cleanup failed:", err)
  );

  // Cascade delete in reverse order (contents -> lessons -> modules -> course)
  await ContentModel.deleteMany({
    lessonId: { $in: lessonIds },
  });
  await CourseLessonModel.deleteMany({
    moduleId: { $in: moduleIds },
  });
  await CourseModuleModel.deleteMany({
    courseId: courseId,
  });

  // Delete all reviews for this course
  await mongoose.model("Review").deleteMany({
    reviewableId: courseId,
    reviewableType: "Course",
  });

  // Delete video notes for this course
  await VideoNoteModel.deleteMany({ courseId });

  // Delete Q&A for this course
  await QnAModel.deleteMany({ courseId });

  // Delete live classes for this course, plus their absent-attendance rows
  // (which key off the live class, not the course, so they'd otherwise orphan).
  const liveClassIds = liveClasses.map((lc) => lc._id);
  if (liveClassIds.length > 0) {
    await LiveClassAttendanceModel.deleteMany({
      liveClass: { $in: liveClassIds },
    });
  }
  await LiveClassModel.deleteMany({ course: courseId });

  // Remove course from instructors' ownedCourses
  if (course.instructor) {
    // Extract instructor IDs and handle both arrays and single instructor
    const instructorIds: string[] = [];

    if (Array.isArray(course.instructor)) {
      for (const instructor of course.instructor) {
        if (!instructor) continue;

        if (typeof instructor === "object" && "_id" in instructor) {
          instructorIds.push(String((instructor as any)._id));
        } else {
          instructorIds.push(String(instructor));
        }
      }
    } else {
      const instructor = course.instructor;
      if (typeof instructor === "object" && instructor && "_id" in instructor) {
        instructorIds.push(String((instructor as any)._id));
      } else {
        instructorIds.push(String(instructor));
      }
    }

    // Remove course from each instructor's ownedCourses
    for (const instructorId of instructorIds) {
      await UserModel.findByIdAndUpdate(
        instructorId,
        { $pull: { ownedCourses: courseId } },
        { new: true }
      );
    }
  }

  // Delete the course
  const deletedCourse = await CourseModel.findOneAndDelete({ _id: courseId });

  // Only check if the main course was deleted successfully
  if (!deletedCourse) {
    return false;
  }

  return true;
};

/**
 * Check if a slug is available for use
 * @param slug - The slug to check
 * @param excludeId - Optional course ID to exclude from check (for updates)
 * @returns Object with availability status
 */
export const checkSlugAvailabilityService = async (
  slug: string,
  excludeId?: string
): Promise<{ available: boolean; message: string }> => {
  try {
    // Basic slug validation
    if (!slug || slug.trim().length === 0) {
      return {
        available: false,
        message: "Slug cannot be empty",
      };
    }

    // Check slug format (alphanumeric, hyphens, underscores only)
    const slugRegex = /^[a-zA-Z0-9-_]+$/;
    if (!slugRegex.test(slug)) {
      return {
        available: false,
        message:
          "Slug can only contain letters, numbers, hyphens, and underscores",
      };
    }

    // Check slug length
    if (slug.length < 3) {
      return {
        available: false,
        message: "Slug must be at least 3 characters long",
      };
    }

    if (slug.length > 50) {
      return {
        available: false,
        message: "Slug must be less than 50 characters",
      };
    }

    // Check if slug exists in database
    const query: any = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingCourse = await CourseModel.findOne(query).select("_id slug");

    if (existingCourse) {
      return {
        available: false,
        message: "This slug is already taken",
      };
    }

    return {
      available: true,
      message: "Slug is available",
    };
  } catch (error) {
    console.error("Error checking slug availability:", error);
    return {
      available: false,
      message: "Error checking slug availability",
    };
  }
};

// Reorder services
export const reorderModulesService = async (
  courseId: string,
  moduleIds: string[]
): Promise<CourseModule[]> => {
  const bulkOps = moduleIds.map((id, index) => ({
    updateOne: {
      filter: {
        _id: new mongoose.Types.ObjectId(id),
        courseId: new mongoose.Types.ObjectId(courseId),
      },
      update: { $set: { order: index } },
    },
  }));

  await CourseModuleModel.bulkWrite(bulkOps);

  const updatedModules = await CourseModuleModel.find({
    _id: { $in: moduleIds.map((id) => new mongoose.Types.ObjectId(id)) },
    courseId: new mongoose.Types.ObjectId(courseId),
  }).sort({ order: 1 });

  return updatedModules as CourseModule[];
};

export const reorderLessonsService = async (
  moduleId: string,
  lessonIds: string[]
): Promise<CourseLesson[]> => {
  const bulkOps = lessonIds.map((id, index) => ({
    updateOne: {
      filter: {
        _id: new mongoose.Types.ObjectId(id),
        moduleId: new mongoose.Types.ObjectId(moduleId),
      },
      update: { $set: { order: index } },
    },
  }));

  await CourseLessonModel.bulkWrite(bulkOps);

  const updatedLessons = await CourseLessonModel.find({
    _id: { $in: lessonIds.map((id) => new mongoose.Types.ObjectId(id)) },
    moduleId: new mongoose.Types.ObjectId(moduleId),
  }).sort({ order: 1 });

  return updatedLessons as CourseLesson[];
};

export const reorderContentService = async (
  lessonId: string,
  contentIds: string[]
): Promise<Content[]> => {
  const bulkOps = contentIds.map((id, index) => ({
    updateOne: {
      filter: {
        _id: new mongoose.Types.ObjectId(id),
        lessonId: new mongoose.Types.ObjectId(lessonId),
      },
      update: { $set: { order: index } },
    },
  }));

  await ContentModel.bulkWrite(bulkOps);

  const updatedContent = await ContentModel.find({
    _id: { $in: contentIds.map((id) => new mongoose.Types.ObjectId(id)) },
    lessonId: new mongoose.Types.ObjectId(lessonId),
  }).sort({ order: 1 });

  return updatedContent as Content[];
};

export const SEATS_LEFT_MIN = 2;
export const SEATS_LEFT_MAX = 9;

/**
 * Assign every active course a fresh random `seatsLeft` in [SEATS_LEFT_MIN,
 * SEATS_LEFT_MAX].
 *
 * The value is synthetic — it is not derived from enrollments, capacity, or any
 * other real quantity, and is overwritten wholesale on every run. Nothing may
 * gate enrollment, payment, or capacity on it.
 *
 * Runs as a single aggregation-pipeline update so `$rand` is evaluated
 * server-side per document — otherwise every course would land on the same
 * number. Deliberately unindexed: the filter matches nearly the whole
 * collection, so a scan is the correct plan and an `isActive` index would not
 * be used.
 */
export const randomizeActiveCourseSeatsLeft = async (): Promise<number> => {
  const span = SEATS_LEFT_MAX - SEATS_LEFT_MIN + 1;

  const result = await CourseModel.updateMany({ isActive: true }, [
    {
      $set: {
        seatsLeft: {
          $floor: {
            $add: [SEATS_LEFT_MIN, { $multiply: [{ $rand: {} }, span] }],
          },
        },
      },
    },
  ]);

  return result.modifiedCount;
};
