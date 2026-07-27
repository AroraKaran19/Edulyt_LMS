import { Router } from "express";
import {
  getPaymentStatus,
  verifyPaymentToken,
  paytmWebhookHandler,
  gatewayWebhookHandler,
  listGateways,
  verifyPaymentSignature,
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

/**
 * @route   GET /api/payment/gateways
 * @desc    Active payment gateways for the checkout picker.
 * @access  Public
 */
router.get("/gateways", listGateways);

/**
 * @route   POST /api/payment/verify/:orderId
 * @desc    Settle an order from a client-side gateway signature.
 * @access  Public (the signature authorizes it)
 */
router.post("/verify/:orderId", verifyPaymentSignature);

// Back-compat: the Paytm dashboard points at this URL — do not remove.
router.post("/paytm-webhook", paytmWebhookHandler);

/**
 * @route   POST /api/payment/webhook/:gateway
 * @desc    Gateway-agnostic webhook entry point.
 * @access  Public
 */
router.post("/webhook/:gateway", gatewayWebhookHandler);

export default router;
