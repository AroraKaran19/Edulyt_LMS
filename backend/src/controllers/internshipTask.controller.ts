import mongoose from "mongoose";
import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  listInternshipTasksAdmin,
  createInternshipTaskAdmin,
  getInternshipTaskByIdAdmin,
  updateInternshipTaskAdmin,
  deleteInternshipTaskAdmin,
  type UpsertInternshipTaskBody,
} from "../services/internshipTask.services";

/**
 * @route   GET /api/internship-tasks/admin
 * @desc    Paginated task templates for admins. Optional `internshipId` + `batchId`
 *          pin templates already linked on that embedded batch first (picker UX).
 * @access  Admin
 */
export const listInternshipTasksAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 20, search, status, internshipId, batchId } =
      req.query;
    const p = Number(page);
    const l = Number(limit);
    if (p < 1 || l < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }
    const st =
      status === "active" || status === "inactive"
        ? (status as "active" | "inactive")
        : "all";
    const result = await listInternshipTasksAdmin(
      p,
      l,
      typeof search === "string" ? search : undefined,
      st,
      typeof internshipId === "string" ? internshipId : undefined,
      typeof batchId === "string" ? batchId : undefined,
    );
    sendSuccessResponse(
      res,
      result,
      "Task templates fetched successfully",
      200,
    );
  },
);

/**
 * @route   POST /api/internship-tasks
 * @access  Admin
 */
export const createInternshipTaskAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }
    const body = req.body as UpsertInternshipTaskBody;
    const result = await createInternshipTaskAdmin(
      body,
      new mongoose.Types.ObjectId(String(userId)),
    );
    sendSuccessResponse(res, result, "Task template created successfully", 201);
  },
);

/**
 * @route   GET /api/internship-tasks/admin/:taskId
 * @access  Admin
 */
export const getInternshipTaskByIdAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const result = await getInternshipTaskByIdAdmin(String(taskId));
    sendSuccessResponse(res, result, "Task template fetched successfully", 200);
  },
);

/**
 * @route   PATCH /api/internship-tasks/admin/:taskId
 * @access  Admin
 */
export const updateInternshipTaskAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const body = req.body as UpsertInternshipTaskBody;
    const result = await updateInternshipTaskAdmin(String(taskId), body);
    sendSuccessResponse(res, result, "Task template updated successfully", 200);
  },
);

/**
 * @route   DELETE /api/internship-tasks/admin/:taskId
 * @access  Admin
 */
export const deleteInternshipTaskAdminController = asyncHandler(
  async (req: Request, res: Response) => {
    const { taskId } = req.params;
    await deleteInternshipTaskAdmin(String(taskId));
    sendSuccessResponse(
      res,
      { deleted: true },
      "Task template deleted successfully",
      200,
    );
  },
);
