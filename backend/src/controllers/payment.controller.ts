import { PaymentService } from "../services/payment.service";
import { Request, Response } from "express";
import UserModel from "../models/user.schema";
import { asyncHandler, AppError, sendSuccessResponse } from "../middlewares/error.middleware";

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    console.log("Payment controller initialized");
    this.paymentService = new PaymentService();
  }

  /**
   * Get order info
   * @param req - The request object
   * @param res - The response object
   */
  getOrderInfo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;
    
    if (!orderId) {
      throw new AppError("Order ID is required", 400);
    }
    
    const orderInfo = await this.paymentService.getOrderInfo(orderId);
    
    if (!orderInfo) {
      throw new AppError("Order not found", 404);
    }
    
    sendSuccessResponse(res, { orderInfo }, "Order info fetched successfully");
  });

  /**
   * Create a payment
   * @param req - The request object
   * @param res - The response object
   */
  createPayment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId, courseId, planType } = req.body;
    
    if (!userId || !courseId || !planType) {
      throw new AppError("Missing required fields", 400);
    }

    const user = await UserModel.findOne({ _id: userId });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check if user is already enrolled in the course
    if (user.enrolledCourses?.includes(courseId)) {
      throw new AppError("User already enrolled in the course", 409);
    }

    const payment = await this.paymentService.createPayment(
      userId,
      courseId,
      planType
    );
    
    const data = {
      orderId: payment.orderId,
      token: payment.token,
    };
    
    sendSuccessResponse(res, data, "Order created successfully");
  });

  /**
   * Get payment status
   * @param req - The request object
   * @param res - The response object
   */
  getPaymentStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;
    
    if (!orderId) {
      throw new AppError("Order ID is required", 400);
    }
    
    const orderStatusResponse = await this.paymentService.getPaymentStatus(
      orderId
    );
    
    if (!orderStatusResponse) {
      throw new AppError("Order not found", 404);
    }
    
    const data = {
      status: orderStatusResponse?.status,
      orderId: orderStatusResponse?.orderId,
      createdAt: orderStatusResponse?.createdAt,
      amount: orderStatusResponse?.amount,
      txnId: orderStatusResponse?.txnId,
    };
    
    sendSuccessResponse(res, data, "Payment status fetched successfully");
  });

  verifyPaymentGatewayToken = asyncHandler(async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { token } = req.params;
    
    const decoded = await this.paymentService.verifyPaymentGatewayToken(
      token
    );
    
    sendSuccessResponse(res, { decoded }, "Payment gateway token verified successfully");
  });
}
