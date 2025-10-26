import { Router } from "express";
import {
  getPaymentStatus,
  verifyPaymentToken,
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

export default router;
