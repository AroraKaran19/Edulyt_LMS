import {
  adminGuard,
  requireAnyPermission,
  verifyAdmin,
} from "../middlewares/admin.middleware";
import { verifyUser } from "../middlewares/user.middleware";
import { Router } from "express";
import {
  createCourseLesson,
  createCourseLessonContent,
  createCourseMetadata,
  createCourseModule,
  deleteCourse,
  deleteCourseLesson,
  deleteCourseLessonContent,
  deleteCourseModule,
  duplicateCourse,
  duplicateCourseMetadata,
  duplicateCourseWithModules,
  getAdminCourseById,
  getAdminCourseBySlug,
  getAdminCourses,
  getAdminCourseOptions,
  getAllCourses,
  getCourseById,
  getCourseBySlug,
  getCoursesByAudience,
  getCoursesByCategory,
  getFeaturedCourses,
  updateCourseLesson,
  updateCourseLessonContent,
  updateCourseMetadata,
  updateCourseModule,
  updateCourseStatus,
  toggleCourseContentStatus,
  checkSlugAvailability,
  reorderModules,
  reorderLessons,
  reorderContent,
} from "../controllers/course.controller";

const router = Router();

/**
 * @route   GET /api/courses
 * @desc    Get all courses
 * @access  Public
 */
router.get("/", getAllCourses);

/**
 * @route   GET /api/courses/featured
 * @desc    Get featured courses
 * @access  Public
 */
router.get("/featured", getFeaturedCourses);

/**
 * @route   GET /api/courses/audience
 * @desc    Get courses by audience
 * @access  Public
 */
router.get("/audience", getCoursesByAudience);

/**
 * @route   GET /api/courses/category
 * @desc    Get courses by category
 * @access  Public
 */
router.get("/category", getCoursesByCategory);

/**
 * @route   GET /api/courses/id/:courseId
 * @desc    Get a course by id
 * @access  Public
 */
router.get("/id/:courseId", getCourseById);

/**
 * @route   GET /api/courses/slug/:slug
 * @desc    Get a course by slug
 * @access  Public
 */
router.get("/slug/:slug", getCourseBySlug);

/**
 * @route   GET /api/courses/check-slug/:slug
 * @desc    Check if a slug is available for use
 * @access  Public
 */
router.get("/check-slug/:slug", checkSlugAvailability);

/**
 * @route   GET /api/courses/admin
 * @desc    Get all courses for admin
 * @access  Admin
 */
router.get("/admin", ...adminGuard("courses.manage"),getAdminCourses);

/**
 * @route   GET /api/courses/admin/options
 * @desc    Lightweight admin course list (id + title only)
 * @access  Admin holding any page that needs a course picker
 *
 * Read-only lookup shared across course pages, so holding either page is
 * enough — the live-classes page needs it to pick a course, and its admins
 * don't necessarily hold `courses.manage`.
 */
router.get(
  "/admin/options",
  verifyUser,
  verifyAdmin,
  requireAnyPermission("courses.manage", "courses.live-classes"),
  getAdminCourseOptions,
);

/**
 * @route   GET /api/courses/admin/id/:courseId
 * @desc    Get a course by id for admin
 * @access  Admin
 */
router.get("/admin/id/:courseId", ...adminGuard("courses.manage"),getAdminCourseById);

/**
 * @route   GET /api/courses/admin/slug/:slug
 * @desc    Get a course by slug for admin
 * @access  Admin
 */
router.get("/admin/slug/:slug", ...adminGuard("courses.manage"),getAdminCourseBySlug);

/**
 * @route   POST /api/courses
 * @desc    Create a course metadata
 * @access  Admin
 */
router.post("/metadata", ...adminGuard("courses.manage"),createCourseMetadata);

// COURSE MODULE MANAGEMENT ROUTES

/**
 * @route   POST /api/courses/modules
 * @desc    Create a course module
 * @access  Admin
 */
router.post("/:courseId/modules", ...adminGuard("courses.manage"),createCourseModule);

/**
 * @route   PUT /api/courses/modules/:moduleId
 * @desc    Update a course module
 * @access  Admin
 */
router.put(
  "/:courseId/modules/:moduleId",
  ...adminGuard("courses.manage"),
  updateCourseModule
);

/**
 * @route   DELETE /api/courses/modules/:moduleId
 * @desc    Delete a course module
 * @access  Admin
 */
router.delete(
  "/:courseId/modules/:moduleId",
  ...adminGuard("courses.manage"),
  deleteCourseModule
);

// COURSE LESSON MANAGEMENT ROUTES

