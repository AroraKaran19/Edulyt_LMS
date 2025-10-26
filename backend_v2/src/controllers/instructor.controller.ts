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
