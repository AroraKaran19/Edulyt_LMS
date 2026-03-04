import { Router } from "express";
import { verifyUser } from "../middlewares/user.middleware";
import { verifyAdmin } from "../middlewares/admin.middleware";
import {
  getDashboardStatsController,
  getCourseAnalyticsController,
} from "../controllers/admin.controller";

const router = Router();

// Apply middleware to all routes
router.use(verifyUser);
router.use(verifyAdmin);

// Admin dashboard route
router.get("/dashboard-stats", getDashboardStatsController);

// Course analytics route
router.get("/courses-analytics", getCourseAnalyticsController);

export default router;
