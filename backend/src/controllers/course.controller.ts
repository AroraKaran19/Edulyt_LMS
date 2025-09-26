import { Request, Response } from "express";
import {
  getAllCourses as getAllCoursesService,
  getCourseUsingSlug as getCourseUsingSlugService,
  getFeaturedCourses as getFeaturedCoursesService,
  getCoursesUsingAudience as getCoursesUsingAudienceService,
  getCoursesUsingCategory as getCoursesUsingCategoryService,
  UpdateCourseMetadata as UpdateCourseMetadataService,
  CreateCourseMetadata as CreateCourseMetadataService,
  updateCourseStatusService,
  getCoursesForAdminService,
  getCourseByIdAdminService,
  duplicateCourseService,
  AddSingleCourseModule as AddSingleCourseModuleService,
  UpdateSingleCourseModule as UpdateSingleCourseModuleService,
  DeleteSingleCourseModule as DeleteSingleCourseModuleService,
  AddSingleCourseLesson as AddSingleCourseLessonService,
  UpdateSingleCourseLesson as UpdateSingleCourseLessonService,
  DeleteSingleCourseLesson as DeleteSingleCourseLessonService,
  AddSingleCourseContent as AddSingleCourseContentService,
  UpdateSingleCourseContent as UpdateSingleCourseContentService,
  DeleteSingleCourseContent as DeleteSingleCourseContentService,
  UpdateCourseModuleReferences as UpdateCourseModuleReferencesService,
  FinalizeCourseCreation as FinalizeCourseCreationService,
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
    const {
      page = 1,
      limit = 10,
      search,
      filters,
      audienceFilter,
      category,
    } = req.query;
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

export const updateCourseStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const { isActive } = req.body;
    const result = await updateCourseStatusService(courseId, isActive);
    sendSuccessResponse(res, result, "Course status updated successfully", 200);
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
      "Course metadata updated successfully",
      200
    );
  }
);

export const createCourseMetadata = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const courseData = req.body;

    if (!courseData || Object.keys(courseData).length === 0) {
      throw new AppError("Course data is required", 400);
    }

    const result = await CreateCourseMetadataService(courseData);

    sendSuccessResponse(
      res,
      { courseId: result.courseId },
      "Course metadata created successfully",
      201
    );
  }
);

export const getCoursesForAdmin = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const {
      page = 1,
      limit = 10,
      search,
      filters,
      audienceFilter,
      category,
    } = req.query;
    const courses = await getCoursesForAdminService(
      Number(page),
      Number(limit),
      search as string,
      category as string,
      audienceFilter as string
    );
    if (!courses || courses.courses.length === 0) {
      sendSuccessResponse(res, [], "No courses found", 200);
      return;
    }
    sendSuccessResponse(res, courses, "Courses retrieved successfully", 200);
  }
);

export const getCourseByIdAdmin = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const course = await getCourseByIdAdminService(courseId);

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    sendSuccessResponse(res, { course }, "Course retrieved successfully", 200);
  }
);

export const duplicateCourse = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const result = await duplicateCourseService(courseId);
    if (!result) {
      throw new AppError("Failed to duplicate course", 500);
    }
    sendSuccessResponse(res, result, "Course duplicated successfully", 200);
  }
);

export const updateCourseModuleReferences = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const { moduleIds } = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!Array.isArray(moduleIds)) {
      throw new AppError("moduleIds must be an array", 400);
    }

    const result = await UpdateCourseModuleReferencesService(
      courseId,
      moduleIds
    );
    sendSuccessResponse(
      res,
      result,
      "Course module references updated successfully",
      200
    );
  }
);

export const finalizeCourseCreation = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;

    const result = await FinalizeCourseCreationService(courseId);
    sendSuccessResponse(res, result, result.message, 200);
  }
);

export const addSingleCourseModule = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const moduleData = req.body;

    if (!moduleData) {
      throw new AppError("Module data is required", 400);
    }

    // Only validate that the module data structure is present

    const result = await AddSingleCourseModuleService(courseId, moduleData);
    sendSuccessResponse(res, result.module, "Module added successfully", 201);
  }
);

