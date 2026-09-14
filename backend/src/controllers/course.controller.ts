import { Request, Response } from "express";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  CreateCourseLessonContentService,
  CreateCourseLessonService,
  CreateCourseMetadataService,
  CreateCourseModuleService,
  DeleteCourseLessonContentService,
  DeleteCourseLessonService,
  DeleteCourseModuleService,
  DeleteCourseService,
  DuplicateCourseService,
  DuplicateCourseMetadataService,
  DuplicateCourseWithModulesService,
  UpdateCourseLessonContentService,
  UpdateCourseLessonService,
  UpdateCourseMetadataService,
  UpdateCourseModuleService,
  UpdateCourseStatusService,
  ToggleCourseContentStatusService,
  getAllCoursesService,
  getAdminCourseOptionsService,
  getCourseByIdService,
  getCourseBySlugService,
  getFeaturedCoursesService,
  checkSlugAvailabilityService,
  reorderModulesService,
  reorderLessonsService,
  reorderContentService,
} from "../services/course.services";
import { isBrand } from "../constants/brands";
import { readableBrands } from "../lib/brandScope";
import { findCourseBrandOutside } from "../services/courseMove.services";

export const getAllCourses = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search, categories, audience } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const brands = readableBrands(req.brand);
    const result = await getAllCoursesService(
      Number(page),
      Number(limit),
      search as string,
      categories as string,
      audience as string,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      brands
    );
    if (!result || result.courses.length === 0) {
      sendSuccessResponse(res, [], "No courses found", 200);
      return;
    }
    sendSuccessResponse(res, result, "Courses retrieved successfully", 200);
    return;
  }
);

export const getFeaturedCourses = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const brands = readableBrands(req.brand);
    const result = await getFeaturedCoursesService(
      Number(page),
      Number(limit),
      search as string,
      false,
      brands
    );
    if (!result || result.courses.length === 0) {
      sendSuccessResponse(res, [], "No featured courses found", 200);
      return;
    }
    sendSuccessResponse(
      res,
      result,
      "Featured courses retrieved successfully",
      200
    );
    return;
  }
);

export const getCoursesByAudience = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search, audience } = req.query;

    if (
      !audience ||
      typeof audience !== "string" ||
      !["college-students", "professionals"].includes(audience as string)
    ) {
      throw new AppError(
        "Audience is required and must be either college-students or professionals",
        400
      );
    }

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const brands = readableBrands(req.brand);
    const result = await getAllCoursesService(
      Number(page),
      Number(limit),
      search as string,
      undefined,
      audience as string,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      brands
    );
    if (!result || result.courses.length === 0) {
      sendSuccessResponse(res, [], "No courses found", 200);
      return;
    }
    sendSuccessResponse(res, result, "Courses retrieved successfully", 200);
    return;
  }
);

export const getCoursesByCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search, category } = req.query;

    if (!category || typeof category !== "string") {
      throw new AppError("Category is required", 400);
    }

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const brands = readableBrands(req.brand);
    const result = await getAllCoursesService(
      Number(page),
      Number(limit),
      search as string,
      category as string,
      undefined,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      brands
    );
    if (!result || result.courses.length === 0) {
      sendSuccessResponse(res, [], "No courses found", 200);
      return;
    }
    sendSuccessResponse(res, result, "Courses retrieved successfully", 200);
    return;
  }
);

export const getCourseById = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const brands = readableBrands(req.brand);
    const result = await getCourseByIdService(courseId, false, brands);
    if (!result) {
      sendSuccessResponse(res, [], "Course not found", 200);
      return;
    }
    sendSuccessResponse(res, result, "Course retrieved successfully", 200);
    return;
  }
);

export const getCourseBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params;
    if (!slug) {
      throw new AppError("Slug is required", 400);
    }

    const brands = readableBrands(req.brand);
    const result = await getCourseBySlugService(slug, false, brands);
    if (!result) {
      // A missing OR disabled course (the service filters on isActive) is a
      // 404, not a 200. Returning `[]` with 200 made callers treat the empty
      // array as a course — truthy, so their `!course` guards never fired and
      // the page crashed on `course.title` instead of showing "not found".
      const movedTo = await findCourseBrandOutside(slug, brands);
      throw new AppError(
        "Course not found",
        404,
        movedTo ? "COURSE_MOVED" : undefined,
        movedTo ? { movedTo } : undefined,
      );
    }
    sendSuccessResponse(res, result, "Course retrieved successfully", 200);
    return;
  }
);

