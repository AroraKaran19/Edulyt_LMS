import { Request, Response } from "express";
import mongoose from "mongoose";
import { AppError, asyncHandler, sendSuccessResponse } from "../middlewares/error.middleware";
import { getAttachedCaApplication } from "../services/caApplicationReview.services";
import {
  activateCaMeetingLinkAdmin,
  createCaMeetingAdmin,
  deleteCaMeetingAdmin,
  getCaMeetingAdmin,
  getCaMeetingAttendanceAdmin,
  listCaMeetingsAdmin,
  listCaMeetingsMine,
  recordCaMeetingAttendanceClick,
  setCaMeetingOverrideAdmin,
  updateCaMeetingAdmin,
} from "../services/caMeeting.services";

/** @route POST /api/admin/ca-meetings */
export const createCaMeetingAdminController = asyncHandler(async (req: Request, res: Response) => {
  const createdBy = new mongoose.Types.ObjectId(String(req.user!._id));
  sendSuccessResponse(res, await createCaMeetingAdmin(req.body ?? {}, createdBy), "Meeting created", 201);
});

/** @route GET /api/admin/ca-meetings?page=&limit= */
export const listCaMeetingsAdminController = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  sendSuccessResponse(res, await listCaMeetingsAdmin(page, limit), "Meetings fetched", 200);
});

/** @route GET /api/admin/ca-meetings/:id */
export const getCaMeetingAdminController = asyncHandler(async (req: Request, res: Response) => {
  sendSuccessResponse(res, await getCaMeetingAdmin(String(req.params.id)), "Meeting fetched", 200);
});

/** @route PATCH /api/admin/ca-meetings/:id */
export const updateCaMeetingAdminController = asyncHandler(async (req: Request, res: Response) => {
  sendSuccessResponse(res, await updateCaMeetingAdmin(String(req.params.id), req.body ?? {}), "Meeting updated", 200);
});

/** @route POST /api/admin/ca-meetings/:id/activate/:slot */
export const activateCaMeetingLinkAdminController = asyncHandler(async (req: Request, res: Response) => {
  const slot = Number(req.params.slot) === 2 ? 2 : 1;
  sendSuccessResponse(res, await activateCaMeetingLinkAdmin(String(req.params.id), slot), "Link activated", 200);
});

/** @route DELETE /api/admin/ca-meetings/:id */
export const deleteCaMeetingAdminController = asyncHandler(async (req: Request, res: Response) => {
  await deleteCaMeetingAdmin(String(req.params.id));
  sendSuccessResponse(res, { deleted: true }, "Meeting deleted", 200);
});

/** @route GET /api/admin/ca-meetings/:id/attendance */
export const getCaMeetingAttendanceAdminController = asyncHandler(async (req: Request, res: Response) => {
  sendSuccessResponse(res, await getCaMeetingAttendanceAdmin(String(req.params.id)), "Attendance fetched", 200);
});

/** @route POST /api/admin/ca-meetings/:id/attendance/override  Body: `{ applicationId, verdict }` */
export const setCaMeetingOverrideAdminController = asyncHandler(async (req: Request, res: Response) => {
  const setBy = new mongoose.Types.ObjectId(String(req.user!._id));
  const result = await setCaMeetingOverrideAdmin(
    String(req.params.id),
    String(req.body?.applicationId),
    req.body?.verdict,
    setBy,
  );
  sendSuccessResponse(res, result, "Attendance updated", 200);
});

/** @route POST /api/ca-meetings/attend/:token */
export const attendCaMeetingController = asyncHandler(async (req: Request, res: Response) => {
  const userId = new mongoose.Types.ObjectId(String(req.user!._id));
  const application = await getAttachedCaApplication(userId);
  if (!application) throw new AppError("not-eligible", 403);
  const result = await recordCaMeetingAttendanceClick(String(req.params.token), application._id, application.endDate);
  if (!result.ok) {
    const statusByReason: Record<string, number> = { invalid: 404, "not-activated": 410, expired: 410, "not-eligible": 403, "tenure-ended": 403 };
    throw new AppError(result.reason, statusByReason[result.reason] ?? 400);
  }
  sendSuccessResponse(res, result, "Attendance marked", 200);
});

/** @route GET /api/ca-meetings/mine */
export const listCaMeetingsMineController = asyncHandler(async (req: Request, res: Response) => {
  const userId = new mongoose.Types.ObjectId(String(req.user!._id));
  const application = await getAttachedCaApplication(userId);
  if (!application) throw new AppError("You are not on a Campus Ambassador team", 403);
  const meetings = await listCaMeetingsMine(application._id, application.joiningDate, application.endDate);
  sendSuccessResponse(res, { meetings }, "Meetings fetched", 200);
});