export const updateSingleCourseModule = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId, moduleId } = req.params;
    const moduleData = req.body;

    if (!moduleId) {
      throw new AppError("Module ID is required", 400);
    }

    const result = await UpdateSingleCourseModuleService(
      courseId,
      moduleId,
      moduleData
    );
    sendSuccessResponse(res, result, "Module updated successfully", 200);
  }
);

export const deleteSingleCourseModule = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId, moduleId } = req.params;

    if (!moduleId) {
      throw new AppError("Module ID is required", 400);
    }

    const result = await DeleteSingleCourseModuleService(courseId, moduleId);
    sendSuccessResponse(res, result, "Module deleted successfully", 200);
  }
);

// ===================
// LESSON CONTROLLERS
// ===================

export const addSingleCourseLesson = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId, moduleId } = req.params;
    const lessonData = req.body;

    if (!moduleId) {
      throw new AppError("Module ID is required", 400);
    }

    if (!lessonData) {
      throw new AppError("Lesson data is required", 400);
    }

    const result = await AddSingleCourseLessonService(
      courseId,
      moduleId,
      lessonData
    );
    sendSuccessResponse(res, result, "Lesson added successfully", 201);
  }
);

export const updateSingleCourseLesson = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId, moduleId, lessonId } = req.params;
    const lessonData = req.body;

    if (!moduleId || !lessonId) {
      throw new AppError("Module ID and Lesson ID are required", 400);
    }

    const result = await UpdateSingleCourseLessonService(
      courseId,
      moduleId,
      lessonId,
      lessonData
    );
    sendSuccessResponse(res, result, "Lesson updated successfully", 200);
  }
);

export const deleteSingleCourseLesson = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId, moduleId, lessonId } = req.params;

    if (!moduleId || !lessonId) {
      throw new AppError("Module ID and Lesson ID are required", 400);
    }

    const result = await DeleteSingleCourseLessonService(
      courseId,
      moduleId,
      lessonId
    );
    sendSuccessResponse(res, result, "Lesson deleted successfully", 200);
  }
);

// ===================
// CONTENT CONTROLLERS
// ===================

export const addSingleCourseContent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId, moduleId, lessonId } = req.params;
    const contentData = req.body;

    if (!moduleId || !lessonId) {
      throw new AppError("Module ID and Lesson ID are required", 400);
    }

    if (!contentData) {
      throw new AppError("Content data is required", 400);
    }

    const result = await AddSingleCourseContentService(
      courseId,
      moduleId,
      lessonId,
      contentData
    );
    sendSuccessResponse(res, result, "Content added successfully", 201);
  }
);

export const updateSingleCourseContent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId, moduleId, lessonId, contentId } = req.params;
    const contentData = req.body;

    if (!moduleId || !lessonId || !contentId) {
      throw new AppError(
        "Module ID, Lesson ID, and Content ID are required",
        400
      );
    }

    const result = await UpdateSingleCourseContentService(
      courseId,
      moduleId,
      lessonId,
      contentId,
      contentData
    );
    sendSuccessResponse(res, result, "Content updated successfully", 200);
  }
);

export const deleteSingleCourseContent = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId, moduleId, lessonId, contentId } = req.params;

    if (!moduleId || !lessonId || !contentId) {
      throw new AppError(
        "Module ID, Lesson ID, and Content ID are required",
        400
      );
    }

    const result = await DeleteSingleCourseContentService(
      courseId,
      moduleId,
      lessonId,
      contentId
    );
    sendSuccessResponse(res, result, "Content deleted successfully", 200);
  }
);

export const checkSlugAvailability = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;

    try {
      const course = await getCourseUsingSlugService(slug);

      if (course) {
        // Course exists, slug is taken
        sendSuccessResponse(
          res,
          {
            available: false,
            message: "Slug is already taken",
          },
          "Slug availability checked"
        );
      } else {
        // Course doesn't exist, slug is available
        sendSuccessResponse(
          res,
          {
            available: true,
            message: "Slug is available",
          },
          "Slug availability checked"
        );
      }
    } catch (error) {
      sendSuccessResponse(
        res,
        {
          available: true,
          message: "Slug is available",
        },
        "Slug availability checked"
      );
    }
  }
);
