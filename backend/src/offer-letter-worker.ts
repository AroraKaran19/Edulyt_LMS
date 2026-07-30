/**
 * PM2 process: offer-letter generation queue.
 * Single instance — see the LibreOffice note on OFFER_LETTER_WORKER_MAX_PARALLEL
 * in workers/offerLetter.worker.ts.
 *
 * Run: node dist/offer-letter-worker.js
 */

import { connectDB, disconnectDB } from "./config/database";
import { initializeS3 } from "./config/s3";
import { startOfferLetterWorker } from "./workers/offerLetter.worker";
import dotenv from "dotenv";

dotenv.config();

const start = async () => {
  try {
    await connectDB();
    await initializeS3();

    console.log("📄 Starting offer-letter worker...");
    startOfferLetterWorker();

    console.log("✅ Offer-letter worker running");

    process.on("SIGTERM", () => {
      console.log("🔄 Shutting down offer-letter worker...");
      disconnectDB();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed to start offer-letter worker:", error);
    process.exit(1);
  }
};

void start();
