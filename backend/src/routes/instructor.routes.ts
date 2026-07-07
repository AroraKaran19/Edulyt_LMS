import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import {
  verifyAdmin,
  requireAnyPermission,
} from "../middlewares/admin.middleware";
import {
  getAllInstructors,
  getInstructorById,
  getInstructorsByIds,
} from "../controllers/instructor.controller";

const router = Router();

// Apply middleware to all routes. Instructor lookups are consumed by both
// course management (assigning instructors) and user management.
router.use(verifyUser);
router.use(verifyAdmin);
router.use(requireAnyPermission("users.manage", "courses.manage"));

/**
 * @route   GET /api/instructors
 * @desc    Get all instructors with pagination and search
 * @access  Admin
 */
router.get("/", getAllInstructors);

/**
 * @route   GET /api/instructors/:instructorId
 * @desc    Get instructor by ID
 * @access  Admin
 */
router.get("/:instructorId", getInstructorById);

/**
 * @route   POST /api/instructors/batch
 * @desc    Get multiple instructors by IDs
 * @access  Admin
 */
router.post("/batch", getInstructorsByIds);

export default router;