/**
 * @route   POST /api/courses/modules/:moduleId/lessons
 * @desc    Create a course module lesson
 * @access  Admin
 */
router.post(
  "/:courseId/modules/:moduleId/lessons",
  ...adminGuard("courses.manage"),
  createCourseLesson
);

/**
 * @route   PUT /api/courses/modules/:moduleId/lessons/:lessonId
 * @desc    Update a course module lesson
 * @access  Admin
 */
router.put(
  "/:courseId/modules/:moduleId/lessons/:lessonId",
  ...adminGuard("courses.manage"),
  updateCourseLesson
);

/**
 * @route   DELETE /api/courses/modules/:moduleId/lessons/:lessonId
 * @desc    Delete a course module lesson
 * @access  Admin
 */
router.delete(
  "/:courseId/modules/:moduleId/lessons/:lessonId",
  ...adminGuard("courses.manage"),
  deleteCourseLesson
);

// COURSE CONTENT MANAGEMENT ROUTES

/**
 * @route   POST /api/courses/modules/:moduleId/lessons/:lessonId/contents
 * @desc    Create a course module lesson content
 * @access  Admin
 */
router.post(
  "/:courseId/modules/:moduleId/lessons/:lessonId/contents",
  ...adminGuard("courses.manage"),
  createCourseLessonContent
);

/**
 * @route   PUT /api/courses/modules/:moduleId/lessons/:lessonId/contents/:contentId
 * @desc    Update a course module lesson content
 * @access  Admin
 */
router.put(
  "/:courseId/modules/:moduleId/lessons/:lessonId/contents/:contentId",
  ...adminGuard("courses.manage"),
  updateCourseLessonContent
);

/**
 * @route   DELETE /api/courses/modules/:moduleId/lessons/:lessonId/contents/:contentId
 * @desc    Delete a course module lesson content
 * @access  Admin
 */
router.delete(
  "/:courseId/modules/:moduleId/lessons/:lessonId/contents/:contentId",
  ...adminGuard("courses.manage"),
  deleteCourseLessonContent
);

/**
 * @route   POST /api/courses/admin/duplicate/:courseId
 * @desc    Duplicate a course
 * @access  Admin
 */
router.post(
  "/admin/duplicate/:courseId",
  ...adminGuard("courses.manage"),
  duplicateCourse
);

/**
 * @route   POST /api/courses/admin/duplicate-metadata/:courseId
 * @desc    Duplicate course metadata only (excluding bound relationships)
 * @access  Admin
 */
router.post(
  "/admin/duplicate-metadata/:courseId",
  ...adminGuard("courses.manage"),
  duplicateCourseMetadata
);

/**
 * @route   POST /api/courses/admin/duplicate-with-modules/:courseId
 * @desc    Duplicate course with all modules, lessons, and contents
 * @access  Admin
 */
router.post(
  "/admin/duplicate-with-modules/:courseId",
  ...adminGuard("courses.manage"),
  duplicateCourseWithModules
);

/**
 * @route   PUT /api/courses/:courseId/status
 * @desc    Update a course status
 * @access  Admin
 */
router.put("/:courseId/status", ...adminGuard("courses.manage"),updateCourseStatus);

/**
 * @route   PUT /api/courses/:courseId/toggle-content-status
 * @desc    Toggle module/lesson/content active status for a specific course
 * @access  Admin
 */
router.put("/:courseId/toggle-content-status", ...adminGuard("courses.manage"),toggleCourseContentStatus);

/**
 * @route   PUT /api/courses/:courseId/metadata
 * @desc    Update a course metadata
 * @access  Admin
 */
router.put(
  "/:courseId/metadata",
  ...adminGuard("courses.manage"),
  updateCourseMetadata
);

/**
 * @route   DELETE /api/courses/:courseId
 * @desc    Delete a course
 * @access  Admin
 */
router.delete("/:courseId", ...adminGuard("courses.manage"),deleteCourse);

/**
 * @route   PUT /api/courses/:courseId/modules/reorder
 * @desc    Reorder course modules
 * @access  Admin
 */
router.put("/:courseId/modules/reorder", ...adminGuard("courses.manage"),reorderModules);

/**
 * @route   PUT /api/courses/modules/:moduleId/lessons/reorder
 * @desc    Reorder course lessons
 * @access  Admin
 */
router.put("/modules/:moduleId/lessons/reorder", ...adminGuard("courses.manage"),reorderLessons);

/**
 * @route   PUT /api/courses/lessons/:lessonId/contents/reorder
 * @desc    Reorder lesson content
 * @access  Admin
 */
router.put("/lessons/:lessonId/contents/reorder", ...adminGuard("courses.manage"),reorderContent);

export default router;
