import { Request, Response } from "express";
import {
  asyncHandler,
  sendSuccessResponse,
  AppError,
} from "../middlewares/error.middleware";
import {
  createOrderService,
  deleteOrderService,
  getOrderInfoService,
  getSelfOrdersService,
  processWebhook,
  updateOrderService,
  verifyPayment as verifyPaymentService,
} from "../services/order.services";
import { UserModel } from "../models";

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
  const { courseId, planType, userId } = req.body;
  // const user = req.user;
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!courseId || !planType) {
    throw new AppError("Missing required fields", 400);
  }

  const order = await createOrderService(
    user?._id as string,
    courseId,
    planType
  );

  if (!order) {
    throw new AppError("Failed to create order", 500);
  }

  res.cookie("paymentToken", order.token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 5, // 5 minutes
    domain: process.env.NODE_ENV === "production" ? ".airkrit.com" : undefined, // Set domain only in production
  });
  sendSuccessResponse(res, order, "Order created successfully", 201);
  return;
});

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
