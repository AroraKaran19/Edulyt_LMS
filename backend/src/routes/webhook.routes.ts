import { Router } from "express";
import { triggerPaymentWebhook, getPaymentWebhookStatus } from "../controllers/webhook.controller";
import { verifyAdmin } from "../middlewares/admin.middleware";

const router = Router();

/**
 * @route   POST /api/webhook/payment-verification
 * @desc    Trigger payment verification manually
 * @access  Admin/Internal
 */
router.post("/payment-verification", verifyAdmin, triggerPaymentWebhook);

/**
 * @route   GET /api/webhook/payment-status
 * @desc    Get status of payment verification cron job
 * @access  Admin/Internal
 */
router.get("/payment-status", verifyAdmin, getPaymentWebhookStatus);

export default router;
