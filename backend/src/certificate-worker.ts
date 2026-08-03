/**
 * PM2 process: scheduled crons + the certificate queue.
 * PM2 process: scheduled crons + the certificate queue.
 * Do not run multiple instances (duplicate crons / duplicate polling).
 *
 * This is the ONLY process that calls `initializeCronJobs()`. Every scheduled
 * job in the system fires from here, including the daily enqueues that feed the
 * offer-letter and internship-evaluation queues — those queues are now drained
 * by their own PM2 apps (worker-offer-letter, worker-internship-eval,
 * worker-invoice). Adding a second instance of this app double-fires every cron.
 * This is the ONLY process that calls `initializeCronJobs()`. Every scheduled
 * job in the system fires from here, including the daily enqueues that feed the
 * offer-letter and internship-evaluation queues — those queues are now drained
 * by their own PM2 apps (worker-offer-letter, worker-internship-eval,
 * worker-invoice). Adding a second instance of this app double-fires every cron.
 *
 * Run: node dist/certificate-worker.js
 */

import { connectDB, disconnectDB } from "./config/database";
import { initializeS3 } from "./config/s3";
import { initializeCronJobs } from "./services/cron.services";
import { startCertificateWorker } from "./workers/certificate.worker";
import {
  installWorkerCrashAlerts,
  reportWorkerStartupFailure,
} from "./lib/workerProcessGuards";
import dotenv from "dotenv";

dotenv.config();

const PROCESS_NAME = "certificate worker";

const start = async () => {
  installWorkerCrashAlerts(PROCESS_NAME);

  try {
    await connectDB();
    await initializeS3();

    console.log("🕐 Starting certificate worker (cron + certificate jobs)...");
    console.log("🕐 Starting certificate worker (cron + certificate jobs)...");
    initializeCronJobs();
    startCertificateWorker();

    console.log("✅ Certificate worker running");

    process.on("SIGTERM", () => {
      console.log("🔄 Shutting down certificate worker...");
      disconnectDB();
      process.exit(0);
    });
  } catch (error) {
    await reportWorkerStartupFailure(PROCESS_NAME, error);
    process.exit(1);
  }
};

void start();
