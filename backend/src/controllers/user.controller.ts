import { Request, Response } from "express";
import { AppError, asyncHandler } from "../middlewares/error.middleware";
import { sendSuccessResponse } from "../middlewares/error.middleware";
import { UserModel } from "../models/user.schema";
import { getUserEnrollments } from "../services/enrollment.service";

export const getEnrolledCourses = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.query;
    const { status } = req.query;
    
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }
    
    const enrollments = await getUserEnrollments(userId as string, status as string);
    
    sendSuccessResponse(
      res,
      { enrollments },
      enrollments.length > 0
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
      .select("-password -refreshTokens -__v")
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
