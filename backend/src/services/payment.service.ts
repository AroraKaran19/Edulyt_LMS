import { CourseModel } from "../models/course.schema";
import { OrderModel } from "../models/order.schema";
import dotenv from "dotenv";
import { UserModel, StudentModel } from "../models/user.schema";
import jwt from "jsonwebtoken";
import { generatePaytmChecksum } from "../utils/helper/PaytmChecksum";
import axios from "axios";
import { createEnrollment } from "./enrollment.service";

dotenv.config();

export class PaymentService {
  /**
   * Update pending payments for a user
   * @param userId - User ID
   * @param updateOperation - MongoDB update operation
   */
  private async updatePendingPayments(userId: string, updateOperation: any) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // For students, use StudentModel to access pendingPayments
    if (user.userType === "student") {
      await StudentModel.findByIdAndUpdate(userId, updateOperation);
    }
  }

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
      token: token,
    });

    await order.save();

    // save the orderid in the user's pendingPayments array
    await this.updatePendingPayments(userId, {
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
          await this.updatePendingPayments(order.userId.toString(), {
            $pull: { pendingPayments: order._id.toString() },
          });

          // Create enrollment record using Enrollments collection
          await createEnrollment(
            order.userId.toString(),
            order.courseId.toString(),
            "direct"
          );

          // increase enrollments count
          await CourseModel.findByIdAndUpdate(order.courseId, {
            $inc: { enrollments: 1 },
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

  /**
   * Process payment webhook
   * @param webhookData - Webhook payload from payment gateway
   * @returns Processing result
   */
  async processWebhook(webhookData: any) {
    try {
      console.log("Processing webhook data:", webhookData);

      // Extract order information from webhook
      const orderId = webhookData.orderId || webhookData.ORDERID;
      const txnId = webhookData.txnId || webhookData.TXNID;
      const status = webhookData.status || webhookData.STATUS;
      const amount = webhookData.amount || webhookData.TXNAMOUNT;

      if (!orderId) {
        return {
          success: false,
          message: "Order ID not found in webhook data",
        };
      }

      // Find the order
      const order = await OrderModel.findById(orderId);
      if (!order) {
        return {
          success: false,
          message: "Order not found",
          orderId,
        };
      }

      // Check if order is already processed
      if (order.paymentStatus === "success") {
        return {
          success: true,
          message: "Order already processed successfully",
          orderId,
        };
      }

      // Process based on payment status
      if (status === "TXN_SUCCESS" || status === "success") {
        // Payment successful
        await this.handleSuccessfulPayment(order, txnId, amount);
        return {
          success: true,
          message: "Payment processed successfully",
          orderId,
        };
      } else if (status === "TXN_FAILURE" || status === "failed") {
        // Payment failed
        await this.handleFailedPayment(order);
        return {
          success: true,
          message: "Payment failure processed",
          orderId,
        };
      } else {
        // Unknown status
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
  }

  /**
   * Handle successful payment
   * @param order - Order document
   * @param txnId - Transaction ID
   * @param amount - Transaction amount
   */
  private async handleSuccessfulPayment(
    order: any,
    txnId: string,
    amount: string
  ) {
    try {
      // Update order status
      order.paymentStatus = "success";
      order.txnId = txnId;
      order.paymentMode = "online";
      await order.save();

      // Remove from pending payments
      await this.updatePendingPayments(order.userId.toString(), {
        $pull: { pendingPayments: order._id.toString() },
      });

      // Note: Course enrollment is now handled by the Enrollments collection
      // The enrollment record is created in the createEnrollment call above

      // Create enrollment record
      await createEnrollment(
        order.userId.toString(),
        order.courseId.toString(),
        "direct"
      );

      // Increase course enrollments count
      await CourseModel.findByIdAndUpdate(order.courseId, {
        $inc: { enrollments: 1 },
      });

      console.log(
        `Payment successful for order ${order._id}, user enrolled in course`
      );
    } catch (error) {
      console.error("Error handling successful payment:", error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   * @param order - Order document
   */
  private async handleFailedPayment(order: any) {
    try {
      // Update order status
      order.paymentStatus = "failed";
      await order.save();

      // Remove from pending payments
      await this.updatePendingPayments(order.userId.toString(), {
        $pull: { pendingPayments: order._id.toString() },
      });

      console.log(`Payment failed for order ${order._id}`);
    } catch (error) {
      console.error("Error handling failed payment:", error);
      throw error;
    }
  }
}
