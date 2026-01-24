import { Router } from "express";
import {
  getPublicInstructorBySlug,
  getPublicInstructorCoursesBySlug,
} from "../controllers/instructor.controller";

const router = Router();

/**
 * @route   GET /api/public/instructors/:slug
 * @desc    Get public instructor profile by slug
 * @access  Public
 */
router.get("/:slug/courses", getPublicInstructorCoursesBySlug);
router.get("/:slug", getPublicInstructorBySlug);

export default router;

