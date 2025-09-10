import { CourseController } from "../controllers/course.controller";
import { Router } from "express";

const router = Router();
const courseController = new CourseController();

/**
 * @route   GET /api/jobs/:jobId/status
 * @desc    Get status of async job (course creation, etc.)
 * @access  Private (Admin only)
 * @params
 *   - jobId: Job ID (URL parameter)
 */
router.get("/:jobId/status", courseController.getJobStatus);

/**
 * @route   POST /api/jobs/:jobId/cancel
 * @desc    Cancel a running async job
 * @access  Private (Admin only)
 * @params
 *   - jobId: Job ID (URL parameter)
 */
router.post("/:jobId/cancel", courseController.cancelJob);

export default router;