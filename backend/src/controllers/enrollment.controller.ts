import { Request, Response } from "express";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  CreateEnrollmentService,
  GetEnrollmentService,
  GetUserEnrollmentsService,
  UpdateEnrollmentProgressService,
  UpdateEnrollmentStatusService,
  GetEnrollmentStatsService,
  GetCourseEnrollmentStatsService,
  GetDetailedProgressService,
  IssueCertificateService,
  GetEnrollmentAnalyticsService,
  DeleteEnrollmentService,
  PauseEnrollmentService,
  ResumeEnrollmentService,
  GetEnrollmentHistoryService,
} from "../services/enrollment.services";
import { EnrollmentModel } from "../models/enrollment.schema";
import {
  Enrollment,
  EnrollmentProgressSummary,
  DetailedEnrollmentProgress,
  UserEnrollmentStats,
  CourseEnrollmentStats,
  LastContentAccessed,
} from "../types";

// Create new enrollment
export const createEnrollment = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId, enrollmentSource, promotionCode, giftFrom, planType, accessControl } = req.body;
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      throw new AppError("User ID is required", 400);
    }

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    // Determine the actual user being enrolled and who is gifting
    const userId = req.body.userId || currentUserId; // Allow admin to enroll other users
    const actualGiftFrom =
      enrollmentSource === "gift" ? currentUserId : giftFrom;

    const enrollmentData: any = {
      userId,
      courseId,
      enrollmentSource: enrollmentSource || "direct",
      promotionCode,
      giftFrom: actualGiftFrom,
      planType: planType || "essential", // Default to essential if not specified
    };

    // Include accessControl if provided
    if (accessControl) {
      enrollmentData.accessControl = accessControl;
    }

    const result = await CreateEnrollmentService(enrollmentData);
    if (!result) {
      throw new AppError("Failed to create enrollment", 500);
    }

    sendSuccessResponse(res, result, "Enrollment created successfully", 201);
  }
);

// Check enrollment status for a course
export const checkEnrollment = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    // Check if user is enrolled in this course
    const enrollment = await EnrollmentModel.findOne({
      userId,
      courseId,
      status: { $ne: "dropped" },
    })
      .populate(
        "courseId",
        "title thumbnail description category slug duration instructor plans analytics isFeatured isCertified"
      )
      .select("status accessControl"); // Include accessControl in the response

    const enrollmentStatus = {
      isEnrolled: !!enrollment,
      enrollment: enrollment || null,
      status: enrollment?.status || null,
      canAccess:
        enrollment?.status === "active" || enrollment?.status === "completed",
      accessControl: enrollment?.accessControl || null, // Include accessControl
    };

    sendSuccessResponse(
      res,
      enrollmentStatus,
      "Enrollment status checked successfully",
      200
    );
  }
);

// Get specific enrollment
export const getEnrollment = asyncHandler(
  async (req: Request, res: Response) => {
    const { enrollmentId } = req.params;

    if (!enrollmentId) {
      throw new AppError("Enrollment ID is required", 400);
    }

    const result = await GetEnrollmentService(enrollmentId);
    if (!result) {
      throw new AppError("Enrollment not found", 404);
    }

    sendSuccessResponse(res, result, "Enrollment retrieved successfully", 200);
  }
);

// Get all enrollments for a user
export const getUserEnrollments = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { status, page = 1, limit = 10, search, sortBy } = req.query;

    // Handle "me" route - use current user's ID
    let targetUserId: string;
    if (userId === "me") {
      if (!req.user?._id) {
        throw new AppError("User not authenticated", 401);
      }
      targetUserId = req.user._id;
    } else {
      if (!userId) {
        throw new AppError("User ID is required", 400);
      }
      targetUserId = userId;
    }

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const result = await GetUserEnrollmentsService(
      targetUserId,
      status as string,
      Number(page),
      Number(limit),
      search as string,
      sortBy as string
    );

    sendSuccessResponse(
      res,
      result,
      "User enrollments retrieved successfully",
      200
    );
  }
);

// Update enrollment progress
export const updateEnrollmentProgress = asyncHandler(
  async (req: Request, res: Response) => {
    const { enrollmentId } = req.params;
    const {
      moduleId,
      lessonId,
      contentId,
      contentType,
      lastPosition,
      completed,
      timeSpent,
    } = req.body;

    if (!enrollmentId) {
      throw new AppError("Enrollment ID is required", 400);
    }

    const progressData = {
      moduleId,
      lessonId,
      contentId,
      contentType,
      lastPosition,
      completed,
      timeSpent,
    };

    const result = await UpdateEnrollmentProgressService(
      enrollmentId,
      progressData
    );
    if (!result) {
      throw new AppError("Failed to update enrollment progress", 500);
    }

    sendSuccessResponse(
      res,
      result,
      "Enrollment progress updated successfully",
      200
    );
  }
);

