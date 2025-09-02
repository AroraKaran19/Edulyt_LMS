import CourseModel from "../models/course.schema";
import { OrderModel } from "../models/order.schema";
import dotenv from "dotenv";
import UserModel from "../models/user.schema";
import jwt from "jsonwebtoken";
import { generatePaytmChecksum } from "../utils/helper/PaytmChecksum";
import axios from "axios";

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
        userId: userId,
        courseId: courseId,
        planType: planType,
        amount: 0,
        currency: "INR",
        paymentMethod: "paytm",
        paymentMode: "online",
        paymentStatus: "pending",
        txnId: "",
      });
      order = await order.save();
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }

    const { token, amount } = await this.preparePaymentRequest(
      order._id.toString(),
      userId,
      courseId,
      planType
    );

    await order.updateOne({
      amount: amount,
      orderId: order._id.toString(),
      token: token,
    });

    await order.save();

    // save the orderid in the user's pendingPayments array
    await UserModel.findByIdAndUpdate(userId, {
      $push: { pendingPayments: order._id.toString() },
    });

    return {
      orderId: order._id.toString(),
      token: token,
    };
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
  ): Promise<{ token: string; amount: number }> {
    try {
      const course = await CourseModel.findById(courseId);
      if (!course) {
        throw new Error("Course or user not found");
      }
      const plan = course.plans[planType];
      if (!plan) {
        throw new Error("Plan not found");
      }

      let amount = plan?.price || 0;

      // Apply course-level discount first (if available and active)
      if (course.discount && course.discount.isActive !== false) {
        if (course.discount.discount === "percentage") {
          // Apply percentage discount
          const discountAmount = (amount * course.discount.value) / 100;
          amount = amount - discountAmount;
        } else if (course.discount.discount === "fixed") {
          // Apply fixed discount
          amount = amount - course.discount.value;
        }

        // Ensure amount doesn't go below 0
        amount = Math.max(amount, 0);
      }

      // Apply plan-level discount (if available and active)
      if (plan?.discount && plan.discount.isActive !== false) {
        if (plan.discount.discount === "percentage") {
          // Apply percentage discount
          const discountAmount = (amount * plan.discount.value) / 100;
          amount = amount - discountAmount;
        } else if (plan.discount.discount === "fixed") {
          // Apply fixed discount
          amount = amount - plan.discount.value;
        }

        // Ensure amount doesn't go below 0
        amount = Math.max(amount, 0);
      }

      // Round off the final amount to ensure clean integer value
      amount = Math.round(amount);

      const paymentGatewayToken = jwt.sign(
        { orderId },
        process.env.JWT_SECRET!,
        {
          expiresIn: "5m",
        }
      );
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

      const checksum = await generatePaytmChecksum(body);

      const response = await axios.post(
        `https://secure.paytmpayments.com/theia/api/v1/initiateTransaction?mid=${process.env.PAYTM_MID}&orderId=${orderId}`,
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
        throw new Error("Error initiating transaction");
      }

      return {
        token: response.data.body.txnToken,
        amount,
      };
    } catch (error) {
      console.error("Error preparing payment request:", error);
      throw error;
    }
  }

  /**
   * Get payment status
   * @param orderId - Order id
   * @returns Payment status
   */
  async getPaymentStatus(orderId: string) {
    try {
      const order = await OrderModel.findOne({ _id: orderId });
      if (!order) {
        return null;
      }

      if (order.paymentStatus === "success") {
        return {
          status: order.paymentStatus,
          orderId: order._id.toString(),
          createdAt: order.createdAt,
          amount: order.amount,
          txnId: order.txnId,
        };
      } else if (order.paymentStatus === "failed") {
        return {
          status: order.paymentStatus,
          orderId: order._id.toString(),
          createdAt: order.createdAt,
          amount: order.amount,
          txnId: order.txnId,
        };
      } else if (order.paymentStatus === "pending") {
        const signature = await generatePaytmChecksum({
          mid: process.env.PAYTM_MID,
          orderId: orderId,
        });
        const status = await axios.post(
          `https://secure.paytmpayments.com/v3/order/status`,
          {
            body: {
              mid: process.env.PAYTM_MID,
              orderId: orderId,
            },
            head: {
              signature: signature,
            },
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
            createdAt: order.createdAt,
            amount: order.amount,
            txnId: order.txnId,
          };
        }

        if (status.data.body.resultInfo.resultStatus === "TXN_SUCCESS") {
          order.paymentStatus = "success";
          order.paymentMode = status.data.body.paymentMode;
          order.txnId = status.data.body.txnId;
          await order.save();

          // remove the order id from the user's pendingPayments array
          await UserModel.findByIdAndUpdate(order.userId, {
            $pull: { pendingPayments: order._id.toString() },
          });

          return {
            status: order.paymentStatus,
            orderId: order._id.toString(),
            createdAt: order.createdAt,
            amount: order.amount,
            txnId: order.txnId,
          };
        }
      }
      return {
        status: order.paymentStatus,
        orderId: order._id.toString(),
        createdAt: order.createdAt,
        amount: order.amount,
        txnId: order.txnId,
      };
    } catch (error) {
      console.error("Error getting payment status:", error);
      throw error;
    }
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