export const getAdminCourses = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search, categories, audience, instructors, isActive, sortBy = "updatedAt", sortOrder = "desc", searchTitleOnly } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const result = await getAllCoursesService(
      Number(page),
      Number(limit),
      search as string,
      categories as string,
      audience as string,
      true,
      sortBy as string,
      sortOrder as string,
      instructors as string,
      isActive === "true" ? true : isActive === "false" ? false : undefined,
      searchTitleOnly === "true" || searchTitleOnly === "1",
      isBrand(req.query.brand) ? [req.query.brand] : undefined
    );
    sendSuccessResponse(res, result, "Courses retrieved successfully", 200);
    return;
  }
);

export const getAdminCourseOptions = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit,
      search,
      categories,
      audience,
      instructors,
      isActive,
      sortBy = "updatedAt",
      sortOrder = "desc",
      searchTitleOnly,
    } = req.query;

    const parsedPage = Number(page);
    const parsedLimit =
      limit === undefined || limit === null || String(limit).trim() === ""
        ? 500
        : Number(limit);

    if (parsedPage < 1 || parsedLimit < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const result = await getAdminCourseOptionsService({
      page: parsedPage,
      limit: parsedLimit,
      search: (search as string) || undefined,
      categories: (categories as string) || undefined,
      audience: (audience as string) || undefined,
      instructors: (instructors as string) || undefined,
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      sortBy: sortBy as "createdAt" | "updatedAt" | "title",
      sortOrder: sortOrder as "asc" | "desc",
      searchTitleOnly: searchTitleOnly === "true" || searchTitleOnly === "1",
      brand: isBrand(req.query.brand) ? req.query.brand : undefined,
    });

    sendSuccessResponse(res, result, "Course options retrieved successfully", 200);
    return;
  }
);

export const getAdminCourseById = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;
    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const result = await getCourseByIdService(courseId, true);
    if (!result) {
      sendSuccessResponse(res, [], "Course not found", 200);
      return;
    }
    sendSuccessResponse(res, result, "Course retrieved successfully", 200);
    return;
  }
);

export const getAdminCourseBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params;
    if (!slug) {
      throw new AppError("Slug is required", 400);
    }

    const result = await getCourseBySlugService(slug, true);
    if (!result) {
      sendSuccessResponse(res, [], "Course not found", 200);
      return;
    }
    sendSuccessResponse(res, result, "Course retrieved successfully", 200);
    return;
  }
);

export const createCourseMetadata = asyncHandler(
  async (req: Request, res: Response) => {
    const courseData = req.body;

    if (!courseData || Object.keys(courseData).length === 0) {
      throw new AppError("Course data is required", 400);
    }

    const result = await CreateCourseMetadataService(courseData);
    if (!result) {
      throw new AppError("Failed to create course metadata", 500);
    }
    sendSuccessResponse(
      res,
      result,
      "Course metadata created successfully",
      201
    );
    return;
  }
);

export const createCourseModule = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const moduleData = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!moduleData || Object.keys(moduleData).length === 0) {
      throw new AppError("Module data is required", 400);
    }

    const result = await CreateCourseModuleService(courseId, moduleData);
    if (!result) {
      throw new AppError("Failed to create course module", 500);
    }
    sendSuccessResponse(res, result, "Course module created successfully", 201);
    return;
  }
);

export const updateCourseModule = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId, moduleId } = req.params;
    const moduleData = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!moduleId) {
      throw new AppError("Module ID is required", 400);
    }

    if (!moduleData || Object.keys(moduleData).length === 0) {
      throw new AppError("Module data is required", 400);
    }

    const result = await UpdateCourseModuleService(
      courseId,
      moduleId,
      moduleData
    );
    if (!result) {
      throw new AppError("Failed to update course module", 500);
    }
    sendSuccessResponse(res, result, "Course module updated successfully", 200);
    return;
  }
);

export const deleteCourseModule = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId, moduleId } = req.params;
    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!moduleId) {
      throw new AppError("Module ID is required", 400);
    }

    const result = await DeleteCourseModuleService(courseId, moduleId);
    if (!result) {
      throw new AppError("Failed to delete course module", 500);
    }
    sendSuccessResponse(res, null, "Course module deleted successfully", 200);
    return;
  }
);

