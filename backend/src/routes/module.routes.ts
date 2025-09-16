import {
  getAllModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  getModuleStats,
} from "../controllers/module.controller";
import { Router } from "express";

const router = Router();

/**
 * @route   GET /api/modules
 * @desc    Get all modules with pagination
 * @access  Public
 * @params
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 100)
 *   - courseId: Filter by course ID
 *   - search: Search term for module title
 * @example
 *   GET /api/modules?page=1&limit=10&courseId=64a1b2c3d4e5f6789012345&search=intro
 */
router.get("/", getAllModules);

/**
 * @route   GET /api/modules/stats
 * @desc    Get module statistics
 * @access  Public
 * @params
 *   - courseId: Filter statistics by course ID (optional)
 * @example
 *   GET /api/modules/stats?courseId=64a1b2c3d4e5f6789012345
 */
router.get("/stats", getModuleStats);

/**
 * @route   GET /api/modules/:moduleId
 * @desc    Get module by ID
 * @access  Public
 * @params
 *   - moduleId: Module ID
 * @example
 *   GET /api/modules/64a1b2c3d4e5f6789012345
 */
router.get("/:moduleId", getModuleById);

/**
 * @route   POST /api/modules
 * @desc    Create a new module
 * @access  Admin/Instructor
 * @body
 *   - title: Module title (required, 3-200 chars)
 *   - description: Module description (optional)
 *   - thumbnailUrl: Module thumbnail URL (optional)
 *   - isLocked: Whether module is locked (optional, default: false)
 *   - isActive: Whether module is active (optional, default: true)
 * @example
 *   POST /api/modules
 *   Body: {
 *     "title": "Introduction to Web Development",
 *     "description": "Learn the basics of HTML, CSS, and JavaScript",
 *     "thumbnailUrl": "https://example.com/thumbnail.jpg",
 *     "isLocked": false,
 *     "isActive": true
 *   }
 */
router.post("/", createModule);

/**
 * @route   PUT /api/modules/:moduleId
 * @desc    Update module
 * @access  Admin/Instructor
 * @params
 *   - moduleId: Module ID
 * @body    Module update data (title, description, thumbnailUrl, isLocked, isActive)
 * @example
 *   PUT /api/modules/64a1b2c3d4e5f6789012345
 *   Body: {
 *     "title": "Advanced Web Development",
 *     "description": "Advanced concepts in web development",
 *     "isActive": true
 *   }
 */
router.put("/:moduleId", updateModule);

/**
 * @route   DELETE /api/modules/:moduleId
 * @desc    Delete module and associated lessons
 * @access  Admin/Instructor
 * @params
 *   - moduleId: Module ID
 * @example
 *   DELETE /api/modules/64a1b2c3d4e5f6789012345
 */
router.delete("/:moduleId", deleteModule);

export default router;
