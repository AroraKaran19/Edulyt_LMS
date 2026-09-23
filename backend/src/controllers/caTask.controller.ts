import { Request, Response } from "express";
import mongoose from "mongoose";
import { AppError, asyncHandler, sendSuccessResponse } from "../middlewares/error.middleware";
import { getAttachedCaApplication } from "../services/caApplicationReview.services";
import {
  createCaTaskAdmin,
  deleteCaTaskAdmin,
  getCaTaskAdmin,
  getCaTaskAttempt,
  listCaTasksAdmin,
  listCaTasksMine,
  submitCaTaskAnswers,
  updateCaTaskAdmin,
} from "../services/caTask.services";

/** @route GET /api/admin/ca-tasks */
export const listCaTasksAdminController = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccessResponse(res, { tasks: await listCaTasksAdmin() }, "Tasks fetched", 200);
});

/** @route GET /api/admin/ca-tasks/:id */
export const getCaTaskAdminController = asyncHandler(async (req: Request, res: Response) => {
  sendSuccessResponse(res, await getCaTaskAdmin(String(req.params.id)), "Task fetched", 200);
});

/** @route POST /api/admin/ca-tasks */
export const createCaTaskAdminController = asyncHandler(async (req: Request, res: Response) => {
  const createdBy = new mongoose.Types.ObjectId(String(req.user!._id));
  const task = await createCaTaskAdmin(req.body ?? {}, createdBy);
  sendSuccessResponse(res, task, "Task created", 201);
});

/** @route PATCH /api/admin/ca-tasks/:id */
export const updateCaTaskAdminController = asyncHandler(async (req: Request, res: Response) => {
  const task = await updateCaTaskAdmin(String(req.params.id), req.body ?? {});
  sendSuccessResponse(res, task, "Task updated", 200);
});

/** @route DELETE /api/admin/ca-tasks/:id */
export const deleteCaTaskAdminController = asyncHandler(async (req: Request, res: Response) => {
  await deleteCaTaskAdmin(String(req.params.id));
  sendSuccessResponse(res, { deleted: true }, "Task deleted", 200);
});

const requireAttachedApplication = async (req: Request) => {
  const userId = new mongoose.Types.ObjectId(String(req.user!._id));
  const application = await getAttachedCaApplication(userId);
  if (!application) throw new AppError("You are not on a Campus Ambassador team", 403);
  return { userId, application };
};

/** @route GET /api/ca-tasks/mine */
export const listCaTasksMineController = asyncHandler(async (req: Request, res: Response) => {
  const { application } = await requireAttachedApplication(req);
  const tasks = await listCaTasksMine(application._id, application.joiningDate, application.endDate);
  sendSuccessResponse(res, { tasks }, "Tasks fetched", 200);
});

/** @route GET /api/ca-tasks/:taskId */
export const getCaTaskAttemptController = asyncHandler(async (req: Request, res: Response) => {
  const { application } = await requireAttachedApplication(req);
  const attempt = await getCaTaskAttempt(
    application._id,
    application.joiningDate,
    application.endDate,
    String(req.params.taskId),
  );
  sendSuccessResponse(res, attempt, "Task fetched", 200);
});

/** @route POST /api/ca-tasks/:taskId/submit  Body: `{ answers: [...] }` */
export const submitCaTaskAnswersController = asyncHandler(async (req: Request, res: Response) => {
  const { userId, application } = await requireAttachedApplication(req);
  const attempt = await submitCaTaskAnswers(
    { _id: application._id, userId, joiningDate: application.joiningDate, endDate: application.endDate },
    String(req.params.taskId),
    req.body?.answers,
  );
  sendSuccessResponse(res, attempt, "Submitted", 200);
});
