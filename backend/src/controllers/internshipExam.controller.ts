import mongoose from "mongoose";
import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  listInternshipExamTemplatesAdmin,
  createInternshipExamAdmin,
  getInternshipExamByIdAdmin,
  updateInternshipExamAdmin,
  deleteInternshipExamAdmin,
  type UpsertInternshipExamBody,
  type UpdateInternshipExamBody,
} from "../services/internshipExam.services";

/**
 * @route   GET /api/internship-exams/admin
 * @desc    Paginated exam templates. Optional `internshipId` + `batchId` pin batch-linked
 *          first. `status=all|active|inactive` for exam bank; legacy `includeInactive` when status omitted.
 * @access  Admin
 */
export const listInternshipExamTemplatesAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 15,
      search,
      internshipId,
      batchId,
      includeInactive,
      status,
      examType,
    } = req.query;
    const p = Number(page);
    const l = Number(limit);
    if (p < 1 || l < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }
    const st =
      status === "all" || status === "active" || status === "inactive"
        ? (status as "all" | "active" | "inactive")
        : undefined;
    const et =
      examType === "entrance" || examType === "certification"
        ? (examType as "entrance" | "certification")
        : undefined;
    const result = await listInternshipExamTemplatesAdmin(
      p,
      l,
      typeof search === "string" ? search : undefined,
      typeof internshipId === "string" ? internshipId : undefined,
      typeof batchId === "string" ? batchId : undefined,
      String(includeInactive) === "true",
      st,
      et,
    );
    sendSuccessResponse(
      res,
      result,
      "Exam templates fetched successfully",
      200,
    );
  },
);

/**
 * @route   POST /api/internship-exams
 * @access  Admin
 */
export const createInternshipExamAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }
    const body = req.body as UpsertInternshipExamBody;
    const result = await createInternshipExamAdmin(
      body,
      new mongoose.Types.ObjectId(String(userId)),
    );
    sendSuccessResponse(res, result, "Exam template created successfully", 201);
  },
);

/**
 * @route   GET /api/internship-exams/admin/:examId
 * @access  Admin
 */
export const getInternshipExamByIdAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const { examId } = req.params;
    const result = await getInternshipExamByIdAdmin(String(examId));
    sendSuccessResponse(res, result, "Exam template fetched successfully", 200);
  },
);

/**
 * @route   PATCH /api/internship-exams/admin/:examId
 * @access  Admin
 */
export const updateInternshipExamAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const { examId } = req.params;
    const body = req.body as UpdateInternshipExamBody;
    const result = await updateInternshipExamAdmin(String(examId), body);
    sendSuccessResponse(res, result, "Exam template updated successfully", 200);
  },
);

/**
 * @route   DELETE /api/internship-exams/admin/:examId
 * @access  Admin
 */
export const deleteInternshipExamAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const { examId } = req.params;
    await deleteInternshipExamAdmin(String(examId));
    sendSuccessResponse(
      res,
      { deleted: true },
      "Exam template deleted successfully",
      200,
    );
  },
);
