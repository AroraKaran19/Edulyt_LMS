import { Request, Response } from "express";
import { InstructorService } from "../services/instructor.service";
import { asyncHandler, AppError, sendSuccessResponse } from "../middlewares/error.middleware";

export class InstructorController {
  private instructorService = new InstructorService();

  constructor() {
    this.instructorService = new InstructorService();
  }

  /**
   * Get all instructors
   * @param req - Request
   * @param res - Response
   */
  getAllInstructors = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const instructors = await this.instructorService.getAllInstructors(
      Number(page),
      Number(limit)
    );
    
    const data = {
      instructors: instructors || [],
      pagination: {
        total: instructors?.length || 0,
        page: Number(page),
        limit: Number(limit),
      },
    };
    
    sendSuccessResponse(res, data, "Instructors fetched successfully");
  });

  /**
   * Get instructor by id
   * @param req - Request
   * @param res - Response
   */
  getInstructorById = asyncHandler(async (req: Request, res: Response) => {
    const instructorId = req.params.id;
    
    if (!instructorId) {
      throw new AppError("Instructor ID is required", 400);
    }
    
    const instructor = await this.instructorService.getInstructorById(
      instructorId
    );
    
    if (!instructor) {
      throw new AppError("Instructor not found", 404);
    }
    
    sendSuccessResponse(res, instructor, "Instructor fetched successfully");
  });

  /**
   * Create instructor
   * @param req - Request
   * @param res - Response
   */
  createInstructor = asyncHandler(async (req: Request, res: Response) => {
    const { email, fullName, profilePicture, password, currentPosition, currentCompany } = req.body;
    
    if (!email || !fullName || !profilePicture || !password || !currentPosition || !currentCompany) {
      throw new AppError("All fields are required", 400);
    }
    
    const instructor = await this.instructorService.createInstructor({
      email,
      fullName,
      profilePicture,
      password,
      currentPosition,
      currentCompany,
    });
    
    if (!instructor) {
      throw new AppError("Instructor not created", 400);
    }
    
    sendSuccessResponse(res, instructor, "Instructor created successfully", 201);
  });

  /**
   * Update instructor
   * @param req - Request
   * @param res - Response
   */
  updateInstructor = asyncHandler(async (req: Request, res: Response) => {
    const instructorId = req.params.id;
    const { data } = req.body;
    
    if (!instructorId) {
      throw new AppError("Instructor ID is required", 400);
    }
    
    if (!data) {
      throw new AppError("Instructor data is required", 400);
    }
    
    const instructor = await this.instructorService.updateInstructor(instructorId, data);
    
    if (!instructor) {
      throw new AppError("Instructor not updated", 400);
    }
    
    sendSuccessResponse(res, instructor, "Instructor updated successfully");
  });

  /**
   * Delete instructor
   * @param req - Request
   * @param res - Response
   */
  deleteInstructor = asyncHandler(async (req: Request, res: Response) => {
    const instructorId = req.params.id;
    
    if (!instructorId) {
      throw new AppError("Instructor ID is required", 400);
    }
    
    const instructor = await this.instructorService.deleteInstructor(instructorId);
    
    if (!instructor) {
      throw new AppError("Instructor not deleted", 400);
    }
    
    sendSuccessResponse(res, instructor, "Instructor deleted successfully");
  });
}
