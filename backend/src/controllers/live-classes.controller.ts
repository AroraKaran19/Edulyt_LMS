import mongoose from "mongoose";
import { Request, Response } from "express";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  activateLiveClassLinkService,
  createLiveClassService,
  deleteLiveClassService,
  getAllLiveClassesService,
  getAllOngoingLiveClassesService,
  getInstructorLiveClassesService,
  getLiveClassAttendanceService,
  getLiveClassByIdService,
  getStudentLiveClassByIdService,
  getStudentLiveClassesForCourseService,
  getStudentLiveClassesService,
  recordLiveClassAttendanceClick,
  setLiveClassAttendanceOverrideService,
  updateLiveClassService,
} from "../services/live-classes.services";
import { readableBrands } from "../lib/brandScope";
import { isBrand } from "../constants/brands";
import type {
  CreateLiveClassBody,
  SetLiveClassAttendanceOverrideBody,
  UpdateLiveClassBody,
} from "../types/live-classes";

/**
 * Every admin-flavoured role, not just the literal "admin". A super-admin that
 * fell through to the instructor branch would be asked to own the course it is
 * managing and get a 403 on every write.
 */
const ADMIN_ROLES = new Set(["admin", "super-admin"]);

/** Pulls the authenticated actor, or throws 401. */
function actor(req: Request): { id: string; isAdmin: boolean } {
  const user = req.user;
  if (!user || !user._id) throw new AppError("User not authenticated", 401);
  return {
    id: String(user._id),
    isAdmin: ADMIN_ROLES.has(String(user.userType)),
  };
}

function parsePaging(req: Request): { page: number; limit: number } {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);
  if (
    !Number.isFinite(page) ||
    !Number.isFinite(limit) ||
    page < 1 ||
    limit < 1
  ) {
    throw new AppError("Page and limit must be positive numbers", 400);
  }
  return { page, limit };
}

// ===================
// Create Live Class
// ===================
export const createLiveClass = asyncHandler(
  async (req: Request, res: Response) => {
    const { id, isAdmin } = actor(req);
    const body = req.body as CreateLiveClassBody;

    const result = await createLiveClassService(body, id, isAdmin);
    sendSuccessResponse(res, result, "Live class created successfully", 201);
  },
);

// ===================
// Update Live Class
// ===================
export const updateLiveClass = asyncHandler(
  async (req: Request, res: Response) => {
    const { id, isAdmin } = actor(req);
    const { liveClassId } = req.params;
    if (!liveClassId) throw new AppError("Live class ID is required", 400);

    const body = { ...(req.body ?? {}) } as UpdateLiveClassBody;
    // Only admins may reassign the owning instructor.
    if (!isAdmin) delete body.instructor;

    const result = await updateLiveClassService(liveClassId, body, id, isAdmin);
    sendSuccessResponse(res, result, "Live class updated successfully", 200);
  },
);

// ===================
// Get All Live Classes (Admin)
// ===================
export const getAllLiveClasses = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit } = parsePaging(req);
    const { courseId, search } = req.query;

    const result = await getAllLiveClassesService(
      page,
      limit,
      typeof courseId === "string" && courseId ? courseId : undefined,
      typeof search === "string" ? search : undefined,
      isBrand(req.query.brand) ? req.query.brand : undefined,
    );

    sendSuccessResponse(res, result, "Live classes retrieved successfully", 200);
  },
);

// ===================
// Get All Ongoing Live Classes (Admin)
// ===================
export const getAllOngoingLiveClasses = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit } = parsePaging(req);
    const result = await getAllOngoingLiveClassesService(page, limit);
    sendSuccessResponse(
      res,
      result,
      "Ongoing live classes retrieved successfully",
      200,
    );
  },
);

// ===================
// Get Instructor's Live Classes
// ===================
export const getInstructorLiveClasses = asyncHandler(
  async (req: Request, res: Response) => {
    const { id, isAdmin } = actor(req);
    const { page, limit } = parsePaging(req);
    const { courseId } = req.query;

    // Admins may inspect any instructor's schedule; instructors only their own.
    const instructorId =
      isAdmin && typeof req.query.instructorId === "string"
        ? req.query.instructorId
        : id;

    const result = await getInstructorLiveClassesService(
      instructorId,
      page,
      limit,
      typeof courseId === "string" && courseId ? courseId : undefined,
    );

    sendSuccessResponse(
      res,
      result,
      "Instructor live classes retrieved successfully",
      200,
    );
  },
);

// ===================
// Activate an attendance link (Admin / owning instructor)
// ===================
export const activateLiveClassLink = asyncHandler(
  async (req: Request, res: Response) => {
    const { id, isAdmin } = actor(req);
    const { liveClassId, slot } = req.params;
    const slotNum = Number(slot);
    if (slotNum !== 1 && slotNum !== 2) {
      throw new AppError("slot must be 1 or 2", 400);
    }

    const result = await activateLiveClassLinkService(
      String(liveClassId),
      slotNum as 1 | 2,
      id,
      isAdmin,
    );

    sendSuccessResponse(res, result, `Attendance ${slotNum} activated`, 200);
  },
);

