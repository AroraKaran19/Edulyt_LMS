/**
 * PM2 process: prunes expired refresh tokens from user documents.
 * Single responsibility, lightweight (no S3 / cron). Safe to run as one
 * instance; multiple instances would just do redundant work.
 *
 * Run: node dist/token-cleanup-worker.js
 */

import { connectDB, disconnectDB } from "./config/database";
import { startTokenCleanupWorker } from "./workers/tokenCleanup.worker";
import {
  installWorkerCrashAlerts,
  reportWorkerStartupFailure,
} from "./lib/workerProcessGuards";
import dotenv from "dotenv";

dotenv.config();

const PROCESS_NAME = "token cleanup worker";

const start = async () => {
  installWorkerCrashAlerts(PROCESS_NAME);

  try {
    await connectDB();

    console.log("🧹 Starting token cleanup worker...");
    startTokenCleanupWorker();

    console.log("✅ Token cleanup worker running");

    process.on("SIGTERM", () => {
      console.log("🔄 Shutting down token cleanup worker...");
      disconnectDB();
      process.exit(0);
    });
  } catch (error) {
    await reportWorkerStartupFailure(PROCESS_NAME, error);
    process.exit(1);
  }
};

void start();
