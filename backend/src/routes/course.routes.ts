import {
  getAllCourses,
  getCourseUsingSlug,
  getFeaturedCourses,
  getCoursesUsingAudience,
  getCoursesUsingCategory,
  updateCourseMetadata,
  createCourseMetadata,
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


export default router;