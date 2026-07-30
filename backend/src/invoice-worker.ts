/**
 * PM2 process: invoice generation queue.
 * Do not run multiple instances — the claim is atomic, so a second instance
 * wouldn't corrupt anything, but it would double the concurrent LibreOffice
 * load that INVOICE_WORKER_MAX_PARALLEL exists to bound.
 *
 * Run: node dist/invoice-worker.js
 */

import { connectDB, disconnectDB } from "./config/database";
import { initializeS3 } from "./config/s3";
import { startInvoiceWorker } from "./workers/invoice.worker";
import dotenv from "dotenv";

dotenv.config();

const start = async () => {
  try {
    await connectDB();
    await initializeS3();

    console.log("🧾 Starting invoice worker...");
    startInvoiceWorker();

    console.log("✅ Invoice worker running");

    process.on("SIGTERM", () => {
      console.log("🔄 Shutting down invoice worker...");
      disconnectDB();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed to start invoice worker:", error);
    process.exit(1);
  }
};

void start();
