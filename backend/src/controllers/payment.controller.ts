import { PaymentService } from "../services/payment.service";
import { Request, Response } from "express";
import { UserModel } from "../models/user.schema";
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

    // Check if user is already enrolled in the course using Enrollments collection
    const { EnrollmentModel } = await import("../models/enrollment.schema");
    const existingEnrollment = await EnrollmentModel.findOne({ 
      userId, 
      courseId, 
      status: { $in: ["active", "completed"] } 
    });
    
    if (existingEnrollment) {
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

  /**
   * Handle payment gateway webhook
   * @param req - The request object
   * @param res - The response object
   */
  handlePaymentWebhook = asyncHandler(async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const webhookData = req.body;
      
      // Log webhook data for debugging
      console.log("Payment webhook received:", JSON.stringify(webhookData, null, 2));
      
      // Process the webhook data
      const result = await this.paymentService.processWebhook(webhookData);
      
      if (result.success) {
        res.status(200).json({ 
          success: true, 
          message: "Webhook processed successfully",
          orderId: result.orderId 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: result.message || "Webhook processing failed" 
        });
      }
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error processing webhook" 
      });
    }
  });
}
