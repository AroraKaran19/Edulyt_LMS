import {
  getAllCourses,
  getCourseUsingSlug,
  getFeaturedCourses,
  getCoursesUsingAudience,
  getCoursesUsingCategory,
  updateCourseMetadata,
  createCourseMetadata,
  updateCourseStatus,
  getCoursesForAdmin,
  getCourseByIdAdmin,
  addSingleCourseModule,
  updateSingleCourseModule,
  deleteSingleCourseModule,
  addSingleCourseLesson,
  updateSingleCourseLesson,
  deleteSingleCourseLesson,
  addSingleCourseContent,
  updateSingleCourseContent,
  deleteSingleCourseContent,
  updateCourseModuleReferences,
  finalizeCourseCreation,
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

/**
 * @route   POST /api/courses/chunked/metadata
 * @desc    Create course metadata only (for chunked course creation)
 * @access  Admin/Instructor
 * @body
 *   - title: Course title (required)
 *   - description: Course description (required)
 *   - shortDescription: Short description (required)
 *   - category: Course category (required)
 *   - audience: Target audience ("college-students" or "professionals") (required)
 *   - thumbnail: Course thumbnail URL (required)
 *   - And other metadata fields...
 * @example
 *   POST /api/courses/chunked/metadata
 *   Body: {
 *     "title": "Complete React Course",
 *     "description": "Learn React from scratch...",
 *     "shortDescription": "Master React development",
 *     "category": "programming",
 *     "audience": "professionals",
 *     "thumbnail": "https://example.com/thumb.jpg"
 *   }
 */
router.post("/chunked/metadata", createCourseMetadata);


/**
 * @route   POST /api/courses/:courseId/modules
 * @desc    Add a single module to a course (real-time)
 * @access  Admin/Instructor
 * @params
 *   - courseId: The ID of the course
 * @body
 *   - Module object with title, description, thumbnailUrl, lessons, etc.
 * @example
 *   POST /api/courses/64a1b2c3d4e5f6789012345/modules
 */
router.post("/:courseId/modules", addSingleCourseModule);

/**
 * @route   PUT /api/courses/:courseId/modules/references
 * @desc    Update course module references (moduleIds array)
 * @access  Admin/Instructor
 * @params
 *   - courseId: The ID of the course
 * @body
 *   - moduleIds: Array of module IDs to reference
 * @example
 *   PUT /api/courses/64a1b2c3d4e5f6789012345/modules/references
 *   Body: {
 *     "moduleIds": ["64a1b2c3d4e5f6789012346", "64a1b2c3d4e5f6789012347"]
 *   }
 */
router.put("/:courseId/modules/references", updateCourseModuleReferences);

/**
 * @route   PUT /api/courses/:courseId/modules/:moduleId
 * @desc    Update a single module in a course (real-time)
 * @access  Admin/Instructor
 * @params
 *   - courseId: The ID of the course
 *   - moduleId: The ID of the module to update
 * @body
 *   - Updated module object
 * @example
 *   PUT /api/courses/64a1b2c3d4e5f6789012345/modules/64a1b2c3d4e5f6789012346
 */
router.put("/:courseId/modules/:moduleId", updateSingleCourseModule);

/**
 * @route   DELETE /api/courses/:courseId/modules/:moduleId
 * @desc    Delete a single module from a course (real-time)
 * @access  Admin/Instructor
 * @params
 *   - courseId: The ID of the course
 *   - moduleId: The ID of the module to delete
 * @example
 *   DELETE /api/courses/64a1b2c3d4e5f6789012345/modules/64a1b2c3d4e5f6789012346
 */
router.delete("/:courseId/modules/:moduleId", deleteSingleCourseModule);

// ===================
// LESSON ROUTES
// ===================

/**
 * @route   POST /api/courses/:courseId/modules/:moduleId/lessons
 * @desc    Add a single lesson to a module (real-time)
 * @access  Admin/Instructor
 * @params
 *   - courseId: The ID of the course
 *   - moduleId: The ID of the module
 * @body
 *   - Lesson object with title, description, etc.
 * @example
 *   POST /api/courses/64a1b2c3d4e5f6789012345/modules/64a1b2c3d4e5f6789012346/lessons
 */
router.post("/:courseId/modules/:moduleId/lessons", addSingleCourseLesson);

/**
 * @route   PUT /api/courses/:courseId/modules/:moduleId/lessons/:lessonId
 * @desc    Update a single lesson in a module (real-time)
 * @access  Admin/Instructor
 * @params
 *   - courseId: The ID of the course
 *   - moduleId: The ID of the module
 *   - lessonId: The ID of the lesson to update
 * @body
 *   - Updated lesson object
 * @example
 *   PUT /api/courses/64a1b2c3d4e5f6789012345/modules/64a1b2c3d4e5f6789012346/lessons/64a1b2c3d4e5f6789012347
 */
router.put("/:courseId/modules/:moduleId/lessons/:lessonId", updateSingleCourseLesson);

/**
 * @route   DELETE /api/courses/:courseId/modules/:moduleId/lessons/:lessonId
 * @desc    Delete a single lesson from a module (real-time)
 * @access  Admin/Instructor
 * @params
 *   - courseId: The ID of the course
 *   - moduleId: The ID of the module
 *   - lessonId: The ID of the lesson to delete
 * @example
 *   DELETE /api/courses/64a1b2c3d4e5f6789012345/modules/64a1b2c3d4e5f6789012346/lessons/64a1b2c3d4e5f6789012347
 */
router.delete("/:courseId/modules/:moduleId/lessons/:lessonId", deleteSingleCourseLesson);

// ===================
// CONTENT ROUTES
// ===================

/**
 * @route   POST /api/courses/:courseId/modules/:moduleId/lessons/:lessonId/contents
 * @desc    Add a single content to a lesson (real-time)
 * @access  Admin/Instructor
 * @params
 *   - courseId: The ID of the course
 *   - moduleId: The ID of the module
 *   - lessonId: The ID of the lesson
 * @body
 *   - Content object with type, title, description, etc.
 * @example
 *   POST /api/courses/64a1b2c3d4e5f6789012345/modules/64a1b2c3d4e5f6789012346/lessons/64a1b2c3d4e5f6789012347/contents
 */
router.post("/:courseId/modules/:moduleId/lessons/:lessonId/contents", addSingleCourseContent);

/**
 * @route   PUT /api/courses/:courseId/modules/:moduleId/lessons/:lessonId/contents/:contentId
 * @desc    Update a single content in a lesson (real-time)
 * @access  Admin/Instructor
 * @params
 *   - courseId: The ID of the course
 *   - moduleId: The ID of the module
 *   - lessonId: The ID of the lesson
 *   - contentId: The ID of the content to update
 * @body
 *   - Updated content object
 * @example
 *   PUT /api/courses/64a1b2c3d4e5f6789012345/modules/64a1b2c3d4e5f6789012346/lessons/64a1b2c3d4e5f6789012347/contents/64a1b2c3d4e5f6789012348
 */
router.put("/:courseId/modules/:moduleId/lessons/:lessonId/contents/:contentId", updateSingleCourseContent);

/**
 * @route   DELETE /api/courses/:courseId/modules/:moduleId/lessons/:lessonId/contents/:contentId
 * @desc    Delete a single content from a lesson (real-time)
 * @access  Admin/Instructor
 * @params
 *   - courseId: The ID of the course
 *   - moduleId: The ID of the module
 *   - lessonId: The ID of the lesson
 *   - contentId: The ID of the content to delete
 * @example
 *   DELETE /api/courses/64a1b2c3d4e5f6789012345/modules/64a1b2c3d4e5f6789012346/lessons/64a1b2c3d4e5f6789012347/contents/64a1b2c3d4e5f6789012348
 */
router.delete("/:courseId/modules/:moduleId/lessons/:lessonId/contents/:contentId", deleteSingleCourseContent);

/**
 * @route   POST /api/courses/:courseId/finalize
 * @desc    Finalize course creation (mark as complete and ready)
 * @access  Admin/Instructor
 * @params
 *   - courseId: The ID of the course to finalize
 * @example
 *   POST /api/courses/64a1b2c3d4e5f6789012345/finalize
 */
router.post("/:courseId/finalize", finalizeCourseCreation);

/**
 * @route   PUT /api/courses/status/:courseId
 * @desc    Update course status
 * @access  Admin/Instructor
 * @params
 *   - courseId: The ID of the course to update
 * @body
 *   - isActive: The status of the course
 * @example
 *   PUT /api/courses/status/:courseId
 */
router.put("/status/:courseId", updateCourseStatus);

/**
 * @route   GET /api/courses/admin
 * @desc    Get all courses for admin
 * @access  Admin
 * @example
 *   GET /api/courses/admin
 */
router.get("/admin", getCoursesForAdmin);

/**
 * @route   GET /api/courses/admin/id/:courseId
 * @desc    Get a specific course by ID for admin (includes inactive courses)
 * @access  Admin
 * @params
 *   - courseId: The ID of the course to retrieve
 * @example
 *   GET /api/courses/admin/id/64a1b2c3d4e5f6789012345
 */
router.get("/admin/id/:courseId", getCourseByIdAdmin);

/**
 * @route   POST /api/courses/admin/duplicate/:courseId
 * @desc    Duplicate a course
 * @access  Admin
 * @params
 *   - courseId: The ID of the course to duplicate
 * @example
 *   POST /api/courses/admin/duplicate/:courseId
 */
// router.post("/admin/duplicate/:courseId", duplicateCourse);



export default router;