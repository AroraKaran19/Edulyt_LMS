import { PaymentService } from "../services/payment.service";
import { Request, Response } from "express";
import UserModel from "../models/user.schema";

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
  getOrderInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      if (!orderId) {
        res.status(400).json({ message: "Order ID is required" });
        return;
      }
      const orderInfo = await this.paymentService.getOrderInfo(orderId);
      if (orderInfo) {
        res.status(200).json({
          success: true,
          message: "Order info fetched successfully",
          orderInfo,
        });
      } else {
        res.status(404).json({ message: "Order not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error getting order info" });
    }
  };

  /**
   * Create a payment
   * @param req - The request object
   * @param res - The response object
   */
  createPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, courseId, planType } = req.body;
      if (!userId || !courseId || !planType) {
        res.status(400).json({ message: "Missing required fields" });
        return;
      }

      const user = await UserModel.findOne({ _id: userId });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Check if user is already enrolled in the course
      if (user.enrolledCourses?.includes(courseId)) {
        res
          .status(203)
          .json({
            message: "User already enrolled in the course",
            success: false,
          });
        return;
      }

      const payment = await this.paymentService.createPayment(
        userId,
        courseId,
        planType
      );
      res.status(200).json({
        success: true,
        message: "Payment created successfully",
        orderId: payment.orderId,
        redirectUrl: payment.redirectUrl,
      });
    } catch (error) {
      res.status(500).json({ message: "Error creating payment", error: error });
    }
  };

  /**
   * Get payment status
   * @param req - The request object
   * @param res - The response object
   */
  getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      if (!orderId) {
        res.status(400).json({ message: "Order ID is required" });
        return;
      }
      const orderStatusResponse = await this.paymentService.getPaymentStatus(
        orderId
      );
      if (!orderStatusResponse) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      res.status(200).json({
        success: true,
        message: "Payment status fetched successfully",
        status: orderStatusResponse?.status,
        orderId: orderStatusResponse?.orderId,
        createdAt: orderStatusResponse?.createdAt,
        amount: orderStatusResponse?.amount,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error getting payment status", error: error });
    }
  };

  verifyPaymentGatewayToken = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { token } = req.params;
      const decoded = await this.paymentService.verifyPaymentGatewayToken(
        token
      );
      res.status(200).json({
        success: true,
        message: "Payment gateway token verified successfully",
        decoded,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error verifying payment gateway token",
        error: error,
      });
    }
  };
}
