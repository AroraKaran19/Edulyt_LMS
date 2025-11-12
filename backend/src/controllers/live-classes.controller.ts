import { Request, Response } from "express";
import {
  AppError,
  asyncHandler,
  sendSuccessResponse,
} from "../middlewares/error.middleware";
import {
  createLiveClassService,
  updateLiveClassService,
  getAllLiveClassesService,
  getAllOngoingLiveClassesService,
  getInstructorLiveClassesService,
  getStudentLiveClassesService,
  getLiveClassByIdService,
  deleteLiveClassService,
} from "../services/live-classes.services";

// ===================
// Create Live Class
// ===================
export const createLiveClass = asyncHandler(
  async (req: Request, res: Response) => {
    const liveClassData = req.body;
    const user = req.user;

    if (!user || !user._id) {
      throw new AppError("User not authenticated", 401);
    }

    const isAdmin = user.userType === "admin";
    
    // For instructors: always use their own ID
    // For admins: allow them to specify instructor in request body, otherwise use their own ID
    if (!isAdmin) {
      // Instructors must use their own ID
      liveClassData.instructor = user._id.toString();
    } else {
      // Admins can specify instructor in request body, or it defaults to their ID
      if (!liveClassData.instructor) {
    liveClassData.instructor = user._id.toString();
      }
    }

    const result = await createLiveClassService(
      liveClassData,
      user._id.toString(),
      isAdmin
    );

    sendSuccessResponse(res, result, "Live class created successfully", 201);
  }
);

// ===================
// Update Live Class
// ===================
export const updateLiveClass = asyncHandler(
  async (req: Request, res: Response) => {
    const { liveClassId } = req.params;
    const updateData = req.body;
    const user = req.user;

    if (!liveClassId) {
      throw new AppError("Live class ID is required", 400);
    }

    // If user is instructor, verify they own this live class
    if (user?.userType === "instructor" && user._id) {
      const existingLiveClass = await getLiveClassByIdService(liveClassId);
      if (!existingLiveClass || !existingLiveClass.instructor) {
        throw new AppError("Live class not found", 404);
      }

      // Extract instructor ID - handle both populated and non-populated cases
      let instructorId: string;
      if (typeof existingLiveClass.instructor === "object") {
        const instructorObj = existingLiveClass.instructor as any;
        instructorId = instructorObj._id
          ? instructorObj._id.toString()
          : instructorObj.toString();
      } else {
        instructorId = existingLiveClass.instructor.toString();
      }

      if (instructorId !== user._id.toString()) {
        throw new AppError("You can only update your own live classes", 403);
      }

      // Prevent instructor from changing instructor field
      delete updateData.instructor;
    }

    const result = await updateLiveClassService(liveClassId, updateData);

    sendSuccessResponse(res, result, "Live class updated successfully", 200);
  }
);

// ===================
// Get All Live Classes (Admin)
// ===================
export const getAllLiveClasses = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const result = await getAllLiveClassesService(
      Number(page),
      Number(limit)
    );

    sendSuccessResponse(
      res,
      result,
      "Live classes retrieved successfully",
      200
    );
  }
);

// ===================
// Get All Ongoing Live Classes (Admin)
// ===================
export const getAllOngoingLiveClasses = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const result = await getAllOngoingLiveClassesService(
      Number(page),
      Number(limit)
    );

    sendSuccessResponse(
      res,
      result,
      "Ongoing live classes retrieved successfully",
      200
    );
  }
);

// ===================
// Get Instructor's Live Classes
// ===================
export const getInstructorLiveClasses = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, courseId } = req.query;
    const user = req.user;

    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    // If user is instructor, use their ID; if admin, use instructorId from query
    let instructorId = user._id?.toString();

    if (user.userType === "admin" && req.query.instructorId) {
      instructorId = req.query.instructorId as string;
    } else if (user.userType === "instructor") {
      instructorId = user._id?.toString();
    } else {
      throw new AppError("Instructor access required", 403);
    }

    if (!instructorId) {
      throw new AppError("Instructor ID is required", 400);
    }

    const result = await getInstructorLiveClassesService(
      instructorId,
      Number(page),
      Number(limit),
      courseId as string | undefined
    );

    sendSuccessResponse(
      res,
      result,
      "Instructor live classes retrieved successfully",
      200
    );
  }
);

// ===================
// Get Student's Live Classes
// ===================
export const getStudentLiveClasses = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const user = req.user;

    if (!user) {
      throw new AppError("User not authenticated", 401);
    }

    if (user.userType !== "student") {
      throw new AppError("Student access required", 403);
    }

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const result = await getStudentLiveClassesService(
      user._id!.toString(),
      Number(page),
      Number(limit)
    );

    sendSuccessResponse(
      res,
      result,
      "Student live classes retrieved successfully",
      200
    );
  }
);

// ===================
// Get Live Class By ID
// ===================
export const getLiveClassById = asyncHandler(
  async (req: Request, res: Response) => {
    const { liveClassId } = req.params;

    if (!liveClassId) {
      throw new AppError("Live class ID is required", 400);
    }

    const result = await getLiveClassByIdService(liveClassId);

    if (!result) {
      throw new AppError("Live class not found", 404);
    }

    sendSuccessResponse(res, result, "Live class retrieved successfully", 200);
  }
);

// ===================
// Delete Live Class
// ===================
export const deleteLiveClass = asyncHandler(
  async (req: Request, res: Response) => {
    const { liveClassId } = req.params;
    const user = req.user;

    if (!liveClassId) {
      throw new AppError("Live class ID is required", 400);
    }

    // If user is instructor, verify they own this live class
    if (user?.userType === "instructor" && user._id) {
      const existingLiveClass = await getLiveClassByIdService(liveClassId);
      if (!existingLiveClass || !existingLiveClass.instructor) {
        throw new AppError("Live class not found", 404);
      }

      // Extract instructor ID - handle both populated and non-populated cases
      let instructorId: string;
      if (typeof existingLiveClass.instructor === "object") {
        const instructorObj = existingLiveClass.instructor as any;
        instructorId = instructorObj._id
          ? instructorObj._id.toString()
          : instructorObj.toString();
      } else {
        instructorId = existingLiveClass.instructor.toString();
      }

      if (instructorId !== user._id.toString()) {
        throw new AppError("You can only delete your own live classes", 403);
      }
    }

    await deleteLiveClassService(liveClassId);

    sendSuccessResponse(res, null, "Live class deleted successfully", 200);
  }
);
