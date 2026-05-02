import mongoose from "mongoose";
import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  listInternshipQuestionsAdmin,
  createInternshipQuestionAdmin,
  bulkCreateInternshipQuestionsAdmin,
  getInternshipQuestionByIdAdmin,
  updateInternshipQuestionAdmin,
  deleteInternshipQuestionAdmin,
  randomInternshipQuestionsAdmin,
  type CreateInternshipQuestionBody,
} from "../services/internshipQuestion.services";

/**
 * @route   GET /api/internship-questions/admin
 * @desc    Paginated question bank for admins
 * @access  Admin
 */
export const listInternshipQuestionsAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 20, search, type, usageFor, category } =
      req.query;
    const p = Number(page);
    const l = Number(limit);
    if (p < 1 || l < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }
    const qType =
      type === "mcq" || type === "file_upload"
        ? (type as "mcq" | "file_upload")
        : undefined;
    const uFor =
      usageFor === "task" || usageFor === "exam"
        ? (usageFor as "task" | "exam")
        : undefined;
    const result = await listInternshipQuestionsAdmin(
      p,
      l,
      typeof search === "string" ? search : undefined,
      qType,
      uFor,
      typeof category === "string" ? category : undefined,
    );
    sendSuccessResponse(
      res,
      result,
      "Questions fetched successfully",
      200,
    );
  },
);

/**
 * @route   POST /api/internship-questions
 * @desc    Create a reusable question (admin)
 * @access  Admin
 */
export const createInternshipQuestionAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }
    const body = req.body as CreateInternshipQuestionBody;
    const result = await createInternshipQuestionAdmin(
      body,
      new mongoose.Types.ObjectId(String(userId)),
    );
    sendSuccessResponse(res, result, "Question created successfully", 201);
  },
);

/**
 * @route   POST /api/internship-questions/admin/bulk
 * @desc    Create many questions (admin) — body: { questions: CreateInternshipQuestionBody[] }
 * @access  Admin
 */
export const bulkCreateInternshipQuestionAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }
    const questions = (req.body as { questions?: CreateInternshipQuestionBody[] })
      ?.questions;
    const result = await bulkCreateInternshipQuestionsAdmin(
      questions ?? [],
      new mongoose.Types.ObjectId(String(userId)),
    );
    if (result.created === 0 && (questions?.length ?? 0) > 0) {
      const first = result.failed[0]?.message ?? "Validation failed";
      throw new AppError(first, 400);
    }
    sendSuccessResponse(
      res,
      result,
      `Imported ${result.created} question(s)`,
      201,
    );
  },
);

/**
 * @route   GET /api/internship-questions/admin/random
 * @desc    Random pick of N active questions from a single category, filtered
 *          by usage (exam | task) and excluding caller-provided IDs.
 * @access  Admin
 */
export const randomInternshipQuestionsAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const { category, usageFor, limit, exclude } = req.query;
    const usage =
      usageFor === "exam" || usageFor === "task" ? usageFor : undefined;
    if (!usage) {
      throw new AppError("usageFor must be exam or task", 400);
    }
    if (typeof category !== "string" || !category.trim()) {
      throw new AppError("category is required", 400);
    }
    const limitNum = Number(limit);
    if (!Number.isFinite(limitNum) || limitNum < 1) {
      throw new AppError("limit must be a positive integer", 400);
    }
    const excludeIds =
      typeof exclude === "string" && exclude.trim()
        ? exclude
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    const result = await randomInternshipQuestionsAdmin(
      category,
      usage,
      limitNum,
      excludeIds,
    );
    sendSuccessResponse(res, result, "Random questions fetched", 200);
  },
);

/**
 * @route   GET /api/internship-questions/admin/:questionId
 * @access  Admin
 */
export const getInternshipQuestionByIdAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const { questionId } = req.params;
    const result = await getInternshipQuestionByIdAdmin(String(questionId));
    sendSuccessResponse(res, result, "Question fetched successfully", 200);
  },
);

/**
 * @route   PATCH /api/internship-questions/admin/:questionId
 * @access  Admin
 */
export const updateInternshipQuestionAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const { questionId } = req.params;
    const body = req.body as CreateInternshipQuestionBody;
    const result = await updateInternshipQuestionAdmin(
      String(questionId),
      body,
    );
    sendSuccessResponse(res, result, "Question updated successfully", 200);
  },
);

/**
 * @route   DELETE /api/internship-questions/admin/:questionId
 * @access  Admin
 */
export const deleteInternshipQuestionAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const { questionId } = req.params;
    await deleteInternshipQuestionAdmin(String(questionId));
    sendSuccessResponse(res, { deleted: true }, "Question deleted successfully", 200);
  },
);
