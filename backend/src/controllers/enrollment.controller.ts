import { Request, Response } from "express";
import { AppError, asyncHandler } from "../middlewares/error.middleware";
import { sendSuccessResponse } from "../middlewares/error.middleware";
import {
  createEnrollment,
  getUserEnrollments,
  getCourseEnrollments,
  getEnrollment,
  updateEnrollmentProgress,
  completeEnrollment,
  updateEnrollmentStatus,
  getCourseEnrollmentStats,
  getUserEnrollmentStats,
  getOverallEnrollmentStats,
  deleteEnrollment,
  getDetailedProgress,
  getProgressSummaries,
} from "../services/enrollment.service";

export class EnrollmentController {
  /**
   * Create a new enrollment
   * @param req - Express request object
   * @param res - Express response object
   */
  createEnrollment = asyncHandler(async (req: Request, res: Response) => {
    const { courseId, enrollmentSource = "direct", giftFrom, promotionCode } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const enrollment = await createEnrollment(
      userId,
      courseId,
      enrollmentSource,
      giftFrom,
      promotionCode
    );

    sendSuccessResponse(
      res,
      { enrollment },
      "Enrollment created successfully",
      201
    );
  });

  /**
   * Get user's enrollments
   * @param req - Express request object
   * @param res - Express response object
   */
  getUserEnrollments = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { status } = req.query;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    const enrollments = await getUserEnrollments(userId, status as string);

    sendSuccessResponse(
      res,
      { enrollments },
      "User enrollments fetched successfully",
      200
    );
  });

  /**
   * Get course enrollments (admin/instructor only)
   * @param req - Express request object
   * @param res - Express response object
   */
  getCourseEnrollments = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { status } = req.query;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const enrollments = await getCourseEnrollments(courseId, status as string);

    sendSuccessResponse(
      res,
      { enrollments },
      "Course enrollments fetched successfully",
      200
    );
  });

  /**
   * Get specific enrollment
   * @param req - Express request object
   * @param res - Express response object
   */
  getEnrollment = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const enrollment = await getEnrollment(userId, courseId);

    if (!enrollment) {
      throw new AppError("Enrollment not found", 404);
    }

    sendSuccessResponse(
      res,
      { enrollment },
      "Enrollment fetched successfully",
      200
    );
  });

  /**
   * Update enrollment progress
   * @param req - Express request object
   * @param res - Express response object
   */
  updateEnrollmentProgress = asyncHandler(async (req: Request, res: Response) => {
    const { courseId, moduleId, lessonId } = req.params;
    const { completed, score, timeSpent } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!courseId || !moduleId || !lessonId) {
      throw new AppError("Course ID, Module ID, and Lesson ID are required", 400);
    }

    if (typeof completed !== "boolean") {
      throw new AppError("Completed status must be a boolean", 400);
    }

    const enrollment = await updateEnrollmentProgress(
      userId,
      courseId,
      moduleId,
      lessonId,
      completed,
      score,
      timeSpent
    );

    sendSuccessResponse(
      res,
      { enrollment },
      "Enrollment progress updated successfully",
      200
    );
  });

  /**
   * Mark enrollment as completed
   * @param req - Express request object
   * @param res - Express response object
   */
  completeEnrollment = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const enrollment = await completeEnrollment(userId, courseId);

    sendSuccessResponse(
      res,
      { enrollment },
      "Enrollment completed successfully",
      200
    );
  });

  /**
   * Update enrollment status
   * @param req - Express request object
   * @param res - Express response object
   */
  updateEnrollmentStatus = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const { status } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    if (!status || !["active", "completed", "dropped", "paused"].includes(status)) {
      throw new AppError("Valid status is required (active, completed, dropped, paused)", 400);
    }

    const enrollment = await updateEnrollmentStatus(userId, courseId, status);

    sendSuccessResponse(
      res,
      { enrollment },
      "Enrollment status updated successfully",
      200
    );
  });

  /**
   * Get course enrollment statistics
   * @param req - Express request object
   * @param res - Express response object
   */
  getCourseEnrollmentStats = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const stats = await getCourseEnrollmentStats(courseId);

    sendSuccessResponse(
      res,
      { stats },
      "Course enrollment statistics fetched successfully",
      200
    );
  });

  /**
   * Get user enrollment statistics
   * @param req - Express request object
   * @param res - Express response object
   */
  getUserEnrollmentStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    const stats = await getUserEnrollmentStats(userId);

    sendSuccessResponse(
      res,
      { stats },
      "User enrollment statistics fetched successfully",
      200
    );
  });

  /**
   * Get overall enrollment statistics (admin only)
   * @param req - Express request object
   * @param res - Express response object
   */
  getOverallEnrollmentStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await getOverallEnrollmentStats();

    sendSuccessResponse(
      res,
      { stats },
      "Overall enrollment statistics fetched successfully",
      200
    );
  });

  /**
   * Delete enrollment
   * @param req - Express request object
   * @param res - Express response object
   */
  deleteEnrollment = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const enrollment = await deleteEnrollment(userId, courseId);

    sendSuccessResponse(
      res,
      { enrollment },
      "Enrollment deleted successfully",
      200
    );
  });

  /**
   * Check if user is enrolled in a course
   * @param req - Express request object
   * @param res - Express response object
   */
  checkEnrollment = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const enrollment = await getEnrollment(userId, courseId);

    sendSuccessResponse(
      res,
      { 
        isEnrolled: !!enrollment,
        enrollment: enrollment || null,
        status: enrollment?.status || null
      },
      "Enrollment check completed",
      200
    );
  });

  /**
   * Get detailed progress for an enrollment
   * @param req - Express request object
   * @param res - Express response object
   */
  getDetailedProgress = asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!courseId) {
      throw new AppError("Course ID is required", 400);
    }

    const detailedProgress = await getDetailedProgress(userId, courseId);

    sendSuccessResponse(
      res,
      { detailedProgress },
      "Detailed progress fetched successfully",
      200
    );
  });

  /**
   * Get progress summaries for multiple enrollments (for dashboard)
   * @param req - Express request object
   * @param res - Express response object
   */
  getProgressSummaries = asyncHandler(async (req: Request, res: Response) => {
    const { enrollmentIds } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError("User authentication required", 401);
    }

    if (!enrollmentIds || !Array.isArray(enrollmentIds)) {
      throw new AppError("Enrollment IDs array is required", 400);
    }

    const progressSummaries = await getProgressSummaries(enrollmentIds);

    sendSuccessResponse(
      res,
      { progressSummaries },
      "Progress summaries fetched successfully",
      200
    );
  });
}

export default new EnrollmentController();
