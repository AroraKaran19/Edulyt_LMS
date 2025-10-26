import { verifyAdmin } from "../middlewares/admin.middleware";
import { verifyUser } from "../middlewares/user.middleware";
import { Router } from "express";
import {
  createOrder,
  deleteOrder,
  getOrderInfo,
  getSelfOrders,
  verifyPayment,
  webhookHandler,
} from "../controllers/order.controller";

const router = Router();

/**
 * @route   GET /api/orders
 * @desc    Get self orders
 * @access  User
 */
router.get("/", verifyUser, getSelfOrders);

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  User
 */
router.post("/", createOrder);

/**
 * @route   GET /api/orders/verify/:token
 * @desc    Verify payment token and get payment status
 * @access  User
 */
router.get("/verify/:token", verifyUser, verifyPayment);

/**
 * @route   GET /api/orders/:orderId
 * @desc    Get an order by ID
 * @access  Admin
 */
router.get("/:orderId", verifyAdmin, getOrderInfo);

/**
 * @route   DELETE /api/orders/:orderId
 * @desc    Delete an order
 * @access  Admin
 */
router.delete("/:orderId", verifyAdmin, deleteOrder);

/**
 * @route   POST /api/orders/webhook
 * @desc    Webhook for payment gateway callbacks
 * @access  Public
 */
router.post("/webhook", webhookHandler);

export default router;
