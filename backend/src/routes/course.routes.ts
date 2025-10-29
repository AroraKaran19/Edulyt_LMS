import { verifyAdmin } from "../middlewares/admin.middleware";
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
  getAdminCourseById,
  getAdminCourseBySlug,
  getAdminCourses,
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
  checkSlugAvailability,
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
router.get("/admin", verifyUser, verifyAdmin, getAdminCourses);

/**
 * @route   GET /api/courses/admin/id/:courseId
 * @desc    Get a course by id for admin
 * @access  Admin
 */
router.get("/admin/id/:courseId", verifyUser, verifyAdmin, getAdminCourseById);

/**
 * @route   GET /api/courses/admin/slug/:slug
 * @desc    Get a course by slug for admin
 * @access  Admin
 */
router.get("/admin/slug/:slug", verifyUser, verifyAdmin, getAdminCourseBySlug);

/**
 * @route   POST /api/courses
 * @desc    Create a course metadata
 * @access  Admin
 */
router.post("/metadata", verifyUser, verifyAdmin, createCourseMetadata);

// COURSE MODULE MANAGEMENT ROUTES

/**
 * @route   POST /api/courses/modules
 * @desc    Create a course module
 * @access  Admin
 */
router.post("/:courseId/modules", verifyUser, verifyAdmin, createCourseModule);

/**
 * @route   PUT /api/courses/modules/:moduleId
 * @desc    Update a course module
 * @access  Admin
 */
router.put(
  "/:courseId/modules/:moduleId",
  verifyUser,
  verifyAdmin,
  updateCourseModule
);

/**
 * @route   DELETE /api/courses/modules/:moduleId
 * @desc    Delete a course module
 * @access  Admin
 */
router.delete(
  "/:courseId/modules/:moduleId",
  verifyUser,
  verifyAdmin,
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
  verifyUser,
  verifyAdmin,
  createCourseLesson
);

/**
 * @route   PUT /api/courses/modules/:moduleId/lessons/:lessonId
 * @desc    Update a course module lesson
 * @access  Admin
 */
router.put(
  "/:courseId/modules/:moduleId/lessons/:lessonId",
  verifyUser,
  verifyAdmin,
  updateCourseLesson
);

/**
 * @route   DELETE /api/courses/modules/:moduleId/lessons/:lessonId
 * @desc    Delete a course module lesson
 * @access  Admin
 */
router.delete(
  "/:courseId/modules/:moduleId/lessons/:lessonId",
  verifyUser,
  verifyAdmin,
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
  verifyUser,
  verifyAdmin,
  createCourseLessonContent
);

/**
 * @route   PUT /api/courses/modules/:moduleId/lessons/:lessonId/contents/:contentId
 * @desc    Update a course module lesson content
 * @access  Admin
 */
router.put(
  "/:courseId/modules/:moduleId/lessons/:lessonId/contents/:contentId",
  verifyUser,
  verifyAdmin,
  updateCourseLessonContent
);

/**
 * @route   DELETE /api/courses/modules/:moduleId/lessons/:lessonId/contents/:contentId
 * @desc    Delete a course module lesson content
 * @access  Admin
 */
router.delete(
  "/:courseId/modules/:moduleId/lessons/:lessonId/contents/:contentId",
  verifyUser,
  verifyAdmin,
  deleteCourseLessonContent
);

/**
 * @route   POST /api/courses/admin/duplicate/:courseId
 * @desc    Duplicate a course
 * @access  Admin
 */
router.post(
  "/admin/duplicate/:courseId",
  verifyUser,
  verifyAdmin,
  duplicateCourse
);

/**
 * @route   POST /api/courses/admin/duplicate-metadata/:courseId
 * @desc    Duplicate course metadata only (excluding bound relationships)
 * @access  Admin
 */
router.post(
  "/admin/duplicate-metadata/:courseId",
  verifyUser,
  verifyAdmin,
  duplicateCourseMetadata
);

/**
 * @route   PUT /api/courses/:courseId/status
 * @desc    Update a course status
 * @access  Admin
 */
router.put("/:courseId/status", verifyUser, verifyAdmin, updateCourseStatus);

/**
 * @route   PUT /api/courses/:courseId/metadata
 * @desc    Update a course metadata
 * @access  Admin
 */
router.put(
  "/:courseId/metadata",
  verifyUser,
  verifyAdmin,
  updateCourseMetadata
);

/**
 * @route   DELETE /api/courses/:courseId
 * @desc    Delete a course
 * @access  Admin
 */
router.delete("/:courseId", verifyUser, verifyAdmin, deleteCourse);

export default router;
