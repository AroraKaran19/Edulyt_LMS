import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/error.middleware";
import { AppError, sendSuccessResponse } from "../middlewares/error.middleware";
import { OrderModel } from "../models";
import { verifyPaymentGatewayToken } from "../services/payments/token";
import {
  reconcileOrder,
  applyPaymentResult,
} from "../services/payments/orderFlow";
import {
  getEnabledGateways,
  getProvider,
  getWebhookProvider,
} from "../services/payments/registry";
import { asBrand } from "../constants/brands";

/** Display names for the checkout picker. Keyed by GatewayName. */
const GATEWAY_LABELS: Record<string, string> = {
  paytm: "Paytm",
  razorpay: "Razorpay",
  phonepe: "PhonePe",
};

/**
 * @route   GET /api/payment/gateways
 * @desc    Gateways that are both enabled and configured for the calling site,
 *          in preference order. The picker reads this — it must never hardcode
 *          the list, or turning a gateway off in env leaves a dead button.
 * @access  Public
 */
export const listGateways = asyncHandler(async (req: Request, res: Response) => {
  const gateways = getEnabledGateways(req.brand).map((name) => ({
    name,
    label: GATEWAY_LABELS[name] ?? name,
  }));

  sendSuccessResponse(
    res,
    { gateways },
    "Payment gateways retrieved successfully",
    200,
  );
});

/**
 * @route   POST /api/payment/verify/:orderId
 * @desc    Settle an order from the client-side gateway signature, so a paying
 *          learner doesn't wait on webhook latency. Idempotent: applyPaymentResult
 *          no-ops on an already-settled order.
 * @access  Public — the gateway signature in the body is the authorization. It
 *          cannot be forged without the gateway's key secret, and the provider
 *          rejects a signature whose gateway order id isn't this order's.
 */
export const verifyPaymentSignature = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;
    if (!orderId) throw new AppError("Order ID is required", 400);

    const order = await OrderModel.findById(orderId);
    if (!order) throw new AppError("Order not found", 404);

    const provider = getProvider(order.paymentMethod);
    if (!provider.verifySignature) {
      throw new AppError(
        `${provider.name} does not support client-side verification`,
        400,
      );
    }

    const result = await provider.verifySignature(order, req.body);
    await applyPaymentResult(order, result);

    sendSuccessResponse(
      res,
      { orderId: order._id.toString(), status: order.paymentStatus },
      "Payment verified successfully",
      200,
    );
  },
);

/**
 * @route   GET /api/payment/status/:orderId
 * @desc    Get payment status by order ID, reconciling with the gateway.
 * @access  Public
 */
export const getPaymentStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;
    if (!orderId) throw new AppError("Order ID is required", 400);

    const order = await OrderModel.findById(orderId);
    if (!order) throw new AppError("Order not found", 404);

    // reconcileOrder is a no-op on settled orders and swallows gateway
    // outages (the provider reports "pending"), so one path covers all cases.
    await reconcileOrder(order);

    sendSuccessResponse(
      res,
      {
        status: order.paymentStatus,
        orderId: order._id.toString(),
        createdAt: order.createdAt,
        amount: order.amount,
        txnId: order.txnId,
      },
      "Payment status retrieved successfully",
      200,
    );
  },
);

/**
 * @route   GET /api/payment/verify-token/:token
 * @desc    Verify payment token and get decoded data
 * @access  Public
 */
export const verifyPaymentToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { token } = req.params;

    if (!token) {
      throw new AppError("Payment token is required", 400);
    }

    try {
      const decoded = verifyPaymentGatewayToken(token);
      sendSuccessResponse(res, { decoded }, "Token verified successfully", 200);
    } catch (error) {
      throw new AppError("Invalid token", 400);
    }
  }
);

/**
 * Verify a gateway's webhook payload, then settle the order it names.
 * Shared by the generic route and the back-compat Paytm one.
 */
const settleWebhook = async (
  gateway: string | undefined,
  req: Request,
): Promise<{ orderId: string; status: string }> => {
  const result = await getWebhookProvider(gateway).verifyWebhook(
    req.body,
    req.headers as Record<string, string | undefined>,
    (req as Request & { rawBody?: Buffer }).rawBody,
  );

  const order = await OrderModel.findById(result.orderId);
  if (!order) throw new AppError("Order not found", 404);
  if (result.brand && asBrand(order.brand) !== result.brand) {
    throw new AppError("Webhook credentials do not belong to this order's site", 403);
  }

  await applyPaymentResult(order, result);

  return { orderId: result.orderId, status: order.paymentStatus };
};

/**
 * @route   POST /api/payment/paytm-webhook
 * @desc    Back-compat webhook entry point. The Paytm dashboard already points
 *          at this URL, so it stays registered.
 * @access  Public (the gateway's servers call this)
 */
export const paytmWebhookHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId, status } = await settleWebhook("paytm", req);

    sendSuccessResponse(
      res,
      { success: true, orderId, status },
      "Paytm webhook processed successfully",
      200,
    );
  },
);

/**
 * @route   POST /api/payment/webhook/:gateway
 * @desc    Gateway-agnostic webhook entry point.
 * @access  Public (the gateway's servers call this)
 */
export const gatewayWebhookHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId, status } = await settleWebhook(req.params.gateway, req);

    sendSuccessResponse(
      res,
      { success: true, orderId, status },
      "Webhook processed successfully",
      200,
    );
  },
);
