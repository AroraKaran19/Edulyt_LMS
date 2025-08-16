import { Router } from "express";
import { CleanupController } from "../controllers/cleanup.controller";
import { verifyAdmin } from "../middlewares/admin.middleware";

const router = Router();
const cleanupController = new CleanupController();

// Clean up all pending orders older than 5 minutes (admin only)
router.post("/pending-orders", verifyAdmin, cleanupController.cleanupPendingOrders.bind(cleanupController));

// Clean up pending orders for a specific user (admin only)
router.post("/pending-orders/user/:userId", verifyAdmin, cleanupController.cleanupUserPendingOrders.bind(cleanupController));

// Get statistics about pending orders (admin only)
router.get("/pending-orders/stats", verifyAdmin, cleanupController.getPendingOrdersStats.bind(cleanupController));

// Cron job management routes (admin only)
router.post("/cron/start", verifyAdmin, cleanupController.startCleanupCron.bind(cleanupController));
router.post("/cron/stop", verifyAdmin, cleanupController.stopCleanupCron.bind(cleanupController));
router.get("/cron/status", verifyAdmin, cleanupController.getCronStatus.bind(cleanupController));
router.post("/cron/run", verifyAdmin, cleanupController.runCleanupTask.bind(cleanupController));

export default router;
