import { calculateFinalDiscountedPrice } from "../utils/lib/calculateDiscount";
import { AppError } from "../middlewares/error.middleware";
import {
  OrderModel,
  CourseModel,
  UserModel,
  StudentModel,
  EnrollmentModel,
} from "../models";
import jwt from "jsonwebtoken";
import { generatePaytmChecksum } from "../utils/lib/generatePaytmChecksum";
import axios from "axios";

const updatePendingPayments = async (userId: string, updateOperation: any) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  if (user.userType === "student") {
    await StudentModel.findByIdAndUpdate(userId, updateOperation);
  }
};

// Create enrollment after successful payment
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

    console.log(`✅ Added course to user's enrollments: ${savedEnrollment._id}`);
    return savedEnrollment;
  } catch (error) {
    console.error("Failed to create enrollment after payment:", error);
    throw new AppError("Failed to create enrollment after payment", 500);
  }
};

export const getSelfOrdersService = async (
  userId: string,
  page: number,
  limit: number,
  search: string
) => {
  const skip = (page - 1) * limit;
  let filters: any = { userId };

  if (search) {
    filters.$or = [
      { "courseId.title": { $regex: search, $options: "i" } },
      { "courseId.description": { $regex: search, $options: "i" } },
      { "courseId.shortDescription": { $regex: search, $options: "i" } },
    ];
  }

  const orders = await OrderModel.find(filters)
    .populate("courseId", "title thumbnail shortDescription")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .select("-__v")
    .lean();

  const total = await OrderModel.countDocuments(filters);
  const totalPages = Math.ceil(total / limit);

  return { orders, total, totalPages, page };
};

