import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/error.middleware";
import { AppError, sendSuccessResponse } from "../middlewares/error.middleware";
import { InstructorService } from "../services/instructor.service";

export class InstructorController {
  private instructorService: InstructorService;

  constructor() {
    this.instructorService = new InstructorService();
  }

  /**
   * Register a new instructor
   * @param req - Express request object
   * @param res - Express response object
   */
  registerInstructor = asyncHandler(async (req: Request, res: Response) => {
    const instructorData = req.body;

    if (!instructorData.email || !instructorData.password) {
      throw new AppError("Email and password are required", 400);
    }

    const { user, accessToken, refreshToken } = await this.instructorService.registerInstructor(
      instructorData,
      {
        userAgent: req.get("User-Agent"),
        ipAddress: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
        deviceType: undefined,
      }
    );

    const data = {
      user,
      accessToken,
      refreshToken,
    };

    sendSuccessResponse(res, data, "Instructor created successfully", 201);
  });

  /**
   * Get all instructors with pagination and filtering
   * @param req - Express request object
   * @param res - Express response object
   */
  getAllInstructors = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = "", status = "", sortBy = "createdAt", sortOrder = "desc" } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }
    if (Number(limit) > 100) {
      throw new AppError("Limit cannot exceed 100 items per page", 400);
    }

    const result = await this.instructorService.getAllInstructors({
      page: Number(page),
      limit: Number(limit),
      search: String(search),
      status: String(status),
      sortBy: String(sortBy),
      sortOrder: String(sortOrder),
    });

    sendSuccessResponse(res, result, "Instructors fetched successfully", 200);
  });

  /**
   * Get instructor by ID
   * @param req - Express request object
   * @param res - Express response object
   */
  getInstructorById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Instructor ID is required", 400);
    }

    const instructor = await this.instructorService.getInstructorById(id);

    sendSuccessResponse(res, { instructor }, "Instructor fetched successfully", 200);
  });

  /**
   * Update instructor by ID
   * @param req - Express request object
   * @param res - Express response object
   */
  updateInstructor = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      throw new AppError("Instructor ID is required", 400);
    }

    const instructor = await this.instructorService.updateInstructor(id, updateData);

    sendSuccessResponse(res, { instructor }, "Instructor updated successfully", 200);
  });

  /**
   * Delete instructor by ID
   * @param req - Express request object
   * @param res - Express response object
   */
  deleteInstructor = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError("Instructor ID is required", 400);
    }

    await this.instructorService.deleteInstructor(id);

    sendSuccessResponse(res, { deletedInstructorId: id }, "Instructor deleted successfully", 200);
  });
}
