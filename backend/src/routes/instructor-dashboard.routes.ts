import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyInstructor } from "../middlewares/instructor.middleware";
import {
  getInstructorDashboard,
  getInstructorAllQnas,
  getInstructorCourseQnas,
  getInstructorReviews,
} from "../controllers/instructorDashboard.controller";

const router = Router();

router.use(verifyUser);
router.use(verifyInstructor);

/**
 * @route   GET /api/instructor/dashboard
 * @desc    Summary stats and courses for the logged-in instructor
 * @access  Instructor
 */
router.get("/dashboard", getInstructorDashboard);

/**
 * @route   GET /api/instructor/qnas
 * @desc    Paginated Q&A across all courses the instructor teaches
 * @access  Instructor
 */
router.get("/qnas", getInstructorAllQnas);

/**
 * @route   GET /api/instructor/courses/:courseId/qnas
 * @desc    Learner questions for a course (instructor must be assigned to the course)
 * @access  Instructor
 */
router.get("/courses/:courseId/qnas", getInstructorCourseQnas);

/**
 * @route   GET /api/instructor/reviews
 * @desc    Approved course reviews for courses this instructor teaches
 * @access  Instructor
 */
router.get("/reviews", getInstructorReviews);

export default router;
