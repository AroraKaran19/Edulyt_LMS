import mongoose from "mongoose";
import {
  CourseModuleModel,
  CourseLessonModel,
  ContentModel,
  VideoContentModel,
  QuizContentModel,
  DocumentContentModel,
} from "../models/course-module.schema";
import { AppError } from "../middlewares/error.middleware";
import { CourseModel } from "../models/course.schema";
import { Course } from "../types/course";

/**
 * Retrieves paginated course list with search and filtering
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param search - Search term for title or description (optional)
 * @param filters - Array of filters to apply (optional)
 * @param audienceFilter - Filter by target audience (optional)
 * @param fields - Specific fields to include (optional)
 * @returns Promise<{courses: Course[], total: number, page: number, totalPages: number}>
 */
export const getAllCourses = async (
  page: number,
  limit: number,
  search?: string,
  filters?: string[],
  audienceFilter?: string,
  category?: string
): Promise<{
  courses: Course[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  try {
    // Input validation
    if (page < 1 || limit < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    if (limit > 100) {
      throw new AppError("Limit cannot exceed 100 items per page", 400);
    }

    // Build query object
    const query: any = { isActive: true };

    // Add filters if provided
    if (filters && filters.length > 0) {
      query.category = {
        $in: filters.map((filter) => new RegExp(filter, "i")),
      };
    }

    // Add audience filter if provided
    if (audienceFilter) {
      query.audience = new RegExp(audienceFilter, "i");
    }

    // Add category filter if provided
    if (category) {
      query.category = new RegExp(category, "i");
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const courses = await CourseModel.find(query)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await CourseModel.countDocuments(query);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      courses: courses as Course[],
      total,
      page,
      totalPages,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in getAllCourses:", error);
    throw new AppError(
      `Failed to retrieve courses: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Get a course by slug
 * @param slug - The course slug
 * @returns Promise<Course | null>
 */
export const getCourseUsingSlug = async (
  slug: string
): Promise<Course | null> => {
  try {
    const course = await CourseModel.findOne({ slug, isActive: true })
      .select("-__v")
      .populate("instructor")
      .populate("testimonials")
      .populate("faqs")
      .populate({
        path: "modules",
        populate: {
          path: "lessons",
          populate: {
            path: "contents",
          },
        },
      })
      .lean();

    return course as Course | null;
  } catch (error) {
    console.error("Database error in getCourseUsingSlug:", error);
    throw new AppError(
      `Failed to retrieve course: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Get featured courses
 * @param limit - Number of courses to return (default: 10)
 * @returns Promise<Course[]>
 */
export const getFeaturedCourses = async (
  limit: number = 10
): Promise<Course[]> => {
  try {
    const courses = await CourseModel.find({ isFeatured: true, isActive: true })
      .select("-__v")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return courses as Course[];
  } catch (error) {
    console.error("Database error in getFeaturedCourses:", error);
    throw new AppError(
      `Failed to retrieve featured courses: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Get courses by target audience
 * @param audience - The target audience
 * @param limit - Number of courses to return (default: 10)
 * @returns Promise<Course[]>
 */
export const getCoursesUsingAudience = async (
  audience: string,
  limit: number = 10
): Promise<Course[]> => {
  try {
    const courses = await CourseModel.find({
      audience: { $regex: audience, $options: "i" },
      isActive: true,
    })
      .select("-__v")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return courses as Course[];
  } catch (error) {
    console.error("Database error in getCoursesUsingAudience:", error);
    throw new AppError(
      `Failed to retrieve courses by audience: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Get courses by category
 * @param category - The category
 * @param limit - Number of courses to return (default: 10)
 * @returns Promise<Course[]>
 */
export const getCoursesUsingCategory = async (
  category: string,
  limit: number = 10
): Promise<Course[]> => {
  try {
    const courses = await CourseModel.find({
      category: { $regex: category, $options: "i" },
      isActive: true,
    })
      .select("-__v")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return courses as Course[];
  } catch (error) {
    console.error("Database error in getCoursesUsingCategory:", error);
    throw new AppError(
      `Failed to retrieve courses by category: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Update course metadata
 * @param courseId - The ID of the course to update
 * @param courseData - The updated course data
 * @returns Promise<Course>
 */
export const UpdateCourseMetadata = async (
  courseId: string,
  courseData: any
): Promise<Course> => {
  try {
    const course = await CourseModel.findByIdAndUpdate(
      courseId,
      { ...courseData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    return course as Course;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in UpdateCourseMetadata:", error);
    throw new AppError(
      `Failed to update course: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Create course metadata
 * @param courseData - The course data to create
 * @returns Promise<{course: Course, courseId: string}>
 */
export const CreateCourseMetadata = async (
  courseData: any
): Promise<{ course: Course; courseId: string }> => {
  try {
    // Clean the course data - remove frontend-only fields
    const cleanedCourseData = { ...courseData };

    // Remove frontend-only fields that shouldn't be saved to database
    delete cleanedCourseData.thumbnailSource;
    delete cleanedCourseData.thumbnailS3Key;
    delete cleanedCourseData.previewVideoSource;
    delete cleanedCourseData.previewVideoS3Key;
    delete cleanedCourseData.curriculumSource;
    delete cleanedCourseData.curriculumS3Key;
    delete cleanedCourseData.moduleIds;

    // Remove _id field to let MongoDB auto-generate it
    delete cleanedCourseData._id;

    // Convert empty curriculum string to undefined to pass URL validation
    if (cleanedCourseData.curriculum === "") {
      cleanedCourseData.curriculum = undefined;
    }

    // Clean testimonials and FAQs - only keep valid ObjectIds
    if (cleanedCourseData.testimonials) {
      cleanedCourseData.testimonials = cleanedCourseData.testimonials.filter(
        (id: string) =>
          id && id.trim() !== "" && mongoose.Types.ObjectId.isValid(id)
      );
    }

    if (cleanedCourseData.faqs) {
      cleanedCourseData.faqs = cleanedCourseData.faqs.filter(
        (id: string) =>
          id && id.trim() !== "" && mongoose.Types.ObjectId.isValid(id)
      );
    }

    const course = new CourseModel(cleanedCourseData);
    const savedCourse = await course.save();

    return {
      course: savedCourse as Course,
      courseId: savedCourse._id.toString(),
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in CreateCourseMetadata:", error);
    throw new AppError(
      `Failed to create course: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Update course status
 * @param courseId - The ID of the course to update
 * @param status - The new status
 * @returns Promise<Course>
 */
export const updateCourseStatusService = async (
  courseId: string,
  status: string
): Promise<Course> => {
  try {
    const course = await CourseModel.findByIdAndUpdate(
      courseId,
      { status, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    return course as Course;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in updateCourseStatusService:", error);
    throw new AppError(
      `Failed to update course status: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Get courses for admin
 * @param page - Page number
 * @param limit - Items per page
 * @param search - Search term
 * @param category - Category filter
 * @param status - Status filter
 * @returns Promise<{courses: Course[], total: number, page: number, totalPages: number}>
 */
export const getCoursesForAdminService = async (
  page: number,
  limit: number,
  search?: string,
  category?: string,
  status?: string
): Promise<{
  courses: Course[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  try {
    // Input validation
    if (page < 1 || limit < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    if (limit > 100) {
      throw new AppError("Limit cannot exceed 100 items per page", 400);
    }

    // Build query object
    const query: any = {};

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
      ];
    }

    // Add category filter
    if (category && category !== "all") {
      query.category = new RegExp(category, "i");
    }

    // Add status filter
    if (status && status !== "all") {
      query.isActive = status === "active";
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const courses = await CourseModel.find(query)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await CourseModel.countDocuments(query);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      courses: courses as Course[],
      total,
      page,
      totalPages,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in getCoursesForAdminService:", error);
    throw new AppError(
      `Failed to retrieve courses for admin: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Get a course by ID for admin (includes inactive courses)
 * @param courseId - The ID of the course to retrieve
 * @returns Promise<Course | null>
 */
export const getCourseByIdAdminService = async (
  courseId: string
): Promise<Course | null> => {
  try {
    const course = await CourseModel.findById(courseId)
      .populate({
        path: "modules",
        populate: {
          path: "lessons",
          populate: {
            path: "contents",
          },
        },
      })
      .select("-__v")
      .lean();

    return course as Course | null;
  } catch (error) {
    console.error("Database error in getCourseByIdAdminService:", error);
    throw new AppError(
      `Failed to retrieve course: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Duplicate a course
 * @param courseId - The ID of the course to duplicate
 * @returns Promise<Course>
 */
export const duplicateCourseService = async (
  courseId: string
): Promise<Course> => {
  try {
    const originalCourse = await CourseModel.findById(courseId).select("-__v");

    if (!originalCourse) {
      throw new AppError("Course not found", 404);
    }

    // Create a copy of the course data
    const courseData = originalCourse.toObject();
    delete (courseData as any)._id;
    delete (courseData as any).createdAt;
    delete (courseData as any).updatedAt;

    // Modify title to indicate it's a copy
    courseData.title = `${courseData.title} (Copy)`;
    courseData.isActive = false; // Set as inactive by default
    courseData.isFeatured = false; // Remove featured status

    const duplicatedCourse = new CourseModel(courseData);
    const savedCourse = await duplicatedCourse.save();

    return savedCourse as Course;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in duplicateCourseService:", error);
    throw new AppError(
      `Failed to duplicate course: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Add a single module to a course (real-time)
 * @param courseId - The ID of the course
 * @param moduleData - The module data to add
 * @returns Promise<{success: boolean, module: any}>
 */
export const AddSingleCourseModule = async (
  courseId: string,
  moduleData: any
): Promise<{ success: boolean; module: any }> => {
  try {
    // Validate course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Remove _id to let MongoDB generate a proper ObjectId
    const { _id, thumbnailSource, thumbnailS3Key, ...moduleDataWithoutId } =
      moduleData;

    // Create the module
    const module = new CourseModuleModel({
      ...moduleDataWithoutId,
      courseId: courseId,
      lessonIds: [],
      isActive:
        moduleDataWithoutId.isActive !== undefined
          ? moduleDataWithoutId.isActive
          : true,
      isCompleted:
        moduleDataWithoutId.isCompleted !== undefined
          ? moduleDataWithoutId.isCompleted
          : false,
    });

    const savedModule = await module.save();

    // Update course with new module ID
    await CourseModel.findByIdAndUpdate(
      courseId,
      {
        $push: { modules: savedModule._id },
        updatedAt: new Date(),
      },
      { runValidators: true }
    );

    return {
      success: true,
      module: savedModule,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in AddSingleCourseModule:", error);
    throw new AppError(
      `Failed to add module: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Update a single module in a course (real-time)
 * @param courseId - The ID of the course
 * @param moduleId - The ID of the module to update
 * @param moduleData - The updated module data
 * @returns Promise<{success: boolean, module: any}>
 */
export const UpdateSingleCourseModule = async (
  courseId: string,
  moduleId: string,
  moduleData: any
): Promise<{ success: boolean; module: any }> => {
  try {
    // Validate course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Remove _id from update data to avoid conflicts
    const { _id, thumbnailSource, thumbnailS3Key, ...updateData } = moduleData;

    // Update the module
    // First try with courseId (for new modules), then without (for backward compatibility)
    let updatedModule = await CourseModuleModel.findOneAndUpdate(
      { _id: moduleId, courseId: courseId },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedModule) {
      updatedModule = await CourseModuleModel.findOneAndUpdate(
        { _id: moduleId },
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );
    }

    if (!updatedModule) {
      throw new AppError("Module not found", 404);
    }

    return {
      success: true,
      module: updatedModule,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in UpdateSingleCourseModule:", error);
    throw new AppError(
      `Failed to update module: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Delete a single module from a course (real-time)
 * @param courseId - The ID of the course
 * @param moduleId - The ID of the module to delete
 * @returns Promise<{success: boolean, message: string}>
 */
export const DeleteSingleCourseModule = async (
  courseId: string,
  moduleId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Delete the module and all its lessons and content
    // First try with courseId (for new modules), then without (for backward compatibility)
    let deletedModule = await CourseModuleModel.findOneAndDelete({
      _id: moduleId,
      courseId: courseId,
    });

    // If not found with courseId, try without courseId for backward compatibility
    if (!deletedModule) {
      deletedModule = await CourseModuleModel.findOneAndDelete({
        _id: moduleId,
      });
    }

    if (!deletedModule) {
      throw new AppError("Module not found", 404);
    }

    // Delete all content for this module directly using moduleId
    const contentDeleteResult = await ContentModel.deleteMany({
      moduleId: moduleId,
    });

    if (contentDeleteResult.deletedCount === 0) {
      console.log("No content found for this module");
    }

    // Delete all lessons for this module
    const lessonDeleteResult = await CourseLessonModel.deleteMany({
      moduleId: moduleId,
    });

    if (lessonDeleteResult.deletedCount === 0) {
      console.log("No lessons found for this module");
    }

    // Remove module ID from course's moduleIds array
    await CourseModel.findByIdAndUpdate(courseId, {
      $pull: { modules: moduleId },
      updatedAt: new Date(),
    });

    return {
      success: true,
      message:
        "Module and all associated lessons and content deleted successfully",
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in DeleteSingleCourseModule:", error);
    throw new AppError(
      `Failed to delete module: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Update course module references (modules array)
 * @param courseId - The ID of the course
 * @param moduleIds - Array of module IDs to reference
 * @returns Promise<{success: boolean, message: string}>
 */
export const UpdateCourseModuleReferences = async (
  courseId: string,
  moduleIds: string[]
): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate that all moduleIds are valid ObjectIds and convert them
    const validModuleIds = moduleIds
      .filter((id) => {
        try {
          return mongoose.Types.ObjectId.isValid(id);
        } catch {
          return false;
        }
      })
      .map((id) => new mongoose.Types.ObjectId(id));

    if (validModuleIds.length !== moduleIds.length) {
      throw new AppError("Invalid module IDs provided", 400);
    }

    // Check if course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Update the course with new module references
    await CourseModel.findByIdAndUpdate(courseId, {
      modules: validModuleIds,
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: `Course module references updated successfully with ${validModuleIds.length} modules`,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in UpdateCourseModuleReferences:", error);
    throw new AppError(
      `Failed to update course module references: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Finalize course creation (mark as complete and ready)
 * @param courseId - The ID of the course to finalize
 * @returns Promise<{success: boolean, message: string}>
 */
export const FinalizeCourseCreation = async (
  courseId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    await CourseModel.findByIdAndUpdate(courseId, {
      isActive: true,
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: "Course creation finalized successfully",
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in FinalizeCourseCreation:", error);
    throw new AppError(
      `Failed to finalize course: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Add a single lesson to a module (real-time)
 * @param courseId - The ID of the course
 * @param moduleId - The ID of the module
 * @param lessonData - The lesson data
 * @returns Promise<{success: boolean, lesson: any}>
 */
export const AddSingleCourseLesson = async (
  courseId: string,
  moduleId: string,
  lessonData: any
): Promise<{ success: boolean; lesson: any }> => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new AppError("Invalid course ID format", 400);
    }
    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      throw new AppError("Invalid module ID format", 400);
    }

    // Validate course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Validate module exists
    // First try with courseId (for new modules), then without (for backward compatibility)
    let module = await CourseModuleModel.findOne({
      _id: moduleId,
      courseId: courseId,
    });
    if (!module) {
      module = await CourseModuleModel.findOne({ _id: moduleId });
    }
    if (!module) {
      throw new AppError("Module not found", 404);
    }

    // Remove _id to let MongoDB generate a proper ObjectId
    const { _id, ...lessonDataWithoutId } = lessonData;

    // Create the lesson
    const lesson = new CourseLessonModel({
      ...lessonDataWithoutId,
      moduleId: moduleId,
    });

    await lesson.save();

    // Update module with new lesson ID
    // First try with courseId (for new modules), then without (for backward compatibility)
    let updateResult = await CourseModuleModel.findOneAndUpdate(
      { _id: moduleId, courseId: courseId },
      {
        $push: { lessonIds: lesson._id },
        updatedAt: new Date(),
      }
    );

    if (!updateResult) {
      await CourseModuleModel.findOneAndUpdate(
        { _id: moduleId },
        {
          $push: { lessonIds: lesson._id },
          updatedAt: new Date(),
        }
      );
    }

    return {
      success: true,
      lesson: lesson,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in AddSingleCourseLesson:", error);
    throw new AppError(
      `Failed to add lesson: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Update a single lesson in a module (real-time)
 * @param courseId - The ID of the course
 * @param moduleId - The ID of the module
 * @param lessonId - The ID of the lesson to update
 * @param lessonData - The updated lesson data
 * @returns Promise<{success: boolean, lesson: any}>
 */
export const UpdateSingleCourseLesson = async (
  courseId: string,
  moduleId: string,
  lessonId: string,
  lessonData: any
): Promise<{ success: boolean; lesson: any }> => {
  try {
    // Validate course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Validate module exists
    // First try with courseId (for new modules), then without (for backward compatibility)
    let module = await CourseModuleModel.findOne({
      _id: moduleId,
      courseId: courseId,
    });
    if (!module) {
      module = await CourseModuleModel.findOne({ _id: moduleId });
    }
    if (!module) {
      throw new AppError("Module not found", 404);
    }

    // Remove _id from update data to avoid conflicts
    const { _id, ...updateData } = lessonData;

    // Update the lesson
    const updatedLesson = await CourseLessonModel.findOneAndUpdate(
      { _id: lessonId, moduleId: moduleId },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedLesson) {
      throw new AppError("Lesson not found", 404);
    }

    return {
      success: true,
      lesson: updatedLesson,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in UpdateSingleCourseLesson:", error);
    throw new AppError(
      `Failed to update lesson: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Delete a single lesson from a module (real-time)
 * @param courseId - The ID of the course
 * @param moduleId - The ID of the module
 * @param lessonId - The ID of the lesson to delete
 * @returns Promise<{success: boolean, message: string}>
 */
export const DeleteSingleCourseLesson = async (
  courseId: string,
  moduleId: string,
  lessonId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Validate module exists
    // First try with courseId (for new modules), then without (for backward compatibility)
    let module = await CourseModuleModel.findOne({
      _id: moduleId,
      courseId: courseId,
    });
    if (!module) {
      module = await CourseModuleModel.findOne({ _id: moduleId });
    }
    if (!module) {
      throw new AppError("Module not found", 404);
    }

    // First, delete all content for this lesson
    const contentDeleteResult = await ContentModel.deleteMany({
      lessonId: lessonId,
    });

    // Delete the lesson
    const deletedLesson = await CourseLessonModel.findOneAndDelete({
      _id: lessonId,
      moduleId: moduleId,
    });

    if (!deletedLesson) {
      throw new AppError("Lesson not found", 404);
    }

    // Remove lesson ID from module
    // First try with courseId (for new modules), then without (for backward compatibility)
    let updateResult = await CourseModuleModel.findOneAndUpdate(
      { _id: moduleId, courseId: courseId },
      {
        $pull: { lessonIds: lessonId },
        updatedAt: new Date(),
      }
    );

    if (!updateResult) {
      await CourseModuleModel.findOneAndUpdate(
        { _id: moduleId },
        {
          $pull: { lessonIds: lessonId },
          updatedAt: new Date(),
        }
      );
    }

    return {
      success: true,
      message: "Lesson and all associated content deleted successfully",
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in DeleteSingleCourseLesson:", error);
    throw new AppError(
      `Failed to delete lesson: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Add a single content to a lesson (real-time)
 * @param courseId - The ID of the course
 * @param moduleId - The ID of the module
 * @param lessonId - The ID of the lesson
 * @param contentData - The content data
 * @returns Promise<{success: boolean, content: any}>
 */
export const AddSingleCourseContent = async (
  courseId: string,
  moduleId: string,
  lessonId: string,
  contentData: any
): Promise<{ success: boolean; content: any }> => {
  try {
    // Validate course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Validate module exists
    // First try with courseId (for new modules), then without (for backward compatibility)
    let module = await CourseModuleModel.findOne({
      _id: moduleId,
      courseId: courseId,
    });
    if (!module) {
      module = await CourseModuleModel.findOne({ _id: moduleId });
    }
    if (!module) {
      throw new AppError("Module not found", 404);
    }

    // Validate lesson exists
    const lesson = await CourseLessonModel.findOne({
      _id: lessonId,
      moduleId: moduleId,
    });
    if (!lesson) {
      throw new AppError("Lesson not found", 404);
    }

    // Remove _id to let MongoDB generate a proper ObjectId
    const { _id, ...contentDataWithoutId } = contentData;

    // Create the content based on type
    let content;
    if (contentData.type === "video") {
      content = new VideoContentModel({
        ...contentDataWithoutId,
        lessonId: lessonId,
        moduleId: moduleId,
      });
    } else if (contentData.type === "quiz") {
      content = new QuizContentModel({
        ...contentDataWithoutId,
        lessonId: lessonId,
        moduleId: moduleId,
      });
    } else if (contentData.type === "document") {
      content = new DocumentContentModel({
        ...contentDataWithoutId,
        lessonId: lessonId,
        moduleId: moduleId,
      });
    } else {
      throw new AppError("Invalid content type", 400);
    }

    await content.save();

    // Update lesson with new content ID
    await CourseLessonModel.findByIdAndUpdate(lessonId, {
      $push: { contentIds: content._id },
      updatedAt: new Date(),
    });

    return {
      success: true,
      content: content,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in AddSingleCourseContent:", error);
    throw new AppError(
      `Failed to add content: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Update a single content in a lesson (real-time)
 * @param courseId - The ID of the course
 * @param moduleId - The ID of the module
 * @param lessonId - The ID of the lesson
 * @param contentId - The ID of the content to update
 * @param contentData - The updated content data
 * @returns Promise<{success: boolean, content: any}>
 */
export const UpdateSingleCourseContent = async (
  courseId: string,
  moduleId: string,
  lessonId: string,
  contentId: string,
  contentData: any
): Promise<{ success: boolean; content: any }> => {
  try {
    // Validate course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Validate module exists
    // First try with courseId (for new modules), then without (for backward compatibility)
    let module = await CourseModuleModel.findOne({
      _id: moduleId,
      courseId: courseId,
    });
    if (!module) {
      module = await CourseModuleModel.findOne({ _id: moduleId });
    }
    if (!module) {
      throw new AppError("Module not found", 404);
    }

    // Validate lesson exists
    const lesson = await CourseLessonModel.findOne({
      _id: lessonId,
      moduleId: moduleId,
    });
    if (!lesson) {
      throw new AppError("Lesson not found", 404);
    }

    // Remove _id from update data to avoid conflicts
    const { _id, ...updateData } = contentData;

    // Update the content
    const updatedContent = await ContentModel.findOneAndUpdate(
      { _id: contentId, lessonId: lessonId, moduleId: moduleId },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedContent) {
      throw new AppError("Content not found", 404);
    }

    return {
      success: true,
      content: updatedContent,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in UpdateSingleCourseContent:", error);
    throw new AppError(
      `Failed to update content: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

/**
 * Delete a single content from a lesson (real-time)
 * @param courseId - The ID of the course
 * @param moduleId - The ID of the module
 * @param lessonId - The ID of the lesson
 * @param contentId - The ID of the content to delete
 * @returns Promise<{success: boolean, message: string}>
 */
export const DeleteSingleCourseContent = async (
  courseId: string,
  moduleId: string,
  lessonId: string,
  contentId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    // Validate module exists
    // First try with courseId (for new modules), then without (for backward compatibility)
    let module = await CourseModuleModel.findOne({
      _id: moduleId,
      courseId: courseId,
    });
    if (!module) {
      module = await CourseModuleModel.findOne({ _id: moduleId });
    }
    if (!module) {
      throw new AppError("Module not found", 404);
    }

    // Validate lesson exists
    const lesson = await CourseLessonModel.findOne({
      _id: lessonId,
      moduleId: moduleId,
    });
    if (!lesson) {
      throw new AppError("Lesson not found", 404);
    }

    // Delete the content
    const deletedContent = await ContentModel.findOneAndDelete({
      _id: contentId,
      lessonId: lessonId,
      moduleId: moduleId,
    });

    if (!deletedContent) {
      throw new AppError("Content not found", 404);
    }

    // Remove content ID from lesson
    await CourseLessonModel.findByIdAndUpdate(lessonId, {
      $pull: { contentIds: contentId },
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: "Content deleted successfully",
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Database error in DeleteSingleCourseContent:", error);
    throw new AppError(
      `Failed to delete content: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};
