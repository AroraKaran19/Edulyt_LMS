import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/error.middleware";
import { AppError, sendSuccessResponse } from "../middlewares/error.middleware";
import { triggerPaymentVerification } from "../services/cron.services";

/**
 * @route   POST /api/webhook/payment-verification
 * @desc    Trigger payment verification manually
 * @access  Admin/Internal
 */
export const triggerPaymentWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      console.log("🔧 Payment verification webhook triggered");

      // Trigger payment verification
      await triggerPaymentVerification();

      sendSuccessResponse(
        res,
        { message: "Payment verification completed" },
        "Payment verification triggered successfully",
        200
      );
    } catch (error: any) {
      console.error("❌ Payment verification webhook failed:", error);
      throw new AppError("Failed to trigger payment verification", 500);
    }
  }
);

/**
 * @route   GET /api/webhook/payment-status
 * @desc    Get status of payment verification cron job
 * @access  Admin/Internal
 */
export const getPaymentWebhookStatus = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // This could be enhanced to return actual cron job status
      // For now, just return a simple status
      sendSuccessResponse(
        res,
        {
          status: "active",
          schedule: "Every 10 minutes",
          lastRun: new Date().toISOString(),
          description: "Payment verification cron job is running",
        },
        "Payment verification status retrieved",
        200
      );
    } catch (error: any) {
      throw new AppError("Failed to get payment verification status", 500);
    }
  }
);
