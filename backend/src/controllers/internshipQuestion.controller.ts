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
  getInternshipQuestionByIdAdmin,
  updateInternshipQuestionAdmin,
  deleteInternshipQuestionAdmin,
  type CreateInternshipQuestionBody,
} from "../services/internshipQuestion.services";

/**
 * @route   GET /api/internship-questions/admin
 * @desc    Paginated question bank for admins
 * @access  Admin
 */
export const listInternshipQuestionsAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 20, search, type, usageFor, categoryId } = req.query;
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
      typeof categoryId === "string" ? categoryId : undefined,
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
