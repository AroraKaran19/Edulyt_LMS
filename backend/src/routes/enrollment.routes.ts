import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin } from "../middlewares/admin.middleware";
import { verifyEnrollmentOwnership } from "../middlewares/enrollment.middleware";
import {
  createEnrollment,
  getEnrollment,
  getUserEnrollments,
  getEnrollmentsByUserIds,
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
 * @desc    Create a new enrollment (gift, trial, manual - admin/super-admin only)
 * @access  Admin, Super-admin
 */
router.post("/", verifyUser, verifyAdmin, createEnrollment);

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
 * @route   POST /api/enrollments/batch-by-users
 * @desc    Get course IDs per user for multiple users (admin only)
 * @access  Admin, Super-admin
 */
router.post("/batch-by-users", verifyUser, verifyAdmin, getEnrollmentsByUserIds);

/**
 * @route   GET /api/enrollments/:enrollmentId
 * @desc    Get specific enrollment details
 * @access  Owner or Admin
 */
router.get("/:enrollmentId", verifyUser, verifyEnrollmentOwnership, getEnrollment);

/**
 * @route   GET /api/enrollments/:enrollmentId/progress
 * @desc    Get detailed progress for an enrollment
 * @access  Owner or Admin
 */
router.get("/:enrollmentId/progress", verifyUser, verifyEnrollmentOwnership, getDetailedProgress);

/**
 * @route   PUT /api/enrollments/:enrollmentId/progress
 * @desc    Update enrollment progress
 * @access  Owner or Admin
 */
router.put("/:enrollmentId/progress", verifyUser, verifyEnrollmentOwnership, updateEnrollmentProgress);

/**
 * @route   POST /api/enrollments/:enrollmentId/recalculate-progress
 * @desc    Recalculate enrollment progress (useful for fixing existing enrollments)
 * @access  Owner or Admin
 */
router.post(
  "/:enrollmentId/recalculate-progress",
  verifyUser,
  verifyEnrollmentOwnership,
  recalculateEnrollmentProgress
);

/**
 * @route   PUT /api/enrollments/:enrollmentId/status
 * @desc    Update enrollment status
 * @access  Owner or Admin
 */
router.put("/:enrollmentId/status", verifyUser, verifyEnrollmentOwnership, updateEnrollmentStatus);

/**
 * @route   PUT /api/enrollments/:enrollmentId/pause
 * @desc    Pause an enrollment
 * @access  Owner or Admin
 */
router.put("/:enrollmentId/pause", verifyUser, verifyEnrollmentOwnership, pauseEnrollment);

/**
 * @route   PUT /api/enrollments/:enrollmentId/resume
 * @desc    Resume a paused enrollment
 * @access  Owner or Admin
 */
router.put("/:enrollmentId/resume", verifyUser, verifyEnrollmentOwnership, resumeEnrollment);

/**
 * @route   POST /api/enrollments/:enrollmentId/certificate
 * @desc    Issue certificate for completed enrollment
 * @access  Owner or Admin
 */
router.post("/:enrollmentId/certificate", verifyUser, verifyEnrollmentOwnership, issueCertificate);

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
 * @access  Owner or Admin
 */
router.delete("/:enrollmentId", verifyUser, verifyEnrollmentOwnership, deleteEnrollment);

export default router;
