import { OrderModel } from "../models/order.schema";
import UserModel from "../models/user.schema";

export class CleanupService {
  /**
   * Clean up pending orders older than 5 minutes
   * @returns Number of orders cleaned up
   */
  async cleanupPendingOrders(): Promise<number> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      // Find all pending orders older than 5 minutes
      const pendingOrders = await OrderModel.find({
        paymentStatus: "pending",
        createdAt: { $lt: fiveMinutesAgo },
      });

      if (pendingOrders.length === 0) {
        console.log("No pending orders older than 5 minutes found");
        return 0;
      }

      const orderIds = pendingOrders.map((order) => order._id.toString());
      const userIds = [
        ...new Set(pendingOrders.map((order) => order.userId.toString())),
      ];

      // Delete the pending orders
      const deleteResult = await OrderModel.deleteMany({
        _id: { $in: orderIds },
      });

      // Remove the order IDs from users' pendingPayments arrays
      for (const userId of userIds) {
        await UserModel.findByIdAndUpdate(userId, {
          $pull: { pendingPayments: { $in: orderIds } },
        });
      }

      console.log(
        `Cleaned up ${deleteResult.deletedCount} pending orders older than 5 minutes`
      );
      return deleteResult.deletedCount || 0;
    } catch (error) {
      console.error("Error cleaning up pending orders:", error);
      throw error;
    }
  }

  /**
   * Clean up pending orders for a specific user
   * @param userId - User ID
   * @returns Number of orders cleaned up
   */
  async cleanupUserPendingOrders(userId: string): Promise<number> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      // Find pending orders for the specific user older than 5 minutes
      const pendingOrders = await OrderModel.find({
        userId: userId,
        paymentStatus: "pending",
        createdAt: { $lt: fiveMinutesAgo },
      });

      if (pendingOrders.length === 0) {
        console.log(
          `No pending orders older than 5 minutes found for user ${userId}`
        );
        return 0;
      }

      const orderIds = pendingOrders.map((order) => order._id.toString());

      // Delete the pending orders
      const deleteResult = await OrderModel.deleteMany({
        _id: { $in: orderIds },
      });

      // Remove the order IDs from user's pendingPayments array
      await UserModel.findByIdAndUpdate(userId, {
        $pull: { pendingPayments: { $in: orderIds } },
      });

      console.log(
        `Cleaned up ${deleteResult.deletedCount} pending orders for user ${userId}`
      );
      return deleteResult.deletedCount || 0;
    } catch (error) {
      console.error(
        `Error cleaning up pending orders for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get statistics about pending orders
   * @returns Statistics object
   */
  async getPendingOrdersStats() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const totalPending = await OrderModel.countDocuments({
        paymentStatus: "pending",
      });
      const oldPending = await OrderModel.countDocuments({
        paymentStatus: "pending",
        createdAt: { $lt: fiveMinutesAgo },
      });

      return {
        totalPending,
        oldPending,
        willBeCleaned: oldPending,
      };
    } catch (error) {
      console.error("Error getting pending orders stats:", error);
      throw error;
    }
  }
}
