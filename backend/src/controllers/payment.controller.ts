import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/error.middleware";
import { AppError, sendSuccessResponse } from "../middlewares/error.middleware";
import { OrderModel, StudentModel } from "../models";
import { generatePaytmChecksum } from "../utils/lib/generatePaytmChecksum";
import PaytmChecksum from "paytmchecksum";
import axios from "axios";
import {
  verifyPaymentGatewayToken,
  createEnrollmentAfterPayment,
  processWebhook,
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
        order.paymentErrorReason =
          statusResponse.data.body.resultInfo?.resultMsg || "Payment declined";
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

/**
 * @route   POST /api/payment/paytm-webhook
 * @desc    Webhook for Paytm payment status callbacks
 * @access  Public (Paytm server calls this)
 */
export const paytmWebhookHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body;

    if (!body || typeof body !== "object") {
      throw new AppError("Invalid webhook payload", 400);
    }

    const orderId = body.ORDERID || body.orderId;
    const checksumHash = body.CHECKSUMHASH || body.checksumHash;

    if (!orderId) {
      throw new AppError("Order ID not found in webhook payload", 400);
    }

    if (process.env.PAYTM_KEY && checksumHash) {
      const paramsCopy = { ...body };
      const isValid = PaytmChecksum.verifySignature(
        paramsCopy,
        process.env.PAYTM_KEY,
        checksumHash
      );
      if (!isValid) {
        console.error("Paytm webhook checksum verification failed");
        throw new AppError("Invalid checksum", 403);
      }
    } else if (checksumHash) {
      console.warn("PAYTM_KEY not set, skipping webhook checksum verification");
    }

    const webhookPayload = {
      orderId,
      txnId: body.TXNID || body.txnId,
      status: body.STATUS || body.status,
      respMsg: body.RESPMSG || body.respMsg,
    };

    const result = await processWebhook(webhookPayload);

    sendSuccessResponse(
      res,
      result,
      "Paytm webhook processed successfully",
      200
    );
  }
);
