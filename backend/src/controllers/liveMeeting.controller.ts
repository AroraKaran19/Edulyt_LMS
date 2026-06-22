import mongoose from "mongoose";
import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  activateInternshipLiveMeetingLinkAdmin,
  createInternshipLiveMeetingAdmin,
  deleteInternshipLiveMeetingAdmin,
  getInternshipLiveMeetingAdmin,
  getInternshipLiveMeetingAttendanceAdmin,
  listInternshipLiveMeetingsAdmin,
  recordAttendanceClick,
  setAttendanceOverrideAdmin,
  updateInternshipLiveMeetingAdmin,
} from "../services/liveMeeting.services";
import type {
  CreateInternshipLiveMeetingBody,
  SetAttendanceOverrideBody,
} from "../types/internship-live-meeting";

/**
 * @route   POST /api/internship-live-meetings
 * @access  Admin
 */
export const createInternshipLiveMeetingController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Unauthorized", 401);
    const body = req.body as CreateInternshipLiveMeetingBody;
    const result = await createInternshipLiveMeetingAdmin(
      body,
      new mongoose.Types.ObjectId(String(userId)),
    );
    sendSuccessResponse(res, result, "Live meeting created", 201);
  },
);

/**
 * @route   GET /api/internship-live-meetings/admin
 *          ?internshipId=...&batchId=...&page=&limit=
 * @access  Admin
 */
export const listInternshipLiveMeetingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { internshipId, batchId, page = 1, limit = 20 } = req.query;
    if (typeof internshipId !== "string" || !internshipId) {
      throw new AppError("internshipId is required", 400);
    }
    const result = await listInternshipLiveMeetingsAdmin(
      internshipId,
      typeof batchId === "string" && batchId ? batchId : undefined,
      Number(page),
      Number(limit),
    );
    sendSuccessResponse(res, result, "Live meetings fetched", 200);
  },
);

/**
 * @route   GET /api/internship-live-meetings/admin/:meetingId
 * @access  Admin
 */
export const getInternshipLiveMeetingController = asyncHandler(
  async (req: Request, res: Response) => {
    const { meetingId } = req.params;
    const result = await getInternshipLiveMeetingAdmin(String(meetingId));
    sendSuccessResponse(res, result, "Live meeting fetched", 200);
  },
);

/**
 * @route   PATCH /api/internship-live-meetings/admin/:meetingId
 * @access  Admin
 */
export const updateInternshipLiveMeetingController = asyncHandler(
  async (req: Request, res: Response) => {
    const { meetingId } = req.params;
    const result = await updateInternshipLiveMeetingAdmin(
      String(meetingId),
      req.body ?? {},
    );
    sendSuccessResponse(res, result, "Live meeting updated", 200);
  },
);

/**
 * @route   POST /api/internship-live-meetings/admin/:meetingId/activate/:slot
 * @access  Admin
 */
export const activateInternshipLiveMeetingLinkController = asyncHandler(
  async (req: Request, res: Response) => {
    const { meetingId, slot } = req.params;
    const slotNum = Number(slot);
    if (slotNum !== 1 && slotNum !== 2) {
      throw new AppError("slot must be 1 or 2", 400);
    }
    const result = await activateInternshipLiveMeetingLinkAdmin(
      String(meetingId),
      slotNum as 1 | 2,
    );
    sendSuccessResponse(res, result, `Link ${slotNum} activated`, 200);
  },
);

/**
 * @route   GET /api/internship-live-meetings/admin/:meetingId/attendance
 * @access  Admin
 */
export const getInternshipLiveMeetingAttendanceController = asyncHandler(
  async (req: Request, res: Response) => {
    const { meetingId } = req.params;
    const result = await getInternshipLiveMeetingAttendanceAdmin(
      String(meetingId),
    );
    sendSuccessResponse(res, result, "Attendance fetched", 200);
  },
);

/**
 * @route   POST /api/internship-live-meetings/admin/:meetingId/attendance/override
 * @desc    Admin forces (present/absent) or clears a student's attendance verdict.
 * @access  Admin
 */
export const setInternshipLiveMeetingAttendanceOverrideController = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = req.user?._id;
    if (!adminId) throw new AppError("Unauthorized", 401);
    const { meetingId } = req.params;
    const { userId, verdict } = (req.body ?? {}) as SetAttendanceOverrideBody;
    if (typeof userId !== "string" || !userId) {
      throw new AppError("userId is required", 400);
    }
    const result = await setAttendanceOverrideAdmin(
      String(meetingId),
      userId,
      verdict,
      new mongoose.Types.ObjectId(String(adminId)),
    );
    const msg =
      verdict === "clear"
        ? "Attendance override cleared"
        : `Student marked ${verdict}`;
    sendSuccessResponse(res, result, msg, 200);
  },
);

/**
 * @route   DELETE /api/internship-live-meetings/admin/:meetingId
 * @access  Admin
 */
export const deleteInternshipLiveMeetingController = asyncHandler(
  async (req: Request, res: Response) => {
    const { meetingId } = req.params;
    await deleteInternshipLiveMeetingAdmin(String(meetingId));
    sendSuccessResponse(res, { deleted: true }, "Live meeting deleted", 200);
  },
);

/**
 * @route   POST /api/internship-live-meetings/attend/:token
 * @access  Authenticated user
 */
export const attendInternshipLiveMeetingController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    if (!userId) throw new AppError("Authentication required", 401);
    const { token } = req.params;
    const result = await recordAttendanceClick(
      String(token),
      new mongoose.Types.ObjectId(String(userId)),
    );

    if (!result.ok) {
      const statusByReason: Record<string, number> = {
        invalid: 404,
        "not-activated": 410,
        expired: 410,
        "not-enrolled": 403,
      };
      const code = statusByReason[result.reason] ?? 400;
      throw new AppError(result.reason, code);
    }

    sendSuccessResponse(
      res,
      result,
      result.alreadyMarked
        ? `Already marked for attendance ${result.slot}`
        : `Attendance ${result.slot} recorded`,
      200,
    );
  },
);
