import {
  getAllCourses,
  getCourseUsingSlug,
  getFeaturedCourses,
  getCoursesUsingAudience,
  getCoursesUsingCategory,
  updateCourseMetadata,
  createCourseMetadata,
  addCourseModules,
  addCourseLessons,
  finalizeCourseCreation,
  updateCourse,
  updateCourseStatus,
  updateCourseStatusBulk,
  getCourseByIdAdmin,
} from "../controllers/course.controller";
// import { verifyAdmin } from "../middlewares/admin.middleware";
import { Router } from "express";

const router = Router();

/**
 * @route   GET /api/courses
 * @desc    Get all courses with pagination, filtering, and optimized data loading
 * @access  Public
 * @params
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 *   - filter: Filter by categories (can be used multiple times: "?filter=web&filter=app&filter=ml")
 *   - category: Filter by categories (comma-separated: "programming,design,business") - alternative to filter
 *   - audience: Filter by target audience ("college-students" or "professionals")
 *   - search: Search in title, description, or short description (optional)
 * @example
 *   GET /api/courses?page=1&limit=10&filter=programming&filter=design&search=javascript
 *   GET /api/courses?page=1&limit=10&category=programming,design&search=javascript
 *   GET /api/courses?page=1&limit=10&audience=college-students&category=programming
 *   GET /api/courses?search=&category=1,2,3&fields=_id,title,thumbnail,enrolledCount
 */
router.get("/", getAllCourses);

/**
 * @route   GET /api/courses/:slug
 * @desc    Get a course using slug
 * @access  Public
 * @params
 *   - slug: Unique identifier for the course
 * @example
 *   GET /api/courses/12345
 */
router.get("/:slug", getCourseUsingSlug);

/**
 * @route   GET /api/courses/featured
 * @desc    Get featured courses
 * @access  Public
 * @example
 *   GET /api/courses/featured
 */
router.get("/featured", getFeaturedCourses);

/**
 * @route   GET /api/courses/audience
 * @desc    Get courses using audience
 * @access  Public
 * @params
 *   - audience: Target audience ("college-students" or "professionals")
 * @example
 *   GET /api/courses/audience?audience=college-students
 */
router.get("/audience", getCoursesUsingAudience);

/**
 * @route   GET /api/courses/category
 * @desc    Get courses using category
 * @access  Public
 * @params
 *   - category: Category name
 * @example
 *   GET /api/courses/category?category=programming
 */
router.get("/category", getCoursesUsingCategory);

/**
 * @route   PUT /api/courses/:courseId/metadata
 * @desc    Update course metadata (basic information)
 * @access  Admin/Instructor
 * @params
 *   - courseId: The ID of the course to update
 * @body
 *   - title: Course title (optional)
 *   - description: Course description (optional)
 *   - shortDescription: Short description (optional)
 *   - category: Course category (optional)
 *   - audience: Target audience ("college-students" or "professionals") (optional)
 *   - skillLevel: Skill level required (optional)
 *   - language: Course language (optional)
 *   - skills: Array of skills covered (optional)
 *   - tags: Array of tags (optional)
 *   - isActive: Whether course is active (optional)
 *   - isFeatured: Whether course is featured (optional)
 *   - isCertified: Whether course provides certification (optional)
 *   - And other metadata fields...
 * @example
 *   PUT /api/courses/64a1b2c3d4e5f6789012345/metadata
 *   Body: {
 *     "title": "Updated Course Title",
 *     "description": "Updated description",
 *     "category": "programming",
 *     "audience": "professionals"
 *   }
 */
router.put("/:courseId/metadata", updateCourseMetadata);

// ===================
// Chunked Course Creation Routes
// ===================

/**
 * @route   POST /api/courses/chunked/metadata
 * @desc    Create course metadata (step 1 of chunked course creation)
 * @access  Admin/Instructor
 * @body    Course metadata object (without modules)
 * @example
 *   POST /api/courses/chunked/metadata
 *   Body: {
 *     "title": "New Course",
 *     "description": "Course description",
 *     "category": "programming",
 *     "audience": "professionals"
 *   }
 */
router.post("/chunked/metadata", createCourseMetadata);

/**
 * @route   POST /api/courses/chunked/:courseId/modules
 * @desc    Add modules to existing course (step 2 of chunked course creation)
 * @access  Admin/Instructor
 * @params
 *   - courseId: The ID of the course to add modules to
 * @body    Array of module objects
 * @example
 *   POST /api/courses/chunked/64a1b2c3d4e5f6789012345/modules
 *   Body: [
 *     {
 *       "title": "Module 1",
 *       "description": "Module description",
 *       "lessons": [...]
 *     }
 *   ]
 */
router.post("/chunked/:courseId/modules", addCourseModules);

/**
 * @route   POST /api/courses/chunked/:courseId/lessons
 * @desc    Add lessons to existing module (step 3 of chunked course creation)
 * @access  Admin/Instructor
 * @params
 *   - courseId: The ID of the course
 * @body
 *   - moduleId: The ID of the module to add lessons to
 *   - lessons: Array of lesson objects
 * @example
 *   POST /api/courses/chunked/64a1b2c3d4e5f6789012345/lessons
 *   Body: {
 *     "moduleId": "64a1b2c3d4e5f6789012346",
 *     "lessons": [...]
 *   }
 */
router.post("/chunked/:courseId/lessons", addCourseLessons);

/**
 * @route   POST /api/courses/chunked/:courseId/finalize
 * @desc    Finalize course creation (step 4 of chunked course creation)
 * @access  Admin/Instructor
 * @params
 *   - courseId: The ID of the course to finalize
 * @example
 *   POST /api/courses/chunked/64a1b2c3d4e5f6789012345/finalize
 */
router.post("/chunked/:courseId/finalize", finalizeCourseCreation);

// ===================
// Course Update & Admin Routes
// ===================

/**
 * @route   PUT /api/courses/:courseId
 * @desc    Update entire course (what frontend expects)
 * @access  Admin/Instructor
 * @params
 *   - courseId: The ID of the course to update
 * @body    Complete course data object
 * @example
 *   PUT /api/courses/64a1b2c3d4e5f6789012345
 *   Body: { course data }
 */
router.put("/:courseId", updateCourse);

/**
 * @route   PUT /api/courses/status/:courseId
 * @desc    Update course status (active/inactive)
 * @access  Admin/Instructor
 * @params
 *   - courseId: The ID of the course to update
 * @body
 *   - isActive: Boolean status to set
 * @example
 *   PUT /api/courses/status/64a1b2c3d4e5f6789012345
 *   Body: { "isActive": true }
 */
router.put("/status/:courseId", updateCourseStatus);

/**
 * @route   PUT /api/courses/status/bulk
 * @desc    Bulk update course status (active/inactive)
 * @access  Admin/Instructor
 * @body
 *   - courseIds: Array of course IDs
 *   - isActive: Boolean status to set
 * @example
 *   PUT /api/courses/status/bulk
 *   Body: {
 *     "courseIds": ["64a1b2c3d4e5f6789012345", "64a1b2c3d4e5f6789012346"],
 *     "isActive": true
 *   }
 */
router.put("/status/bulk", updateCourseStatusBulk);

/**
 * @route   GET /api/courses/admin/id/:courseId
 * @desc    Get course by ID for admin (includes inactive courses)
 * @access  Admin
 * @params
 *   - courseId: The ID of the course to retrieve
 * @example
 *   GET /api/courses/admin/id/64a1b2c3d4e5f6789012345
 */
router.get("/admin/id/:courseId", getCourseByIdAdmin);

export default router;