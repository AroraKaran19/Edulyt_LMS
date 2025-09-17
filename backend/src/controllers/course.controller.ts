import { Request, Response } from "express";
import {
  getAllCourses as getAllCoursesService,
  getCourseUsingSlug as getCourseUsingSlugService,
  getFeaturedCourses as getFeaturedCoursesService,
  getCoursesUsingAudience as getCoursesUsingAudienceService,
  getCoursesUsingCategory as getCoursesUsingCategoryService,
  UpdateCourseMetadata as UpdateCourseMetadataService,
  CreateCourseMetadata as CreateCourseMetadataService,
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

export const updateCourseMetadata = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const updateData = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const result = await UpdateCourseMetadataService(courseId, updateData);

    sendSuccessResponse(res, { courseId, updated: true }, result.message, 200);
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
      result.message,
      201
    );
  }
);
