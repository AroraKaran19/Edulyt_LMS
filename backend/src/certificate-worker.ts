/**
 * PM2 process: scheduled crons + certificate, offer-letter, and internship
 * certificate-evaluation queues.
 * Do not run multiple instances (duplicate crons / duplicate polling).
 *
 * The internship evaluation worker lives here on purpose: the daily enqueue cron
 * is already registered by `initializeCronJobs()`, and a passing verdict enqueues
 * a certificate job that THIS process drains — so verdict → certificate → PDF all
 * happen in one place. It is pure DB I/O, so it adds no meaningful memory.
 * It stays inert unless INTERNSHIP_EVALUATION_ENABLED=true.
 *
 * Run: node dist/certificate-worker.js
 */

import { connectDB, disconnectDB } from "./config/database";
import { initializeS3 } from "./config/s3";
import { initializeCronJobs } from "./services/cron.services";
import { startCertificateWorker } from "./workers/certificate.worker";
import { startOfferLetterWorker } from "./workers/offerLetter.worker";
import { startInternshipEvaluationWorker } from "./workers/internshipEvaluation.worker";
import { startInvoiceWorker } from "./workers/invoice.worker";
import dotenv from "dotenv";

dotenv.config();

const start = async () => {
  try {
    await connectDB();
    await initializeS3();

    console.log(
      "🕐 Starting certificate worker (cron + certificate + offer-letter + internship-evaluation + invoice jobs)...",
    );
    initializeCronJobs();
    startCertificateWorker();
    startOfferLetterWorker();
    startInternshipEvaluationWorker();
    startInvoiceWorker();

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
