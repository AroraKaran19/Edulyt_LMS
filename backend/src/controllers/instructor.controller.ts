import { Request, Response } from "express";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  getAllInstructorsService,
  getInstructorByIdService,
  getInstructorsByIdsService,
  getPublicInstructorBySlugService,
  getPublicInstructorCoursesBySlugService,
} from "../services/instructor.services";

export const getAllInstructors = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit, search } = req.query;

    const params = {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
    };

    const result = await getAllInstructorsService(params);

    sendSuccessResponse(res, result, "Instructors fetched successfully", 200);
    return;
  }
);

export const getInstructorById = asyncHandler(
  async (req: Request, res: Response) => {
    const { instructorId } = req.params;

    if (!instructorId) {
      throw new AppError("Instructor ID is required", 400);
    }

    const instructor = await getInstructorByIdService(instructorId);

    if (!instructor) {
      throw new AppError("Instructor not found", 404);
    }

    sendSuccessResponse(
      res,
      instructor,
      "Instructor fetched successfully",
      200
    );
    return;
  }
);

export const getInstructorsByIds = asyncHandler(
  async (req: Request, res: Response) => {
    const { instructorIds } = req.body;

    if (!instructorIds || !Array.isArray(instructorIds)) {
      throw new AppError("Instructor IDs array is required", 400);
    }

    if (instructorIds.length === 0) {
      sendSuccessResponse(res, [], "No instructors found", 200);
      return;
    }

    const instructors = await getInstructorsByIdsService(instructorIds);

    sendSuccessResponse(
      res,
      instructors,
      "Instructors fetched successfully",
      200
    );
    return;
  }
);

export const getPublicInstructorBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params;

    if (!slug) {
      throw new AppError("Instructor slug is required", 400);
    }

    const result = await getPublicInstructorBySlugService(slug);

    if (!result) {
      throw new AppError("Instructor not found", 404);
    }

    sendSuccessResponse(
      res,
      result,
      "Instructor fetched successfully",
      200
    );
    return;
  }
);

export const getPublicInstructorCoursesBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params;
    const { page = "1", limit = "4" } = req.query;

    if (!slug) {
      throw new AppError("Instructor slug is required", 400);
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);

    if (!Number.isFinite(pageNum) || pageNum < 1) {
      throw new AppError("Page must be a positive number", 400);
    }

    if (!Number.isFinite(limitNum) || limitNum < 1) {
      throw new AppError("Limit must be a positive number", 400);
    }

    const result = await getPublicInstructorCoursesBySlugService(
      slug,
      pageNum,
      limitNum
    );

    if (!result) {
      throw new AppError("Instructor not found", 404);
    }

    sendSuccessResponse(
      res,
      result,
      "Instructor courses fetched successfully",
      200
    );
    return;
  }
);
