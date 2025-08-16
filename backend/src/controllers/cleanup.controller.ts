import { CleanupService } from "../services/cleanup.service";
import { CronService } from "../services/cron.service";
import { Request, Response } from "express";

export class CleanupController {
  private cleanupService: CleanupService;
  private cronService: CronService;

  constructor() {
    console.log("Cleanup controller initialized");
    this.cleanupService = new CleanupService();
    this.cronService = new CronService();
  }

  /**
   * Clean up all pending orders older than 5 minutes
   * @param req - The request object
   * @param res - The response object
   */
  cleanupPendingOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const cleanedCount = await this.cleanupService.cleanupPendingOrders();
      
      res.status(200).json({
        success: true,
        message: `Successfully cleaned up ${cleanedCount} pending orders`,
        cleanedCount
      });
    } catch (error) {
      console.error("Error in cleanup controller:", error);
      res.status(500).json({ 
        success: false,
        message: "Error cleaning up pending orders" 
      });
    }
  };

  /**
   * Clean up pending orders for a specific user
   * @param req - The request object
   * @param res - The response object
   */
  cleanupUserPendingOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({ 
          success: false,
          message: "User ID is required" 
        });
        return;
      }

      const cleanedCount = await this.cleanupService.cleanupUserPendingOrders(userId);
      
      res.status(200).json({
        success: true,
        message: `Successfully cleaned up ${cleanedCount} pending orders for user ${userId}`,
        cleanedCount,
        userId
      });
    } catch (error) {
      console.error("Error in cleanup controller:", error);
      res.status(500).json({ 
        success: false,
        message: "Error cleaning up user pending orders" 
      });
    }
  };

  /**
   * Get statistics about pending orders
   * @param req - The request object
   * @param res - The response object
   */
  getPendingOrdersStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.cleanupService.getPendingOrdersStats();
      
      res.status(200).json({
        success: true,
        message: "Pending orders statistics retrieved successfully",
        stats
      });
    } catch (error) {
      console.error("Error in cleanup controller:", error);
      res.status(500).json({ 
        success: false,
        message: "Error getting pending orders statistics" 
      });
    }
  };

  /**
   * Start the cleanup cron job
   * @param req - The request object
   * @param res - The response object
   */
  startCleanupCron = async (req: Request, res: Response): Promise<void> => {
    try {
      const { intervalMinutes } = req.body;
      const interval = intervalMinutes ? parseInt(intervalMinutes) : 5;
      
      this.cronService.startCleanupCron(interval);
      
      res.status(200).json({
        success: true,
        message: `Cleanup cron job started with ${interval} minute interval`,
        interval
      });
    } catch (error) {
      console.error("Error starting cleanup cron:", error);
      res.status(500).json({ 
        success: false,
        message: "Error starting cleanup cron job" 
      });
    }
  };

  /**
   * Stop the cleanup cron job
   * @param req - The request object
   * @param res - The response object
   */
  stopCleanupCron = async (req: Request, res: Response): Promise<void> => {
    try {
      this.cronService.stopCleanupCron();
      
      res.status(200).json({
        success: true,
        message: "Cleanup cron job stopped"
      });
    } catch (error) {
      console.error("Error stopping cleanup cron:", error);
      res.status(500).json({ 
        success: false,
        message: "Error stopping cleanup cron job" 
      });
    }
  };

  /**
   * Get cron job status
   * @param req - The request object
   * @param res - The response object
   */
  getCronStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const status = this.cronService.getStatus();
      
      res.status(200).json({
        success: true,
        message: "Cron job status retrieved successfully",
        status
      });
    } catch (error) {
      console.error("Error getting cron status:", error);
      res.status(500).json({ 
        success: false,
        message: "Error getting cron job status" 
      });
    }
  };

  /**
   * Run cleanup task manually
   * @param req - The request object
   * @param res - The response object
   */
  runCleanupTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const cleanedCount = await this.cronService.runCleanupTask();
      
      res.status(200).json({
        success: true,
        message: `Manual cleanup task completed. ${cleanedCount} orders cleaned up`,
        cleanedCount
      });
    } catch (error) {
      console.error("Error running manual cleanup task:", error);
      res.status(500).json({ 
        success: false,
        message: "Error running manual cleanup task" 
      });
    }
  };
}
