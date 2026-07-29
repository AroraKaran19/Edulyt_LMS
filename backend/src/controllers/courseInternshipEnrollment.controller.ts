import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  listMyCourseInternshipsService,
  getMyCourseInternshipService,
} from "../services/courseInternshipEnrollment.services";

/**
 * @route   GET /api/course-internship-enrollments/me
 * @desc    The caller's course internships.
 * @access  Authenticated learner
 */
export const listMyCourseInternshipsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const enrollments = await listMyCourseInternshipsService(String(userId));
    sendSuccessResponse(
      res,
      { enrollments },
      "Course internships fetched successfully",
      200,
    );
  },
);

/**
 * @route   GET /api/course-internship-enrollments/me/:enrollmentId
 * @desc    One enrollment with its task rows, on the learner's own timeline.
 * @access  Authenticated learner (own enrollment only)
 */
export const getMyCourseInternshipController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const enrollment = await getMyCourseInternshipService(
      String(userId),
      req.params.enrollmentId,
    );
    sendSuccessResponse(
      res,
      enrollment,
      "Course internship fetched successfully",
      200,
    );
  },
);
