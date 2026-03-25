/**
 * Standalone worker process for cron jobs and certificate generation.
 * Run this as a separate process when scaling API horizontally.
 *
 * Usage: node dist/worker.js (or via PM2 ecosystem)
 */

import { connectDB, disconnectDB } from "./config/database";
import { initializeS3 } from "./config/s3";
import { initializeCronJobs } from "./services/cron.services";
import { startCertificateWorker } from "./workers/certificate.worker";
import dotenv from "dotenv";

dotenv.config();

const startWorker = async () => {
  try {
    await connectDB();
    await initializeS3();

    console.log("🕐 Starting background jobs...");
    initializeCronJobs();
    startCertificateWorker();

    console.log("✅ Worker process running (cron + certificate generation)");

    process.on("SIGTERM", () => {
      console.log("🔄 Shutting down worker...");
      disconnectDB();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed to start worker:", error);
    process.exit(1);
  }
};

startWorker();
