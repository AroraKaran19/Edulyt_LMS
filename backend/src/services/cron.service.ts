import { CleanupService } from "./cleanup.service";

export class CronService {
  private cleanupService: CleanupService;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.cleanupService = new CleanupService();
    console.log("Cron service initialized");
  }

  /**
   * Start the cleanup cron job
   * @param intervalMinutes - Interval in minutes (default: 5 minutes)
   */
  startCleanupCron(intervalMinutes: number = 5): void {
    if (this.isRunning) {
      console.log("Cleanup cron job is already running");
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;
    
    console.log(`Starting cleanup cron job - will run every ${intervalMinutes} minutes`);
    
    // Run immediately on start
    this.runCleanupTask();
    
    // Schedule recurring execution
    this.cleanupInterval = setInterval(() => {
      this.runCleanupTask();
    }, intervalMs);

    this.isRunning = true;
  }

  /**
   * Stop the cleanup cron job
   */
  stopCleanupCron(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      this.isRunning = false;
      console.log("Cleanup cron job stopped");
    }
  }

  /**
   * Run the cleanup task manually
   */
  async runCleanupTask(): Promise<number> {
    try {
      console.log("Running cleanup task...");
      const cleanedCount = await this.cleanupService.cleanupPendingOrders();
      
      if (cleanedCount > 0) {
        console.log(`Cleanup task completed: ${cleanedCount} orders cleaned up`);
      } else {
        console.log("Cleanup task completed: No orders to clean up");
      }
      
      return cleanedCount;
    } catch (error) {
      console.error("Error in cleanup task:", error);
      throw error;
    }
  }

  /**
   * Get cron job status
   */
  getStatus(): { isRunning: boolean; lastRun?: Date } {
    return {
      isRunning: this.isRunning
    };
  }

  /**
   * Restart the cleanup cron job
   * @param intervalMinutes - Interval in minutes (default: 5 minutes)
   */
  restartCleanupCron(intervalMinutes: number = 5): void {
    this.stopCleanupCron();
    this.startCleanupCron(intervalMinutes);
  }
}
