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
}