// Update enrollment status
export const updateEnrollmentStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { enrollmentId } = req.params;
    const { status } = req.body;

    if (!enrollmentId) {
      throw new AppError("Enrollment ID is required", 400);
    }

    if (
      !status ||
      !["active", "completed", "dropped", "paused"].includes(status)
    ) {
      throw new AppError("Valid status is required", 400);
    }

    const result = await UpdateEnrollmentStatusService(enrollmentId, status);
    if (!result) {
      throw new AppError("Failed to update enrollment status", 500);
    }

    sendSuccessResponse(
      res,
      result,
      "Enrollment status updated successfully",
      200
    );
  }
);

// Pause enrollment
export const pauseEnrollment = asyncHandler(
  async (req: Request, res: Response) => {
    const { enrollmentId } = req.params;

    if (!enrollmentId) {
      throw new AppError("Enrollment ID is required", 400);
    }

    const result = await PauseEnrollmentService(enrollmentId);
    if (!result) {
      throw new AppError("Failed to pause enrollment", 500);
    }

    sendSuccessResponse(res, result, "Enrollment paused successfully", 200);
  }
);

// Resume enrollment
export const resumeEnrollment = asyncHandler(
  async (req: Request, res: Response) => {
    const { enrollmentId } = req.params;

    if (!enrollmentId) {
      throw new AppError("Enrollment ID is required", 400);
    }

    const result = await ResumeEnrollmentService(enrollmentId);
    if (!result) {
      throw new AppError("Failed to resume enrollment", 500);
    }

    sendSuccessResponse(res, result, "Enrollment resumed successfully", 200);
  }
);

// Issue certificate
export const issueCertificate = asyncHandler(
  async (req: Request, res: Response) => {
    const { enrollmentId } = req.params;

    if (!enrollmentId) {
      throw new AppError("Enrollment ID is required", 400);
    }

    const result = await IssueCertificateService(enrollmentId);
    if (!result) {
      throw new AppError("Failed to issue certificate", 500);
    }

    sendSuccessResponse(res, result, "Certificate issued successfully", 200);
  }
);

// Get user enrollment statistics
export const getEnrollmentStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const result = await GetEnrollmentStatsService(userId);
    if (!result) {
      throw new AppError("Failed to get enrollment statistics", 500);
    }

    sendSuccessResponse(
      res,
      result,
      "Enrollment statistics retrieved successfully",
      200
    );
  }
);

// Get course enrollment statistics
export const getCourseEnrollmentStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { courseId } = req.params;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const result = await GetCourseEnrollmentStatsService(courseId);
    if (!result) {
      throw new AppError("Failed to get course enrollment statistics", 500);
    }

    sendSuccessResponse(
      res,
      result,
      "Course enrollment statistics retrieved successfully",
      200
    );
  }
);

// Get detailed progress
export const getDetailedProgress = asyncHandler(
  async (req: Request, res: Response) => {
    const { enrollmentId } = req.params;

    if (!enrollmentId) {
      throw new AppError("Enrollment ID is required", 400);
    }

    const result = await GetDetailedProgressService(enrollmentId);
    if (!result) {
      throw new AppError("Failed to get detailed progress", 500);
    }

    sendSuccessResponse(
      res,
      result,
      "Detailed progress retrieved successfully",
      200
    );
  }
);

// Get enrollment analytics
export const getEnrollmentAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { period = "30" } = req.query; // days

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const result = await GetEnrollmentAnalyticsService(userId, Number(period));
    if (!result) {
      throw new AppError("Failed to get enrollment analytics", 500);
    }

    sendSuccessResponse(
      res,
      result,
      "Enrollment analytics retrieved successfully",
      200
    );
  }
);

// Get enrollment history
export const getEnrollmentHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const result = await GetEnrollmentHistoryService(
      userId,
      Number(page),
      Number(limit)
    );

    sendSuccessResponse(
      res,
      result,
      "Enrollment history retrieved successfully",
      200
    );
  }
);

// Delete enrollment (soft delete)
export const deleteEnrollment = asyncHandler(
  async (req: Request, res: Response) => {
    const { enrollmentId } = req.params;

    if (!enrollmentId) {
      throw new AppError("Enrollment ID is required", 400);
    }

    const result = await DeleteEnrollmentService(enrollmentId);
    if (!result) {
      throw new AppError("Failed to delete enrollment", 500);
    }

    sendSuccessResponse(res, null, "Enrollment deleted successfully", 200);
  }
);
