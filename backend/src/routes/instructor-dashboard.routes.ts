import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyInstructor } from "../middlewares/instructor.middleware";
import {
  getInstructorDashboard,
  getInstructorAllQnas,
  getInstructorCourseQnas,
  getInstructorReviews,
} from "../controllers/instructorDashboard.controller";
import {
  getPublicInstructorBySlug,
  getPublicInstructorCoursesBySlug,
  getPublicInstructorInternshipsBySlug,
} from "../controllers/instructor.controller";

const router = Router();

const requireInstructor = [verifyUser, verifyInstructor];

/**
 * @route   GET /api/instructor/dashboard
 * @desc    Summary stats and courses for the logged-in instructor
 * @access  Instructor
 */
router.get("/dashboard", ...requireInstructor, getInstructorDashboard);

/**
 * @route   GET /api/instructor/qnas
 * @desc    Paginated Q&A across all courses the instructor teaches
 * @access  Instructor
 */
router.get("/qnas", ...requireInstructor, getInstructorAllQnas);

/**
 * @route   GET /api/instructor/courses/:courseId/qnas
 * @desc    Learner questions for a course (instructor must be assigned to the course)
 * @access  Instructor
 */
router.get(
  "/courses/:courseId/qnas",
  ...requireInstructor,
  getInstructorCourseQnas,
);

/**
 * @route   GET /api/instructor/reviews
 * @desc    Approved course reviews for courses this instructor teaches
 * @access  Instructor
 */
router.get("/reviews", ...requireInstructor, getInstructorReviews);

/**
 * @route   GET /api/instructor/:slug/courses
 * @desc    Paginated courses for a public instructor profile
 * @access  Public
 */
router.get("/:slug/courses", getPublicInstructorCoursesBySlug);

/**
 * @route   GET /api/instructor/:slug/internships
 * @desc    Active internships this instructor mentors (public profile)
 * @access  Public
 */
router.get("/:slug/internships", getPublicInstructorInternshipsBySlug);

/**
 * @route   GET /api/instructor/:slug
 * @desc    Public instructor profile by slug
 * @access  Public
 */
router.get("/:slug", getPublicInstructorBySlug);

export default router;
