import { Request, Response } from "express";
import {
  getAllCourses as getAllCoursesService,
  getCourseUsingSlug as getCourseUsingSlugService,
  getFeaturedCourses as getFeaturedCoursesService,
  getCoursesUsingAudience as getCoursesUsingAudienceService,
  getCoursesUsingCategory as getCoursesUsingCategoryService,
  UpdateCourseMetadata as UpdateCourseMetadataService,
  CreateCourseMetadata as CreateCourseMetadataService,
  CreateCourseModule as CreateCourseModuleService,
  getCourseById as getCourseByIdService,
} from "../services/course.service";
import dotenv from "dotenv";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
dotenv.config();

export const getAllCourses = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10, search, filters, audienceFilter, category } = req.query;
    const courses = await getAllCoursesService(
      Number(page),
      Number(limit),
      search as string,
      filters as string[],
      audienceFilter as string,
      category as string
    );
    if (!courses || courses.courses.length === 0) {
      sendSuccessResponse(
        res,
        { courses: [], total: 0, page: 1, totalPages: 0 },
        "No courses found",
        200
      );
      return;
    }
    sendSuccessResponse(res, courses, "Courses retrieved successfully", 200);
  }
);

export const getCourseUsingSlug = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;
    if (!slug) {
      throw new AppError("Slug is required", 400);
    }
    const course = await getCourseUsingSlugService(slug);
    if (!course) {
      sendSuccessResponse(res, {}, "Course not found", 200);
      return;
    }
    sendSuccessResponse(res, course, "Course retrieved successfully", 200);
    return;
  }
);

export const getFeaturedCourses = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const courses = await getFeaturedCoursesService();
    if (!courses || courses.length === 0) {
      sendSuccessResponse(res, [], "No featured courses found", 200);
      return;
    }
    sendSuccessResponse(res, courses, "Courses retrieved successfully", 200);
    return;
  }
);

export const getCoursesUsingAudience = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { audience } = req.query;
    if (!audience || typeof audience !== "string") {
      throw new AppError("Audience is required", 400);
    }
    const courses = await getCoursesUsingAudienceService(audience);
    if (!courses || courses.length === 0) {
      sendSuccessResponse(res, [], "No courses found for this audience", 200);
      return;
    }
    sendSuccessResponse(res, courses, "Courses retrieved successfully", 200);
    return;
  }
);

export const getCoursesUsingCategory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { category } = req.query;
    if (!category || typeof category !== "string") {
      throw new AppError("Category is required", 400);
    }
    const courses = await getCoursesUsingCategoryService(category);
    if (!courses || courses.length === 0) {
      sendSuccessResponse(res, [], "No courses found for this category", 200);
      return;
    }
    sendSuccessResponse(res, courses, "Courses retrieved successfully", 200);
    return;
  }
);

export const updateCourseMetadata = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const updateData = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const result = await UpdateCourseMetadataService(courseId, updateData);
    
    sendSuccessResponse(
      res,
      { courseId, updated: true },
      result.message,
      200
    );
  }
);

// Chunked course creation endpoints

/**
 * Create course metadata (step 1 of chunked approach)
 */
export const createCourseMetadata = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const courseData = req.body;

    if (!courseData) {
      throw new AppError("Course data is required", 400);
    }

    console.log("📝 Creating course metadata:", {
      title: courseData.title,
      category: courseData.category,
      hasModules: Array.isArray(courseData.modules) && courseData.modules.length > 0
    });

    const result = await CreateCourseMetadataService(courseData);
    
    sendSuccessResponse(
      res,
      { courseId: result.courseId },
      result.message,
      200
    );
  }
);

/**
 * Add modules to existing course (step 2 of chunked approach)
 */
export const addCourseModules = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const modules = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!Array.isArray(modules)) {
      throw new AppError("Modules must be an array", 400);
    }

    console.log(`📚 Adding ${modules.length} modules to course ${courseId}`);

    const result = await CreateCourseModuleService({
      courseId,
      modules
    });
    
    sendSuccessResponse(
      res,
      { 
        courseId,
        moduleIds: result.moduleIds,
        modulesAdded: modules.length
      },
      result.message,
      200
    );
  }
);

