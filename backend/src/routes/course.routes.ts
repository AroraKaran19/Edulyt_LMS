import { CourseController } from "../controllers/course.controller";
// import { verifyAdmin } from "../middlewares/admin.middleware";
import { Router } from "express";

const router = Router();
const courseController = new CourseController();

/**
 * @route   GET /api/courses
 * @desc    Get all courses with pagination and filtering
 * @access  Public
 * @params
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 *   - category: Filter by categories (comma-separated: "programming,design,business")
 *   - search: Search in title, description, or short description (optional)
 * @example
 *   GET /api/courses?page=1&limit=10&category=programming,design&search=javascript
 *   GET /api/courses?search=&category=1,2,3
 */
router.get("/", courseController.getAllCourses);

/**
 * @route   GET /api/courses/featured
 * @desc    Get all featured courses
 * @access  Public
 */
router.get("/featured", courseController.getFeaturedCourses);

/**
 * @route   GET /api/courses/id/:courseId
 * @desc    Get a course by ID
 * @access  Public
 * @params
 *   - courseId: Course ID (URL parameter)
 * @example
 *   GET /api/courses/id/507f1f77bcf86cd799439011
 *   GET /api/courses/id/64f8a1b2c3d4e5f6a7b8c9d0
 */
router.get("/id/:courseId", courseController.getCourseById);

/**
 * @route   PUT /api/courses/:courseId
 * @desc    Update a course by ID
 * @access  Private (Admin only)
 * @params
 *   - courseId: Course ID (URL parameter)
 */
router.put("/:courseId", courseController.updateCourseById);

/**
 * @route   DELETE /api/courses/id/:courseId
 * @desc    Delete a course by ID
 * @access  Private (Admin only)
 * @params
 *   - courseId: Course ID (URL parameter)
 */
// router.delete("/id/:courseId", courseController.deleteCourseById);

/**
 * @route   GET /api/courses/admin/id/:courseId
 * @desc    Get a course by ID (Admin version - includes inactive courses)
 * @access  Private (Admin only)
 * @params
 *   - courseId: Course ID (URL parameter)
 * @example
 *   GET /api/courses/admin/id/507f1f77bcf86cd799439011
 *   GET /api/courses/admin/id/64f8a1b2c3d4e5f6a7b8c9d0
 */
// router.get("/admin/id/:courseId", verifyAdmin, courseController.getCourseByIdAdmin);
router.get("/admin/id/:courseId", courseController.getCourseByIdAdmin);

/**
 * @route   GET /api/courses/:slug
 * @desc    Get a course by slug
 * @access  Public
 * @params
 *   - slug: Course slug (URL parameter)
 * @example
 *   GET /api/courses/javascript-fundamentals
 *   GET /api/courses/react-advanced-concepts
 */
router.get("/:slug", courseController.getCourseBySlug);

/**
 * @route   POST /api/courses
 * @desc    Create a new course
 * @access  Private (should be protected with admin middleware)
 * @body @type {Course}
 */
// router.post("/", verifyAdmin, courseController.createCourse);
router.post("/", courseController.createCourse)

export default router;