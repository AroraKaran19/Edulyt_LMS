import express from "express";
import EnrollmentController from "../controllers/enrollment.controller";
import { verifyUser } from "../middlewares/auth.middleware";
import {
  validateCourseForEnrollment,
  checkExistingEnrollment,
  validateProgressUpdate,
  validateStatusUpdate,
  validateEnrollmentSource,
} from "../middlewares/enrollment.middleware";

const router = express.Router();

/**
 * @route   POST /api/enrollment
 * @desc    Create a new enrollment
 * @access  Private (user)
 * @body    { courseId, enrollmentSource?, giftFrom?, promotionCode? }
 * @return  Enrollment object
 */
router.post(
  "/",
  verifyUser,
  validateCourseForEnrollment,
  checkExistingEnrollment,
  validateEnrollmentSource,
  EnrollmentController.createEnrollment
);

/**
 * @route   GET /api/enrollment/user
 * @desc    Get user's enrollments
 * @access  Private (user)
 * @query   status? (active, completed, dropped, paused)
 * @return  Array of enrollments
 */
router.get("/user", verifyUser, EnrollmentController.getUserEnrollments);

/**
 * @route   GET /api/enrollment/course/:courseId
 * @desc    Get course enrollments (admin/instructor only)
 * @access  Private (admin/instructor)
 * @params  courseId - Course ID
 * @query   status? (active, completed, dropped, paused)
 * @return  Array of enrollments
 */
router.get("/course/:courseId", verifyUser, EnrollmentController.getCourseEnrollments);

/**
 * @route   GET /api/enrollment/:courseId
 * @desc    Get specific enrollment for a course
 * @access  Private (user)
 * @params  courseId - Course ID
 * @return  Enrollment object
 */
router.get("/:courseId", verifyUser, EnrollmentController.getEnrollment);

/**
 * @route   GET /api/enrollment/:courseId/check
 * @desc    Check if user is enrolled in a course
 * @access  Private (user)
 * @params  courseId - Course ID
 * @return  { isEnrolled: boolean, enrollment: object | null, status: string | null }
 */
router.get("/:courseId/check", verifyUser, EnrollmentController.checkEnrollment);

/**
 * @route   PUT /api/enrollment/:courseId/modules/:moduleId/lessons/:lessonId/progress
 * @desc    Update enrollment progress for a specific lesson
 * @access  Private (user)
 * @params  courseId, moduleId, lessonId
 * @body    { completed: boolean, score?: number, timeSpent?: number }
 * @return  Updated enrollment object
 */
router.put(
  "/:courseId/modules/:moduleId/lessons/:lessonId/progress",
  verifyUser,
  validateProgressUpdate,
  EnrollmentController.updateEnrollmentProgress
);

/**
 * @route   PUT /api/enrollment/:courseId/complete
 * @desc    Mark enrollment as completed
 * @access  Private (user)
 * @params  courseId - Course ID
 * @return  Updated enrollment object
 */
router.put("/:courseId/complete", verifyUser, EnrollmentController.completeEnrollment);

/**
 * @route   PUT /api/enrollment/:courseId/status
 * @desc    Update enrollment status
 * @access  Private (user)
 * @params  courseId - Course ID
 * @body    { status: "active" | "completed" | "dropped" | "paused" }
 * @return  Updated enrollment object
 */
router.put(
  "/:courseId/status",
  verifyUser,
  validateStatusUpdate,
  EnrollmentController.updateEnrollmentStatus
);

/**
 * @route   GET /api/enrollment/stats/course/:courseId
 * @desc    Get course enrollment statistics
 * @access  Private (admin/instructor)
 * @params  courseId - Course ID
 * @return  Course enrollment statistics
 */
router.get("/stats/course/:courseId", verifyUser, EnrollmentController.getCourseEnrollmentStats);

/**
 * @route   GET /api/enrollment/stats/user
 * @desc    Get user enrollment statistics
 * @access  Private (user)
 * @return  User enrollment statistics
 */
router.get("/stats/user", verifyUser, EnrollmentController.getUserEnrollmentStats);

/**
 * @route   GET /api/enrollment/stats/overall
 * @desc    Get overall enrollment statistics (admin only)
 * @access  Private (admin)
 * @return  Overall enrollment statistics
 */
router.get("/stats/overall", verifyUser, EnrollmentController.getOverallEnrollmentStats);

/**
 * @route   DELETE /api/enrollment/:courseId
 * @desc    Delete enrollment
 * @access  Private (user)
 * @params  courseId - Course ID
 * @return  Deleted enrollment object
 */
router.delete("/:courseId", verifyUser, EnrollmentController.deleteEnrollment);

export default router;
