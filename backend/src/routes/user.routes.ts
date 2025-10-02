import { Router } from "express";
import { getEnrolledCourses, getUserProfile } from "../controllers/user.controller";
import { verifyUser } from "../middlewares/auth.middleware";

const router = Router();

// Get enrolled courses for a user
router.get("/enrolled-courses", getEnrolledCourses);

// Get user profile (requires authentication)
router.get("/profile", verifyUser, getUserProfile);

export default router;