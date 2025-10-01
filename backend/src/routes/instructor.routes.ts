import express from "express";
import { InstructorController } from "../controllers/instructor.controller";
import { verifyUser } from "../middlewares/auth.middleware";

const router = express.Router();
const instructorController = new InstructorController();

/**
 * @route   POST /api/instructor/register
 * @desc    Register a new instructor (admin only)
 * @access  Private (admin)
 * @body    Instructor registration data
 * @return  Success/Error response
 */
router.post("/register", instructorController.registerInstructor);

/**
 * @route   GET /api/instructor
 * @desc    Get all instructors with pagination and filtering
 * @access  Private (admin)
 * @query   page, limit, search, status, sortBy, sortOrder
 * @return  List of instructors with pagination info
 */
router.get("/", verifyUser, instructorController.getAllInstructors);

/**
 * @route   GET /api/instructor/:id
 * @desc    Get instructor by ID
 * @access  Private (admin)
 * @params  id - Instructor ID
 * @return  Instructor details
 */
router.get("/:id", verifyUser, instructorController.getInstructorById);

/**
 * @route   PUT /api/instructor/:id
 * @desc    Update instructor by ID
 * @access  Private (admin)
 * @params  id - Instructor ID
 * @body    Updated instructor data
 * @return  Updated instructor details
 */
router.put("/:id", verifyUser, instructorController.updateInstructor);

/**
 * @route   DELETE /api/instructor/:id
 * @desc    Delete instructor by ID
 * @access  Private (admin)
 * @params  id - Instructor ID
 * @return  Success message
 */
router.delete("/:id", verifyUser, instructorController.deleteInstructor);

export default router;
