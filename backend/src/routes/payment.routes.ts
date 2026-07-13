import { Router } from "express";
import {
  getPaymentStatus,
  verifyPaymentToken,
  paytmWebhookHandler,
  gatewayWebhookHandler,
} from "../controllers/payment.controller";

const router = Router();

/**
 * @route   GET /api/payment/status/:orderId
 * @desc    Get payment status by order ID
 * @access  Public
 */
router.get("/status/:orderId", getPaymentStatus);

/**
 * @route   GET /api/payment/verify-token/:token
 * @desc    Verify payment token and get decoded data
 * @access  Public
 */
router.get("/verify-token/:token", verifyPaymentToken);

// Back-compat: the Paytm dashboard points at this URL — do not remove.
router.post("/paytm-webhook", paytmWebhookHandler);

/**
 * @route   POST /api/payment/webhook/:gateway
 * @desc    Gateway-agnostic webhook entry point.
 * @access  Public
 */
router.post("/webhook/:gateway", gatewayWebhookHandler);

export default router;
