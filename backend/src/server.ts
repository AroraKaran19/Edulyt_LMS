import app from "./app";
import { connectDB, disconnectDB } from "./config/database";
import dotenv from "dotenv";
import { initializeS3 } from "./config/s3";
import { initializeCronJobs } from "./services/cron.services";
import { startCertificateWorker } from "./workers/certificate.worker";
import { startCollaborationWorker } from "./workers/collaboration.worker";
import { startOfferLetterWorker } from "./workers/offerLetter.worker";
import { startTokenCleanupWorker } from "./workers/tokenCleanup.worker";
import { startInternshipEvaluationWorker } from "./workers/internshipEvaluation.worker";
import { flushMailQueue, pendingMailCount } from "./utils/mailer";

dotenv.config();

if (!process.env.PORT) {
  throw new Error("PORT is not defined in environment variables");
}

const PORT = process.env.PORT || 8080;

const RUN_BACKGROUND_JOBS = process.env.RUN_BACKGROUND_JOBS !== "false";

const startServer = async () => {
  try {
    await connectDB();
    await initializeS3();

    if (RUN_BACKGROUND_JOBS) {
      initializeCronJobs();
      startCertificateWorker();
      startCollaborationWorker();
      startOfferLetterWorker();
      startTokenCleanupWorker();
      startInternshipEvaluationWorker();
    } else {
      console.log("⏭️  Skipping cron & worker (RUN_BACKGROUND_JOBS=false, running behind load balancer)");
    }

    const server = app.listen(PORT, () => {
      console.log(`🚀 Airkrit Backend Server is running on port ${PORT}`);
      console.log(`🌐 Health check available at: http://localhost:${PORT}/`);
    });

    // Gracefully shutdown the server
    process.on("SIGTERM", () => {
      console.log("🔄 Shutting down server...");
      server.close(async () => {
        console.log("🔒 Server closed");
        // Mail is queued off the request path; let it drain before we exit.
        const pending = pendingMailCount();
        if (pending > 0) {
          console.log(`📧 Waiting on ${pending} queued email(s)...`);
          await flushMailQueue();
        }
        disconnectDB();
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
