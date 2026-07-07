import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { adminGuard } from "../middlewares/admin.middleware";
import { verifyAdminOrInstructor } from "../middlewares/instructor.middleware";
import {
  createLiveClass,
  updateLiveClass,
  deleteLiveClass,
  getAllLiveClasses,
  getAllOngoingLiveClasses,
  getInstructorLiveClasses,
  getStudentLiveClasses,
  getLiveClassById,
} from "../controllers/live-classes.controller";

const router = Router();

// ===================
// Admin & Instructor Routes
// ===================

/**
 * @route   POST /api/live-classes
 * @desc    Create a new live class
 * @access  Admin, Instructor
 */
router.post(
  "/",
  verifyUser,
  verifyAdminOrInstructor,
  createLiveClass
);

/**
 * @route   PUT /api/live-classes/:liveClassId
 * @desc    Update an existing live class
 * @access  Admin, Instructor (can only update their own)
 */
router.put(
  "/:liveClassId",
  verifyUser,
  verifyAdminOrInstructor,
  updateLiveClass
);

/**
 * @route   DELETE /api/live-classes/:liveClassId
 * @desc    Delete a live class
 * @access  Admin, Instructor (can only delete their own)
 */
router.delete(
  "/:liveClassId",
  verifyUser,
  verifyAdminOrInstructor,
  deleteLiveClass
);

/**
 * @route   GET /api/live-classes/admin
 * @desc    Get all live classes (admin only)
 * @access  Admin
 */
router.get(
  "/admin",
  ...adminGuard("courses.live-classes"),
  getAllLiveClasses
);

/**
 * @route   GET /api/live-classes/ongoing
 * @desc    Get all ongoing live classes
 * @access  Admin
 */
router.get(
  "/ongoing",
  ...adminGuard("courses.live-classes"),
  getAllOngoingLiveClasses
);

/**
 * @route   GET /api/live-classes/instructor
 * @desc    Get instructor's live classes (optionally filtered by course)
 * @access  Admin, Instructor
 */
router.get(
  "/instructor",
  verifyUser,
  verifyAdminOrInstructor,
  getInstructorLiveClasses
);

// ===================
// Student Routes
// ===================

/**
 * @route   GET /api/live-classes/student
 * @desc    Get live classes for courses the student is enrolled in
 * @access  Student
 */
router.get(
  "/student",
  verifyUser,
  getStudentLiveClasses
);

// ===================
// Public Routes (with authentication)
// ===================
// Note: These routes must come after specific routes like /instructor and /student
// to avoid route conflicts

/**
 * @route   GET /api/live-classes/:liveClassId
 * @desc    Get live class by ID
 * @access  Authenticated users
 */
router.get(
  "/:liveClassId",
  verifyUser,
  getLiveClassById
);

export default router;

