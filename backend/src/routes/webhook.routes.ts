import { Router } from "express";
import { triggerPaymentWebhook, getPaymentWebhookStatus } from "../controllers/webhook.controller";
import { adminGuard } from "../middlewares/admin.middleware";

const router = Router();

/**
 * @route   POST /api/webhook/payment-verification
 * @desc    Trigger payment verification manually
 * @access  Admin/Internal
 */
router.post("/payment-verification", ...adminGuard("orders"),triggerPaymentWebhook);

/**
 * @route   GET /api/webhook/payment-status
 * @desc    Get status of payment verification cron job
 * @access  Admin/Internal
 */
router.get("/payment-status", ...adminGuard("orders"),getPaymentWebhookStatus);

export default router;
