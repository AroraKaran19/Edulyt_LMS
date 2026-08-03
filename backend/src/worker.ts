/**
 * All-in-one worker: cron + certificate + offer-letter + collaboration + invoice (single process).
 * Prefer PM2 apps `worker-cert` + `worker-collab` in production (see ecosystem.config.cjs).
 *
 * Usage: node dist/worker.js
 */

import { connectDB, disconnectDB } from "./config/database";
import { initializeS3 } from "./config/s3";
import { initializeCronJobs } from "./services/cron.services";
import { startCertificateWorker } from "./workers/certificate.worker";
import { startOfferLetterWorker } from "./workers/offerLetter.worker";
import { startCollaborationWorker } from "./workers/collaboration.worker";
import { startTokenCleanupWorker } from "./workers/tokenCleanup.worker";
import { startInvoiceWorker } from "./workers/invoice.worker";
import {
  installWorkerCrashAlerts,
  reportWorkerStartupFailure,
} from "./lib/workerProcessGuards";
import dotenv from "dotenv";

dotenv.config();

const PROCESS_NAME = "worker (all-in-one)";

const startWorker = async () => {
  installWorkerCrashAlerts(PROCESS_NAME);

  try {
    await connectDB();
    await initializeS3();

    console.log("🕐 Starting background jobs...");
    initializeCronJobs();
    startCertificateWorker();
    startOfferLetterWorker();
    startCollaborationWorker();
    startTokenCleanupWorker();
    startInvoiceWorker();

    console.log(
      "✅ Worker process running (cron + certificate + offer-letter + collaboration + token-cleanup + invoice jobs)"
    );

    process.on("SIGTERM", () => {
      console.log("🔄 Shutting down worker...");
      disconnectDB();
      process.exit(0);
    });
  } catch (error) {
    await reportWorkerStartupFailure(PROCESS_NAME, error);
    process.exit(1);
  }
};

void startWorker();
