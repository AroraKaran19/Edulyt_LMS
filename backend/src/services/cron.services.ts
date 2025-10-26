import cron from "node-cron";
import {
  OrderModel,
  CourseModel,
  UserModel,
  StudentModel,
  EnrollmentModel,
} from "../models";
import { generatePaytmChecksum } from "../utils/lib/generatePaytmChecksum";
import axios from "axios";
import { AppError } from "../middlewares/error.middleware";

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

/**
 * Create enrollment after successful payment
 */
const createEnrollmentAfterPayment = async (order: any) => {
  try {
    // Check if enrollment already exists
    const existingEnrollment = await EnrollmentModel.findOne({
      userId: order.userId,
      courseId: order.courseId,
      status: { $ne: "dropped" },
    });

    if (existingEnrollment) {
      console.log("Enrollment already exists for this user and course");
      return existingEnrollment;
    }

    // Create new enrollment
    const enrollment = new EnrollmentModel({
      userId: order.userId,
      courseId: order.courseId,
      enrolledAt: new Date(),
      status: "active",
      enrollmentSource: "direct",
      progress: {
        overallCompletion: 0,
        totalModules: 0,
        completedModules: 0,
        totalLessons: 0,
        completedLessons: 0,
        lastActivityAt: new Date(),
      },
      lastUpdated: new Date(),
      totalTimeSpent: 0,
    });

    const savedEnrollment = await enrollment.save();

    // Add enrollment to user's enrollments array
    await StudentModel.findByIdAndUpdate(order.userId, {
      $push: { enrollments: savedEnrollment._id },
    });

    console.log(
      `✅ Added course to user's enrollments: ${savedEnrollment._id}`
    );
    return savedEnrollment;
  } catch (error) {
    console.error("Error creating enrollment:", error);
    throw error;
  }
};

/**
 * Check payment status for all pending orders
 */
const checkPendingPayments = async () => {
  try {
    console.log("🔄 Starting payment verification cron job...");

    // Find all orders with pending payment status
    const pendingOrders = await OrderModel.find({
      paymentStatus: "pending",
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Only check orders from last 24 hours
    }).limit(50); // Limit to 50 orders per run to avoid overwhelming Paytm API

    if (pendingOrders.length === 0) {
      console.log("✅ No pending payments to verify");
      return;
    }

    console.log(`🔍 Found ${pendingOrders.length} pending orders to verify`);

    for (const order of pendingOrders) {
      try {
        await verifyOrderPayment(order);
      } catch (error) {
        console.error(`❌ Error verifying order ${order._id}:`, error);
        // Continue with other orders even if one fails
      }
    }

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
      console.log(`✅ Payment successful for order ${order._id}`);
    } else if (resultStatus === "TXN_FAILURE") {
      // Payment failed
      await handleFailedPayment(order);
      console.log(`❌ Payment failed for order ${order._id}`);
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

    // Increment course enrollments
    await CourseModel.findByIdAndUpdate(order.courseId, {
      $inc: { enrollments: 1 },
    });

    // Create enrollment
    await createEnrollmentAfterPayment(order);

    console.log(`✅ Successfully processed payment for order ${order._id}`);
  } catch (error) {
    console.error(
      `❌ Error processing successful payment for order ${order._id}:`,
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

    console.log(
      `✅ Successfully processed failed payment for order ${order._id}`
    );
  } catch (error) {
    console.error(
      `❌ Error processing failed payment for order ${order._id}:`,
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
