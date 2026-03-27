/**
 * PM2 process: collaboration course-allotment job queue.
 * Do not run multiple instances unless jobs are sharded (not supported yet).
 *
 * Run: node dist/collaboration-worker.js
 */

import { connectDB, disconnectDB } from "./config/database";
import { initializeS3 } from "./config/s3";
import { startCollaborationWorker } from "./workers/collaboration.worker";
import dotenv from "dotenv";

dotenv.config();

const start = async () => {
  try {
    await connectDB();
    await initializeS3();

    console.log("🕐 Starting collaboration worker...");
    startCollaborationWorker();

    console.log("✅ Collaboration worker running");

    process.on("SIGTERM", () => {
      console.log("🔄 Shutting down collaboration worker...");
      disconnectDB();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed to start collaboration worker:", error);
    process.exit(1);
  }
};

void start();
