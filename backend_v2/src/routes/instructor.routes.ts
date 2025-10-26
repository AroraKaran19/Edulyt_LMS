import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin } from "../middlewares/admin.middleware";
import {
  getAllInstructors,
  getInstructorById,
  getInstructorsByIds,
} from "../controllers/instructor.controller";

const router = Router();

// Apply middleware to all routes
router.use(verifyUser);
router.use(verifyAdmin);

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
