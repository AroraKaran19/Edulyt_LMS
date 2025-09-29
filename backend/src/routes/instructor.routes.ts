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

export default router;