export const createCourseLesson = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId, moduleId } = req.params;
    const lessonData = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!moduleId) {
      throw new AppError("Module ID is required", 400);
    }

    if (!lessonData || Object.keys(lessonData).length === 0) {
      throw new AppError("Lesson data is required", 400);
    }

    const result = await CreateCourseLessonService(
      courseId,
      moduleId,
      lessonData
    );
    if (!result) {
      throw new AppError("Failed to create course lesson", 500);
    }
    sendSuccessResponse(res, result, "Course lesson created successfully", 201);
    return;
  }
);

export const updateCourseLesson = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId, moduleId, lessonId } = req.params;
    const lessonData = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!moduleId) {
      throw new AppError("Module ID is required", 400);
    }

    if (!lessonId) {
      throw new AppError("Lesson ID is required", 400);
    }

    if (!lessonData || Object.keys(lessonData).length === 0) {
      throw new AppError("Lesson data is required", 400);
    }

    const result = await UpdateCourseLessonService(
      courseId,
      moduleId,
      lessonId,
      lessonData
    );
    if (!result) {
      throw new AppError("Failed to update course lesson", 500);
    }
    sendSuccessResponse(res, result, "Course lesson updated successfully", 200);
    return;
  }
);

export const deleteCourseLesson = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId, moduleId, lessonId } = req.params;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!moduleId) {
      throw new AppError("Module ID is required", 400);
    }

    if (!lessonId) {
      throw new AppError("Lesson ID is required", 400);
    }

    const result = await DeleteCourseLessonService(
      courseId,
      moduleId,
      lessonId
    );
    if (!result) {
      throw new AppError("Failed to delete course lesson", 500);
    }
    sendSuccessResponse(res, null, "Course lesson deleted successfully", 200);
    return;
  }
);

export const createCourseLessonContent = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId, moduleId, lessonId } = req.params;
    const contentData = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!moduleId) {
      throw new AppError("Module ID is required", 400);
    }

    if (!lessonId) {
      throw new AppError("Lesson ID is required", 400);
    }

    if (!contentData || Object.keys(contentData).length === 0) {
      throw new AppError("Content data is required", 400);
    }

    const result = await CreateCourseLessonContentService(
      courseId,
      moduleId,
      lessonId,
      contentData
    );
    if (!result) {
      throw new AppError("Failed to create course lesson content", 500);
    }
    sendSuccessResponse(
      res,
      result,
      "Course lesson content created successfully",
      201
    );
    return;
  }
);

export const updateCourseLessonContent = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId, moduleId, lessonId, contentId } = req.params;
    const contentData = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!moduleId) {
      throw new AppError("Module ID is required", 400);
    }

    if (!lessonId) {
      throw new AppError("Lesson ID is required", 400);
    }

    if (!contentId) {
      throw new AppError("Content ID is required", 400);
    }

    if (!contentData || Object.keys(contentData).length === 0) {
      throw new AppError("Content data is required", 400);
    }

    const result = await UpdateCourseLessonContentService(
      courseId,
      moduleId,
      lessonId,
      contentId,
      contentData
    );
    if (!result) {
      throw new AppError("Failed to update course lesson content", 500);
    }
    sendSuccessResponse(
      res,
      result,
      "Course lesson content updated successfully",
      200
    );
    return;
  }
);

export const deleteCourseLessonContent = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId, moduleId, lessonId, contentId } = req.params;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!moduleId) {
      throw new AppError("Module ID is required", 400);
    }

    if (!lessonId) {
      throw new AppError("Lesson ID is required", 400);
    }

    if (!contentId) {
      throw new AppError("Content ID is required", 400);
    }

    const result = await DeleteCourseLessonContentService(
      courseId,
      moduleId,
      lessonId,
      contentId
    );
    if (!result) {
      throw new AppError("Failed to delete course lesson content", 500);
    }
    sendSuccessResponse(
      res,
      null,
      "Course lesson content deleted successfully",
      200
    );
    return;
  }
);

