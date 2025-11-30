import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import {
  createEnrollment,
  getEnrollment,
  getUserEnrollments,
  updateEnrollmentProgress,
  recalculateEnrollmentProgress,
  updateEnrollmentStatus,
  getEnrollmentStats,
  getCourseEnrollmentStats,
  getDetailedProgress,
  issueCertificate,
  getEnrollmentAnalytics,
  deleteEnrollment,
  pauseEnrollment,
  resumeEnrollment,
  getEnrollmentHistory,
  checkEnrollment,
  getUserDashboardStats,
} from "../controllers/enrollment.controller";

const router = Router();

/**
 * @route   POST /api/enrollments
 * @desc    Create a new enrollment
 * @access  User
 */
router.post("/", verifyUser, createEnrollment);

/**
 * @route   GET /api/enrollments/check/:courseId
 * @desc    Check enrollment status for a course
 * @access  User
 */
router.get("/check/:courseId", verifyUser, checkEnrollment);

/**
 * @route   GET /api/enrollments/user/:userId
 * @desc    Get all enrollments for a user (use "me" for current user)
 * @access  User
 */
router.get("/user/:userId", verifyUser, getUserEnrollments);

/**
 * @route   GET /api/enrollments/dashboard-stats
 * @desc    Get user dashboard statistics (for dashboard widgets)
 * @access  User
 */
router.get("/dashboard-stats", verifyUser, getUserDashboardStats);

/**
 * @route   GET /api/enrollments/:enrollmentId
 * @desc    Get specific enrollment details
 * @access  User
 */
router.get("/:enrollmentId", verifyUser, getEnrollment);

/**
 * @route   GET /api/enrollments/:enrollmentId/progress
 * @desc    Get detailed progress for an enrollment
 * @access  User
 */
router.get("/:enrollmentId/progress", verifyUser, getDetailedProgress);

/**
 * @route   PUT /api/enrollments/:enrollmentId/progress
 * @desc    Update enrollment progress
 * @access  User
 */
router.put("/:enrollmentId/progress", verifyUser, updateEnrollmentProgress);

/**
 * @route   POST /api/enrollments/:enrollmentId/recalculate-progress
 * @desc    Recalculate enrollment progress (useful for fixing existing enrollments)
 * @access  User
 */
router.post(
  "/:enrollmentId/recalculate-progress",
  verifyUser,
  recalculateEnrollmentProgress
);

/**
 * @route   PUT /api/enrollments/:enrollmentId/status
 * @desc    Update enrollment status
 * @access  User
 */
router.put("/:enrollmentId/status", verifyUser, updateEnrollmentStatus);

/**
 * @route   PUT /api/enrollments/:enrollmentId/pause
 * @desc    Pause an enrollment
 * @access  User
 */
router.put("/:enrollmentId/pause", verifyUser, pauseEnrollment);

/**
 * @route   PUT /api/enrollments/:enrollmentId/resume
 * @desc    Resume a paused enrollment
 * @access  User
 */
router.put("/:enrollmentId/resume", verifyUser, resumeEnrollment);

/**
 * @route   POST /api/enrollments/:enrollmentId/certificate
 * @desc    Issue certificate for completed enrollment
 * @access  User
 */
router.post("/:enrollmentId/certificate", verifyUser, issueCertificate);

/**
 * @route   GET /api/enrollments/stats/user/:userId
 * @desc    Get user enrollment statistics
 * @access  User
 */
router.get("/stats/user/:userId", verifyUser, getEnrollmentStats);

/**
 * @route   GET /api/enrollments/stats/course/:courseId
 * @desc    Get course enrollment statistics
 * @access  User
 */
router.get("/stats/course/:courseId", verifyUser, getCourseEnrollmentStats);

/**
 * @route   GET /api/enrollments/analytics/:userId
 * @desc    Get detailed enrollment analytics for user
 * @access  User
 */
router.get("/analytics/:userId", verifyUser, getEnrollmentAnalytics);

/**
 * @route   GET /api/enrollments/history/:userId
 * @desc    Get enrollment history for user
 * @access  User
 */
router.get("/history/:userId", verifyUser, getEnrollmentHistory);

/**
 * @route   DELETE /api/enrollments/:enrollmentId
 * @desc    Delete an enrollment (soft delete - mark as dropped)
 * @access  User
 */
router.delete("/:enrollmentId", verifyUser, deleteEnrollment);

export default router;
