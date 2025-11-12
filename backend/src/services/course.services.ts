import { AppError } from "../middlewares/error.middleware";
import {
  ContentModel,
  CourseLessonModel,
  CourseModel,
  CourseModuleModel,
  UserModel,
} from "../models";
import { Content, Course, CourseLesson, CourseModule } from "../types";
import mongoose from "mongoose";

export const getAllCoursesService = async (
  page: number,
  limit: number,
  search: string,
  categories?: string,
  audience?: string,
  isAdmin?: boolean,
  sortBy: string = "updatedAt",
  sortOrder: string = "desc"
): Promise<{
  courses: Course[];
  total: number;
  page: number;
  totalPages: number;
  isAdmin?: boolean;
}> => {
  const skip = (page - 1) * limit;

  let filters: any = {};
  
  // Active filter - only show active courses for non-admin users
  if (!isAdmin) {
    filters.isActive = true;
  }
  
  if (search) {
    filters.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { shortDescription: { $regex: search, $options: "i" } },
    ];
  }
  if (categories) {
    // Handle multiple categories separated by commas
    const categoryList = categories.split(",").map((cat) => cat.trim());
    if (categoryList.length === 1) {
      // Single category - use exact match for better performance
      filters.category = categoryList[0];
    } else {
      // Multiple categories - use $in operator
      filters.category = { $in: categoryList };
    }
  }
  if (audience) {
    filters.audience = { $regex: audience, $options: "i" };
  }

  // Build aggregation pipeline
  const pipeline: any[] = [{ $match: filters }];

  // For regular users, add random field for random sorting
  // For admin, sort by updatedAt
  if (!isAdmin) {
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
  } else {
    // For admin, always sort by updatedAt
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    pipeline.push({
      $sort: { updatedAt: sortDirection },
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
            thumbnail: 1,
            instructor: 1,
            analytics: 1,
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
    filters.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { shortDescription: { $regex: search, $options: "i" } },
    ];
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
      $project: isAdmin
        ? { __v: 0 }
        : {
            title: 1,
            description: 1,
            thumbnail: 1,
            instructor: 1,
            analytics: 1,
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

  const course = await CourseModel.findById(courseId)
    .where(isAdmin ? {} : { isActive: true })
    .select("-__v")
    .populate("instructor", "-__v")
    .populate("testimonials", "-__v")
    .populate("faqs", isAdmin ? "-__v" : "-__v -_id -createdAt -updatedAt")
    .populate({
      path: "modules",
      select: isAdmin ? "-__v" : "-__v -courseId -createdAt -updatedAt",
      populate: {
        path: "lessons",
        select: isAdmin ? "-__v" : "-__v -moduleId -createdAt -updatedAt",
        populate: {
          path: "contents",
          select: isAdmin
            ? "-__v"
            : "-__v -moduleId -lessonId -createdAt -updatedAt",
        },
      },
    })
    .lean();

  if (!course) {
    return null;
  }

  return course as Course;
};

export const getCourseBySlugService = async (
  slug: string,
  isAdmin?: boolean
): Promise<Course | null> => {
  const course = await CourseModel.findOne({ slug, isActive: true })
    .where(isAdmin ? {} : { isActive: true })
    .select("-__v")
    .populate("instructor", "-__v")
    .populate("testimonials", "-__v")
    .populate("faqs", isAdmin ? "-__v" : "-__v -_id -createdAt -updatedAt")
    .populate({
      path: "modules",
      select: isAdmin ? "-__v" : "-__v -courseId -createdAt -updatedAt",
      populate: {
        path: "lessons",
        select: isAdmin ? "-__v" : "-__v -moduleId -createdAt -updatedAt",
        populate: {
          path: "contents",
          select: isAdmin
            ? "-__v"
            : "-__v -moduleId -lessonId -createdAt -updatedAt",
        },
      },
    })
    .lean();

  if (!course) {
    return null;
  }

  return course as Course;
};

export const CreateCourseMetadataService = async (
  courseData: any
): Promise<Course | null> => {
  try {
    const cleanedCourseData = { ...courseData, modules: [] };
    const course = new CourseModel(cleanedCourseData);

    const savedCourse = await course.save();
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

  const cleanedModuleData = {
    ...moduleData,
    courseId: course._id,
    lessons: [],
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

  const module = await CourseModuleModel.findOneAndUpdate(
    {
      _id: moduleId,
      courseId: course._id,
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

  const cleanedLessonData = {
    ...lessonData,
    moduleId: module._id,
    contents: [],
  };
  const lesson = new CourseLessonModel(cleanedLessonData);

  const savedLesson = await lesson.save();

  if (!savedLesson) {
    return null;
  }

  await CourseModuleModel.findOneAndUpdate(
    {
      _id: moduleId,
      courseId: course._id,
    },
    {
      $push: { lessons: savedLesson._id },
      updatedAt: new Date(),
    }
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

  const cleanedContentData = {
    ...contentData,
    lessonId: lesson._id,
    moduleId: module._id,
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

export const UpdateCourseMetadataService = async (
  courseId: string,
  courseData: any
): Promise<Course | null> => {
  const updatedCourse = await CourseModel.findOneAndUpdate(
    { _id: courseId },
    { ...courseData, updatedAt: new Date() },
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
