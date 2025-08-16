import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";

const router = Router();
const paymentController = new PaymentController();

/**
 * @route   POST /api/payment/create-order
 * @desc    Create a payment
 * @access  Public
 * @body
 *   - userId: string
 *   - courseId: string
 *   - planType: "elite" | "essential"
 * @return  Redirect URL
 */
router.post("/create-order", paymentController.createPayment);

/**
 * @route   GET /api/payment/order-info/:orderId
 * @desc    Get order info
 * @access  Public
 * @param   orderId: string
 */
router.get("/order-info/:orderId", paymentController.getOrderInfo);

/**
 * @route   GET /api/payment/status/:orderId
 * @desc    Get payment status
 * @access  Public
 * @param   orderId: string
 */
router.get("/status/:orderId", paymentController.getPaymentStatus);

/**
 * @route   GET /api/payment/verify-token/:token
 * @desc    Verify payment gateway token
 * @access  Public
 * @param   token: string
 */
router.get("/verify-token/:token", paymentController.verifyPaymentGatewayToken);

export default router;