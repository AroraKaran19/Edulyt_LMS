import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  createOrderService,
  createInternshipSeatOrderService,
  createInternshipSuccessPointsOrderService,
  deleteOrderService,
  getOrderInfoService,
  getSelfOrdersService,
  getTotalSpendByUserIdService,
  processWebhook,
  updateOrderService,
  verifyPayment as verifyPaymentService,
} from "../services/order.services";
import { UserModel } from "../models";
import { isFreeOrderResult } from "../services/payments/orderFlow";
import type { CheckoutSession } from "../services/payments/types";
import { DEFAULT_BRAND } from "../constants/brands";

/**
 * Phase 1 adapts the normalized gateway result back into the legacy response
 * shape the frontend already understands. Phase 3 replaces this with the
 * normalized payload once the checkout launcher is gateway-aware.
 *
 * `_id` always comes from `result.orderId` (OUR order id) — never from
 * `gatewayOrderId`, which is the gateway's own id and differs for Razorpay.
 */
const toLegacyOrderResponse = (result: CheckoutSession) => {
  if (isFreeOrderResult(result)) {
    return {
      _id: result.orderId,
      freeOrder: true as const,
      token: result.token,
    };
  }
  return {
    _id: result.orderId,
    gateway: result.gateway,
    token: result.clientToken,
    // Razorpay's checkout needs both of these; Paytm's ignores them.
    gatewayOrderId: result.gatewayOrderId,
    keyId: (result.extra as { keyId?: string } | undefined)?.keyId,
    amount: result.amount,
    currency: result.currency,
  };
};

const PAYMENT_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 1000 * 60 * 5, // 5 minutes
  domain: process.env.NODE_ENV === "production" ? ".airkrit.com" : undefined,
};

export const getSelfOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search } = req.query;

    const user = req.user;

    if (Number(page) < 1 || Number(limit) < 1) {
      throw new AppError("Page and limit must be positive numbers", 400);
    }

    const orders = await getSelfOrdersService(
      user?._id as string,
      Number(page),
      Number(limit),
      String(search)
    );
    if (!orders) {
      sendSuccessResponse(res, [], "Orders not found", 200);
      return;
    }
    sendSuccessResponse(res, orders, "Orders fetched successfully", 200);
    return;
  }
);

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const {
    courseId,
    planType,
    userId,
    couponCode,
    referralCode,
    useSuccessPoints,
    gateway,
    courseInternshipMonths,
  } = req.body;

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  // Partners are portal-only — no purchasing. Blocked here because this
  // route reads userId from the body (no verifyUser middleware) so the
  // shared `denyPartners` middleware can't be chained.
  if (user.userType === "partner") {
    throw new AppError(
      "Partner accounts can't purchase courses or internships.",
      403,
    );
  }

  if (!courseId || !planType) {
    throw new AppError("Missing required fields", 400);
  }

  const order = await createOrderService(
    user._id as string,
    courseId,
    planType,
    couponCode,
    typeof referralCode === "string" ? referralCode : undefined,
    useSuccessPoints === true,
    typeof gateway === "string" ? gateway : undefined,
    // Validated against the course's own offer in the service; the client
    // chooses a duration, never a price.
    courseInternshipMonths,
    req.brand ?? DEFAULT_BRAND,
  );

  if (!order) {
    throw new AppError("Failed to create order", 500);
  }

  const payload = toLegacyOrderResponse(order);
  if (payload.token) {
    res.cookie("paymentToken", payload.token, PAYMENT_COOKIE_OPTIONS);
  }
  sendSuccessResponse(res, payload, "Order created successfully", 201);
  return;
});

/**
 * Create a checkout order for a paid internship seat (enrollment in `payment_pending`).
 */
