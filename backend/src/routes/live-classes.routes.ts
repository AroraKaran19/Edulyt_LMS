import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { adminGuard } from "../middlewares/admin.middleware";
import { verifyAdminOrInstructor } from "../middlewares/instructor.middleware";
import {
  activateLiveClassLink,
  attendLiveClass,
  createLiveClass,
  deleteLiveClass,
  getAllLiveClasses,
  getAllOngoingLiveClasses,
  getInstructorLiveClasses,
  getLiveClassAttendance,
  getLiveClassById,
  getStudentCourseLiveClasses,
  getStudentLiveClasses,
  setLiveClassAttendanceOverride,
  updateLiveClass,
} from "../controllers/live-classes.controller";

const router = Router();

// ===================
// Student Routes
// ===================

/**
 * @route   POST /api/live-classes/attend/:token
 * @desc    Student records attendance via an attendance link
 * @access  Authenticated user
 */
router.post("/attend/:token", verifyUser, attendLiveClass);

/**
 * @route   GET /api/live-classes/student
 * @desc    Live classes for courses the student is enrolled in (elite plan)
 * @access  Student
 */
router.get("/student", verifyUser, getStudentLiveClasses);

/**
 * @route   GET /api/live-classes/student/course/:courseId
 * @desc    Live classes for one enrolled course — drives the course player's
 *          "Live Classes" tab. Non-elite enrollments get hasAccess: false.
 * @access  Enrolled student
 */
router.get("/student/course/:courseId", verifyUser, getStudentCourseLiveClasses);

// ===================
// Admin & Instructor Routes
// ===================

/**
 * @route   POST /api/live-classes
 * @desc    Create a new live class
 * @access  Admin, Instructor
 */
router.post("/", verifyUser, verifyAdminOrInstructor, createLiveClass);

/**
 * @route   GET /api/live-classes/admin
 * @desc    Get all live classes, optionally filtered by course / title search
 * @access  Admin (courses.live-classes)
 */
router.get("/admin", ...adminGuard("courses.live-classes"), getAllLiveClasses);

/**
 * @route   GET /api/live-classes/ongoing
 * @desc    Get all currently-running live classes
 * @access  Admin (courses.live-classes)
 */
router.get(
  "/ongoing",
  ...adminGuard("courses.live-classes"),
  getAllOngoingLiveClasses,
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
  getInstructorLiveClasses,
);

/**
 * @route   GET /api/live-classes/admin/:liveClassId/attendance
 * @desc    Roster with per-link clicks and present/absent/pending verdict.
 *          Lazily finalizes attendance once both windows have closed.
 * @access  Admin, owning Instructor
 */
router.get(
  "/admin/:liveClassId/attendance",
  verifyUser,
  verifyAdminOrInstructor,
  getLiveClassAttendance,
);

/**
 * @route   POST /api/live-classes/admin/:liveClassId/attendance/override
 * @desc    Force or clear a learner's verdict.
 *          Body: { userId, verdict: "present" | "absent" | "clear" }
 * @access  Admin, owning Instructor
 */
router.post(
  "/admin/:liveClassId/attendance/override",
  verifyUser,
  verifyAdminOrInstructor,
  setLiveClassAttendanceOverride,
);

/**
 * @route   POST /api/live-classes/admin/:liveClassId/activate/:slot
 * @desc    Open attendance link 1 or 2. One-shot — cannot be re-activated.
 * @access  Admin, owning Instructor
 */
router.post(
  "/admin/:liveClassId/activate/:slot",
  verifyUser,
  verifyAdminOrInstructor,
  activateLiveClassLink,
);

/**
 * @route   PUT /api/live-classes/:liveClassId
 * @desc    Update an existing live class
 * @access  Admin, Instructor (own classes only)
 */
router.put("/:liveClassId", verifyUser, verifyAdminOrInstructor, updateLiveClass);

/**
 * @route   DELETE /api/live-classes/:liveClassId
 * @desc    Delete a live class and its absent-attendance records
 * @access  Admin, Instructor (own classes only)
 */
router.delete(
  "/:liveClassId",
  verifyUser,
  verifyAdminOrInstructor,
  deleteLiveClass,
);

// ===================
// Authenticated (must stay last — matches any remaining id)
// ===================

/**
 * @route   GET /api/live-classes/:liveClassId
 * @desc    Get live class by ID (student view is token-free + elite-gated)
 * @access  Authenticated users
 */
router.get("/:liveClassId", verifyUser, getLiveClassById);

export default router;
