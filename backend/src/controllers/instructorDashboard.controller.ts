import { Request, Response } from "express";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  getInstructorAllQnasService,
  getInstructorDashboardService,
} from "../services/instructorDashboard.services";
import { assertInstructorTeachesCourse } from "../services/instructorCourse.services";
import { getAllQnAsService } from "../services/qna.services";
import { getInstructorCourseReviewsService } from "../services/review.services";

export const getInstructorDashboard = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }
    const data = await getInstructorDashboardService(String(userId));
    sendSuccessResponse(res, data, "Instructor dashboard loaded", 200);
  }
);

/** Q&A for a course — only admin-approved threads; instructor must teach the course. */
/** All learner questions across courses this instructor teaches (approved only). */
export const getInstructorAllQnas = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }
    const { page = 1, limit = 20, search = "" } = req.query;
    const result = await getInstructorAllQnasService(
      String(userId),
      Number(page),
      Number(limit),
      String(search)
    );
    sendSuccessResponse(res, result, "Instructor Q&A loaded", 200);
  }
);

export const getInstructorCourseQnas = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }
    const { courseId } = req.params;
    const {
      page = 1,
      limit = 20,
      search = "",
      repliesLimit = 40,
    } = req.query;

    await assertInstructorTeachesCourse(courseId, String(userId));

    const result = await getAllQnAsService(
      Number(page),
      Number(limit),
      String(search),
      courseId,
      undefined,
      undefined,
      false,
      undefined,
      Number(repliesLimit) > 0 ? Number(repliesLimit) : 40
    );

    sendSuccessResponse(res, result, "Course Q&A loaded", 200);
  }
);

/** Approved course reviews across all courses this instructor teaches. */
export const getInstructorReviews = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }
    const { page = 1, limit = 20, search = "" } = req.query;
    const result = await getInstructorCourseReviewsService(
      String(userId),
      Number(page),
      Number(limit),
      String(search)
    );
    sendSuccessResponse(res, result, "Instructor reviews loaded", 200);
  }
);