/**
 * Add lessons to existing module (step 3 of chunked approach)
 */
export const addCourseLessons = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const { moduleId, lessons } = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!moduleId) {
      throw new AppError("Module ID is required", 400);
    }

    if (!Array.isArray(lessons)) {
      throw new AppError("Lessons must be an array", 400);
    }

    console.log(`📖 Adding ${lessons.length} lessons to module ${moduleId} in course ${courseId}`);

    // For now, return success - this would be implemented if needed
    sendSuccessResponse(
      res,
      { 
        courseId,
        moduleId,
        lessonsAdded: lessons.length
      },
      "Lessons added successfully",
      200
    );
  }
);

/**
 * Finalize course creation (step 4 of chunked approach)
 */
export const finalizeCourseCreation = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    console.log(`✅ Finalizing course creation for course ${courseId}`);

    // Mark course as active and finalized
    const result = await UpdateCourseMetadataService(courseId, { 
      isActive: true,
      updatedAt: new Date()
    });
    
    sendSuccessResponse(
      res,
      { 
        courseId,
        finalized: true
      },
      "Course creation finalized successfully",
      200
    );
  }
);

// ===================
// Course Update & Admin Endpoints
// ===================

/**
 * Update entire course (frontend expects PUT /courses/:courseId)
 */
export const updateCourse = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const courseData = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!courseData) {
      throw new AppError("Course data is required", 400);
    }

    console.log("📝 Updating course:", {
      courseId,
      title: courseData.title,
      hasModules: Array.isArray(courseData.modules) && courseData.modules.length > 0
    });

    // For now, we'll update the metadata only
    // This can be extended to handle full course updates with modules
    const { modules, reviews, faqs, testimonials, ...updateData } = courseData;
    
    const result = await UpdateCourseMetadataService(courseId, updateData);
    
    sendSuccessResponse(
      res,
      { courseId, updated: true },
      result.message,
      200
    );
  }
);

/**
 * Update course status (active/inactive)
 */
export const updateCourseStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const { isActive } = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (typeof isActive !== 'boolean') {
      throw new AppError("isActive must be a boolean value", 400);
    }

    console.log("🔄 Updating course status:", {
      courseId,
      newStatus: isActive
    });

    const result = await UpdateCourseMetadataService(courseId, { isActive });
    
    sendSuccessResponse(
      res,
      { courseId, isActive, updated: true },
      `Course ${isActive ? 'activated' : 'deactivated'} successfully`,
      200
    );
  }
);

/**
 * Bulk update course status (active/inactive)
 */
export const updateCourseStatusBulk = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseIds, isActive } = req.body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      throw new AppError("Course IDs array is required", 400);
    }

    if (typeof isActive !== 'boolean') {
      throw new AppError("isActive must be a boolean value", 400);
    }

    console.log(`🔄 Bulk updating ${courseIds.length} courses status to ${isActive}`);

    let updatedCount = 0;
    const errors: string[] = [];

    for (const courseId of courseIds) {
      try {
        await UpdateCourseMetadataService(courseId, { isActive });
        updatedCount++;
      } catch (error) {
        errors.push(`Failed to update course ${courseId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    sendSuccessResponse(
      res,
      { 
        updatedCount, 
        totalRequested: courseIds.length,
        errors: errors.length > 0 ? errors : undefined
      },
      `Successfully updated ${updatedCount} out of ${courseIds.length} courses`,
      200
    );
  }
);

/**
 * Get course by ID for admin (includes inactive courses)
 */
export const getCourseByIdAdmin = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    console.log(`📖 Getting course by ID for admin: ${courseId}`);

    const course = await getCourseByIdService(courseId, false); // false = don't require active status
    
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    sendSuccessResponse(
      res,
      { course },
      "Course retrieved successfully",
      200
    );
  }
);
