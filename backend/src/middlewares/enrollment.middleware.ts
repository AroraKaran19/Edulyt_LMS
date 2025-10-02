import { Request, Response, NextFunction } from "express";
import { AppError } from "./error.middleware";
import { CourseModel } from "../models/course.schema";
import { EnrollmentModel } from "../models/enrollment.schema";
import mongoose from "mongoose";

/**
 * Validate course exists and is active
 */
export const validateCourseForEnrollment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new AppError("Invalid course ID format", 400);
    }

    const course = await CourseModel.findById(courseId).select("_id title isActive");
    
    if (!course) {
      throw new AppError("Course not found", 404);
    }

    if (!course.isActive) {
      throw new AppError("Course is not available for enrollment", 400);
    }

    // Add course info to request for later use
    (req as any).course = course;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is already enrolled
 */
export const checkExistingEnrollment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    const existingEnrollment = await EnrollmentModel.findOne({
      userId,
      courseId,
      status: { $in: ["active", "completed"] },
    });

    if (existingEnrollment) {
      throw new AppError("User is already enrolled in this course", 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate enrollment progress update data
 */
export const validateProgressUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { completed, score, timeSpent } = req.body;

    if (typeof completed !== "boolean") {
      throw new AppError("Completed status must be a boolean", 400);
    }

    if (score !== undefined && (typeof score !== "number" || score < 0 || score > 100)) {
      throw new AppError("Score must be a number between 0 and 100", 400);
    }

    if (timeSpent !== undefined && (typeof timeSpent !== "number" || timeSpent < 0)) {
      throw new AppError("Time spent must be a positive number", 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate enrollment status update
 */
export const validateStatusUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.body;
    const validStatuses = ["active", "completed", "dropped", "paused"];

    if (!status || !validStatuses.includes(status)) {
      throw new AppError(
        `Status must be one of: ${validStatuses.join(", ")}`,
        400
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has permission to access enrollment
 */
export const checkEnrollmentAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { courseId } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    // Admin and instructors can access any enrollment
    if (userRole === "admin" || userRole === "instructor") {
      return next();
    }

    // Regular users can only access their own enrollments
    const enrollment = await EnrollmentModel.findOne({
      userId,
      courseId,
    });

    if (!enrollment) {
      throw new AppError("Enrollment not found or access denied", 404);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate enrollment source and related data
 */
export const validateEnrollmentSource = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { enrollmentSource, giftFrom, promotionCode } = req.body;
    const validSources = ["direct", "gift", "promotion"];

    if (enrollmentSource && !validSources.includes(enrollmentSource)) {
      throw new AppError(
        `Enrollment source must be one of: ${validSources.join(", ")}`,
        400
      );
    }

    if (enrollmentSource === "gift" && !giftFrom) {
      throw new AppError("Gift from field is required for gift enrollments", 400);
    }

    if (enrollmentSource === "promotion" && !promotionCode) {
      throw new AppError("Promotion code is required for promotion enrollments", 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};
