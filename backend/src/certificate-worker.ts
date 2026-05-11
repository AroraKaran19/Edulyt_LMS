/**
 * PM2 process: scheduled crons + certificate + offer-letter generation queues.
 * Do not run multiple instances (duplicate crons / duplicate polling).
 *
 * Run: node dist/certificate-worker.js
 */

import { connectDB, disconnectDB } from "./config/database";
import { initializeS3 } from "./config/s3";
import { initializeCronJobs } from "./services/cron.services";
import { startCertificateWorker } from "./workers/certificate.worker";
import { startOfferLetterWorker } from "./workers/offerLetter.worker";
import dotenv from "dotenv";

dotenv.config();

const start = async () => {
  try {
    await connectDB();
    await initializeS3();

    console.log("🕐 Starting certificate worker (cron + certificate + offer-letter jobs)...");
    initializeCronJobs();
    startCertificateWorker();
    startOfferLetterWorker();

    console.log("✅ Certificate worker running");

    process.on("SIGTERM", () => {
      console.log("🔄 Shutting down certificate worker...");
      disconnectDB();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed to start certificate worker:", error);
    process.exit(1);
  }
};

void start();
