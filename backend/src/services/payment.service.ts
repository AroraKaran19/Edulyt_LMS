import CourseModel from "../models/course.schema";
import { OrderModel } from "../models/order.schema";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
import UserModel from "../models/user.schema";
import jwt from "jsonwebtoken";
import axios from "axios";
import PaytmChecksum, { PaytmParamsBody } from "paytmchecksum";

dotenv.config();

export class PaymentService {
  /**
   * Get order info
   * @param orderId - Order id
   * @returns Order
   */
  async getOrderInfo(orderId: string) {
    try {
      const order = await OrderModel.findOne({ _id: orderId });
      if (!order) {
        return null;
      }
      return order;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create payment
   * @param userId - User id
   * @param courseId - Course id
   * @param planType - Plan type
   * @returns Order
   */
  async createPayment(
    userId: string,
    courseId: string,
    planType: "elite" | "essential"
  ) {
    let order;
    try {
      order = await OrderModel.create({
        orderId: randomUUID(),
        userId: userId,
        courseId: courseId,
        planType: planType,
        amount: 0,
        currency: "INR",
        paymentMethod: "phonepe",
        paymentMode: "online",
        paymentStatus: "pending",
      });
      order = await order.save();
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }

    const { paymentRequest, merchantOrderId } =
      await this.preparePaymentRequest(
        order._id.toString(),
        userId,
        courseId,
        planType
      );

    const response = await Paytm.Payment.getPaymentStatus(paymentRequest);

    await order.updateOne({
      amount: response.amount,
      orderId: merchantOrderId,
    });

    await order.save();

    // save the orderid in the user's pendingPayments array
    await UserModel.findByIdAndUpdate(userId, {
      $push: { pendingPayments: order._id.toString() },
    });

    return {
      orderId: order._id.toString(),
      redirectUrl: response.redirectUrl,
    };
  }

  /**
   * Get payment status
   * @param orderId - Order id
   * @returns Payment status
   */
  async getPaymentStatus(orderId: string) {
    try {
      const order = await OrderModel.findById(orderId);
      if (!order) {
        console.log("Order not found");
        return null;
      }
      if (
        order.paymentStatus === "success" ||
        order.paymentStatus === "failed"
      ) {
        return {
          status: order.paymentStatus,
          orderId: orderId,
          createdAt: order.createdAt,
          amount: order.amount,
          paymentMode: order.paymentMode,
        };
      }
      const response = await Paytm.Payment.getPaymentStatus(order.orderId);
      if (response.state === "SUCCESS" || response.state === "COMPLETED") {
        await order.updateOne({
          paymentStatus: "success",
          paymentMode: response.paymentDetails[0].paymentMode || "online",
        });
        await UserModel.findByIdAndUpdate(order.userId, {
          $pull: { pendingPayments: orderId }, // remove the orderId from the pendingPayments array
        });
        await UserModel.findByIdAndUpdate(order.userId, {
          $push: { enrolledCourses: order.courseId },
        });

        return {
          status: "success",
          orderId: orderId,
          createdAt: order.createdAt,
          amount: order.amount,
          paymentMode: order.paymentMode,
        };
      } else if (
        response.state === "FAILED" ||
        response.state === "CANCELLED"
      ) {
        await order.updateOne({ paymentStatus: "failed" });
        return {
          status: "failed",
          orderId: orderId,
          createdAt: order.createdAt,
          amount: order.amount,
          paymentMode: order.paymentMode,
        };
      } else {
        await order.updateOne({ paymentStatus: "pending" });
        return {
          status: "pending",
          orderId: orderId,
          createdAt: order.createdAt,
          amount: order.amount,
          paymentMode: order.paymentMode,
        };
      }
    } catch (error) {
      console.error("Error getting payment status:", error);
      throw error;
    }
  }

  /**
   * Prepare payment request
   * @param orderId - Order id
   * @param userId - User id
   * @param courseId - Course id
   * @param planType - Plan type
   * @returns Payment request
   */
  private async preparePaymentRequest(
    orderId: string,
    userId: string,
    courseId: string,
    planType: "elite" | "essential"
  ) {
    const course = await CourseModel.findById(courseId);
    if (!course) {
      throw new Error("Course or user not found");
    }
    const plan = course.plans[planType];
    if (!plan) {
      throw new Error("Plan not found");
    }

    const amount = plan?.price;
    const merchantOrderId = randomUUID();
    const paymentGatewayToken = jwt.sign({ orderId }, process.env.JWT_SECRET!, {
      expiresIn: "5m",
    });
    const redirectUrl = `${process.env.FRONTEND_URL}/payment/status/${orderId}?token=${paymentGatewayToken}`;

    const body = {
      requestType: "Payment",
      mid: process.env.PAYTM_MID!,
      websiteName: process.env.PAYTM_WEBSITE!,
      orderId,
      callbackUrl: redirectUrl,
      txnAmount: {
        value: amount.toString(),
        currency: "INR",
      },
      userInfo: {
        custId: userId,
      },
    };

    const checksum = await PaytmChecksum.generateSignature(
      JSON.stringify(body),
      process.env.PAYTM_KEY!
    );

    const verifyChecksum = PaytmChecksum.verifySignature(
      JSON.stringify(body),
      process.env.PAYTM_KEY!,
      checksum
    );
    console.log("Checksum valid?", verifyChecksum);
    console.log("Checksum:", checksum);
    console.log("Body:", JSON.stringify(body));

    const response = await axios.post(
      `https://secure.paytmpayments.com/theia/api/v1/initiateTransaction?mid=${process.env.PAYTM_MID}&orderId=${orderId}`,
      {
        head: {
          channelId: "WEB",
          signature: checksum,
        },
        body: JSON.stringify(body),
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log(response.data);

    return {
      paymentRequest: response.data.txnToken,
      merchantOrderId,
    };
  }

  /**
   * Verify payment gateway token
   * @param token - Token
   * @returns Decoded token
   */
  async verifyPaymentGatewayToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      return decoded;
    } catch (error) {
      console.error("Error verifying payment gateway token:", error);
      throw error;
    }
  }
}