// ===================
// Attendance (Admin / owning instructor)
// ===================
export const getLiveClassAttendance = asyncHandler(
  async (req: Request, res: Response) => {
    const { id, isAdmin } = actor(req);
    const { liveClassId } = req.params;
    if (!liveClassId) throw new AppError("Live class ID is required", 400);

    const result = await getLiveClassAttendanceService(
      liveClassId,
      id,
      isAdmin,
    );
    sendSuccessResponse(res, result, "Attendance fetched", 200);
  },
);

// ===================
// Force / clear a learner's verdict (Admin / owning instructor)
// ===================
export const setLiveClassAttendanceOverride = asyncHandler(
  async (req: Request, res: Response) => {
    const { id, isAdmin } = actor(req);
    const { liveClassId } = req.params;
    if (!liveClassId) throw new AppError("Live class ID is required", 400);

    const { userId, verdict } = (req.body ??
      {}) as SetLiveClassAttendanceOverrideBody;
    if (!userId) throw new AppError("userId is required", 400);

    const result = await setLiveClassAttendanceOverrideService(
      liveClassId,
      String(userId),
      verdict,
      new mongoose.Types.ObjectId(id),
      id,
      isAdmin,
    );

    sendSuccessResponse(
      res,
      result,
      verdict === "clear" ? "Override cleared" : `Marked ${verdict}`,
      200,
    );
  },
);

// ===================
// Get Student's Live Classes
// ===================
export const getStudentLiveClasses = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user._id) throw new AppError("User not authenticated", 401);
    if (user.userType !== "student") {
      throw new AppError("Student access required", 403);
    }

    const { page, limit } = parsePaging(req);
    const result = await getStudentLiveClassesService(
      String(user._id),
      page,
      limit,
      readableBrands(req.brand),
    );

    sendSuccessResponse(
      res,
      result,
      "Student live classes retrieved successfully",
      200,
    );
  },
);

// ===================
// Get Student's Live Classes for one course (course player tab)
// ===================
export const getStudentCourseLiveClasses = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user._id) throw new AppError("User not authenticated", 401);

    const { courseId } = req.params;
    if (!courseId) throw new AppError("Course ID is required", 400);

    const { page, limit } = parsePaging(req);
    const result = await getStudentLiveClassesForCourseService(
      courseId,
      String(user._id),
      page,
      limit,
      readableBrands(req.brand),
    );

    sendSuccessResponse(
      res,
      result,
      "Course live classes retrieved successfully",
      200,
    );
  },
);

// ===================
// Student records attendance via a link
// ===================
export const attendLiveClass = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user._id) throw new AppError("Authentication required", 401);

    const { token } = req.params;
    const result = await recordLiveClassAttendanceClick(
      String(token),
      new mongoose.Types.ObjectId(String(user._id)),
    );

    if (!result.ok) {
      const statusByReason: Record<string, number> = {
        invalid: 404,
        "not-activated": 410,
        expired: 410,
        "not-enrolled": 403,
        "not-elite": 403,
      };
      throw new AppError(result.reason, statusByReason[result.reason] ?? 400);
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

// ===================
// Get Live Class By ID
// ===================
export const getLiveClassById = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    if (!user || !user._id) throw new AppError("User not authenticated", 401);

    const { liveClassId } = req.params;
    if (!liveClassId) throw new AppError("Live class ID is required", 400);

    // Students get the token-free projection behind the elite-plan gate;
    // staff get the admin view with the attendance URLs.
    if (user.userType === "student") {
      const result = await getStudentLiveClassByIdService(
        liveClassId,
        String(user._id),
      );
      sendSuccessResponse(res, result, "Live class retrieved successfully", 200);
      return;
    }

    const result = await getLiveClassByIdService(liveClassId);
    if (!result) throw new AppError("Live class not found", 404);

    if (
      user.userType === "instructor" &&
      result.instructor?._id !== String(user._id)
    ) {
      throw new AppError("You can only view your own live classes", 403);
    }

    sendSuccessResponse(res, result, "Live class retrieved successfully", 200);
  },
);

// ===================
// Delete Live Class
// ===================
export const deleteLiveClass = asyncHandler(
  async (req: Request, res: Response) => {
    const { id, isAdmin } = actor(req);
    const { liveClassId } = req.params;
    if (!liveClassId) throw new AppError("Live class ID is required", 400);

    await deleteLiveClassService(liveClassId, id, isAdmin);
    sendSuccessResponse(res, null, "Live class deleted successfully", 200);
  },
);