export const createOrderService = async (
  userId: string,
  courseId: string,
  planType: "elite" | "essential"
) => {
  if (!process.env.PAYTM_MID || !process.env.PAYTM_WEBSITE) {
    throw new AppError("PAYTM_MID or PAYTM_WEBSITE is not set", 500);
  }

  const course = await CourseModel.findById(courseId);
  if (!course) throw new AppError("Course not found", 404);

  const plan = course.plans[planType];
  if (!plan)
    throw new AppError(`${planType} plan not available for this course`, 400);

  const amount = calculateFinalDiscountedPrice(
    plan.price,
    course.discount,
    plan.discount
  );

  const order = new OrderModel({
    txnId: Math.random().toString(36).substring(2, 15),
    token: "", // Will be set by Paytm's txnToken
    userId,
    courseId,
    planType,
    amount,
    currency: "INR",
    paymentMethod: "paytm",
    paymentMode: "online",
    paymentStatus: "pending",
  });
  await order.save();

  // Save order to user
  await StudentModel.findByIdAndUpdate(userId, {
    $push: { orders: order._id.toString() },
  });

  const paymentGatewayToken = generatePaymentGatewayToken(order._id.toString());
  const redirectUrl = `${process.env.FRONTEND_URL}/payment/status/${order._id.toString()}?token=${paymentGatewayToken}`;

  const body = {
    requestType: "Payment",
    mid: process.env.PAYTM_MID,
    websiteName: process.env.PAYTM_WEBSITE,
    orderId: order._id.toString(),
    callbackUrl: redirectUrl,
    txnAmount: { value: amount.toString(), currency: "INR" },
    userInfo: { custId: userId },
  };

  const checksum = await generatePaytmChecksum(body);
  
  if (!checksum) {
    throw new AppError("Failed to generate Paytm checksum", 500);
  }

  const response = await axios.post(
    `https://secure.paytmpayments.com/theia/api/v1/initiateTransaction?mid=${
      process.env.PAYTM_MID
    }&orderId=${order._id.toString()}`,
    {
      head: {
        signature: checksum,
        channelId: "WEB",
        version: "v1",
        requestTimestamp: `${Math.floor(Date.now() / 1000)}`,
      },
      body,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  if (response.status !== 200) {
    throw new AppError("Error initiating transaction", 500);
  }

  if (!response.data.body?.txnToken) {
    throw new AppError("Invalid response from Paytm - no transaction token", 500);
  }

  order.token = response.data.body.txnToken; // Paytm's transaction token
  await order.save();

  await updatePendingPayments(userId, {
    $push: { pendingPayments: order._id.toString() },
  });

  return {
    _id: order._id.toString(),
    token: response.data.body.txnToken,
  };
};

export const getOrderInfoService = async (orderId: string) => {
  const order = await OrderModel.findById(orderId)
    .populate("courseId", "title thumbnail shortDescription")
    .populate("userId", "name email")
    .lean();
  if (!order) throw new AppError("Order not found", 404);
  return order;
};

export const updateOrderService = async (orderId: string, update: any) => {
  const order = await OrderModel.findOneAndUpdate(
    { _id: orderId },
    { ...update, updatedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!order) throw new AppError("Order not found", 404);
  return order;
};

export const verifyPayment = async (token: string) => {
  const { orderId } = verifyPaymentGatewayToken(token);
  const order = await OrderModel.findOne({ _id: orderId });
  if (!order) throw new AppError("Order not found", 404);

  if (order.paymentStatus === "success" || order.paymentStatus === "failed") {
    return {
      status: order.paymentStatus,
      orderId: order._id.toString(),
      updatedAt: order.updatedAt,
      amount: order.amount,
      txnId: order.txnId,
    };
  }

  const signature = await generatePaytmChecksum({
    mid: process.env.PAYTM_MID,
    orderId: orderId,
  });

  const status = await axios.post(
    `https://secure.paytmpayments.com/v3/order/status`,
    {
      body: { mid: process.env.PAYTM_MID, orderId: orderId },
      head: { signature: signature },
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  if (status.status !== 200) {
    return {
      status: order.paymentStatus,
      orderId: order._id.toString(),
      updatedAt: order.updatedAt,
      amount: order.amount,
      txnId: order.txnId,
    };
  }

  if (status.data.body.resultInfo.resultStatus === "TXN_SUCCESS") {
    order.paymentStatus = "success";
    order.paymentMode = status.data.body.paymentMode;
    order.txnId = status.data.body.txnId;
    await order.save();

    await updatePendingPayments(order.userId?.toString() || "", {
      $pull: { pendingPayments: order._id.toString() },
    });

    await CourseModel.findByIdAndUpdate(order.courseId, {
      $inc: { enrollments: 1 },
    });

    // Create enrollment after successful payment
    await createEnrollmentAfterPayment(order);
  } else if (status.data.body.resultInfo.resultStatus === "TXN_FAILURE") {
    order.paymentStatus = "failed";
    await order.save();

    await updatePendingPayments(order.userId?.toString() || "", {
      $pull: { pendingPayments: order._id.toString() },
    });
  }

  return {
    status: order.paymentStatus,
    orderId: order._id.toString(),
    updatedAt: order.updatedAt,
    amount: order.amount,
    txnId: order.txnId,
  };
};

export const generatePaymentGatewayToken = (orderId: string) => {
  return jwt.sign({ orderId }, process.env.JWT_SECRET!, { expiresIn: "5m" });
};

export const verifyPaymentGatewayToken = (
  token: string
): { orderId: string } => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { orderId: string };
  } catch (error) {
    throw new AppError("Invalid token", 400);
  }
};

export const processWebhook = async (webhookData: any) => {
  try {
    const orderId = webhookData.orderId || webhookData.ORDERID;
    const txnId = webhookData.txnId || webhookData.TXNID;
    const status = webhookData.status || webhookData.STATUS;

    if (!orderId) {
      return { success: false, message: "Order ID not found in webhook data" };
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return { success: false, message: "Order not found", orderId };
    }

    if (order.paymentStatus === "success") {
      return {
        success: true,
        message: "Order already processed successfully",
        orderId,
      };
    }

    if (status === "TXN_SUCCESS" || status === "success") {
      await handleSuccessfulPayment(order, txnId);
      return {
        success: true,
        message: "Payment processed successfully",
        orderId,
      };
    } else if (status === "TXN_FAILURE" || status === "failed") {
      await handleFailedPayment(order);
      return { success: true, message: "Payment failure processed", orderId };
    } else {
      return {
        success: false,
        message: `Unknown payment status: ${status}`,
        orderId,
      };
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return {
      success: false,
      message: "Error processing webhook",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

const handleSuccessfulPayment = async (order: any, txnId: string) => {
  order.paymentStatus = "success";
  order.txnId = txnId;
  order.paymentMode = "online";
  await order.save();

  await updatePendingPayments(order.userId?.toString() || "", {
    $pull: { pendingPayments: order._id.toString() },
  });

  await CourseModel.findByIdAndUpdate(order.courseId, {
    $inc: { enrollments: 1 },
  });

  // Create enrollment after successful payment
  await createEnrollmentAfterPayment(order);
};

const handleFailedPayment = async (order: any) => {
  order.paymentStatus = "failed";
  await order.save();

  await updatePendingPayments(order.userId?.toString() || "", {
    $pull: { pendingPayments: order._id.toString() },
  });
};

export const deleteOrderService = async (orderId: string) => {
  const order = await OrderModel.findByIdAndDelete(orderId);
  if (!order) throw new AppError("Order not found", 404);
  return order;
};
