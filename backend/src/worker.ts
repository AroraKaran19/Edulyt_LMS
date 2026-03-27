/**
 * All-in-one worker: cron + certificate + collaboration (single process).
 * Prefer PM2 apps `worker-cert` + `worker-collab` in production (see ecosystem.config.cjs).
 *
 * Usage: node dist/worker.js
 */

import { connectDB, disconnectDB } from "./config/database";
import { initializeS3 } from "./config/s3";
import { initializeCronJobs } from "./services/cron.services";
import { startCertificateWorker } from "./workers/certificate.worker";
import { startCollaborationWorker } from "./workers/collaboration.worker";
import dotenv from "dotenv";

dotenv.config();

const startWorker = async () => {
  try {
    await connectDB();
    await initializeS3();

    console.log("🕐 Starting background jobs...");
    initializeCronJobs();
    startCertificateWorker();
    startCollaborationWorker();

    console.log(
      "✅ Worker process running (cron + certificate + collaboration jobs)"
    );

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

void startWorker();
