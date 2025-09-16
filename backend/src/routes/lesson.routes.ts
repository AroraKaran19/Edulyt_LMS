import {
  getAllLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
} from "../controllers/module.controller";
import { Router } from "express";

const router = Router();

/**
 * @route   GET /api/lessons
 * @desc    Get all lessons with pagination
 * @access  Public
 * @params
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 *   - moduleId: Filter by module ID
 *   - search: Search term for lesson title
 * @example
 *   GET /api/lessons?page=1&limit=10&moduleId=64a1b2c3d4e5f6789012345&search=basics
 */
router.get("/", getAllLessons);

/**
 * @route   GET /api/lessons/:lessonId
 * @desc    Get lesson by ID
 * @access  Public
 * @params
 *   - lessonId: Lesson ID
 * @example
 *   GET /api/lessons/64a1b2c3d4e5f6789012345
 */
router.get("/:lessonId", getLessonById);

/**
 * @route   POST /api/lessons
 * @desc    Create a new lesson
 * @access  Admin/Instructor
 * @body
 *   - title: Lesson title (required, 3-200 chars)
 *   - description: Lesson description (optional)
 *   - isLocked: Whether lesson is locked (optional, default: false)
 * @example
 *   POST /api/lessons
 *   Body: {
 *     "title": "HTML Basics",
 *     "description": "Learn the fundamentals of HTML",
 *     "isLocked": false
 *   }
 */
router.post("/", createLesson);

/**
 * @route   PUT /api/lessons/:lessonId
 * @desc    Update lesson
 * @access  Admin/Instructor
 * @params
 *   - lessonId: Lesson ID
 * @body    Lesson update data (title, description, isLocked)
 * @example
 *   PUT /api/lessons/64a1b2c3d4e5f6789012345
 *   Body: {
 *     "title": "Advanced HTML",
 *     "description": "Advanced HTML concepts and techniques",
 *     "isLocked": true
 *   }
 */
router.put("/:lessonId", updateLesson);

/**
 * @route   DELETE /api/lessons/:lessonId
 * @desc    Delete lesson and associated content
 * @access  Admin/Instructor
 * @params
 *   - lessonId: Lesson ID
 * @example
 *   DELETE /api/lessons/64a1b2c3d4e5f6789012345
 */
router.delete("/:lessonId", deleteLesson);

export default router;
