import { Router } from "express";
import { InstructorController } from "../controllers/instructor.controller";

const router = Router();
const instructorController = new InstructorController();

/**
 * Get all instructors
 * @route GET /api/instructors
 * @access Admin
 * @description Get all instructors
 * @returns {Object} - Instructors
 */
router.get("/", instructorController.getAllInstructors);

/**
 * Get instructor by id
 * @route GET /api/instructors/:id
 * @access Admin
 * @description Get instructor by id
 * @returns {Object} - Instructor
 */
router.get("/:id", instructorController.getInstructorById);

/**
 * Create instructor
 * @route POST /api/instructors
 * @access Admin
 * @description Create instructor
 * @returns {Object} - Instructor
 */
router.post("/", instructorController.createInstructor);

/**
 * Update instructor
 * @route PUT /api/instructors/:id
 * @access Admin
 * @description Update instructor
 * @returns {Object} - Instructor
 */
router.put("/:id", instructorController.updateInstructor);

/**
 * Delete instructor
 * @route DELETE /api/instructors/:id
 * @access Admin
 * @description Delete instructor
 * @returns {Object} - Instructor
 */
router.delete("/:id", instructorController.deleteInstructor);

export default router;