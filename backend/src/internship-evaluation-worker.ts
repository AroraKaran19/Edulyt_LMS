/**
 * PM2 process: internship certificate-evaluation queue.
 *
 * Pure DB I/O (no LibreOffice): it decides a verdict and, on a pass, enqueues a
 * certificate job that worker-cert drains. The daily enqueue cron that feeds
 * this queue lives in `initializeCronJobs()` on worker-cert, so this process is
 * a pure consumer and stays inert unless INTERNSHIP_EVALUATION_ENABLED=true.
 *
 * Single instance.
 *
 * Run: node dist/internship-evaluation-worker.js
 */

import { connectDB, disconnectDB } from "./config/database";
import { initializeS3 } from "./config/s3";
import { startInternshipEvaluationWorker } from "./workers/internshipEvaluation.worker";
import dotenv from "dotenv";

dotenv.config();

const start = async () => {
  try {
    await connectDB();
    await initializeS3();

    console.log("🎓 Starting internship evaluation worker...");
    startInternshipEvaluationWorker();

    console.log("✅ Internship evaluation worker running");

    process.on("SIGTERM", () => {
      console.log("🔄 Shutting down internship evaluation worker...");
      disconnectDB();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed to start internship evaluation worker:", error);
    process.exit(1);
  }
};

void start();
