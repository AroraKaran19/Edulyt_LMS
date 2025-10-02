import { Request, Response } from "express";
import { AppError, asyncHandler } from "../middlewares/error.middleware";
import { EnrollmentModel } from "../models/enrollment.schema";
import { sendSuccessResponse } from "../middlewares/error.middleware";
import { UserModel } from "../models/user.schema";

export const getEnrolledCourses = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.query;
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }
    const courses = await EnrollmentModel.find({ userId }).populate("courseId");
    sendSuccessResponse(
      res,
      { courses },
      courses.length > 0
        ? "Enrolled courses fetched successfully"
        : "No enrolled courses found",
      200
    );
  }
);

export const getUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    
    if (!userId) {
      throw new AppError("User ID is required", 401);
    }

    const user = await UserModel.findById(userId)
      .select('-password -refreshTokens -__v')
      .lean();

    if (!user) {
      throw new AppError("User not found", 404);
    }

    sendSuccessResponse(
      res,
      { user },
      "User profile fetched successfully",
      200
    );
  }
);
