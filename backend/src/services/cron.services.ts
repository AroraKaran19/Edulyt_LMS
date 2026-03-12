import cron from "node-cron";
import {
  OrderModel,
  CourseModel,
  UserModel,
  StudentModel,
} from "../models";
import { generatePaytmChecksum } from "../utils/lib/generatePaytmChecksum";
import axios from "axios";
import { AppError } from "../middlewares/error.middleware";
import { createEnrollmentAfterPayment } from "./order.services";

/**
 * Update pending payments for a user
 */
const updatePendingPayments = async (userId: string, updateOperation: any) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  if (user.userType === "student") {
    await StudentModel.findByIdAndUpdate(userId, updateOperation);
  }
};


const PENDING_ORDER_AGE_HOURS = 24;

/**
 * Delete abandoned pending orders older than the threshold
 */
const deleteOldPendingOrders = async () => {
  const cutoff = new Date(Date.now() - PENDING_ORDER_AGE_HOURS * 60 * 60 * 1000);
  const oldPendingOrders = await OrderModel.find({
    paymentStatus: "pending",
    createdAt: { $lt: cutoff },
  }).lean();

  if (oldPendingOrders.length === 0) return;

  const orderIds = oldPendingOrders.map((o) => o._id.toString());
  const userIdToOrderIds = new Map<string, string[]>();
  for (const o of oldPendingOrders) {
    const uid = o.userId?.toString();
    if (uid) {
      const list = userIdToOrderIds.get(uid) ?? [];
      list.push(o._id.toString());
      userIdToOrderIds.set(uid, list);
    }
  }

  for (const [userId, ids] of userIdToOrderIds) {
    try {
      await UserModel.findByIdAndUpdate(userId, {
        $pull: { pendingPayments: { $in: ids } },
      });
    } catch {
      // User may not exist
    }
  }

  const deleteResult = await OrderModel.deleteMany({
    _id: { $in: orderIds },
    paymentStatus: "pending",
  });
  console.log(`🗑️ Deleted ${deleteResult.deletedCount} abandoned pending order(s)`);
};

/**
 * Check payment status for all pending orders
 */
const checkPendingPayments = async () => {
  try {
    console.log("🔄 Starting payment verification cron job...");

    // 1. Verify recent pending orders (last 24 hours)
    const pendingOrders = await OrderModel.find({
      paymentStatus: "pending",
      createdAt: { $gte: new Date(Date.now() - PENDING_ORDER_AGE_HOURS * 60 * 60 * 1000) },
    }).limit(50);

    if (pendingOrders.length === 0) {
      console.log("✅ No pending payments to verify");
    } else {
      console.log(`🔍 Found ${pendingOrders.length} pending orders to verify`);
      for (const order of pendingOrders) {
        try {
          await verifyOrderPayment(order);
        } catch (error) {
          console.error(`❌ Error verifying order ${order._id}:`, error);
        }
      }
    }

    // 2. Delete abandoned pending orders older than 24 hours
    await deleteOldPendingOrders();

    console.log("✅ Payment verification cron job completed");
  } catch (error) {
    console.error("❌ Payment verification cron job failed:", error);
  }
};

/**
 * Verify payment status for a single order
 */
const verifyOrderPayment = async (order: any) => {
  try {
    // Generate checksum for Paytm API
    const signature = await generatePaytmChecksum({
      mid: process.env.PAYTM_MID,
      orderId: order._id.toString(),
    });

    if (!signature) {
      console.error(`❌ Failed to generate checksum for order ${order._id}`);
      return;
    }

    // Call Paytm API to check payment status
    const statusResponse = await axios.post(
      `https://secure.paytmpayments.com/v3/order/status`,
      {
        body: {
          mid: process.env.PAYTM_MID,
          orderId: order._id.toString(),
        },
        head: { signature: signature },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    if (statusResponse.status !== 200) {
      console.log(
        `⚠️ Paytm API returned non-200 status for order ${order._id}`
      );
      return;
    }

    const resultStatus = statusResponse.data.body.resultInfo.resultStatus;

    if (resultStatus === "TXN_SUCCESS") {
      // Payment successful
      await handleSuccessfulPayment(order, statusResponse.data.body);
    } else if (resultStatus === "TXN_FAILURE") {
      // Payment failed
      const errorReason =
        statusResponse.data.body.resultInfo?.resultMsg || "Payment declined";
      order.paymentErrorReason = errorReason;
      await handleFailedPayment(order);
      console.log(`❌ Payment failed for order ${order._id}: ${errorReason}`);
    } else {
      // Still pending
      console.log(`⏳ Payment still pending for order ${order._id}`);
    }
  } catch (error) {
    console.error(`❌ Error verifying payment for order ${order._id}:`, error);
  }
};

/**
 * Handle successful payment
 */
const handleSuccessfulPayment = async (order: any, paytmResponse: any) => {
  try {
    
    // Update order status
    order.paymentStatus = "success";
    order.paymentMode = paytmResponse.paymentMode;
    order.txnId = paytmResponse.txnId;
    await order.save();

    // Remove from pending payments
    await updatePendingPayments(order.userId?.toString() || "", {
      $pull: { pendingPayments: order._id.toString() },
    });

    // Create enrollment after successful payment (this will update analytics)
    try {
      await createEnrollmentAfterPayment(order);
    } catch (enrollmentError) {
      console.error(`Failed to create enrollment for order ${order._id}:`, enrollmentError);
      // Don't throw here as payment is already successful
      // The enrollment can be created manually later if needed
    }

  } catch (error) {
    console.error(
      `Error processing successful payment for order ${order._id}:`,
      error
    );
  }
};

/**
 * Handle failed payment
 */
const handleFailedPayment = async (order: any) => {
  try {
    // Update order status
    order.paymentStatus = "failed";
    await order.save();

    // Remove from pending payments
    await updatePendingPayments(order.userId?.toString() || "", {
      $pull: { pendingPayments: order._id.toString() },
    });

  } catch (error) {
    console.error(
      `Error processing failed payment for order ${order._id}:`,
      error
    );
  }
};

/**
 * Initialize cron jobs
 */
export const initializeCronJobs = () => {
  console.log("🕐 Initializing cron jobs...");

  // Run payment verification every 10 minutes
  cron.schedule(
    "*/10 * * * *",
    () => {
      console.log("⏰ Running payment verification cron job...");
      checkPendingPayments();
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log("✅ Cron jobs initialized:");
  console.log("  - Payment verification: Every 10 minutes");
};

/**
 * Manual trigger for payment verification (for testing)
 */
export const triggerPaymentVerification = async () => {
  console.log("🔧 Manual payment verification triggered");
  await checkPendingPayments();
};
