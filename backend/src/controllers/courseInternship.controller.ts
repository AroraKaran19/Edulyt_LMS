import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  listCourseInternshipsService,
  getCourseInternshipByIdService,
  createCourseInternshipService,
  updateCourseInternshipService,
  deleteCourseInternshipService,
  type UpsertCourseInternshipBody,
} from "../services/courseInternship.services";

/**
 * @route   GET /api/course-internships
 * @desc    Paginated internship programs sold as course add-ons.
 * @access  Admin
 */
export const listCourseInternshipsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 20, search, status } = req.query;
    const p = Number(page);
    const l = Number(limit);
    if (p < 1 || l < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }
    const st =
      status === "active" || status === "inactive"
        ? (status as "active" | "inactive")
        : "all";

    const result = await listCourseInternshipsService(
      p,
      l,
      typeof search === "string" ? search : undefined,
      st,
    );
    sendSuccessResponse(res, result, "Programs fetched successfully", 200);
  },
);

/**
 * @route   GET /api/course-internships/:programId
 * @access  Admin
 */
export const getCourseInternshipController = asyncHandler(
  async (req: Request, res: Response) => {
    const program = await getCourseInternshipByIdService(req.params.programId);
    sendSuccessResponse(res, program, "Program fetched successfully", 200);
  },
);

/**
 * @route   POST /api/course-internships
 * @access  Admin
 */
export const createCourseInternshipController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const program = await createCourseInternshipService(
      req.body as UpsertCourseInternshipBody,
      String(userId),
    );
    sendSuccessResponse(res, program, "Program created successfully", 201);
  },
);

/**
 * @route   PATCH /api/course-internships/:programId
 * @access  Admin
 */
export const updateCourseInternshipController = asyncHandler(
  async (req: Request, res: Response) => {
    const program = await updateCourseInternshipService(
      req.params.programId,
      req.body as UpsertCourseInternshipBody,
    );
    sendSuccessResponse(res, program, "Program updated successfully", 200);
  },
);

/**
 * @route   DELETE /api/course-internships/:programId
 * @access  Admin
 */
export const deleteCourseInternshipController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await deleteCourseInternshipService(req.params.programId);
    sendSuccessResponse(res, result, "Program deleted successfully", 200);
  },
);