export const duplicateCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;
    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const result = await DuplicateCourseService(courseId);
    if (!result) {
      throw new AppError("Failed to duplicate course", 500);
    }
    sendSuccessResponse(res, result, "Course duplicated successfully", 200);
    return;
  }
);

export const duplicateCourseMetadata = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;
    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const result = await DuplicateCourseMetadataService(courseId, req.body ?? {});
    if (!result) {
      throw new AppError("Failed to duplicate course metadata", 500);
    }
    sendSuccessResponse(res, result, "Course metadata duplicated successfully", 200);
    return;
  }
);

export const duplicateCourseWithModules = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;
    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const result = await DuplicateCourseWithModulesService(courseId, req.body ?? {});
    if (!result) {
      throw new AppError("Failed to duplicate course with modules", 500);
    }
    sendSuccessResponse(res, result, "Course with modules duplicated successfully", 200);
    return;
  }
);

export const updateCourseStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { status } = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (status === undefined || status === null || ![true, false].includes(status)) {
      throw new AppError(
        "Status is required and must be either true or false",
        400
      );
    }

    const result = await UpdateCourseStatusService(courseId, status);
    if (!result) {
      throw new AppError("Failed to update course status", 500);
    }
    sendSuccessResponse(res, result, "Course status updated successfully", 200);
    return;
  }
);

export const toggleCourseContentStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { contentType, contentId } = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!contentType || !["module", "lesson", "content"].includes(contentType)) {
      throw new AppError("Valid content type is required (module, lesson, or content)", 400);
    }

    if (!contentId) {
      throw new AppError("Content ID is required", 400);
    }

    const result = await ToggleCourseContentStatusService(courseId, contentType, contentId);
    if (!result) {
      throw new AppError("Failed to toggle content status", 500);
    }
    sendSuccessResponse(res, result, "Content status toggled successfully", 200);
    return;
  }
);

export const updateCourseMetadata = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const courseData = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!courseData || Object.keys(courseData).length === 0) {
      throw new AppError("Course data is required", 400);
    }

    const result = await UpdateCourseMetadataService(courseId, courseData);
    if (!result) {
      throw new AppError("Failed to update course metadata", 500);
    }
    sendSuccessResponse(
      res,
      result,
      "Course metadata updated successfully",
      200
    );
    return;
  }
);

export const deleteCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;
    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const result = await DeleteCourseService(courseId);
    if (!result) {
      throw new AppError("Failed to delete course", 500);
    }
    sendSuccessResponse(res, null, "Course deleted successfully", 200);
    return;
  }
);

/**
 * Check if a slug is available for use
 * @route GET /api/courses/check-slug/:slug
 * @access Public
 */
export const checkSlugAvailability = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params;
    const { excludeId } = req.query;

    if (!slug) {
      throw new AppError("Slug is required", 400);
    }

    const result = await checkSlugAvailabilityService(
      slug,
      excludeId as string
    );

    sendSuccessResponse(res, result, result.message, 200);
    return;
  }
);

// Reorder controllers
export const reorderModules = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { moduleIds } = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
      throw new AppError(
        "moduleIds must be a non-empty array of module IDs",
        400
      );
    }

    const result = await reorderModulesService(courseId, moduleIds);

    sendSuccessResponse(
      res,
      result,
      "Modules reordered successfully",
      200
    );
    return;
  }
);

export const reorderLessons = asyncHandler(
  async (req: Request, res: Response) => {
    const { moduleId } = req.params;
    const { lessonIds } = req.body;

    if (!moduleId) {
      throw new AppError("Module ID is required", 400);
    }

    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      throw new AppError(
        "lessonIds must be a non-empty array of lesson IDs",
        400
      );
    }

    const result = await reorderLessonsService(moduleId, lessonIds);

    sendSuccessResponse(
      res,
      result,
      "Lessons reordered successfully",
      200
    );
    return;
  }
);

export const reorderContent = asyncHandler(
  async (req: Request, res: Response) => {
    const { lessonId } = req.params;
    const { contentIds } = req.body;

    if (!lessonId) {
      throw new AppError("Lesson ID is required", 400);
    }

    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      throw new AppError(
        "contentIds must be a non-empty array of content IDs",
        400
      );
    }

    const result = await reorderContentService(lessonId, contentIds);

    sendSuccessResponse(
      res,
      result,
      "Content reordered successfully",
      200
    );
    return;
  }
);
