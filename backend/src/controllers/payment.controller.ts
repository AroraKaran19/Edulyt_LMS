import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/error.middleware";
import { AppError, sendSuccessResponse } from "../middlewares/error.middleware";
import { OrderModel, CourseModel, StudentModel } from "../models";
import { generatePaytmChecksum } from "../utils/lib/generatePaytmChecksum";
import axios from "axios";
import {
  verifyPaymentGatewayToken,
  createEnrollmentAfterPayment,
} from "../services/order.services";

/**
 * @route   GET /api/payment/status/:orderId
 * @desc    Get payment status by order ID and verify with Paytm
 * @access  Public
 */
export const getPaymentStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;

    if (!orderId) {
      throw new AppError("Order ID is required", 400);
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // If order is already processed, return current status
    if (order.paymentStatus === "success" || order.paymentStatus === "failed") {
      const paymentData = {
        status: order.paymentStatus,
        orderId: order._id.toString(),
        createdAt: order.createdAt,
        amount: order.amount,
        txnId: order.txnId,
      };

      sendSuccessResponse(
        res,
        paymentData,
        "Payment status retrieved successfully",
        200
      );
      return;
    }

    // For pending orders, verify with Paytm
    try {
      const signature = await generatePaytmChecksum({
        mid: process.env.PAYTM_MID,
        orderId: orderId,
      });

      if (!signature) {
        throw new AppError("Failed to generate Paytm checksum", 500);
      }

      const statusResponse = await axios.post(
        `https://secure.paytmpayments.com/v3/order/status`,
        {
          body: {
            mid: process.env.PAYTM_MID,
            orderId: orderId,
          },
          head: { signature: signature },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 10000,
        }
      );

      if (statusResponse.status !== 200) {
        // Return current status if Paytm API fails
        const paymentData = {
          status: order.paymentStatus,
          orderId: order._id.toString(),
          createdAt: order.createdAt,
          amount: order.amount,
          txnId: order.txnId,
        };
        sendSuccessResponse(
          res,
          paymentData,
          "Payment status retrieved successfully",
          200
        );
        return;
      }

      const resultStatus = statusResponse.data.body.resultInfo.resultStatus;

      // Update order status based on Paytm response
      if (resultStatus === "TXN_SUCCESS") {
        order.paymentStatus = "success";
        order.paymentMode = statusResponse.data.body.paymentMode;
        order.txnId = statusResponse.data.body.txnId;
        await order.save();

        // Remove from pending payments
        await StudentModel.findByIdAndUpdate(order.userId, {
          $pull: { pendingPayments: order._id.toString() },
        });

        // Create enrollment after successful payment (this will update analytics)
        try {
          await createEnrollmentAfterPayment(order);
        } catch (enrollmentError) {
          console.error(
            `Failed to create enrollment for order ${order._id}:`,
            enrollmentError
          );
          // Don't throw here as payment is already successful
          // The enrollment can be created manually later if needed
        }
      } else if (resultStatus === "TXN_FAILURE") {

        order.paymentStatus = "failed";
        await order.save();

        // Remove from pending payments
        await StudentModel.findByIdAndUpdate(order.userId, {
          $pull: { pendingPayments: order._id.toString() },
        });
      }

      const paymentData = {
        status: order.paymentStatus,
        orderId: order._id.toString(),
        createdAt: order.createdAt,
        amount: order.amount,
        txnId: order.txnId,
      };

      sendSuccessResponse(
        res,
        paymentData,
        "Payment status verified with Paytm",
        200
      );
    } catch (error: any) {
      console.error(
        `❌ Error verifying payment with Paytm for order ${orderId}:`,
        error.message
      );

      // Return current status if verification fails
      const paymentData = {
        status: order.paymentStatus,
        orderId: order._id.toString(),
        createdAt: order.createdAt,
        amount: order.amount,
        txnId: order.txnId,
      };

      sendSuccessResponse(
        res,
        paymentData,
        "Payment status retrieved (Paytm verification failed)",
        200
      );
    }
  }
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