export const createInternshipSeatOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const { internshipEnrollmentId, gateway } = req.body as {
      internshipEnrollmentId?: string;
      gateway?: string;
    };
    if (!req.user?._id) {
      throw new AppError("Unauthorized", 401);
    }
    if (!internshipEnrollmentId) {
      throw new AppError("internshipEnrollmentId is required", 400);
    }

    const order = await createInternshipSeatOrderService(
      String(req.user._id),
      internshipEnrollmentId,
      typeof gateway === "string" ? gateway : undefined,
      req.brand ?? DEFAULT_BRAND,
    );

    if (!order) {
      throw new AppError("Failed to create order", 500);
    }

    const payload = toLegacyOrderResponse(order);
    if (payload.token) {
      res.cookie("paymentToken", payload.token, PAYMENT_COOKIE_OPTIONS);
    }
    sendSuccessResponse(res, payload, "Order created successfully", 201);
    return;
  },
);

/**
 * Create a checkout order for purchasing internship certification success points.
 */
export const createInternshipSuccessPointsOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const { internshipEnrollmentId, quantity, gateway } = req.body as {
      internshipEnrollmentId?: string;
      quantity?: number;
      gateway?: string;
    };
    if (!req.user?._id) {
      throw new AppError("Unauthorized", 401);
    }
    if (!internshipEnrollmentId) {
      throw new AppError("internshipEnrollmentId is required", 400);
    }
    if (quantity === undefined || quantity === null) {
      throw new AppError("quantity is required", 400);
    }

    const order = await createInternshipSuccessPointsOrderService(
      String(req.user._id),
      internshipEnrollmentId,
      Number(quantity),
      typeof gateway === "string" ? gateway : undefined,
      req.brand ?? DEFAULT_BRAND,
    );

    if (!order) {
      throw new AppError("Failed to create order", 500);
    }

    const payload = toLegacyOrderResponse(order);
    if (payload.token) {
      res.cookie("paymentToken", payload.token, PAYMENT_COOKIE_OPTIONS);
    }
    sendSuccessResponse(res, payload, "Order created successfully", 201);
    return;
  },
);

export const getOrderInfo = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;
    if (!orderId) {
      throw new AppError("Order ID is required", 400);
    }
    const order = await getOrderInfoService(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    sendSuccessResponse(res, order, "Order info fetched successfully", 200);
    return;
  }
);

export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { update } = req.body;
  if (!orderId) {
    throw new AppError("Order ID is required", 400);
  }
  if (!update) {
    throw new AppError("Update data is required", 400);
  }
  const order = await updateOrderService(orderId, update);
  if (!order) {
    throw new AppError("Failed to update order", 500);
  }
  sendSuccessResponse(res, order, "Order updated successfully", 200);
  return;
});

export const verifyPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const { token } = req.params;
    if (!token) {
      throw new AppError("Payment token is required", 400);
    }

    const result = await verifyPaymentService(token);
    if (!result) {
      throw new AppError("Failed to verify payment", 500);
    }

    sendSuccessResponse(res, result, "Payment verified successfully", 200);
    return;
  }
);

export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  if (!orderId) {
    throw new AppError("Order ID is required", 400);
  }
  const order = await deleteOrderService(orderId);
  if (!order) {
    throw new AppError("Failed to delete order", 500);
  }
  sendSuccessResponse(res, order, "Order deleted successfully", 200);
  return;
});

/**
 * Get total spend for a user (admin only - paid purchases only, excludes gift/trial).
 * @route GET /api/admin/users/:userId/total-spend
 */
export const getTotalSpendByUserId = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }
    const totalSpend = await getTotalSpendByUserIdService(userId);
    sendSuccessResponse(
      res,
      { totalSpend },
      "Total spend retrieved successfully",
      200
    );
  }
);

// Not Tested Yet
export const webhookHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await processWebhook(req.body);
    if (!order) {
      throw new AppError("Failed to process webhook", 500);
    }
    sendSuccessResponse(
      res,
      order,
      "Order webhook processed successfully",
      200
    );
    return;
  }
);
